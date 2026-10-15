package com.gestionconcours.model;

import jakarta.persistence.*;

@Entity
@Table(name = "concours")
public class Concours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String ecole;   // Matalan: ENSA, ENCG, FST...
    private String matiere;  // Matalan: Math, Physique, Informatique...
    private Integer annee;   // Matalan: 2025, 2026...

    private String pdfCorrectionUrl; // PDF dyal Correction (rétrocompatibilité)

    @Column(length = 500)
    private String htmlUrl;           // Fichier HTML Sujet

    @Column(length = 500)
    private String htmlCorrectionUrl; // Fichier HTML Correction

    public Concours() {
    }

    public Concours(Long id, String titre, String ecole, String matiere, Integer annee, String pdfCorrectionUrl, String htmlUrl, String htmlCorrectionUrl) {
        this.id = id;
        this.titre = titre;
        this.ecole = ecole;
        this.matiere = matiere;
        this.annee = annee;
        this.pdfCorrectionUrl = pdfCorrectionUrl;
        this.htmlUrl = htmlUrl;
        this.htmlCorrectionUrl = htmlCorrectionUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getEcole() {
        return ecole;
    }

    public void setEcole(String ecole) {
        this.ecole = ecole;
    }

    public String getMatiere() {
        return matiere;
    }

    public void setMatiere(String matiere) {
        this.matiere = matiere;
    }

    public Integer getAnnee() {
        return annee;
    }

    public void setAnnee(Integer annee) {
        this.annee = annee;
    }

    public String getPdfCorrectionUrl() {
        return pdfCorrectionUrl;
    }

    public void setPdfCorrectionUrl(String pdfCorrectionUrl) {
        this.pdfCorrectionUrl = pdfCorrectionUrl;
    }

    public String getHtmlUrl() {
        return htmlUrl;
    }

    public void setHtmlUrl(String htmlUrl) {
        this.htmlUrl = htmlUrl;
    }

    public String getHtmlCorrectionUrl() {
        return htmlCorrectionUrl;
    }

    public void setHtmlCorrectionUrl(String htmlCorrectionUrl) {
        this.htmlCorrectionUrl = htmlCorrectionUrl;
    }
}