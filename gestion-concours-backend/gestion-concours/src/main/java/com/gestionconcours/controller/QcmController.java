package com.gestionconcours.controller;

import com.gestionconcours.model.ConcoursBlanc;
import com.gestionconcours.model.QcmChoice;
import com.gestionconcours.model.QcmQuestion;
import com.gestionconcours.repository.ConcoursBlancRepository;
import com.gestionconcours.repository.QcmQuestionRepository;
import com.gestionconcours.repository.QcmResponseRepository;
import com.gestionconcours.model.QcmResponse;
import com.gestionconcours.service.PdfQcmExtractorService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@RestController
@RequestMapping("/api/qcm")
@CrossOrigin(origins = "*")
public class QcmController {

    private final QcmQuestionRepository qcmQuestionRepository;
    private final QcmResponseRepository qcmResponseRepository;
    private final ConcoursBlancRepository concoursBlancRepository;
    private final PdfQcmExtractorService pdfQcmExtractorService;
    private final String UPLOAD_DIR = "uploads/";

    private static final String QCM_TRACKING_BRIDGE = """
            (() => {
              const messageType = 'econcourse-qcm-mistake';
              const attemptId = Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
              const sent = new Set();
              const textOf = (value) => String(value || '').replace(/\\s+/g, ' ').trim().slice(0, 5000);
              const publish = (payload) => {
                const key = [payload.questionId, payload.selectedChoiceLabel, payload.selectedChoiceText].join(':');
                if (sent.has(key)) return;
                sent.add(key);
                window.parent.postMessage({ type: messageType, attemptId, mistake: payload }, '*');
              };
              const getData = () => typeof QCM_DATA !== 'undefined' ? QCM_DATA : window.QCM_DATA;
              const getState = () => typeof S !== 'undefined' ? S : window.S;
              const getChoiceLabel = (choice) => String(choice?.k ?? choice?.choiceLabel ?? choice?.label ?? choice?.id ?? '').trim().toUpperCase();
              const getChoiceText = (choice) => textOf(choice?.t ?? choice?.choiceText ?? choice?.text ?? choice?.label ?? '');

              document.addEventListener('click', (event) => {
                const button = event.target.closest('button[data-k], button[data-answer], [data-choice]');
                if (!button) return;
                const data = getData();
                const state = getState();
                if (!Array.isArray(data?.questions)) return;
                const index = Number.isInteger(state?.cur) ? state.cur : 0;
                const question = data.questions[index];
                if (!question) return;
                const selectedLabel = String(button.dataset.k ?? button.dataset.answer ?? button.dataset.choice ?? '').trim().toUpperCase();
                const correctLabel = String(question.correct ?? question.correctChoiceLabel ?? question.answer ?? '').trim().toUpperCase();
        if (!selectedLabel || !correctLabel) return;
                const options = question.options ?? question.choices ?? [];
                const selected = options.find((choice) => getChoiceLabel(choice) === selectedLabel);
                const correct = options.find((choice) => getChoiceLabel(choice) === correctLabel);
                const payload = {
                  questionId: question.id ?? question.questionNumber ?? index + 1,
                  questionNumber: question.questionNumber ?? question.id ?? index + 1,
                  questionText: textOf(question.enonce ?? question.questionText ?? question.text ?? ''),
                  selectedChoiceLabel: selectedLabel,
                  selectedChoiceText: textOf(selected?.t ?? selected?.choiceText ?? selected?.text ?? button.innerText),
                  correctChoiceLabel: correctLabel,
          isCorrect: selectedLabel === correctLabel,
                  correctChoiceText: getChoiceText(correct),
                  explanation: textOf(Array.isArray(question.explication) ? question.explication.join(' ') : (question.explication ?? question.explanation ?? '')),
                  chapter: textOf(data.chapitre ?? data.chapter ?? '')
                };
                window.setTimeout(() => {
                  if (state?.answers && state.answers[question.id] !== selectedLabel) return;
                  publish(payload);
                }, 0);
              }, true);

              // Repli pour les QCM HTML qui marquent visuellement les réponses fausses/vraies.
              const observer = new MutationObserver(() => {
                if (Array.isArray(getData()?.questions)) return;
                document.querySelectorAll('.bad, .incorrect, .wrong, .is-wrong, [data-correct="false"]').forEach((wrong) => {
                  if (wrong.dataset.econcourseTracked) return;
                  const container = wrong.closest('[data-question], .question, .qcm-question, .qbox, #qBody') || wrong.parentElement?.parentElement;
                  if (!container) return;
                  const correct = container.querySelector('.good, .correct, .is-correct, [data-correct="true"]');
                  if (!correct) return;
                  wrong.dataset.econcourseTracked = 'true';
                  const questionText = container.querySelector('.qtext, .question-text, .statement, [data-question-text]')?.innerText || '';
                  const selectedChoiceLabel = wrong.dataset.k ?? wrong.dataset.answer ?? '';
                  const correctChoiceLabel = correct.dataset.k ?? correct.dataset.answer ?? '';
                  publish({
                    questionId: container.dataset.questionId ?? container.dataset.id ?? textOf(questionText).slice(0, 80),
                    questionNumber: container.dataset.questionNumber ?? '',
                    questionText: textOf(questionText),
                    selectedChoiceLabel: String(selectedChoiceLabel || 'Réponse choisie').toUpperCase(),
                    selectedChoiceText: textOf(wrong.innerText),
                    correctChoiceLabel: String(correctChoiceLabel || 'Bonne réponse').toUpperCase(),
                    correctChoiceText: textOf(correct.innerText),
                    explanation: textOf(container.querySelector('.explanation, .explication, .fb.ko')?.innerText || ''),
                    chapter: ''
                  });
                });
              });
              observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'data-correct'] });
            })();
            """;

    public QcmController(QcmQuestionRepository qcmQuestionRepository,
                          QcmResponseRepository qcmResponseRepository,
                          ConcoursBlancRepository concoursBlancRepository,
                          PdfQcmExtractorService pdfQcmExtractorService) {
        this.qcmQuestionRepository = qcmQuestionRepository;
        this.qcmResponseRepository = qcmResponseRepository;
        this.concoursBlancRepository = concoursBlancRepository;
        this.pdfQcmExtractorService = pdfQcmExtractorService;
    }

    @PostMapping("/concours-blanc/{id}/responses")
    public ResponseEntity<?> recordResponse(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<ConcoursBlanc> optional = concoursBlancRepository.findById(id);
        if (optional.isEmpty()) return ResponseEntity.notFound().build();
        String attemptId = String.valueOf(body.getOrDefault("attemptId", "")).trim();
        String questionKey = String.valueOf(body.getOrDefault("questionId", "")).trim();
        String selected = String.valueOf(body.getOrDefault("selectedChoiceLabel", "")).trim().toUpperCase(Locale.ROOT);
        String correct = String.valueOf(body.getOrDefault("correctChoiceLabel", "")).trim().toUpperCase(Locale.ROOT);
        if (attemptId.isEmpty() || attemptId.length() > 100 || questionKey.isEmpty() || selected.isEmpty() || correct.isEmpty()) {
            return ResponseEntity.badRequest().body("Réponse QCM incomplète.");
        }
        questionKey = questionKey.substring(0, Math.min(questionKey.length(), 255));
        QcmResponse response = qcmResponseRepository
                .findByConcoursBlancIdAndAttemptIdAndQuestionKey(id, attemptId, questionKey)
                .orElseGet(QcmResponse::new);
        response.setConcoursBlanc(optional.get());
        response.setAttemptId(attemptId);
        response.setStudentId(parseLong(body.get("studentId")));
        response.setQuestionKey(questionKey);
        response.setQuestionNumber(parseInteger(body.get("questionNumber")));
        response.setQuestionText(limit(String.valueOf(body.getOrDefault("questionText", "")), 10000));
        response.setSelectedChoiceLabel(selected);
        response.setCorrectChoiceLabel(correct);
        response.setSelectedChoiceText(limit(String.valueOf(body.getOrDefault("selectedChoiceText", "")), 10000));
        response.setCorrectChoiceText(limit(String.valueOf(body.getOrDefault("correctChoiceText", "")), 10000));
        response.setExplanation(limit(String.valueOf(body.getOrDefault("explanation", "")), 20000));
        response.setCorrect(selected.equals(correct));
        QcmResponse saved = qcmResponseRepository.save(response);
        return ResponseEntity.ok(Map.of("saved", true, "id", saved.getId(), "correct", saved.isCorrect()));
    }

    @GetMapping("/mes-resultats")
    public ResponseEntity<?> getStudentResults(@RequestParam Long studentId) {
        List<QcmResponse> responses = qcmResponseRepository.findByStudentIdOrderByAnsweredAtDesc(studentId);
        Map<String, List<QcmResponse>> attempts = new HashMap<>();
        responses.forEach(r -> attempts.computeIfAbsent(r.getConcoursBlanc().getId() + ":" + r.getAttemptId(), k -> new ArrayList<>()).add(r));
        long correctAnswers = responses.stream().filter(QcmResponse::isCorrect).count();
        long successfulAttempts = attempts.values().stream().filter(answerSet ->
                answerSet.stream().filter(QcmResponse::isCorrect).count() * 100.0 / answerSet.size() >= 50).count();
        double averageScore = attempts.values().stream().mapToDouble(answerSet ->
                answerSet.stream().filter(QcmResponse::isCorrect).count() * 100.0 / answerSet.size()).average().orElse(0);

        List<Map<String, Object>> mistakes = responses.stream().filter(r -> !r.isCorrect()).map(this::studentMistake).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("participations", attempts.size());
        result.put("answeredQuestions", responses.size());
        result.put("correctAnswers", correctAnswers);
        result.put("incorrectAnswers", responses.size() - correctAnswers);
        result.put("averageScore", Math.round(averageScore * 10.0) / 10.0);
        result.put("successRate", attempts.isEmpty() ? 0 : Math.round(successfulAttempts * 1000.0 / attempts.size()) / 10.0);
        result.put("mistakes", mistakes);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/mes-erreurs/{responseId}/reviewed")
    public ResponseEntity<?> setMistakeReviewed(
            @PathVariable Long responseId,
            @RequestParam Long studentId,
            @RequestBody Map<String, Boolean> body) {
        Optional<QcmResponse> optional = qcmResponseRepository.findByIdAndStudentIdAndCorrectFalse(responseId, studentId);
        if (optional.isEmpty()) return ResponseEntity.notFound().build();
        QcmResponse response = optional.get();
        response.setReviewed(Boolean.TRUE.equals(body.get("reviewed")));
        qcmResponseRepository.save(response);
        return ResponseEntity.ok(Map.of("id", responseId, "reviewed", response.isReviewed()));
    }

    private Map<String, Object> studentMistake(QcmResponse response) {
        Map<String, Object> item = new LinkedHashMap<>();
        ConcoursBlanc concours = response.getConcoursBlanc();
        item.put("id", "db-" + response.getId());
        item.put("databaseId", response.getId());
        item.put("sourceType", "Concours blanc");
        item.put("resourceId", concours.getId());
        item.put("resourceTitle", concours.getTitre());
        item.put("subject", concours.getMatiere());
        item.put("chapter", concours.getChapitre());
        item.put("attemptId", response.getAttemptId());
        item.put("questionId", response.getQuestionKey());
        item.put("questionNumber", response.getQuestionNumber());
        item.put("questionText", response.getQuestionText());
        item.put("selectedChoiceLabel", response.getSelectedChoiceLabel());
        item.put("selectedChoiceText", response.getSelectedChoiceText());
        item.put("correctChoiceLabel", response.getCorrectChoiceLabel());
        item.put("correctChoiceText", response.getCorrectChoiceText());
        item.put("explanation", response.getExplanation());
        item.put("occurredAt", response.getAnsweredAt());
        item.put("reviewed", response.isReviewed());
        return item;
    }

    @GetMapping("/concours-blancs/stats")
    public ResponseEntity<?> getConcoursBlancAnalytics(
            @RequestParam(required = false) String matiere,
            @RequestParam(required = false) String chapitre) {
        List<ConcoursBlanc> concours = concoursBlancRepository.findAll().stream()
                .filter(cb -> matiere == null || matiere.isBlank() || matiere.equals(cb.getMatiere()))
                .filter(cb -> chapitre == null || chapitre.isBlank() || chapitre.equals(cb.getChapitre()))
                .toList();
        Set<Long> ids = new HashSet<>();
        concours.forEach(cb -> ids.add(cb.getId()));
        List<QcmResponse> responses = qcmResponseRepository.findAllByOrderByAnsweredAtDesc().stream()
                .filter(r -> ids.contains(r.getConcoursBlanc().getId())).toList();
        Map<String, List<QcmResponse>> attempts = new HashMap<>();
        responses.forEach(r -> attempts.computeIfAbsent(r.getConcoursBlanc().getId() + ":" + r.getAttemptId(), k -> new ArrayList<>()).add(r));
        double averageScore = attempts.values().stream().mapToDouble(answerSet ->
                answerSet.stream().filter(QcmResponse::isCorrect).count() * 100.0 / answerSet.size()).average().orElse(0);
        long successfulAttempts = attempts.values().stream().filter(answerSet ->
                answerSet.stream().filter(QcmResponse::isCorrect).count() * 100.0 / answerSet.size() >= 50).count();

        Map<String, List<QcmResponse>> byQuestion = new LinkedHashMap<>();
        responses.forEach(r -> byQuestion.computeIfAbsent(r.getConcoursBlanc().getId() + ":" + r.getQuestionKey(), k -> new ArrayList<>()).add(r));
        List<Map<String, Object>> hardest = byQuestion.values().stream()
                .sorted(Comparator.comparingDouble(list -> list.stream().filter(QcmResponse::isCorrect).count() * 1.0 / list.size()))
                .limit(8).map(list -> questionSummary(list, false)).toList();
        Map<String, List<QcmResponse>> errors = new LinkedHashMap<>();
        responses.stream().filter(r -> !r.isCorrect()).forEach(r -> errors.computeIfAbsent(
                r.getConcoursBlanc().getId() + ":" + r.getQuestionKey() + ":" + r.getSelectedChoiceLabel(), k -> new ArrayList<>()).add(r));
        List<Map<String, Object>> frequentErrors = errors.values().stream()
                .sorted(Comparator.comparingInt((List<QcmResponse> list) -> list.size()).reversed())
                .limit(8).map(list -> questionSummary(list, true)).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalQcm", concours.size());
        result.put("totalQuestions", concours.stream().mapToLong(cb -> qcmQuestionRepository.countByConcoursBlancId(cb.getId())).sum());
        result.put("participations", attempts.size());
        result.put("averageScore", Math.round(averageScore * 10.0) / 10.0);
        result.put("successRate", attempts.isEmpty() ? 0 : Math.round(successfulAttempts * 1000.0 / attempts.size()) / 10.0);
        result.put("hardestQuestions", hardest);
        result.put("frequentErrors", frequentErrors);
        result.put("hasResults", !responses.isEmpty());
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> questionSummary(List<QcmResponse> list, boolean includeChoice) {
        QcmResponse first = list.get(0);
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("titre", first.getConcoursBlanc().getTitre());
        item.put("matiere", first.getConcoursBlanc().getMatiere());
        item.put("chapitre", first.getConcoursBlanc().getChapitre());
        item.put("questionNumber", first.getQuestionNumber());
        item.put("questionText", first.getQuestionText());
        item.put("responses", list.size());
        item.put("errorRate", Math.round(list.stream().filter(r -> !r.isCorrect()).count() * 1000.0 / list.size()) / 10.0);
        if (includeChoice) {
            item.put("selectedChoiceLabel", first.getSelectedChoiceLabel());
            item.put("selectedChoiceText", first.getSelectedChoiceText());
        }
        return item;
    }

    private Integer parseInteger(Object value) {
        try { return value == null ? null : Integer.valueOf(String.valueOf(value)); }
        catch (NumberFormatException ignored) { return null; }
    }

    private Long parseLong(Object value) {
        try { return value == null ? null : Long.valueOf(String.valueOf(value)); }
        catch (NumberFormatException ignored) { return null; }
    }

    private String limit(String value, int max) { return value.length() > max ? value.substring(0, max) : value; }

    @GetMapping(value = "/tracking-bridge.js", produces = "application/javascript")
    public ResponseEntity<String> getTrackingBridge() {
        return ResponseEntity.ok(QCM_TRACKING_BRIDGE);
    }

    @GetMapping(value = "/tracked-html/{fileName:.+}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<?> getTrackedHtml(@PathVariable String fileName) {
        if (fileName == null || !fileName.matches("(?i)[a-z0-9._-]+\\.html?")) {
            return ResponseEntity.badRequest().body("Nom de fichier HTML invalide.");
        }

        try {
            Path uploadRoot = Path.of(UPLOAD_DIR).toAbsolutePath().normalize();
            Path htmlPath = uploadRoot.resolve(fileName).normalize();
            if (!htmlPath.startsWith(uploadRoot) || !Files.isRegularFile(htmlPath)) {
                return ResponseEntity.notFound().build();
            }

            String html = Files.readString(htmlPath);
            if (!html.toLowerCase(Locale.ROOT).contains("<html")) {
                return ResponseEntity.badRequest().body("Le fichier n'est pas une page HTML.");
            }
            if (!html.toLowerCase(Locale.ROOT).contains("<base ")) {
                html = html.replaceFirst("(?i)<head([^>]*)>", "<head$1><base href=\"/uploads/\">");
            }
            if (!html.contains("econcourse-qcm-mistake")) {
                String bridgeTag = "<script defer src=\"/api/qcm/tracking-bridge.js\"></script>";
                if (html.matches("(?is).*?</body\\s*>.*")) {
                    html = html.replaceFirst("(?i)</body\\s*>", bridgeTag + "</body>");
                } else {
                    html += bridgeTag;
                }
            }
            return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Impossible d'ouvrir le fichier QCM suivi.");
        }
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
