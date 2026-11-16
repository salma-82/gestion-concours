package com.gestionconcours.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String htmlUrl;    // Lien dyal fichier HTML (avec MathJax, styles)
    private String fileType;   // "HTML" ou "PDF"

    private Integer totalPages = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "resume_page_images", joinColumns = @JoinColumn(name = "resume_id"))
    @Column(name = "image_url")
    @OrderColumn(name = "page_order")
    private List<String> pageImages = new ArrayList<>();

    @Column(name = "is_free", nullable = false)
    private boolean isFree = false;

    @JsonProperty("isFree")
    public boolean isFree() { return isFree; }

    private LocalDateTime createdAt = LocalDateTime.now();
}

