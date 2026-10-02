package com.gestionconcours.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "concours")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Concours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String ecole;   // Matalan: ENSA, ENCG, FST...
    private String matiere; // Matalan: Math, Physique, Informatique...
    private Integer annee;  // Matalan: 2025, 2026...

    private String pdfUrl;           // PDF dyal Sujet
    private String pdfCorrectionUrl; // PDF dyal Correction
}