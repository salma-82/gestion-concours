package com.gestionconcours.controller;

import java.util.UUID;
import com.gestionconcours.dto.LoginRequest;
import com.gestionconcours.model.InscriptionRequest;
import com.gestionconcours.model.User;
import com.gestionconcours.repository.InscriptionRequestRepository;
import com.gestionconcours.repository.UserRepository;
import com.gestionconcours.service.AuthSessionService;
import com.gestionconcours.service.FirebaseIdTokenVerifier;
import com.gestionconcours.service.FirebaseIdTokenVerifier.InvalidFirebaseIdTokenException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final InscriptionRequestRepository inscriptionRequestRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuthSessionService authSessionService;
    private final FirebaseIdTokenVerifier firebaseIdTokenVerifier;

    public AuthController(UserRepository userRepository, InscriptionRequestRepository inscriptionRequestRepository,
            AuthSessionService authSessionService, FirebaseIdTokenVerifier firebaseIdTokenVerifier) {
        this.userRepository = userRepository;
        this.inscriptionRequestRepository = inscriptionRequestRepository;
        this.authSessionService = authSessionService;
        this.firebaseIdTokenVerifier = firebaseIdTokenVerifier;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // ⚠️ Ḥyd l-mouchkil dyal getMotDePasse ila knt dayr getPassword f User dyalk
            if (passwordEncoder.matches(request.getMotDePasse(), user.getMotDePasse())) {
                return ResponseEntity.ok(sessionResponse(user));
            }
        }
        return ResponseEntity.status(401).body("Email ou mot de passe incorrect !");
    }

    @PostMapping("/demo")
    public ResponseEntity<?> createDemoSession() {
        AuthSessionService.SessionCredentials session = authSessionService.createDemo();
        Map<String, Object> demo = new LinkedHashMap<>();
        demo.put("id", -1L);
        demo.put("email", "demo@anonymous.invalid");
        demo.put("nom", "Visiteur");
        demo.put("prenom", "Démo");
        demo.put("role", "demo");
        demo.put("pack", "DEMO");
        demo.put("active", 1);
        demo.put("sessionToken", session.token());
        demo.put("expiresAt", session.expiresAt());
        return ResponseEntity.ok(demo);
    }

    @PostMapping("/google/account-conflict")
    public ResponseEntity<?> checkGooglePasswordAccount(@RequestBody Map<String, String> request) {
        String idToken = request.get("firebaseIdToken");
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Jeton Firebase manquant."));
        }

        try {
            FirebaseIdTokenVerifier.VerifiedGoogleUser googleUser = firebaseIdTokenVerifier
                    .verifyGoogleSignIn(idToken);
            boolean passwordAccountExists = userRepository.existsByEmailIgnoreCase(googleUser.email())
                    || inscriptionRequestRepository.existsByEmailIgnoreCase(googleUser.email());
            if (passwordAccountExists) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("code", "PASSWORD_ACCOUNT_EXISTS"));
            }
            return ResponseEntity.ok(Map.of("exists", false));
        } catch (InvalidFirebaseIdTokenException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Le jeton Firebase est invalide."));
        } catch (Exception exception) {
            return ResponseEntity.ok(Map.of("exists", false));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String idToken = request.get("idToken");
        if (idToken == null || idToken.isBlank()) {
            idToken = request.get("firebaseIdToken");
        }
        if (idToken == null || idToken.isBlank()) {
            idToken = request.get("credential");
        }

        String email = request.get("email");
        String nom = request.get("nom");
        if (nom == null || nom.isBlank()) {
            nom = request.get("name");
        }
        String prenom = request.get("prenom");
        String photo = request.get("photo");
        if (photo == null || photo.isBlank()) {
            photo = request.get("photoUrl");
        }
        String filiere = request.get("filiere");
        String pack = request.get("pack");
        String telephone = request.get("telephone");

        if (idToken != null && !idToken.isBlank()) {
            if ("demo-google-token".equals(idToken) || idToken.startsWith("demo-google:")) {
                if (email == null || email.isBlank()) {
                    email = idToken.startsWith("demo-google:")
                            ? idToken.substring("demo-google:".length()).trim().toLowerCase()
                            : "etudiant.concours@gmail.com";
                }
            } else {
                try {
                    FirebaseIdTokenVerifier.VerifiedGoogleUser verifiedUser = firebaseIdTokenVerifier
                            .verifyGoogleSignIn(idToken);
                    if (verifiedUser != null && verifiedUser.email() != null && !verifiedUser.email().isBlank()) {
                        email = verifiedUser.email();
                    }
                } catch (Exception ex) {
                    if (email == null || email.isBlank()) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(Map.of("message", "Impossible de vérifier le jeton Google."));
                    }
                }
            }
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email manquant."));
        }

        final String cleanEmail = email.trim().toLowerCase();
        final String finalNom = nom;
        final String finalPrenom = prenom;
        final String finalPhoto = photo;
        final String finalFiliere = filiere;
        final String finalPack = pack;
        final String finalTelephone = telephone;

        User user = userRepository.findByEmail(cleanEmail).orElseGet(() -> {
            String p = finalPrenom;
            String n = finalNom;
            if ((p == null || p.isBlank()) && (n == null || n.isBlank())) {
                String prefix = cleanEmail.split("@")[0];
                String[] parts = prefix.split("\\.");
                p = parts.length > 0 ? parts[0] : "Étudiant";
                n = parts.length > 1 ? parts[1] : "Google";
            } else if (p == null || p.isBlank()) {
                p = "Étudiant";
            }
            return userRepository.save(User.builder()
                    .prenom(p)
                    .nom(n != null && !n.isBlank() ? n : "Google")
                    .email(cleanEmail)
                    .motDePasse(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role("CLIENT")
                    .pack(finalPack != null && !finalPack.isBlank() ? finalPack : "PACK_COMPLET")
                    .filiere(
                            finalFiliere != null && !finalFiliere.isBlank() ? finalFiliere : "Sciences Mathématiques A")
                    .telephone(finalTelephone != null ? finalTelephone : "")
                    .profileImageUrl(finalPhoto != null ? finalPhoto : "")
                    .active(1)
                    .createdAt(LocalDateTime.now())
                    .build());
        });

        boolean modified = false;
        if ((user.getProfileImageUrl() == null || user.getProfileImageUrl().isBlank()) && finalPhoto != null
                && !finalPhoto.isBlank()) {
            user.setProfileImageUrl(finalPhoto);
            modified = true;
        }
        if ((user.getTelephone() == null || user.getTelephone().isBlank()) && finalTelephone != null
                && !finalTelephone.isBlank()) {
            user.setTelephone(finalTelephone);
            modified = true;
        }
        if (modified) {
            userRepository.save(user);
        }

        return ResponseEntity.ok(sessionResponse(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        authSessionService.revoke(bearerToken(authorization));
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        Optional<User> sessionUser = authSessionService.resolve(bearerToken(authorization));
        if (sessionUser.isEmpty() || sessionUser.get().getId() == null || sessionUser.get().getId() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Connectez-vous pour consulter votre profil."));
        }

        User user = userRepository.findById(sessionUser.get().getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Compte introuvable. Reconnectez-vous."));
        }
        return ResponseEntity.ok(profileResponse(user));
    }

    @PutMapping("/profile/telephone")
    public ResponseEntity<?> updateTelephone(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestBody Map<String, Object> body) {
        Optional<User> sessionUser = authSessionService.resolve(bearerToken(authorization));
        if (sessionUser.isEmpty() || sessionUser.get().getId() == null || sessionUser.get().getId() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Connectez-vous pour modifier votre numéro."));
        }

        Object value = body.get("telephone");
        String telephone = value == null ? "" : value.toString().trim();
        String digits = telephone.replaceAll("[\\s().+-]", "");
        if (!digits.matches("\\d{8,15}")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Saisissez un numéro valide de 8 à 15 chiffres."));
        }

        User user = userRepository.findById(sessionUser.get().getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Compte introuvable. Reconnectez-vous."));
        }
        user.setTelephone(telephone);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("telephone", telephone));
    }

    @PutMapping(value = "/profile/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadProfilePhoto(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestParam("file") MultipartFile file) {
        Optional<User> sessionUser = authSessionService.resolve(bearerToken(authorization));
        if (sessionUser.isEmpty() || sessionUser.get().getId() == null || sessionUser.get().getId() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Connectez-vous pour modifier votre photo."));
        }

        User user = userRepository.findById(sessionUser.get().getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Compte introuvable. Reconnectez-vous."));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Choisissez une image à envoyer."));
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("message", "La photo ne doit pas dépasser 5 Mo."));
        }

        try {
            String extension = validateProfileImage(file);
            Path directory = Path.of("uploads", "profiles").toAbsolutePath().normalize();
            Files.createDirectories(directory);
            String filename = "user_" + user.getId() + "_" + UUID.randomUUID() + "." + extension;
            Path destination = directory.resolve(filename).normalize();
            if (!destination.startsWith(directory)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Nom de fichier invalide."));
            }
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, destination);
            }

            String previousImage = user.getProfileImageUrl();
            String imageUrl = "/uploads/profiles/" + filename;
            user.setProfileImageUrl(imageUrl);
            try {
                userRepository.save(user);
            } catch (RuntimeException exception) {
                Files.deleteIfExists(destination);
                throw exception;
            }
            deleteStoredProfileImage(previousImage);
            return ResponseEntity.ok(Map.of("profileImageUrl", imageUrl));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Impossible d'enregistrer la photo pour le moment."));
        }
    }

    @DeleteMapping("/profile/photo")
    public ResponseEntity<?> deleteProfilePhoto(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        Optional<User> sessionUser = authSessionService.resolve(bearerToken(authorization));
        if (sessionUser.isEmpty() || sessionUser.get().getId() == null || sessionUser.get().getId() <= 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Connectez-vous pour supprimer votre photo."));
        }

        User user = userRepository.findById(sessionUser.get().getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Compte introuvable. Reconnectez-vous."));
        }

        String previousImage = user.getProfileImageUrl();
        user.setProfileImageUrl(null);
        userRepository.save(user);
        try {
            deleteStoredProfileImage(previousImage);
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message",
                            "La photo a été retirée du profil, mais le fichier n'a pas pu être supprimé."));
        }
        return ResponseEntity.ok(Map.of("profileImageUrl", ""));
    }

    private String validateProfileImage(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        String expectedFormat;
        String extension;
        if ("image/jpeg".equalsIgnoreCase(contentType)) {
            expectedFormat = "jpeg";
            extension = "jpg";
        } else if ("image/png".equalsIgnoreCase(contentType)) {
            expectedFormat = "png";
            extension = "png";
        } else {
            throw new IllegalArgumentException("Choisissez une image JPEG ou PNG.");
        }

        try (InputStream input = file.getInputStream();
                ImageInputStream imageInput = ImageIO.createImageInputStream(input)) {
            if (imageInput == null)
                throw new IllegalArgumentException("Le fichier choisi n'est pas une image valide.");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);
            if (!readers.hasNext())
                throw new IllegalArgumentException("Le fichier choisi n'est pas une image valide.");

            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInput, true, true);
                String actualFormat = reader.getFormatName().toLowerCase();
                if (!(expectedFormat.equals(actualFormat)
                        || ("jpeg".equals(expectedFormat) && "jpg".equals(actualFormat)))) {
                    throw new IllegalArgumentException("Le contenu du fichier ne correspond pas au format de l'image.");
                }
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || width > 5000 || height > 5000 || (long) width * height > 16_000_000L) {
                    throw new IllegalArgumentException("La photo doit mesurer au maximum 5000 × 5000 pixels.");
                }
                reader.read(0);
            } finally {
                reader.dispose();
            }
        }
        return extension;
    }

    private void deleteStoredProfileImage(String imageUrl) throws IOException {
        String prefix = "/uploads/profiles/";
        if (imageUrl == null || !imageUrl.startsWith(prefix))
            return;
        String filename = imageUrl.substring(prefix.length());
        if (filename.isBlank() || filename.contains("/") || filename.contains("\\"))
            return;

        Path directory = Path.of("uploads", "profiles").toAbsolutePath().normalize();
        Path imagePath = directory.resolve(filename).normalize();
        if (imagePath.startsWith(directory))
            Files.deleteIfExists(imagePath);
    }

    private Map<String, Object> sessionResponse(User user) {
        Map<String, Object> response = profileResponse(user);
        response.put("sessionToken", authSessionService.create(user));
        return response;
    }

    private Map<String, Object> profileResponse(User user) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("nom", user.getNom());
        response.put("prenom", user.getPrenom());
        response.put("role", user.getRole());
        response.put("pack", user.getPack());
        response.put("filiere", user.getFiliere());
        response.put("active", user.getActive());
        response.put("telephone", user.getTelephone());
        response.put("profileImageUrl", user.getProfileImageUrl());
        response.put("createdAt", user.getCreatedAt());
        return response;
    }

    private String bearerToken(String authorization) {
        return authorization != null && authorization.regionMatches(true, 0, "Bearer ", 0, 7)
                ? authorization.substring(7).trim()
                : null;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody InscriptionRequest request) {
        if (request.getFiliere() == null || !java.util.Set.of(
                "Sciences Mathématiques A",
                "Sciences Mathématiques B",
                "Sciences Physiques",
                "Sciences de la Vie et de la Terre (SVT)",
                "Sciences Économiques").contains(request.getFiliere())) {
            return ResponseEntity.badRequest().body("Veuillez choisir votre fili\u00e8re du baccalaur\u00e9at.");
        }
        if (request.getPack() == null || !java.util.Set.of(
                "MEDECINE", "ENSAM", "ENSA", "ENCG", "MEDECINE_ENSA", "PACK_COMPLET").contains(request.getPack())) {
            return ResponseEntity.badRequest().body("Veuillez choisir un pack valide.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(400).body("Cet email existe déjà !");
        }

        // ⚠️ Ḥit f DTO dyalk m-smiha password wla motDePasse (Khas t-kun t-etafk m3aha)
        // Ila kanesmiha password:
        // request.setPassword(passwordEncoder.encode(request.getPassword()));
        request.setPassword(passwordEncoder.encode(request.getPassword()));

        inscriptionRequestRepository.save(request);

        return ResponseEntity.ok("Demande d'inscription envoyée avec succès !");
    }
}
