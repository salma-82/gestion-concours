package com.gestionconcours.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "examens_nationaux")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamenNational {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;            // Ex: Examen National 2024
    private String matiere;          // Ex: Mathématiques, Physique-Chimie, SVT...
    private String optionBac;        // Ex: SM-A, SM-B, PC, SVT, STE, STM, Eco...
    private String session;          // Ex: Normale, Rattrapage
    private Integer annee;           // Ex: 2024, 2023, 2022...

    private String pdfSujetUrl;      // Lien PDF dyal le sujet
    private String pdfCorrectionUrl; // Lien PDF dyal la correction

    private Integer sujetTotalPages = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @Fetch(FetchMode.SUBSELECT)
    @CollectionTable(name = "examen_sujet_page_images", joinColumns = @JoinColumn(name = "examen_id"))
    @Column(name = "image_url")
    @OrderColumn(name = "page_order")
    private List<String> sujetPageImages = new ArrayList<>();

    private Integer correctionTotalPages = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @Fetch(FetchMode.SUBSELECT)
    @CollectionTable(name = "examen_correction_page_images", joinColumns = @JoinColumn(name = "examen_id"))
    @Column(name = "image_url")
    @OrderColumn(name = "page_order")
    private List<String> correctionPageImages = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
}
