package com.gestionconcours.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

@Entity
@Table(name = "concours_blancs")
public class ConcoursBlanc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String matiere;
    private String chapitre;

    @Column(length = 500)
    private String htmlUrl;

    private String fileType; // "HTML"

    // Nouveaux champs
    private Integer dureeMnutes;       // Durée du test en minutes
    private Integer nombreQuestions;   // Nombre de questions
    private Boolean publie = false;    // Publié ou non
    @Column(name = "is_free", nullable = false)
    private boolean isFree = false;
    private LocalDateTime dateCreation = LocalDateTime.now();

    // Constructeur vide
    public ConcoursBlanc() {
    }

    // ========== Getters & Setters ==========

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMatiere() { return matiere; }
    public void setMatiere(String matiere) { this.matiere = matiere; }

    public String getChapitre() { return chapitre; }
    public void setChapitre(String chapitre) { this.chapitre = chapitre; }

    public String getHtmlUrl() { return htmlUrl; }
    public void setHtmlUrl(String htmlUrl) { this.htmlUrl = htmlUrl; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Integer getDureeMnutes() { return dureeMnutes; }
    public void setDureeMnutes(Integer dureeMnutes) { this.dureeMnutes = dureeMnutes; }

    @JsonProperty("isFree")
    public boolean isFree() { return isFree; }
    public void setFree(boolean free) { isFree = free; }

    public Integer getNombreQuestions() { return nombreQuestions; }
    public void setNombreQuestions(Integer nombreQuestions) { this.nombreQuestions = nombreQuestions; }

    public Boolean getPublie() { return publie != null ? publie : false; }
    public void setPublie(Boolean publie) { this.publie = publie; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
