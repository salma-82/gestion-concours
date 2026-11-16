package com.gestionconcours.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;

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
    @Column(length = 500)
    private String htmlUrl;           // Fichier HTML Sujet

    @Column(name = "is_free", nullable = false)
    private boolean isFree = false;

    public Concours() {
    }

    public Concours(Long id, String titre, String ecole, String matiere, Integer annee, String htmlUrl) {
        this.id = id;
        this.titre = titre;
        this.ecole = ecole;
        this.matiere = matiere;
        this.annee = annee;
        this.htmlUrl = htmlUrl;
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

    @JsonProperty("isFree")
    public boolean isFree() { return isFree; }
    public void setFree(boolean free) { isFree = free; }

    public String getHtmlUrl() {
        return htmlUrl;
    }

    public void setHtmlUrl(String htmlUrl) {
        this.htmlUrl = htmlUrl;
    }

}
