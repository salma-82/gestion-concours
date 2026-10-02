package com.gestionconcours.controller;

import com.gestionconcours.model.Resume;
import com.gestionconcours.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/resumes")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeRepository resumeRepository;
    private final String UPLOAD_DIR = "uploads/";

    // 1. Afficher tous les résumés ou filtrer par matière/chapitre
    @GetMapping
    public List<Resume> getResumes(
            @RequestParam(required = false) String matiere,
            @RequestParam(required = false) String chapitre) {
        
        if (matiere != null && chapitre != null && !chapitre.isEmpty()) {
            return resumeRepository.findByMatiereAndChapitre(matiere, chapitre);
        } else if (matiere != null) {
            return resumeRepository.findByMatiere(matiere);
        }
        return resumeRepository.findAll();
    }

    // 2. Ajouter un résumé avec PDF (Réservé à l'Admin)
    @PostMapping
    public ResponseEntity<?> createResume(
            @RequestParam("matiere") String matiere,
            @RequestParam("chapitre") String chapitre,
            @RequestParam("titre") String titre,
            @RequestParam("file") MultipartFile file) {
        try {
            // Créer le dossier uploads ila ma kanch
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();

            // Enregistrer le fichier PDF avec un nom unique
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(UPLOAD_DIR + fileName);
            Files.write(filePath, file.getBytes());

            Resume resume = new Resume();
            resume.setMatiere(matiere);
            resume.setChapitre(chapitre);
            resume.setTitre(titre);
            resume.setPdfUrl(fileName);

            resumeRepository.save(resume);
            return ResponseEntity.ok("Résumé ajouté avec succès !");
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur lors de l'upload du fichier.");
        }
    }

    // 3. Supprimer un résumé
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(@PathVariable Long id) {
        resumeRepository.deleteById(id);
        return ResponseEntity.ok("Résumé supprimé avec succès !");
    }
}