package com.gestionconcours.controller;

import com.gestionconcours.model.ConcoursBlanc;
import com.gestionconcours.repository.ConcoursBlancRepository;
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
@RequestMapping("/api/concours-blancs")
@CrossOrigin(origins = "*")
public class ConcoursBlancController {

    private final ConcoursBlancRepository concoursBlancRepository;

    public ConcoursBlancController(ConcoursBlancRepository concoursBlancRepository) {
        this.concoursBlancRepository = concoursBlancRepository;
    }

    private final String UPLOAD_DIR = "uploads/";

    // Jbd l-liste kamla (GET)
    @GetMapping
    public List<ConcoursBlanc> getAllConcours() {
        return concoursBlancRepository.findAll();
    }

    // Ajout dyal concours m3a PDF (POST)
    @PostMapping
    public ResponseEntity<?> createConcours(
            @RequestParam("titre") String titre,
            @RequestParam("matiere") String matiere,
            @RequestParam("chapitre") String chapitre,
            @RequestParam("file") MultipartFile file) {
        try {
            // Créer dossier uploads ila makanch
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // Renommer l-fichier b UUID bach ma y- t-cheriawch b nafs l-ism
            String fileName = UUID.randomUUID().toString() + "_" + (file.getOriginalFilename() != null ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") : "concours_blanc.pdf");
            Path filePath = Paths.get(UPLOAD_DIR, fileName);
            Files.write(filePath, file.getBytes());

            // Enregistrement f Base de Données
            ConcoursBlanc concours = new ConcoursBlanc();
            concours.setTitre(titre);
            concours.setMatiere(matiere);
            concours.setChapitre(chapitre);
            concours.setPdfUrl("http://localhost:8081/uploads/" + fileName); // URL dyal PDF

            ConcoursBlanc saved = concoursBlancRepository.save(concours);
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur f téléchargement dyal l-fichier: " + e.getMessage());
        }
    }

    // Supprimer un concours blanc par ID (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConcoursBlanc(@PathVariable Long id) {
        if (!concoursBlancRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        concoursBlancRepository.deleteById(id);
        return ResponseEntity.ok("Concours blanc supprimé avec succès !");
    }
}