package com.gestionconcours.controller;

import com.gestionconcours.model.ConcoursBlanc;
import com.gestionconcours.repository.ConcoursBlancRepository;
import com.gestionconcours.repository.QcmQuestionRepository;
import com.gestionconcours.service.PdfQcmExtractorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/api/concours-blancs")
@CrossOrigin(origins = "*")
public class ConcoursBlancController {

    private final ConcoursBlancRepository concoursBlancRepository;
    private final PdfQcmExtractorService pdfQcmExtractorService;
    private final QcmQuestionRepository qcmQuestionRepository;

    public ConcoursBlancController(ConcoursBlancRepository concoursBlancRepository,
                                    PdfQcmExtractorService pdfQcmExtractorService,
                                    QcmQuestionRepository qcmQuestionRepository) {
        this.concoursBlancRepository = concoursBlancRepository;
        this.pdfQcmExtractorService = pdfQcmExtractorService;
        this.qcmQuestionRepository = qcmQuestionRepository;
    }

    private final String UPLOAD_DIR = "uploads/";

    // =====================================================================
    // GET - Liste complète (admin)
    // =====================================================================
    @GetMapping
    public List<ConcoursBlanc> getAllConcours() {
        return concoursBlancRepository.findAll();
    }

    // =====================================================================
    // GET - Liste publiée uniquement (clients)
    // =====================================================================
    @GetMapping("/publies")
    public List<ConcoursBlanc> getConcoursPublies() {
        return concoursBlancRepository.findByPublieTrue();
    }

    // =====================================================================
    // GET - Matières distinctes (publiées) — pour clients
    // =====================================================================
    @GetMapping("/matieres")
    public ResponseEntity<?> getMatieres() {
        List<String> matieres = concoursBlancRepository.findDistinctMatierePublie();
        return ResponseEntity.ok(matieres);
    }

    // =====================================================================
    // GET - Matières distinctes (toutes) — pour admin
    // =====================================================================
    @GetMapping("/matieres/all")
    public ResponseEntity<?> getMatieresAll() {
        List<String> matieres = concoursBlancRepository.findDistinctMatiere();
        return ResponseEntity.ok(matieres);
    }

    // =====================================================================
    // GET - Chapitres d'une matière (publiés) — pour clients
    // =====================================================================
    @GetMapping("/chapitres")
    public ResponseEntity<?> getChapitresByMatiere(@RequestParam String matiere) {
        List<String> chapitres = concoursBlancRepository.findDistinctChapitreByMatiere(matiere);
        return ResponseEntity.ok(chapitres);
    }

    // =====================================================================
    // GET - Chapitres d'une matière (tous) — pour admin
    // =====================================================================
    @GetMapping("/chapitres/all")
    public ResponseEntity<?> getChapitresByMatiereAll(@RequestParam String matiere) {
        List<String> chapitres = concoursBlancRepository.findDistinctChapitreByMatiereAll(matiere);
        return ResponseEntity.ok(chapitres);
    }

    // =====================================================================
    // GET - QCM d'un chapitre (publiés) — pour clients
    // =====================================================================
    @GetMapping("/par-chapitre")
    public ResponseEntity<?> getByMatiereAndChapitre(
            @RequestParam String matiere,
            @RequestParam String chapitre) {
        List<ConcoursBlanc> list = concoursBlancRepository.findByMatiereAndChapitreAndPublieTrue(matiere, chapitre);
        return ResponseEntity.ok(list);
    }

    // =====================================================================
    // GET - Statistiques par matière (nombre de QCM publiés)
    // =====================================================================
    @GetMapping("/stats/matieres")
    public ResponseEntity<?> getStatsMatieres() {
        List<String> matieres = concoursBlancRepository.findDistinctMatierePublie();
        List<Map<String, Object>> result = new ArrayList<>();
        for (String m : matieres) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("matiere", m);
            item.put("count", concoursBlancRepository.countByMatiereAndPublie(m));
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    // =====================================================================
    // GET - Statistiques chapitres d'une matière
    // =====================================================================
    @GetMapping("/stats/chapitres")
    public ResponseEntity<?> getStatsChapitres(@RequestParam String matiere) {
        List<String> chapitres = concoursBlancRepository.findDistinctChapitreByMatiere(matiere);
        List<Map<String, Object>> result = new ArrayList<>();
        for (String ch : chapitres) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("chapitre", ch);
            item.put("count", concoursBlancRepository.countByMatiereAndChapitreAndPublie(matiere, ch));
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    // =====================================================================
    // POST - Créer un nouveau QCM avec upload HTML/PDF
    // =====================================================================
    @PostMapping
    public ResponseEntity<?> createConcours(
            @RequestParam("titre") String titre,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "ecole", required = false) String ecole,
            @RequestParam("matiere") String matiere,
            @RequestParam(value = "chapitre", required = false) String chapitre,
            @RequestParam(value = "annee", required = false) Integer annee,
            @RequestParam(value = "dureeMnutes", required = false) Integer dureeMnutes,
            @RequestParam(value = "nombreQuestions", required = false) Integer nombreQuestions,
            @RequestParam(value = "publie", required = false, defaultValue = "false") Boolean publie,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "htmlFile", required = false) MultipartFile htmlFile) {

        // If an HTML file is uploaded, force publication (so client can see it)
        if ((htmlFile != null && !htmlFile.isEmpty()) || (file != null && !file.isEmpty())) {
            publie = true;
        }
        try {
            if ((file == null || file.isEmpty()) && (htmlFile == null || htmlFile.isEmpty())) {
                return ResponseEntity.badRequest().body("Veuillez sélectionner un fichier HTML.");
            }

            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            ConcoursBlanc concours = new ConcoursBlanc();
            concours.setTitre(titre);
            concours.setDescription(description != null && !description.trim().isEmpty() ? description.trim() : null);
            concours.setEcole(ecole != null && !ecole.trim().isEmpty() ? ecole.trim() : null);
            concours.setMatiere(matiere);
            concours.setChapitre(chapitre != null && !chapitre.trim().isEmpty() ? chapitre.trim() : null);
            concours.setAnnee(annee);
            concours.setDureeMnutes(dureeMnutes);
            concours.setNombreQuestions(nombreQuestions);
            // publie flag already forced above if HTML provided
            concours.setPublie(publie != null ? publie : false);

            Path pdfSavedPath = null;
            Path htmlSavedPath = null;

            // Traitement du fichier principal (PDF ou HTML)
            if (file != null && !file.isEmpty()) {
                String origName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
                String sanitized = origName.replaceAll("[^a-zA-Z0-9.-]", "_");
                String ext = "";
                int dotIdx = sanitized.lastIndexOf(".");
                if (dotIdx > 0) ext = sanitized.substring(dotIdx).toLowerCase();

                String fileName = UUID.randomUUID().toString() + "_" + sanitized;
                Path destPath = Paths.get(UPLOAD_DIR, fileName);
                Files.write(destPath, file.getBytes());

                if (ext.equals(".html") || ext.equals(".htm")) {
                    concours.setHtmlUrl("http://localhost:8081/uploads/" + fileName);
                    concours.setFileType("HTML");
                    htmlSavedPath = destPath;
                } else {
                    concours.setPdfUrl("http://localhost:8081/uploads/" + fileName);
                    concours.setFileType("PDF");
                    pdfSavedPath = destPath;
                }
            }

            // Traitement du fichier HTML spécifique
            if (htmlFile != null && !htmlFile.isEmpty()) {
                String origName = htmlFile.getOriginalFilename() != null ? htmlFile.getOriginalFilename() : "concours.html";
                String sanitized = origName.replaceAll("[^a-zA-Z0-9.-]", "_");
                String htmlName = UUID.randomUUID().toString() + "_" + sanitized;
                Path destHtmlPath = Paths.get(UPLOAD_DIR, htmlName);
                Files.write(destHtmlPath, htmlFile.getBytes());

                concours.setHtmlUrl("http://localhost:8081/uploads/" + htmlName);
                htmlSavedPath = destHtmlPath;

                if (concours.getPdfUrl() != null && !concours.getPdfUrl().isEmpty()) {
                    concours.setFileType("BOTH");
                } else {
                    concours.setFileType("HTML");
                }
            }

            ConcoursBlanc saved = concoursBlancRepository.save(concours);

            // Extraction automatique des questions QCM depuis PDF
            int extractedCount = 0;
            if (pdfSavedPath != null) {
                try {
                    extractedCount = pdfQcmExtractorService.extractAndSaveQuestions(pdfSavedPath.toFile(), saved);
                    System.out.println("[ConcoursBlancController] " + extractedCount + " questions QCM extraites du PDF.");
                } catch (Exception extractErr) {
                    System.err.println("[ConcoursBlancController] Erreur extraction QCM PDF: " + extractErr.getMessage());
                }
            }

            // Si aucune question extraite du PDF, tenter depuis HTML
            if (extractedCount == 0 && htmlSavedPath != null) {
                try {
                    int htmlCount = pdfQcmExtractorService.extractAndSaveQuestionsFromHtml(htmlSavedPath.toFile(), saved);
                    System.out.println("[ConcoursBlancController] " + htmlCount + " questions QCM extraites du HTML.");
                } catch (Exception htmlExtractErr) {
                    System.err.println("[ConcoursBlancController] Erreur extraction QCM HTML: " + htmlExtractErr.getMessage());
                }
            }

            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur téléchargement fichier: " + e.getMessage());
        }
    }

    // =====================================================================
    // PUT - Mettre à jour les infos d'un QCM (sans fichier)
    // =====================================================================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateConcours(
            @PathVariable Long id,
            @RequestParam(value = "titre", required = false) String titre,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "matiere", required = false) String matiere,
            @RequestParam(value = "chapitre", required = false) String chapitre,
            @RequestParam(value = "dureeMnutes", required = false) Integer dureeMnutes,
            @RequestParam(value = "nombreQuestions", required = false) Integer nombreQuestions,
            @RequestParam(value = "publie", required = false) Boolean publie,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "htmlFile", required = false) MultipartFile htmlFile) {

        Optional<ConcoursBlanc> optional = concoursBlancRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ConcoursBlanc concours = optional.get();

        if (titre != null && !titre.trim().isEmpty()) concours.setTitre(titre.trim());
        if (description != null) concours.setDescription(description.trim());
        if (matiere != null && !matiere.trim().isEmpty()) concours.setMatiere(matiere.trim());
        if (chapitre != null) concours.setChapitre(chapitre.trim());
        if (dureeMnutes != null) concours.setDureeMnutes(dureeMnutes);
        if (nombreQuestions != null) concours.setNombreQuestions(nombreQuestions);
        if (publie != null) concours.setPublie(publie);

        // Remplacement du fichier HTML si fourni
        try {
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) uploadDir.mkdirs();

            if (file != null && !file.isEmpty()) {
                String origName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
                String sanitized = origName.replaceAll("[^a-zA-Z0-9.-]", "_");
                String ext = "";
                int dotIdx = sanitized.lastIndexOf(".");
                if (dotIdx > 0) ext = sanitized.substring(dotIdx).toLowerCase();
                String fileName = UUID.randomUUID().toString() + "_" + sanitized;
                Path destPath = Paths.get(UPLOAD_DIR, fileName);
                Files.write(destPath, file.getBytes());

                if (ext.equals(".html") || ext.equals(".htm")) {
                    concours.setHtmlUrl("http://localhost:8081/uploads/" + fileName);
                } else {
                    concours.setPdfUrl("http://localhost:8081/uploads/" + fileName);
                }
            }

            if (htmlFile != null && !htmlFile.isEmpty()) {
                String origName = htmlFile.getOriginalFilename() != null ? htmlFile.getOriginalFilename() : "concours.html";
                String sanitized = origName.replaceAll("[^a-zA-Z0-9.-]", "_");
                String htmlName = UUID.randomUUID().toString() + "_" + sanitized;
                Path destHtmlPath = Paths.get(UPLOAD_DIR, htmlName);
                Files.write(destHtmlPath, htmlFile.getBytes());
                concours.setHtmlUrl("http://localhost:8081/uploads/" + htmlName);
            }
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur remplacement fichier: " + e.getMessage());
        }

        ConcoursBlanc saved = concoursBlancRepository.save(concours);
        return ResponseEntity.ok(saved);
    }

    // =====================================================================
    // PATCH - Publier / dépublier
    // =====================================================================
    @PatchMapping("/{id}/toggle-publie")
    public ResponseEntity<?> togglePublie(@PathVariable Long id) {
        Optional<ConcoursBlanc> optional = concoursBlancRepository.findById(id);
        if (optional.isEmpty()) return ResponseEntity.notFound().build();

        ConcoursBlanc concours = optional.get();
        concours.setPublie(!concours.getPublie());
        ConcoursBlanc saved = concoursBlancRepository.save(concours);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", saved.getId());
        resp.put("publie", saved.getPublie());
        resp.put("message", saved.getPublie() ? "QCM publié !" : "QCM dépublié.");
        return ResponseEntity.ok(resp);
    }

    // =====================================================================
    // POST - Upload HTML pour un concours existant
    // =====================================================================
    @PostMapping("/{id}/upload-html")
    public ResponseEntity<?> uploadHtmlFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("Le fichier HTML sélectionné est vide.");
            }

            Optional<ConcoursBlanc> optional = concoursBlancRepository.findById(id);
            if (optional.isEmpty()) return ResponseEntity.notFound().build();

            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) uploadDir.mkdirs();

            String origName = file.getOriginalFilename() != null ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") : "concours.html";
            String fileName = UUID.randomUUID().toString() + "_" + origName;
            Path filePath = Paths.get(UPLOAD_DIR, fileName);
            Files.write(filePath, file.getBytes());

            ConcoursBlanc concours = optional.get();
            concours.setHtmlUrl("http://localhost:8081/uploads/" + fileName);
            if (concours.getPdfUrl() != null && !concours.getPdfUrl().isEmpty()) {
                concours.setFileType("BOTH");
            } else {
                concours.setFileType("HTML");
            }

            ConcoursBlanc saved = concoursBlancRepository.save(concours);

            try {
                int count = qcmQuestionRepository.findByConcoursBlancIdOrderByQuestionNumberAsc(id).size();
                if (count == 0) {
                    int htmlCount = pdfQcmExtractorService.extractAndSaveQuestionsFromHtml(filePath.toFile(), saved);
                    System.out.println("[ConcoursBlancController] " + htmlCount + " questions QCM extraites du HTML.");
                }
            } catch (Exception ex) {
                System.err.println("[ConcoursBlancController] Erreur extraction HTML: " + ex.getMessage());
            }

            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erreur lors de l'enregistrement du fichier HTML: " + e.getMessage());
        }
    }

    // =====================================================================
    // DELETE - Supprimer un QCM
    // =====================================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConcoursBlanc(@PathVariable Long id) {
        if (!concoursBlancRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        qcmQuestionRepository.deleteChoicesByConcoursBlancId(id);
        qcmQuestionRepository.deleteByConcoursBlancId(id);
        concoursBlancRepository.deleteById(id);
        return ResponseEntity.ok("Concours blanc supprimé avec succès !");
    }
}