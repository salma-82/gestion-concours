package com.gestionconcours.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "resumes")
@Data
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String matiere;    // MATH, PHYSIQUE, SVT
    private String chapitre;   // Ex: Calcul des limites, Suites...
    private String titre;      // Titre dyal le résumé
    private String pdfUrl;     // Lien dyal fichier PDF (pour l'admin)
    private String htmlUrl;    // Lien dyal fichier HTML (avec MathJax, styles)
    private String fileType;   // "HTML" ou "PDF"

    private Integer totalPages = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "resume_page_images", joinColumns = @JoinColumn(name = "resume_id"))
    @Column(name = "image_url")
    @OrderColumn(name = "page_order")
    private List<String> pageImages = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String contenu;    // Contenu texte ou description

    private LocalDateTime createdAt = LocalDateTime.now();
}

