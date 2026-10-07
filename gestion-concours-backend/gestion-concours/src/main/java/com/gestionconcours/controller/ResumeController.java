package com.gestionconcours.controller;

import com.gestionconcours.model.Resume;
import com.gestionconcours.repository.ResumeRepository;
import com.gestionconcours.service.PdfPageConverterService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeRepository resumeRepository;
    private final PdfPageConverterService pdfPageConverterService;
    private final String UPLOAD_DIR = "uploads/";

    @GetMapping("/api/resumes/matieres")
    public List<String> getMatieres() {
        return resumeRepository.findDistinctMatieres();
    }

    @GetMapping("/api/resumes/chapitres")
    public List<String> getChapitres(@RequestParam String matiere) {
        return resumeRepository.findDistinctChapitresByMatiere(matiere);
    }

    @GetMapping({"/api/resumes", "/api/clients/{clientId}/resumes"})
    public List<Resume> getResumes(
            @PathVariable(required = false) Long clientId,
            @RequestParam(required = false) String matiere,
            @RequestParam(required = false) String chapitre) {

        List<Resume> list;
        if (matiere != null && chapitre != null && !chapitre.isEmpty()) {
            list = resumeRepository.findByMatiereAndChapitre(matiere, chapitre);
        } else if (matiere != null) {
            list = resumeRepository.findByMatiere(matiere);
        } else {
            list = resumeRepository.findAll();
        }

        // Auto-génération des images si un ancien résumé a le PDF mais pas encore les pages PNG
        for (Resume resume : list) {
            if ((resume.getPageImages() == null || resume.getPageImages().isEmpty()) && resume.getPdfUrl() != null) {
                ensureResumePageImages(resume);
            }
        }

        return list;
    }

    @GetMapping("/api/resumes/{id}")
    public ResponseEntity<?> getResumeById(@PathVariable Long id) {
        Optional<Resume> optionalResume = resumeRepository.findById(id);
        if (optionalResume.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Resume resume = optionalResume.get();
        if ((resume.getPageImages() == null || resume.getPageImages().isEmpty()) && resume.getPdfUrl() != null) {
            ensureResumePageImages(resume);
        }

        return ResponseEntity.ok(resume);
    }

    @PostMapping("/api/resumes")
    public ResponseEntity<?> createResume(
            @RequestParam("matiere") String matiere,
            @RequestParam("chapitre") String chapitre,
            @RequestParam("titre") String titre,
            @RequestParam("file") MultipartFile file) {

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Le fichier PDF est vide.");
            }

            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String baseUuid = UUID.randomUUID().toString();
            String originalFileName = file.getOriginalFilename() != null ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") : "resume.pdf";
            String pdfFileName = baseUuid + "_" + originalFileName;
            Path pdfFilePath = Paths.get(UPLOAD_DIR, pdfFileName);
            Files.write(pdfFilePath, file.getBytes());

            // Conversion automatique de chaque page du PDF en image PNG avec PDFBox
            List<String> pageFileNames = pdfPageConverterService.convertPdfToPngPages(pdfFilePath.toFile(), dir, "page_" + baseUuid);

            List<String> pageUrls = new ArrayList<>();
            for (String pName : pageFileNames) {
                pageUrls.add("http://localhost:8081/uploads/" + pName);
            }

            Resume resume = new Resume();
            resume.setMatiere(matiere);
            resume.setChapitre(chapitre);
            resume.setTitre(titre);
            resume.setPdfUrl("http://localhost:8081/uploads/" + pdfFileName);
            resume.setPageImages(pageUrls);
            resume.setTotalPages(pageUrls.size());
            resume.setContenu("");

            Resume saved = resumeRepository.save(resume);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors du traitement du résumé PDF : " + e.getMessage());
        }
    }

    @PostMapping("/api/resumes/{id}/generate-images")
    public ResponseEntity<?> regenerateImages(@PathVariable Long id) {
        Optional<Resume> optionalResume = resumeRepository.findById(id);
        if (optionalResume.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Resume resume = optionalResume.get();
        boolean success = ensureResumePageImages(resume);
        if (success) {
            return ResponseEntity.ok(resume);
        } else {
            return ResponseEntity.badRequest().body("Impossible de générer les images pour ce résumé.");
        }
    }

    @DeleteMapping("/api/resumes/{id}")
    public ResponseEntity<?> deleteResume(@PathVariable Long id) {
        resumeRepository.deleteById(id);
        return ResponseEntity.ok("Résumé supprimé avec succès !");
    }

    /**
     * Méthode utilitaire pour générer à la volée les pages PNG d'un PDF si elles n'existent pas encore
     */
    private boolean ensureResumePageImages(Resume resume) {
        try {
            if (resume.getPdfUrl() == null || resume.getPdfUrl().trim().isEmpty()) {
                return false;
            }

            String pdfFileName = resume.getPdfUrl().substring(resume.getPdfUrl().lastIndexOf("/") + 1);
            File pdfFile = new File(UPLOAD_DIR, pdfFileName);
            if (!pdfFile.exists()) {
                return false;
            }

            File dir = new File(UPLOAD_DIR);
            String prefix = "page_" + (resume.getId() != null ? resume.getId() : UUID.randomUUID());
            List<String> pageFileNames = pdfPageConverterService.convertPdfToPngPages(pdfFile, dir, prefix);

            List<String> pageUrls = new ArrayList<>();
            for (String pName : pageFileNames) {
                pageUrls.add("http://localhost:8081/uploads/" + pName);
            }

            resume.setPageImages(pageUrls);
            resume.setTotalPages(pageUrls.size());
            resumeRepository.save(resume);
            return true;
        } catch (Exception e) {
            System.err.println("Erreur lors de la génération automatique des pages PNG pour le résumé #" + resume.getId() + ": " + e.getMessage());
            return false;
        }
    }
}