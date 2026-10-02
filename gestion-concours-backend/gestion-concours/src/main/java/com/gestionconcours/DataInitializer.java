package com.gestionconcours;

import com.gestionconcours.model.User;
import com.gestionconcours.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository) {
        return args -> {
            // Outil pour hacher le mot de passe (BCrypt)
            BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

            // Vérifier si la table est vide pour éviter les doublons à chaque redémarrage
            if (userRepository.count() == 0) {
                
                // 1. Création du compte ADMIN
                User admin = User.builder()
                        .nom("Admin")
                        .prenom("Super")
                        .email("admin@concours.ma")
                        .motDePasse(passwordEncoder.encode("123456")) // Mot de passe haché !
                        .role("ADMIN")
                        .active(1)
                        .createdAt(LocalDateTime.now())
                        .dateValidation(LocalDateTime.now())
                        .build();

                userRepository.save(admin);
                System.out.println(">>> Utilisateur ADMIN inséré avec succès ! (Email: admin@concours.ma / Pass: 123456)");

                // 2. Création du compte CLIENT
                User client = User.builder()
                        .nom("Boussami")
                        .prenom("Salma")
                        .email("client@concours.ma")
                        .motDePasse(passwordEncoder.encode("123456")) // Mot de passe haché !
                        .role("CLIENT")
                        .active(1)
                        .createdAt(LocalDateTime.now())
                        .dateValidation(LocalDateTime.now())
                        .build();

                userRepository.save(client);
                System.out.println(">>> Utilisateur CLIENT inséré avec succès ! (Email: client@concours.ma / Pass: 123456)");
            }
        };
    }
}