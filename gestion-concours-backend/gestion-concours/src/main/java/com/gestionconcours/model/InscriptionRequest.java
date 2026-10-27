package com.gestionconcours.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
@Data
@Entity
@Table(name = "demande_inscription")
public class InscriptionRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    private String email;
    private String telephone;
    private String password; // Khas y-kon encrypted (BCrypt)
    private String role = "CLIENT";
    @Column(name = "selected_pack", length = 40)
    private String pack;

    @Column(name = "filiere_bac", length = 120, nullable = false)
    private String filiere;
    
    // Getters and Setters
}
