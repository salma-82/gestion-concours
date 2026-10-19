package com.gestionconcours.controller;

import com.gestionconcours.model.StudentQcmAnswer;
import com.gestionconcours.model.QcmResponse;
import com.gestionconcours.repository.QcmResponseRepository;
import com.gestionconcours.repository.StudentQcmAnswerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/qcm")
@CrossOrigin(origins = "*")
public class StudentQcmHistoryController {
    private final StudentQcmAnswerRepository repository;
    private final QcmResponseRepository legacyRepository;

    public StudentQcmHistoryController(StudentQcmAnswerRepository repository, QcmResponseRepository legacyRepository) {
        this.repository = repository;
        this.legacyRepository = legacyRepository;
    }

    @PostMapping("/attempt-answer")
    public ResponseEntity<?> saveAnswer(@RequestBody Map<String, Object> body) {
        Long studentId = asLong(body.get("studentId"));
        String resourceId = value(body.get("resourceId"));
        String resourceType = value(body.get("sourceType"));
        String attemptId = value(body.get("attemptId"));
        String questionKey = value(body.get("questionId"));
        String selected = value(body.get("selectedChoiceLabel"));
        String correct = value(body.get("correctChoiceLabel"));
        if (studentId == null || resourceId.isBlank() || resourceType.isBlank() || attemptId.isBlank()
                || questionKey.isBlank() || selected.isBlank() || correct.isBlank()) {
            return ResponseEntity.badRequest().body("Données de tentative QCM incomplètes.");
        }
        StudentQcmAnswer answer = repository
                .findByStudentIdAndResourceTypeAndResourceIdAndAttemptIdAndQuestionKey(
                        studentId, resourceType, resourceId, attemptId, questionKey)
                .orElseGet(StudentQcmAnswer::new);
        answer.setStudentId(studentId);
        answer.setResourceType(resourceType);
        answer.setResourceId(resourceId);
        answer.setResourceTitle(value(body.get("resourceTitle")));
        answer.setSchool(value(body.get("school")));
        answer.setSubject(value(body.get("subject")));
        answer.setChapter(value(body.get("chapter")));
        answer.setYear(asInteger(body.get("year")));
        answer.setTotalQuestions(asInteger(body.get("totalQuestions")));
        answer.setAttemptId(attemptId);
        answer.setQuestionKey(questionKey.substring(0, Math.min(255, questionKey.length())));
        answer.setQuestionNumber(asInteger(body.get("questionNumber")));
        answer.setQuestionText(value(body.get("questionText")));
        answer.setSelectedChoiceLabel(selected);
        answer.setCorrectChoiceLabel(correct);
        answer.setSelectedChoiceText(value(body.get("selectedChoiceText")));
        answer.setCorrectChoiceText(value(body.get("correctChoiceText")));
        answer.setExplanation(value(body.get("explanation")));
        answer.setCorrect(selected.equalsIgnoreCase(correct));
        answer.setAnsweredAt(java.time.LocalDateTime.now());
        return ResponseEntity.ok(Map.of("saved", true, "id", repository.save(answer).getId()));
    }

    @GetMapping("/mes-concours")
    public ResponseEntity<?> getStudentHistory(@RequestParam Long studentId) {
        List<StudentQcmAnswer> answers = new ArrayList<>(repository.findByStudentIdOrderByAnsweredAtDesc(studentId));
        Set<String> savedKeys = new HashSet<>();
        answers.forEach(answer -> savedKeys.add(historyKey(answer.getResourceType(), answer.getResourceId(), answer.getAttemptId(), answer.getQuestionKey())));
        for (QcmResponse legacy : legacyRepository.findByStudentIdOrderByAnsweredAtDesc(studentId)) {
            if (legacy.getConcoursBlanc() == null) continue;
            String resourceId = String.valueOf(legacy.getConcoursBlanc().getId());
            String key = historyKey("Concours blanc", resourceId, legacy.getAttemptId(), legacy.getQuestionKey());
            if (!savedKeys.add(key)) continue;
            StudentQcmAnswer answer = new StudentQcmAnswer();
            answer.setStudentId(studentId);
            answer.setResourceType("Concours blanc");
            answer.setResourceId(resourceId);
            answer.setResourceTitle(legacy.getConcoursBlanc().getTitre());
            answer.setSchool(legacy.getConcoursBlanc().getEcole());
            answer.setSubject(legacy.getConcoursBlanc().getMatiere());
            answer.setChapter(legacy.getConcoursBlanc().getChapitre());
            answer.setYear(legacy.getConcoursBlanc().getAnnee());
            answer.setAttemptId(legacy.getAttemptId());
            answer.setQuestionKey(legacy.getQuestionKey());
            answer.setQuestionNumber(legacy.getQuestionNumber());
            answer.setQuestionText(legacy.getQuestionText());
            answer.setSelectedChoiceLabel(legacy.getSelectedChoiceLabel());
            answer.setSelectedChoiceText(legacy.getSelectedChoiceText());
            answer.setCorrectChoiceLabel(legacy.getCorrectChoiceLabel());
            answer.setCorrectChoiceText(legacy.getCorrectChoiceText());
            answer.setExplanation(legacy.getExplanation());
            answer.setCorrect(legacy.isCorrect());
            answer.setAnsweredAt(legacy.getAnsweredAt());
            answers.add(answer);
        }
        Map<String, List<StudentQcmAnswer>> grouped = new LinkedHashMap<>();
        answers.forEach(answer -> grouped.computeIfAbsent(
                answer.getResourceType() + "|" + answer.getResourceId() + "|" + answer.getAttemptId(),
                ignored -> new ArrayList<>()).add(answer));

        List<Map<String, Object>> attempts = grouped.values().stream().map(items -> {
            StudentQcmAnswer first = items.get(0);
            long correctCount = items.stream().filter(StudentQcmAnswer::isCorrect).count();
            int expectedCount = items.stream().map(StudentQcmAnswer::getTotalQuestions).filter(Objects::nonNull).max(Integer::compareTo).orElse(items.size());
            Map<String, Object> attempt = new LinkedHashMap<>();
            attempt.put("resourceType", first.getResourceType());
            attempt.put("resourceId", first.getResourceId());
            attempt.put("resourceTitle", first.getResourceTitle());
            attempt.put("school", first.getSchool());
            attempt.put("subject", first.getSubject());
            attempt.put("chapter", first.getChapter());
            attempt.put("year", first.getYear());
            attempt.put("attemptId", first.getAttemptId());
            attempt.put("answeredAt", items.stream().map(StudentQcmAnswer::getAnsweredAt).max(Comparator.naturalOrder()).orElse(first.getAnsweredAt()));
            attempt.put("correctAnswers", correctCount);
            attempt.put("totalQuestions", items.size());
            attempt.put("expectedQuestions", expectedCount);
            attempt.put("score", expectedCount == 0 ? 0 : Math.round(correctCount * 1000.0 / expectedCount) / 10.0);
            attempt.put("answers", items.stream().sorted(Comparator.comparing(a -> Optional.ofNullable(a.getQuestionNumber()).orElse(Integer.MAX_VALUE)))
                    .map(this::answerView).toList());
            return attempt;
        }).sorted((a, b) -> ((Comparable) b.get("answeredAt")).compareTo(a.get("answeredAt"))).toList();
        return ResponseEntity.ok(Map.of("attempts", attempts));
    }

    private Map<String, Object> answerView(StudentQcmAnswer answer) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("questionId", answer.getQuestionKey());
        view.put("questionNumber", answer.getQuestionNumber());
        view.put("questionText", answer.getQuestionText());
        view.put("selectedChoiceLabel", answer.getSelectedChoiceLabel());
        view.put("selectedChoiceText", answer.getSelectedChoiceText());
        view.put("correctChoiceLabel", answer.getCorrectChoiceLabel());
        view.put("correctChoiceText", answer.getCorrectChoiceText());
        view.put("explanation", answer.getExplanation());
        view.put("correct", answer.isCorrect());
        return view;
    }

    private String value(Object value) { return value == null ? "" : String.valueOf(value).trim(); }
    private String historyKey(String type, String resource, String attempt, String question) { return type + "|" + resource + "|" + attempt + "|" + question; }
    private Long asLong(Object value) { try { return value == null ? null : Long.valueOf(String.valueOf(value)); } catch (NumberFormatException ignored) { return null; } }
    private Integer asInteger(Object value) { try { return value == null || String.valueOf(value).isBlank() ? null : Integer.valueOf(String.valueOf(value)); } catch (NumberFormatException ignored) { return null; } }
}
