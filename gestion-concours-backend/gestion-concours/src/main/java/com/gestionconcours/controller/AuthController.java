package com.gestionconcours.controller;

import com.gestionconcours.dto.LoginRequest;
import com.gestionconcours.model.InscriptionRequest;
import com.gestionconcours.model.User;
import com.gestionconcours.repository.InscriptionRequestRepository;
import com.gestionconcours.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final InscriptionRequestRepository inscriptionRequestRepository;
    private final BCryptPasswordEncoder passwordEncoder;

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