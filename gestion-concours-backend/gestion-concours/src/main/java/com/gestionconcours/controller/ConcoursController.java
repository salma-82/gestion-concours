package com.gestionconcours.controller;

import com.gestionconcours.model.Concours;
import com.gestionconcours.repository.ConcoursRepository;
import com.gestionconcours.repository.StudentActivityEventRepository;
import com.gestionconcours.service.DemoContentAccessService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
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
    private final StudentActivityEventRepository studentActivityEventRepository;
    private final DemoContentAccessService demoAccess;

    public ConcoursController(ConcoursRepository concoursRepository,
                              StudentActivityEventRepository studentActivityEventRepository,
                              DemoContentAccessService demoAccess) {
        this.concoursRepository = concoursRepository;
        this.studentActivityEventRepository = studentActivityEventRepository;
        this.demoAccess = demoAccess;
    }

    private final String UPLOAD_DIR = "uploads/";

    // 1. GET: Filtre b École, Matière, Année (chapitre supprimé)
    @GetMapping
    public List<Concours> getConcours(
            @RequestParam(required = false) String ecole,
            @RequestParam(required = false) String matiere,
            @RequestParam(required = false) Integer annee,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        List<Concours> items = concoursRepository.filterConcours(ecole, matiere, annee);
        demoAccess.protectConcours(items, authorization);
        return items;
    }

    // 1b. GET: Liste des écoles distinctes (pour le client)
    @GetMapping("/ecoles")
    public List<String> getDistinctEcoles() {
        return concoursRepository.findDistinctEcoles();
    }

    // 1c. GET: Concours par école, triés par année décroissante (pour le client)
    @GetMapping("/by-ecole")
    public List<Concours> getConcoursByEcole(@RequestParam String ecole,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        List<Concours> items = concoursRepository.findByEcoleOrderByAnneeDesc(ecole);
        demoAccess.protectConcours(items, authorization);
        return items;
    }

    // 2. GET by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getConcoursById(@PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<Concours> item = concoursRepository.findById(id);
        if (item.isEmpty()) return ResponseEntity.notFound().build();
        if (demoAccess.isLocked(item.get().isFree(), authorization)) return demoAccess.forbidden();
        return ResponseEntity.ok(item.get());
    }
    // 3. POST: Ajouter un concours avec son sujet HTML
    @PostMapping
    public ResponseEntity<?> createConcours(
            @RequestParam("titre") String titre,
            @RequestParam("ecole") String ecole,
            @RequestParam("matiere") String matiere,
            @RequestParam("annee") Integer annee,
            @RequestParam(value = "fileSujet", required = false) MultipartFile fileSujet,
            @RequestParam(value = "fileHtml", required = false) MultipartFile fileHtml) {

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

            if (actualSujet != null && !actualSujet.isEmpty()) {
                String originalName = actualSujet.getOriginalFilename() != null
                        ? actualSujet.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_")
                        : "sujet.html";
                String fileNameSujet = UUID.randomUUID() + "_" + originalName;
                Files.write(Paths.get(UPLOAD_DIR, fileNameSujet), actualSujet.getBytes());
                concours.setHtmlUrl("http://localhost:8081/uploads/" + fileNameSujet);
            }

            Concours savedConcours = concoursRepository.save(concours);
            return ResponseEntity.ok(savedConcours);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur lors de l'upload des fichiers: " + e.getMessage());
        }
    }

    // 4. PUT: Modifier un Concours existant et ses fichiers HTML optionnels
    @PutMapping("/{id}")
    public ResponseEntity<?> updateConcours(
            @PathVariable Long id,
            @RequestParam("titre") String titre,
            @RequestParam("ecole") String ecole,
            @RequestParam("matiere") String matiere,
            @RequestParam("annee") Integer annee,
            @RequestParam(value = "fileSujet", required = false) MultipartFile fileSujet,
            @RequestParam(value = "fileHtml", required = false) MultipartFile fileHtml) {

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

            if (actualSujet != null && !actualSujet.isEmpty()) {
                String originalName = actualSujet.getOriginalFilename() != null
                        ? actualSujet.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_")
                        : "sujet.html";
                String fileNameSujet = UUID.randomUUID() + "_" + originalName;
                Files.write(Paths.get(UPLOAD_DIR, fileNameSujet), actualSujet.getBytes());
                concours.setHtmlUrl("http://localhost:8081/uploads/" + fileNameSujet);
            }

            Concours saved = concoursRepository.save(concours);
            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur lors de la mise à jour: " + e.getMessage());
        }
    }
    // 5. POST: Remplacer le fichier HTML du sujet
    @PostMapping("/{id}/upload-html")
    public ResponseEntity<?> uploadHtml(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file) {

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
            concours.setHtmlUrl(fullUrl);

            Concours saved = concoursRepository.save(concours);
            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur lors de l'upload du fichier HTML: " + e.getMessage());
        }
    }

    // 6. DELETE: Supprimer un Concours par ID
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteConcours(@PathVariable Long id) {
        if (!concoursRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        studentActivityEventRepository.deleteByConcoursId(id);
        concoursRepository.deleteById(id);
        return ResponseEntity.ok("Concours supprimé avec succès !");
    }
}
