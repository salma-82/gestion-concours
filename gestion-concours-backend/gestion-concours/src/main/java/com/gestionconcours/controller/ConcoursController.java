package com.gestionconcours.controller;

import com.gestionconcours.model.Concours;
import com.gestionconcours.repository.ConcoursRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
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

    // 1. GET: Filtre b École, Matière, Année (chapitre supprimé)
    @GetMapping
    public List<Concours> getConcours(
            @RequestParam(required = false) String ecole,
            @RequestParam(required = false) String matiere,
            @RequestParam(required = false) Integer annee) {
        
        return concoursRepository.filterConcours(ecole, matiere, annee);
    }

    // 1b. GET: Liste des écoles distinctes (pour le client)
    @GetMapping("/ecoles")
    public List<String> getDistinctEcoles() {
        return concoursRepository.findDistinctEcoles();
    }

    // 1c. GET: Concours par école, triés par année décroissante (pour le client)
    @GetMapping("/by-ecole")
    public List<Concours> getConcoursByEcole(@RequestParam String ecole) {
        return concoursRepository.findByEcoleOrderByAnneeDesc(ecole);
    }

    // 2. GET by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getConcoursById(@PathVariable Long id) {
        return concoursRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. POST: Ajout Concours avec fichiers HTML (Sujet et Correction)
    @PostMapping
    public ResponseEntity<?> createConcours(
            @RequestParam("titre") String titre,
            @RequestParam("ecole") String ecole,
            @RequestParam("matiere") String matiere,
            @RequestParam("annee") Integer annee,
            @RequestParam(value = "fileSujet", required = false) MultipartFile fileSujet,
            @RequestParam(value = "fileCorrection", required = false) MultipartFile fileCorrection,
            @RequestParam(value = "fileHtml", required = false) MultipartFile fileHtml,
            @RequestParam(value = "fileHtmlCorrection", required = false) MultipartFile fileHtmlCorrection) {

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

            MultipartFile actualSujet = fileHtml != null && !fileHtml.isEmpty() ? fileHtml : fileSujet;
            MultipartFile actualCorrection = fileHtmlCorrection != null && !fileHtmlCorrection.isEmpty() ? fileHtmlCorrection : fileCorrection;

            // Traitement Sujet HTML
            if (actualSujet != null && !actualSujet.isEmpty()) {
                String originalName = actualSujet.getOriginalFilename() != null 
                        ? actualSujet.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") 
                        : "sujet.html";
                String fileNameSujet = UUID.randomUUID().toString() + "_" + originalName;
                Path filePathSujet = Paths.get(UPLOAD_DIR, fileNameSujet);
                Files.write(filePathSujet, actualSujet.getBytes());

                String fullUrl = "http://localhost:8081/uploads/" + fileNameSujet;
                concours.setHtmlUrl(fullUrl);
            }

            // Traitement Correction HTML
            if (actualCorrection != null && !actualCorrection.isEmpty()) {
                String originalName = actualCorrection.getOriginalFilename() != null 
                        ? actualCorrection.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") 
                        : "correction.html";
                String fileNameCorrection = UUID.randomUUID().toString() + "_" + originalName;
                Path filePathCorrection = Paths.get(UPLOAD_DIR, fileNameCorrection);
                Files.write(filePathCorrection, actualCorrection.getBytes());

                String fullUrl = "http://localhost:8081/uploads/" + fileNameCorrection;
                concours.setHtmlCorrectionUrl(fullUrl);
            }

            Concours savedConcours = concoursRepository.save(concours);
            return ResponseEntity.ok(savedConcours);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur lors de l'upload des fichiers: " + e.getMessage());
        }
    }

    // 4. PUT: Modifier un Concours existant et ses fichiers HTML
    @PutMapping("/{id}")
    public ResponseEntity<?> updateConcours(
            @PathVariable Long id,
            @RequestParam("titre") String titre,
            @RequestParam("ecole") String ecole,
            @RequestParam("matiere") String matiere,
            @RequestParam("annee") Integer annee,
            @RequestParam(value = "fileSujet", required = false) MultipartFile fileSujet,
            @RequestParam(value = "fileCorrection", required = false) MultipartFile fileCorrection,
            @RequestParam(value = "fileHtml", required = false) MultipartFile fileHtml,
            @RequestParam(value = "fileHtmlCorrection", required = false) MultipartFile fileHtmlCorrection) {

        Optional<Concours> optionalConcours = concoursRepository.findById(id);
        if (!optionalConcours.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        try {
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            Concours concours = optionalConcours.get();
            concours.setTitre(titre);
            concours.setEcole(ecole);
            concours.setMatiere(matiere);
            concours.setAnnee(annee);

            MultipartFile actualSujet = fileHtml != null && !fileHtml.isEmpty() ? fileHtml : fileSujet;
            MultipartFile actualCorrection = fileHtmlCorrection != null && !fileHtmlCorrection.isEmpty() ? fileHtmlCorrection : fileCorrection;

            // Remplacement éventuel du Sujet HTML
            if (actualSujet != null && !actualSujet.isEmpty()) {
                String originalName = actualSujet.getOriginalFilename() != null 
                        ? actualSujet.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") 
                        : "sujet.html";
                String fileNameSujet = UUID.randomUUID().toString() + "_" + originalName;
                Path filePathSujet = Paths.get(UPLOAD_DIR, fileNameSujet);
                Files.write(filePathSujet, actualSujet.getBytes());

                String fullUrl = "http://localhost:8081/uploads/" + fileNameSujet;
                concours.setHtmlUrl(fullUrl);
            }

            // Remplacement éventuel de la Correction HTML
            if (actualCorrection != null && !actualCorrection.isEmpty()) {
                String originalName = actualCorrection.getOriginalFilename() != null 
                        ? actualCorrection.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") 
                        : "correction.html";
                String fileNameCorrection = UUID.randomUUID().toString() + "_" + originalName;
                Path filePathCorrection = Paths.get(UPLOAD_DIR, fileNameCorrection);
                Files.write(filePathCorrection, actualCorrection.getBytes());

                String fullUrl = "http://localhost:8081/uploads/" + fileNameCorrection;
                concours.setHtmlCorrectionUrl(fullUrl);
            }

            Concours saved = concoursRepository.save(concours);
            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur lors de la mise à jour: " + e.getMessage());
        }
    }

    // 5. POST: Remplacer directement le fichier HTML Sujet ou Correction
    @PostMapping("/{id}/upload-html")
    public ResponseEntity<?> uploadHtml(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "type", defaultValue = "sujet") String type) {

        Optional<Concours> optionalConcours = concoursRepository.findById(id);
        if (!optionalConcours.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Veuillez sélectionner un fichier HTML.");
        }

        try {
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            Concours concours = optionalConcours.get();
            String originalName = file.getOriginalFilename() != null 
                    ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") 
                    : "concours.html";
            String fileName = UUID.randomUUID().toString() + "_" + originalName;
            Path filePath = Paths.get(UPLOAD_DIR, fileName);
            Files.write(filePath, file.getBytes());

            String fullUrl = "http://localhost:8081/uploads/" + fileName;
            if ("correction".equalsIgnoreCase(type)) {
                concours.setHtmlCorrectionUrl(fullUrl);
            } else {
                concours.setHtmlUrl(fullUrl);
            }

            Concours saved = concoursRepository.save(concours);
            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur lors de l'upload du fichier HTML: " + e.getMessage());
        }
    }

    // 6. DELETE: Supprimer un Concours par ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConcours(@PathVariable Long id) {
        if (!concoursRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        concoursRepository.deleteById(id);
        return ResponseEntity.ok("Concours supprimé avec succès !");
    }
}