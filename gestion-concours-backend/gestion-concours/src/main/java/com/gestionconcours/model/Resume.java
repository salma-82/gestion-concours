package com.gestionconcours.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Data
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String matiere;    // MATH, PHYSIQUE, SVT
    private String chapitre;   // Ex: Calcul des limites, Suites...
    private String titre;      // Titre dyal la fiche
    private String pdfUrl;     // Chemin wla nom dyal fichier PDF

    private LocalDateTime createdAt = LocalDateTime.now();
}