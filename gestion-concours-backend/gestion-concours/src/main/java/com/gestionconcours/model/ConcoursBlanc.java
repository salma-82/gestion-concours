package com.gestionconcours.model;

import jakarta.persistence.*;
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

    // Champs conservés pour compatibilité
    private String ecole;
    private Integer annee;

    @Column(length = 500)
    private String pdfUrl;

    @Column(length = 500)
    private String htmlUrl;

    private String fileType; // "PDF", "HTML", "BOTH"

    // Nouveaux champs
    private Integer dureeMnutes;       // Durée du test en minutes
    private Integer nombreQuestions;   // Nombre de questions
    private Boolean publie = false;    // Publié ou non
    private LocalDateTime dateCreation = LocalDateTime.now();

    // Constructeur vide
    public ConcoursBlanc() {
    }

    public ConcoursBlanc(String titre, String matiere, String chapitre, String pdfUrl) {
        this.titre = titre;
        this.matiere = matiere;
        this.chapitre = chapitre;
        this.pdfUrl = pdfUrl;
    }

    public ConcoursBlanc(String titre, String ecole, String matiere, String chapitre, Integer annee, String pdfUrl) {
        this.titre = titre;
        this.ecole = ecole;
        this.matiere = matiere;
        this.chapitre = chapitre;
        this.annee = annee;
        this.pdfUrl = pdfUrl;
    }

    // ========== Getters & Setters ==========

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getEcole() { return ecole; }
    public void setEcole(String ecole) { this.ecole = ecole; }

    public String getMatiere() { return matiere; }
    public void setMatiere(String matiere) { this.matiere = matiere; }

    public String getChapitre() { return chapitre; }
    public void setChapitre(String chapitre) { this.chapitre = chapitre; }

    public Integer getAnnee() { return annee; }
    public void setAnnee(Integer annee) { this.annee = annee; }

    public String getPdfUrl() { return pdfUrl; }
    public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }

    public String getHtmlUrl() { return htmlUrl; }
    public void setHtmlUrl(String htmlUrl) { this.htmlUrl = htmlUrl; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Integer getDureeMnutes() { return dureeMnutes; }
    public void setDureeMnutes(Integer dureeMnutes) { this.dureeMnutes = dureeMnutes; }

    public Integer getNombreQuestions() { return nombreQuestions; }
    public void setNombreQuestions(Integer nombreQuestions) { this.nombreQuestions = nombreQuestions; }

    public Boolean getPublie() { return publie != null ? publie : false; }
    public void setPublie(Boolean publie) { this.publie = publie; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}