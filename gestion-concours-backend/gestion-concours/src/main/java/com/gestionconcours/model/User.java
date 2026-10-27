package com.gestionconcours.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String prenom;

    @Column(unique = true, nullable = false)
    private String email;

    private String telephone;

    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    private String role;

    @Column(name = "selected_pack", length = 40)
    private String pack;

    @Column(name = "filiere_bac", length = 120)
    private String filiere;

    private Integer active;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;
}
