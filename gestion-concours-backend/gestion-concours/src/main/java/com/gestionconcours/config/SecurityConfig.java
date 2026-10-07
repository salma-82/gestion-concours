package com.gestionconcours.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Désactiver CSRF l l-api REST
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Activer CORS globalement
                .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable())) // Permettre l'affichage dans un iframe (PDF)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                            "/api/**",       // 👈 Rddina ga3 les routes /api/** public bach t-hni rassek mn 403 Forbidden
                            "/uploads/**",
                            "/error"
                        )
                        .permitAll()
                        .anyRequest().authenticated());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5175", 
            "http://localhost:5174",
            "http://localhost:5173", 
            "http://localhost:3000"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}