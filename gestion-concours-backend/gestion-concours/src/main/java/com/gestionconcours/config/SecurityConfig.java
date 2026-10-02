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
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/api/resumes/**", "/api/concours-blancs/**", "/uploads/**")
                        .permitAll() // Public
                        .requestMatchers("/api/admin/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN", "admin", "role_admin") // 👈
                                                                                                                        // Ġttina
                                                                                                                        // gaɛ
                                                                                                                        // les
                                                                                                                        // cas
                                                                                                                        // bch
                                                                                                                        // n-tadawow
                                                                                                                        // 403
                        .anyRequest().authenticated());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5175", "http://localhost:5174",
                "http://localhost:5173", "http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
}