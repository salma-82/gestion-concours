package com.gestionconcours.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.Signature;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Verifies Firebase Authentication ID tokens without requiring a service-account key. */
@Service
public class FirebaseIdTokenVerifier {
    private static final URI CERTIFICATES_URI = URI.create(
            "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
    private static final Pattern MAX_AGE_PATTERN = Pattern.compile("(?:^|,)\\s*max-age=(\\d+)", Pattern.CASE_INSENSITIVE);
    private static final long CLOCK_SKEW_SECONDS = 60;

    private final String projectId;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private volatile CachedCertificates cachedCertificates;
    private volatile Instant lastCertificateRefreshAt = Instant.EPOCH;

    public FirebaseIdTokenVerifier(
            @org.springframework.beans.factory.annotation.Autowired(required = false) ObjectMapper objectMapper,
            @Value("${firebase.project-id:e-concours-37cc1}") String projectId) {
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.projectId = projectId;
        this.httpClient = HttpClient.newBuilder().connectTimeout(java.time.Duration.ofSeconds(5)).build();
    }

    public VerifiedGoogleUser verifyGoogleSignIn(String idToken)
            throws InvalidFirebaseIdTokenException, IOException, InterruptedException, GeneralSecurityException {
        if (idToken == null || idToken.isBlank() || idToken.length() > 16_384) {
            throw new InvalidFirebaseIdTokenException("Invalid Firebase ID token.");
        }

        String[] parts = idToken.split("\\.", -1);
        if (parts.length != 3) {
            throw new InvalidFirebaseIdTokenException("Invalid Firebase ID token.");
        }

        JsonNode header;
        JsonNode claims;
        try {
            header = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[0]));
            claims = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[1]));
        } catch (IOException | IllegalArgumentException exception) {
            throw new InvalidFirebaseIdTokenException("Invalid Firebase ID token.");
        }

        String keyId = header.path("kid").asText("");
        if (!"RS256".equals(header.path("alg").asText()) || keyId.isBlank()) {
            throw new InvalidFirebaseIdTokenException("Unsupported Firebase ID token.");
        }

        long now = Instant.now().getEpochSecond();
        long expiration = claims.path("exp").asLong(0);
        long issuedAt = claims.path("iat").asLong(Long.MAX_VALUE);
        long authTime = claims.path("auth_time").asLong(Long.MAX_VALUE);
        String uid = claims.path("sub").asText("");
        String email = claims.path("email").asText("").trim();
        String provider = claims.path("firebase").path("sign_in_provider").asText("");

        boolean validClaims = projectId.equals(claims.path("aud").asText())
                && ("https://securetoken.google.com/" + projectId).equals(claims.path("iss").asText())
                && expiration > now
                && issuedAt > 0
                && issuedAt <= now + CLOCK_SKEW_SECONDS
                && authTime > 0
                && authTime <= now + CLOCK_SKEW_SECONDS
                && authTime <= issuedAt + CLOCK_SKEW_SECONDS
                && !uid.isBlank()
                && "google.com".equals(provider)
                && !email.isBlank()
                && claims.path("email_verified").asBoolean(false);
        if (!validClaims) {
            throw new InvalidFirebaseIdTokenException("Firebase ID token claims are invalid.");
        }

        X509Certificate certificate = certificates(false).get(keyId);
        if (certificate == null) {
            certificate = certificates(true).get(keyId);
        }
        if (certificate == null) {
            throw new InvalidFirebaseIdTokenException("Unknown Firebase signing key.");
        }
        certificate.checkValidity();

        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initVerify(certificate.getPublicKey());
        signature.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
        byte[] signatureBytes;
        try {
            signatureBytes = Base64.getUrlDecoder().decode(parts[2]);
        } catch (IllegalArgumentException exception) {
            throw new InvalidFirebaseIdTokenException("Invalid Firebase ID token signature.");
        }
        if (!signature.verify(signatureBytes)) {
            throw new InvalidFirebaseIdTokenException("Invalid Firebase ID token signature.");
        }

        return new VerifiedGoogleUser(uid, email);
    }

    private Map<String, X509Certificate> certificates(boolean forceRefresh)
            throws IOException, InterruptedException, GeneralSecurityException {
        CachedCertificates cached = cachedCertificates;
        if (!forceRefresh && cached != null && cached.expiresAt().isAfter(Instant.now())) {
            return cached.values();
        }

        synchronized (this) {
            cached = cachedCertificates;
            if (!forceRefresh && cached != null && cached.expiresAt().isAfter(Instant.now())) {
                return cached.values();
            }
            if (forceRefresh
                    && cached != null
                    && cached.expiresAt().isAfter(Instant.now())
                    && lastCertificateRefreshAt.isAfter(Instant.now().minusSeconds(60))) {
                return cached.values();
            }

            HttpRequest request = HttpRequest.newBuilder(CERTIFICATES_URI)
                    .timeout(java.time.Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IOException("Unable to retrieve Firebase signing certificates.");
            }

            JsonNode certificateJson = objectMapper.readTree(response.body());
            Map<String, X509Certificate> certificates = new HashMap<>();
            CertificateFactory factory = CertificateFactory.getInstance("X.509");
            var fields = certificateJson.fields();
            while (fields.hasNext()) {
                var entry = fields.next();
                byte[] pem = entry.getValue().asText().getBytes(StandardCharsets.US_ASCII);
                X509Certificate certificate = (X509Certificate) factory.generateCertificate(
                        new ByteArrayInputStream(pem));
                certificates.put(entry.getKey(), certificate);
            }
            if (certificates.isEmpty()) {
                throw new IOException("Firebase signing certificates were empty.");
            }

            long maxAgeSeconds = response.headers().firstValue("Cache-Control")
                    .map(FirebaseIdTokenVerifier::maxAgeSeconds)
                    .orElse(3600L);
            Map<String, X509Certificate> immutableCertificates = Map.copyOf(certificates);
            cachedCertificates = new CachedCertificates(
                    immutableCertificates,
                    Instant.now().plusSeconds(Math.max(0, maxAgeSeconds)));
            lastCertificateRefreshAt = Instant.now();
            return immutableCertificates;
        }
    }

    private static long maxAgeSeconds(String cacheControl) {
        Matcher matcher = MAX_AGE_PATTERN.matcher(cacheControl);
        return matcher.find() ? Long.parseLong(matcher.group(1)) : 3600L;
    }

    public record VerifiedGoogleUser(String uid, String email) {}

    public static class InvalidFirebaseIdTokenException extends Exception {
        public InvalidFirebaseIdTokenException(String message) {
            super(message);
        }
    }

    private record CachedCertificates(Map<String, X509Certificate> values, Instant expiresAt) {}

}
