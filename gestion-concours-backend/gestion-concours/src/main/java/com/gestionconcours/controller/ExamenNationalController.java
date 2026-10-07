package com.gestionconcours.controller;

import com.gestionconcours.model.ExamenNational;
import com.gestionconcours.repository.ExamenNationalRepository;
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
@RequestMapping("/api/examens-nationaux")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ExamenNationalController {

    private final ExamenNationalRepository examenNationalRepository;
    private final PdfPageConverterService pdfPageConverterService;
    private final String UPLOAD_DIR = "uploads/";

    // 1. GET: Liste des examens nationaux (avec ou sans filtres)
    @GetMapping
    public List<ExamenNational> getExamens(
            @RequestParam(required = false) String matiere,
            @RequestParam(required = false) Integer annee,
            @RequestParam(required = false) String optionBac,
            @RequestParam(required = false) String session) {

        String cleanMatiere = (matiere != null && !matiere.trim().isEmpty()) ? matiere.trim() : null;
        String cleanOption = (optionBac != null && !optionBac.trim().isEmpty()) ? optionBac.trim() : null;
        String cleanSession = (session != null && !session.trim().isEmpty()) ? session.trim() : null;

        List<ExamenNational> list;
        if (cleanMatiere == null && annee == null && cleanOption == null && cleanSession == null) {
            list = examenNationalRepository.findAllByOrderByAnneeDescIdDesc();
        } else {
            list = examenNationalRepository.filterExamens(cleanMatiere, annee, cleanOption, cleanSession);
        }

        // Auto-génération des images si un examen a le PDF mais pas encore les pages PNG
        for (ExamenNational ex : list) {
            ensureExamenPageImages(ex);
        }

        return list;
    }

    // 2. GET: Liste des matières distinctes
    @GetMapping("/matieres")
    public List<String> getMatieres() {
        return examenNationalRepository.findDistinctMatieres();
    }

    // 3. GET: Liste des années distinctes
    @GetMapping("/annees")
    public List<Integer> getAnnees() {
        return examenNationalRepository.findDistinctAnnees();
    }

    // 4. GET: Détail d'un examen par ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getExamenById(@PathVariable Long id) {
        Optional<ExamenNational> optional = examenNationalRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        ExamenNational examen = optional.get();
        ensureExamenPageImages(examen);
        return ResponseEntity.ok(examen);
    }

    // 5. POST: Ajout d'un Examen National avec conversion PDFBox en images PNG
    @PostMapping
    public ResponseEntity<?> createExamen(
            @RequestParam("titre") String titre,
            @RequestParam("matiere") String matiere,
            @RequestParam(value = "optionBac", required = false) String optionBac,
            @RequestParam(value = "session", required = false) String session,
            @RequestParam("annee") Integer annee,
            @RequestParam(value = "fileSujet", required = false) MultipartFile fileSujet,
            @RequestParam(value = "fileCorrection", required = false) MultipartFile fileCorrection) {

        try {
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            ExamenNational examen = new ExamenNational();
            examen.setTitre(titre != null ? titre.trim() : "Examen National " + annee);
            examen.setMatiere(matiere != null ? matiere.trim() : "");
            examen.setOptionBac(optionBac != null && !optionBac.trim().isEmpty() ? optionBac.trim() : "Toutes options");
            examen.setSession(session != null && !session.trim().isEmpty() ? session.trim() : "Normale");
            examen.setAnnee(annee);

            String baseUuid = UUID.randomUUID().toString();

            // Traitement PDF Sujet & Rendu PNG
            if (fileSujet != null && !fileSujet.isEmpty()) {
                String originalSujet = fileSujet.getOriginalFilename() != null ? fileSujet.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") : "sujet.pdf";
                String fileNameSujet = "exam_sujet_" + baseUuid + "_" + originalSujet;
                Path filePathSujet = Paths.get(UPLOAD_DIR, fileNameSujet);
                Files.write(filePathSujet, fileSujet.getBytes());
                examen.setPdfSujetUrl("http://localhost:8081/uploads/" + fileNameSujet);

                try {
                    List<String> sujetPageFiles = pdfPageConverterService.convertPdfToPngPages(
                            filePathSujet.toFile(), uploadDir, "page_sujet_" + baseUuid);
                    List<String> sujetUrls = new ArrayList<>();
                    for (String pName : sujetPageFiles) {
                        sujetUrls.add("http://localhost:8081/uploads/" + pName);
                    }
                    examen.setSujetPageImages(sujetUrls);
                    examen.setSujetTotalPages(sujetUrls.size());
                } catch (Exception convErr) {
                    System.err.println("Erreur conversion PNG sujet: " + convErr.getMessage());
                }
            }

            // Traitement PDF Correction & Rendu PNG
            if (fileCorrection != null && !fileCorrection.isEmpty()) {
                String originalCorrection = fileCorrection.getOriginalFilename() != null ? fileCorrection.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") : "correction.pdf";
                String fileNameCorrection = "exam_corr_" + baseUuid + "_" + originalCorrection;
                Path filePathCorrection = Paths.get(UPLOAD_DIR, fileNameCorrection);
                Files.write(filePathCorrection, fileCorrection.getBytes());
                examen.setPdfCorrectionUrl("http://localhost:8081/uploads/" + fileNameCorrection);

                try {
                    List<String> corrPageFiles = pdfPageConverterService.convertPdfToPngPages(
                            filePathCorrection.toFile(), uploadDir, "page_corr_" + baseUuid);
                    List<String> corrUrls = new ArrayList<>();
                    for (String pName : corrPageFiles) {
                        corrUrls.add("http://localhost:8081/uploads/" + pName);
                    }
                    examen.setCorrectionPageImages(corrUrls);
                    examen.setCorrectionTotalPages(corrUrls.size());
                } catch (Exception convErr) {
                    System.err.println("Erreur conversion PNG correction: " + convErr.getMessage());
                }
            }

            ExamenNational saved = examenNationalRepository.save(examen);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors de l'enregistrement de l'examen national: " + e.getMessage());
        }
    }

    // 6. PUT: Modification d'un Examen National
    @PutMapping("/{id}")
    public ResponseEntity<?> updateExamen(
            @PathVariable Long id,
            @RequestParam("titre") String titre,
            @RequestParam("matiere") String matiere,
            @RequestParam(value = "optionBac", required = false) String optionBac,
            @RequestParam(value = "session", required = false) String session,
            @RequestParam("annee") Integer annee,
            @RequestParam(value = "fileSujet", required = false) MultipartFile fileSujet,
            @RequestParam(value = "fileCorrection", required = false) MultipartFile fileCorrection) {

        Optional<ExamenNational> optional = examenNationalRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            File uploadDir = new File(UPLOAD_DIR);
            ExamenNational examen = optional.get();
            examen.setTitre(titre != null ? titre.trim() : examen.getTitre());
            examen.setMatiere(matiere != null ? matiere.trim() : examen.getMatiere());
            if (optionBac != null) examen.setOptionBac(optionBac.trim());
            if (session != null) examen.setSession(session.trim());
            examen.setAnnee(annee);

            String baseUuid = UUID.randomUUID().toString();

            // Remplacement optionnel Sujet PDF
            if (fileSujet != null && !fileSujet.isEmpty()) {
                String originalSujet = fileSujet.getOriginalFilename() != null ? fileSujet.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") : "sujet.pdf";
                String fileNameSujet = "exam_sujet_" + baseUuid + "_" + originalSujet;
                Path filePathSujet = Paths.get(UPLOAD_DIR, fileNameSujet);
                Files.write(filePathSujet, fileSujet.getBytes());
                examen.setPdfSujetUrl("http://localhost:8081/uploads/" + fileNameSujet);

                try {
                    List<String> sujetPageFiles = pdfPageConverterService.convertPdfToPngPages(
                            filePathSujet.toFile(), uploadDir, "page_sujet_" + baseUuid);
                    List<String> sujetUrls = new ArrayList<>();
                    for (String pName : sujetPageFiles) {
                        sujetUrls.add("http://localhost:8081/uploads/" + pName);
                    }
                    examen.setSujetPageImages(sujetUrls);
                    examen.setSujetTotalPages(sujetUrls.size());
                } catch (Exception convErr) {
                    System.err.println("Erreur conversion PNG sujet: " + convErr.getMessage());
                }
            }

            // Remplacement optionnel Correction PDF
            if (fileCorrection != null && !fileCorrection.isEmpty()) {
                String originalCorrection = fileCorrection.getOriginalFilename() != null ? fileCorrection.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") : "correction.pdf";
                String fileNameCorrection = "exam_corr_" + baseUuid + "_" + originalCorrection;
                Path filePathCorrection = Paths.get(UPLOAD_DIR, fileNameCorrection);
                Files.write(filePathCorrection, fileCorrection.getBytes());
                examen.setPdfCorrectionUrl("http://localhost:8081/uploads/" + fileNameCorrection);

                try {
                    List<String> corrPageFiles = pdfPageConverterService.convertPdfToPngPages(
                            filePathCorrection.toFile(), uploadDir, "page_corr_" + baseUuid);
                    List<String> corrUrls = new ArrayList<>();
                    for (String pName : corrPageFiles) {
                        corrUrls.add("http://localhost:8081/uploads/" + pName);
                    }
                    examen.setCorrectionPageImages(corrUrls);
                    examen.setCorrectionTotalPages(corrUrls.size());
                } catch (Exception convErr) {
                    System.err.println("Erreur conversion PNG correction: " + convErr.getMessage());
                }
            }

            ExamenNational updated = examenNationalRepository.save(examen);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors de la modification de l'examen: " + e.getMessage());
        }
    }

    // 7. DELETE: Suppression d'un Examen National
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExamen(@PathVariable Long id) {
        if (!examenNationalRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        examenNationalRepository.deleteById(id);
        return ResponseEntity.ok("Examen national supprimé avec succès !");
    }

    /**
     * Méthode utilitaire pour générer à la volée les pages PNG des sujets et corrections
     */
    private void ensureExamenPageImages(ExamenNational ex) {
        try {
            File uploadDir = new File(UPLOAD_DIR);

            // Sujet
            if ((ex.getSujetPageImages() == null || ex.getSujetPageImages().isEmpty()) && ex.getPdfSujetUrl() != null) {
                String pdfFileName = ex.getPdfSujetUrl().substring(ex.getPdfSujetUrl().lastIndexOf("/") + 1);
                File pdfFile = new File(UPLOAD_DIR, pdfFileName);
                if (pdfFile.exists()) {
                    String prefix = "page_sujet_lazy_" + ex.getId();
                    List<String> files = pdfPageConverterService.convertPdfToPngPages(pdfFile, uploadDir, prefix);
                    List<String> urls = new ArrayList<>();
                    for (String f : files) urls.add("http://localhost:8081/uploads/" + f);
                    ex.setSujetPageImages(urls);
                    ex.setSujetTotalPages(urls.size());
                    examenNationalRepository.save(ex);
                }
            }

            // Correction
            if ((ex.getCorrectionPageImages() == null || ex.getCorrectionPageImages().isEmpty()) && ex.getPdfCorrectionUrl() != null) {
                String pdfFileName = ex.getPdfCorrectionUrl().substring(ex.getPdfCorrectionUrl().lastIndexOf("/") + 1);
                File pdfFile = new File(UPLOAD_DIR, pdfFileName);
                if (pdfFile.exists()) {
                    String prefix = "page_corr_lazy_" + ex.getId();
                    List<String> files = pdfPageConverterService.convertPdfToPngPages(pdfFile, uploadDir, prefix);
                    List<String> urls = new ArrayList<>();
                    for (String f : files) urls.add("http://localhost:8081/uploads/" + f);
                    ex.setCorrectionPageImages(urls);
                    ex.setCorrectionTotalPages(urls.size());
                    examenNationalRepository.save(ex);
                }
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de la génération PNG pour examen #" + ex.getId() + ": " + e.getMessage());
        }
    }
}
