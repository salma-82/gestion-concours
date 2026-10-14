package com.gestionconcours.controller;

import com.gestionconcours.model.CoursBac;
import com.gestionconcours.repository.CoursBacRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CoursBacController {

    private final CoursBacRepository coursBacRepository;
    private final String UPLOAD_DIR = "uploads/";

    // 1. GET: Récupérer tous les cours_bac avec filtre par Matière et Chapitre
    @GetMapping("/api/cours-bac")
    public List<CoursBac> getCoursBac(
            @RequestParam(required = false) String matiere,
            @RequestParam(required = false) String chapitre) {
        if ((matiere != null && !matiere.trim().isEmpty()) || (chapitre != null && !chapitre.trim().isEmpty())) {
            return coursBacRepository.filterCoursBac(matiere, chapitre);
        }
        return coursBacRepository.findAll();
    }

    // 2. GET by ID
    @GetMapping("/api/cours-bac/{id}")
    public ResponseEntity<?> getCoursBacById(@PathVariable Long id) {
        return coursBacRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. GET: Distinct Matières
    @GetMapping("/api/cours-bac/matieres")
    public List<String> getMatieres() {
        return coursBacRepository.findDistinctMatieres();
    }

    // 4. GET: Distinct Chapitres par Matière
    @GetMapping("/api/cours-bac/chapitres")
    public List<String> getChapitres(@RequestParam String matiere) {
        return coursBacRepository.findDistinctChapitresByMatiere(matiere);
    }

    // 5. POST: Ajouter un cours_bac avec fichier HTML
    @PostMapping("/api/cours-bac")
    public ResponseEntity<?> createCoursBac(
            @RequestParam("titre") String titre,
            @RequestParam("matiere") String matiere,
            @RequestParam("chapitre") String chapitre,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Veuillez sélectionner un fichier HTML.");
            }

            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String baseUuid = UUID.randomUUID().toString();
            String originalFileName = file.getOriginalFilename() != null ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") : "cours.html";
            String htmlFileName = baseUuid + "_" + originalFileName;

            Path htmlFilePath = Paths.get(UPLOAD_DIR, htmlFileName);
            Files.write(htmlFilePath, file.getBytes());

            CoursBac cours = new CoursBac();
            cours.setTitre(titre);
            cours.setMatiere(matiere);
            cours.setChapitre(chapitre);
            cours.setHtmlUrl("http://localhost:8081/uploads/" + htmlFileName);

            CoursBac saved = coursBacRepository.save(cours);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors de l'enregistrement du cours BAC : " + e.getMessage());
        }
    }

    // 6. PUT: Modifier un cours_bac
    @PutMapping("/api/cours-bac/{id}")
    public ResponseEntity<?> updateCoursBac(
            @PathVariable Long id,
            @RequestParam("titre") String titre,
            @RequestParam("matiere") String matiere,
            @RequestParam("chapitre") String chapitre,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            Optional<CoursBac> optionalCours = coursBacRepository.findById(id);
            if (optionalCours.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            CoursBac cours = optionalCours.get();
            cours.setTitre(titre);
            cours.setMatiere(matiere);
            cours.setChapitre(chapitre);

            if (file != null && !file.isEmpty()) {
                File dir = new File(UPLOAD_DIR);
                if (!dir.exists()) {
                    dir.mkdirs();
                }

                String baseUuid = UUID.randomUUID().toString();
                String originalFileName = file.getOriginalFilename() != null ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") : "cours.html";
                String htmlFileName = baseUuid + "_" + originalFileName;

                Path htmlFilePath = Paths.get(UPLOAD_DIR, htmlFileName);
                Files.write(htmlFilePath, file.getBytes());

                cours.setHtmlUrl("http://localhost:8081/uploads/" + htmlFileName);
            }

            CoursBac updated = coursBacRepository.save(cours);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors de la modification du cours BAC : " + e.getMessage());
        }
    }

    // 7. DELETE: Supprimer un cours_bac
    @DeleteMapping("/api/cours-bac/{id}")
    public ResponseEntity<?> deleteCoursBac(@PathVariable Long id) {
        coursBacRepository.deleteById(id);
        return ResponseEntity.ok("Cours BAC supprimé avec succès !");
    }
}
