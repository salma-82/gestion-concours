package com.gestionconcours.controller;

import com.gestionconcours.model.Concours;
import com.gestionconcours.repository.ConcoursRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/concours")
@CrossOrigin(origins = "*")
public class ConcoursController {

    private final ConcoursRepository concoursRepository;

    public ConcoursController(ConcoursRepository concoursRepository) {
        this.concoursRepository = concoursRepository;
    }

    private final String UPLOAD_DIR = "uploads/";

    // 1. GET: Filtre b École, Matière, Année
    @GetMapping
    public List<Concours> getConcours(
            @RequestParam(required = false) String ecole,
            @RequestParam(required = false) String matiere,
            @RequestParam(required = false) Integer annee) {
        
        return concoursRepository.filterConcours(ecole, matiere, annee);
    }

    // 2. POST: Ajout Concours m3a Sujet w Correction (Bdoon Chapitre)
    @PostMapping
    public ResponseEntity<?> createConcours(
            @RequestParam("titre") String titre,
            @RequestParam("ecole") String ecole,
            @RequestParam("matiere") String matiere,
            @RequestParam("annee") Integer annee,
            @RequestParam(value = "fileSujet", required = false) MultipartFile fileSujet,
            @RequestParam(value = "fileCorrection", required = false) MultipartFile fileCorrection) {

        try {
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            Concours concours = new Concours();
            concours.setTitre(titre);
            concours.setEcole(ecole);
            concours.setMatiere(matiere);
            concours.setAnnee(annee);

            // Traitement PDF Sujet
            if (fileSujet != null && !fileSujet.isEmpty()) {
                String fileNameSujet = UUID.randomUUID().toString() + "_" + fileSujet.getOriginalFilename();
                Path filePathSujet = Paths.get(UPLOAD_DIR + fileNameSujet);
                Files.write(filePathSujet, fileSujet.getBytes());
                concours.setPdfUrl("http://localhost:8080/uploads/" + fileNameSujet);
            }

            // Traitement PDF Correction
            if (fileCorrection != null && !fileCorrection.isEmpty()) {
                String fileNameCorrection = UUID.randomUUID().toString() + "_" + fileCorrection.getOriginalFilename();
                Path filePathCorrection = Paths.get(UPLOAD_DIR + fileNameCorrection);
                Files.write(filePathCorrection, fileCorrection.getBytes());
                concours.setPdfCorrectionUrl("http://localhost:8080/uploads/" + fileNameCorrection);
            }

            Concours savedConcours = concoursRepository.save(concours);
            return ResponseEntity.ok(savedConcours);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur lors de l'upload des fichiers: " + e.getMessage());
        }
    }

    // 3. DELETE: Supprimer un Concours par ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConcours(@PathVariable Long id) {
        if (!concoursRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        concoursRepository.deleteById(id);
        return ResponseEntity.ok("Concours supprimé avec succès !");
    }
}