package com.gestionconcours.controller;

import com.gestionconcours.dto.LoginRequest;
import com.gestionconcours.model.InscriptionRequest;
import com.gestionconcours.model.User;
import com.gestionconcours.repository.InscriptionRequestRepository;
import com.gestionconcours.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final InscriptionRequestRepository inscriptionRequestRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${google.client-id:}")
    private String googleClientId;

    public AuthController(UserRepository userRepository, InscriptionRequestRepository inscriptionRequestRepository) {
        this.userRepository = userRepository;
        this.inscriptionRequestRepository = inscriptionRequestRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // ⚠️ Ḥyd l-mouchkil dyal getMotDePasse ila knt dayr getPassword f User dyalk
            if (passwordEncoder.matches(request.getMotDePasse(), user.getMotDePasse())) {
                return ResponseEntity.ok(user);
            }
        }
        return ResponseEntity.status(401).body("Email ou mot de passe incorrect !");
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String credential = request.get("credential");
        if (credential == null || credential.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Jeton Google manquant."));
        }

        try {
            String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token="
                    + URLEncoder.encode(credential, StandardCharsets.UTF_8);
            HttpRequest tokenInfoRequest = HttpRequest.newBuilder(URI.create(tokenInfoUrl)).GET().build();
            HttpResponse<String> googleResponse = httpClient.send(tokenInfoRequest, HttpResponse.BodyHandlers.ofString());
            if (googleResponse.statusCode() != 200) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Le jeton Google a expiré ou n’est pas valide."));
            }

            JsonNode claims = objectMapper.readTree(googleResponse.body());
            String audience = claims.path("aud").asText("");
            String email = claims.path("email").asText("").trim().toLowerCase();
            boolean verifiedEmail = claims.path("email_verified").asBoolean(false)
                    || "true".equalsIgnoreCase(claims.path("email_verified").asText());

            boolean isAudienceValid = (googleClientId == null || googleClientId.isBlank())
                    || googleClientId.trim().equalsIgnoreCase(audience.trim());

            if (!isAudienceValid || email.isBlank() || !verifiedEmail) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Le compte Google n’a pas pu être vérifié."));
            }

            User user = userRepository.findByEmail(email).orElseGet(() -> {
                String firstName = claims.path("given_name").asText("");
                String lastName = claims.path("family_name").asText("");
                if (lastName.isBlank()) lastName = claims.path("name").asText(email);
                return userRepository.save(User.builder()
                        .prenom(firstName)
                        .nom(lastName)
                        .email(email)
                        .motDePasse(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .role("CLIENT")
                        .active(1)
                        .createdAt(LocalDateTime.now())
                        .build());
            });

            if (user.getActive() != null && user.getActive() == 0) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Ce compte n’est pas actif."));
            }

            Map<String, Object> safeUser = new LinkedHashMap<>();
            safeUser.put("id", user.getId());
            safeUser.put("email", user.getEmail());
            safeUser.put("nom", user.getNom());
            safeUser.put("prenom", user.getPrenom());
            safeUser.put("role", user.getRole());
            safeUser.put("active", user.getActive());
            return ResponseEntity.ok(safeUser);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Vérification Google interrompue. Réessayez."));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Impossible de vérifier la connexion Google pour le moment."));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody InscriptionRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(400).body("Cet email existe déjà !");
        }

        // ⚠️ Ḥit f DTO dyalk m-smiha password wla motDePasse (Khas t-kun t-etafk m3aha)
        // Ila kanesmiha password: request.setPassword(passwordEncoder.encode(request.getPassword()));
        request.setPassword(passwordEncoder.encode(request.getPassword()));

        inscriptionRequestRepository.save(request);

        return ResponseEntity.ok("Demande d'inscription envoyée avec succès !");
    }
}
