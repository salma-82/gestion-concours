package com.gestionconcours.controller;

import com.gestionconcours.model.ConcoursBlanc;
import com.gestionconcours.model.QcmChoice;
import com.gestionconcours.model.QcmQuestion;
import com.gestionconcours.repository.ConcoursBlancRepository;
import com.gestionconcours.repository.QcmQuestionRepository;
import com.gestionconcours.service.PdfQcmExtractorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.*;

@RestController
@RequestMapping("/api/qcm")
@CrossOrigin(origins = "*")
public class QcmController {

    private final QcmQuestionRepository qcmQuestionRepository;
    private final ConcoursBlancRepository concoursBlancRepository;
    private final PdfQcmExtractorService pdfQcmExtractorService;
    private final String UPLOAD_DIR = "uploads/";

    public QcmController(QcmQuestionRepository qcmQuestionRepository,
                          ConcoursBlancRepository concoursBlancRepository,
                          PdfQcmExtractorService pdfQcmExtractorService) {
        this.qcmQuestionRepository = qcmQuestionRepository;
        this.concoursBlancRepository = concoursBlancRepository;
        this.pdfQcmExtractorService = pdfQcmExtractorService;
    }

    /**
     * GET /api/qcm/concours-blanc/{id}
     * Récupère toutes les questions QCM d'un concours blanc.
     */
    @GetMapping("/concours-blanc/{id}")
    public ResponseEntity<?> getQuestionsByConcoursBlancId(@PathVariable Long id) {
        Optional<ConcoursBlanc> optional = concoursBlancRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<QcmQuestion> questions = qcmQuestionRepository.findByConcoursBlancIdOrderByQuestionNumberAsc(id);

        // Construire la réponse avec les infos du concours
        Map<String, Object> response = new LinkedHashMap<>();
        ConcoursBlanc cb = optional.get();
        response.put("concoursBlancId", cb.getId());
        response.put("titre", cb.getTitre());
        response.put("ecole", cb.getEcole());
        response.put("matiere", cb.getMatiere());
        response.put("chapitre", cb.getChapitre());
        response.put("annee", cb.getAnnee());

        List<Map<String, Object>> questionList = new ArrayList<>();
        for (QcmQuestion q : questions) {
            Map<String, Object> qMap = new LinkedHashMap<>();
            qMap.put("id", q.getId());
            qMap.put("questionNumber", q.getQuestionNumber());
            qMap.put("questionText", q.getQuestionText());
            qMap.put("correctChoiceLabel", q.getCorrectChoiceLabel());
            qMap.put("explanation", q.getExplanation());

            List<Map<String, Object>> choiceList = new ArrayList<>();
            for (QcmChoice c : q.getChoices()) {
                Map<String, Object> cMap = new LinkedHashMap<>();
                cMap.put("id", c.getId());
                cMap.put("choiceLabel", c.getChoiceLabel());
                cMap.put("choiceText", c.getChoiceText());
                choiceList.add(cMap);
            }
            qMap.put("choices", choiceList);
            questionList.add(qMap);
        }
        response.put("questions", questionList);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/qcm/concours-blanc/{id}/stats
     * Statistiques : nombre total de questions et nombre de questions corrigées.
     */
    @GetMapping("/concours-blanc/{id}/stats")
    public ResponseEntity<?> getStatsByConcoursBlancId(@PathVariable Long id) {
        if (!concoursBlancRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        long totalQuestions = qcmQuestionRepository.countByConcoursBlancId(id);
        long correctedQuestions = qcmQuestionRepository.countCorrectedByConcoursBlancId(id);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("concoursBlancId", id);
        stats.put("totalQuestions", totalQuestions);
        stats.put("correctedQuestions", correctedQuestions);
        stats.put("hasQuestions", totalQuestions > 0);
        stats.put("allCorrected", totalQuestions > 0 && totalQuestions == correctedQuestions);

        return ResponseEntity.ok(stats);
    }

    /**
     * PUT /api/qcm/question/{id}/correction
     * L'administrateur ajoute/modifie la bonne réponse et l'explication d'une question.
     */
    @PutMapping("/question/{id}/correction")
    public ResponseEntity<?> updateCorrection(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Optional<QcmQuestion> optional = qcmQuestionRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        QcmQuestion question = optional.get();

        String correctChoiceLabel = body.get("correctChoiceLabel");
        String explanation = body.get("explanation");

        if (correctChoiceLabel != null && !correctChoiceLabel.trim().isEmpty()) {
            question.setCorrectChoiceLabel(correctChoiceLabel.trim().toUpperCase());
        }
        if (explanation != null) {
            question.setExplanation(explanation.trim());
        }

        qcmQuestionRepository.save(question);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", question.getId());
        response.put("questionNumber", question.getQuestionNumber());
        response.put("correctChoiceLabel", question.getCorrectChoiceLabel());
        response.put("explanation", question.getExplanation());
        response.put("message", "Correction mise à jour avec succès !");

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/qcm/concours-blanc/{id}/extract
     * Force la ré-extraction des questions QCM à partir du PDF d'un concours blanc.
     */
    @PostMapping("/concours-blanc/{id}/extract")
    public ResponseEntity<?> forceExtract(@PathVariable Long id) {
        Optional<ConcoursBlanc> optional = concoursBlancRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ConcoursBlanc cb = optional.get();
        if (cb.getPdfUrl() == null || cb.getPdfUrl().isEmpty()) {
            return ResponseEntity.badRequest().body("Ce concours blanc n'a pas de fichier PDF associé.");
        }

        try {
            // Supprimer les anciennes questions avant de ré-extraire
            qcmQuestionRepository.deleteChoicesByConcoursBlancId(id);
            qcmQuestionRepository.deleteByConcoursBlancId(id);

            // Extraire le nom du fichier depuis l'URL
            String pdfFileName = cb.getPdfUrl().substring(cb.getPdfUrl().lastIndexOf("/") + 1);
            File pdfFile = new File(UPLOAD_DIR, pdfFileName);

            if (!pdfFile.exists()) {
                return ResponseEntity.badRequest().body("Le fichier PDF n'existe pas sur le serveur: " + pdfFileName);
            }

            int count = pdfQcmExtractorService.extractAndSaveQuestions(pdfFile, cb);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("concoursBlancId", id);
            response.put("extractedQuestions", count);
            response.put("message", count > 0
                    ? count + " questions QCM extraites avec succès !"
                    : "Aucune question QCM détectée dans ce PDF. Le format n'est peut-être pas standard.");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors de l'extraction QCM: " + e.getMessage());
        }
    }

    /**
     * PUT /api/qcm/concours-blanc/{id}/corrections-batch
     * Mise à jour en lot de toutes les corrections d'un concours blanc.
     */
    @PutMapping("/concours-blanc/{id}/corrections-batch")
    public ResponseEntity<?> updateCorrectionsBatch(
            @PathVariable Long id,
            @RequestBody List<Map<String, String>> corrections) {

        if (!concoursBlancRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        int updated = 0;
        for (Map<String, String> correction : corrections) {
            String questionIdStr = correction.get("questionId");
            String correctChoiceLabel = correction.get("correctChoiceLabel");
            String explanation = correction.get("explanation");

            if (questionIdStr == null) continue;

            try {
                Long questionId = Long.parseLong(questionIdStr);
                Optional<QcmQuestion> optQ = qcmQuestionRepository.findById(questionId);
                if (optQ.isPresent()) {
                    QcmQuestion q = optQ.get();
                    if (correctChoiceLabel != null && !correctChoiceLabel.trim().isEmpty()) {
                        q.setCorrectChoiceLabel(correctChoiceLabel.trim().toUpperCase());
                    }
                    if (explanation != null) {
                        q.setExplanation(explanation.trim());
                    }
                    qcmQuestionRepository.save(q);
                    updated++;
                }
            } catch (NumberFormatException ignored) {}
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("updatedQuestions", updated);
        response.put("message", updated + " corrections mises à jour avec succès !");

        return ResponseEntity.ok(response);
    }
}
