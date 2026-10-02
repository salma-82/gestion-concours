package com.gestionconcours.model;

import jakarta.persistence.*;

@Entity
@Table(name = "concours_blancs")
public class ConcoursBlanc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String matiere;
    private String chapitre;
    
    @Column(length = 500)
    private String pdfUrl; // L-lien wla l-chemis dyal PDF

    // Constructeur vide
    public ConcoursBlanc() {
    }

    // Constructeur m3a les paramètres
    public ConcoursBlanc(String titre, String matiere, String chapitre, String pdfUrl) {
        this.titre = titre;
        this.matiere = matiere;
        this.chapitre = chapitre;
        this.pdfUrl = pdfUrl;
    }

    // Getters et Setters
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

    public String getMatiere() {
        return matiere;
    }

    public void setMatiere(String matiere) {
        this.matiere = matiere;
    }

    public String getChapitre() {
        return chapitre;
    }

    public void setChapitre(String chapitre) {
        this.chapitre = chapitre;
    }

    public String getPdfUrl() {
        return pdfUrl;
    }

    public void setPdfUrl(String pdfUrl) {
        this.pdfUrl = pdfUrl;
    }
}