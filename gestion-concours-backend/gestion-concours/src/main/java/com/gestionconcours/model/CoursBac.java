package com.gestionconcours.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "cours_bac")
@Data
public class CoursBac {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    private String matiere;   // Mathématiques, Physique-Chimie, SVT

    private String filiere;   // Filière / Option Bac (ex: SM-A, SM-B, PC, SVT...)

    private String chapitre;  // Nom dyal chapitre

    @Column(length = 500)
    private String htmlUrl;   // Lien dyal fichier HTML uploadé

    private LocalDateTime createdAt = LocalDateTime.now();
}
