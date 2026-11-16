package com.gestionconcours.controller;

import com.gestionconcours.model.StudentQcmAnswer;
import com.gestionconcours.repository.StudentQcmAnswerRepository;
import com.gestionconcours.model.User;
import com.gestionconcours.model.Concours;
import com.gestionconcours.model.ConcoursBlanc;
import com.gestionconcours.repository.ConcoursRepository;
import com.gestionconcours.repository.ConcoursBlancRepository;
import com.gestionconcours.service.AuthSessionService;
import com.gestionconcours.service.QcmTimerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/qcm")
@CrossOrigin(origins = "*")
public class StudentQcmHistoryController {
    private final StudentQcmAnswerRepository repository;
    private final AuthSessionService authSessionService;
    private final ConcoursRepository concoursRepository;
    private final ConcoursBlancRepository concoursBlancRepository;
    private final QcmTimerService timerService;

    public StudentQcmHistoryController(StudentQcmAnswerRepository repository, AuthSessionService authSessionService, ConcoursRepository concoursRepository, ConcoursBlancRepository concoursBlancRepository, QcmTimerService timerService) {
        this.repository = repository;
        this.authSessionService = authSessionService;
        this.concoursRepository = concoursRepository;
        this.concoursBlancRepository = concoursBlancRepository;
        this.timerService = timerService;
    }

    @PostMapping("/attempt-answer")
    public ResponseEntity<?> saveAnswer(@RequestHeader(value = "Authorization", required = false) String authorization, @RequestBody Map<String, Object> body) {
        Optional<User> sessionUser = authSessionService.resolve(bearerToken(authorization));
        if (sessionUser.isEmpty()) return ResponseEntity.status(401).body("Session expirée. Veuillez vous reconnecter.");
        Long studentId = sessionUser.get().getId();
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
        String resourceTitle = value(body.get("resourceTitle"));
        String school = value(body.get("school"));
        String subject = value(body.get("subject"));
        String chapter = value(body.get("chapter"));
        Integer year = asInteger(body.get("year"));
        try {
            Long databaseResourceId = Long.valueOf(resourceId);
            if (resourceType.toLowerCase(Locale.ROOT).contains("blanc")) {
                ConcoursBlanc resource = concoursBlancRepository.findById(databaseResourceId).orElse(null);
                if (resource == null || !resource.getPublie()) return ResponseEntity.badRequest().body("Concours blanc introuvable ou non publié.");
                resourceTitle = resource.getTitre();
                school = resource.getEcole();
                subject = resource.getMatiere();
                chapter = resource.getChapitre();
                year = resource.getAnnee();
            } else {
                Concours resource = concoursRepository.findById(databaseResourceId).orElse(null);
                if (resource == null) return ResponseEntity.badRequest().body("Concours introuvable.");
                resourceTitle = resource.getTitre();
                school = resource.getEcole();
                subject = resource.getMatiere();
                year = resource.getAnnee();
            }
        } catch (NumberFormatException exception) {
            return ResponseEntity.badRequest().body("Identifiant du concours invalide.");
        }
        String timerSessionId = value(body.get("timerSessionId"));
        try {
            if (timerService.isTimedResource(resourceType, resourceId) && timerSessionId.isBlank()) {
                return ResponseEntity.status(409).body(Map.of("message", "Ouvrez une session chronométrée avant de répondre à ce concours."));
            }
            if (!timerSessionId.isBlank()) {
                var timedSession = timerService.saveSelectedAnswer(studentId, timerSessionId, resourceType, resourceId,
                        questionKey, selected, asInteger(body.get("totalQuestions")));
                attemptId = timedSession.getPublicId();
            }
        } catch (QcmTimerService.TimerFailure failure) {
            return ResponseEntity.status(failure.getStatus()).body(Map.of("message", failure.getMessage()));
        }
        StudentQcmAnswer answer = repository
                .findByStudentIdAndResourceTypeAndResourceIdAndAttemptIdAndQuestionKey(
                        studentId, resourceType, resourceId, attemptId, questionKey)
                .orElseGet(StudentQcmAnswer::new);
        answer.setStudentId(studentId);
        answer.setResourceType(resourceType);
        answer.setResourceId(resourceId);
        answer.setResourceTitle(resourceTitle);
        answer.setSchool(school);
        answer.setSubject(subject);
        answer.setChapter(chapter);
        answer.setYear(year);
        answer.setStudentFiliere(sessionUser.get().getFiliere());
        answer.setTotalQuestions(asInteger(body.get("totalQuestions")));
        answer.setAttemptId(attemptId);
        answer.setQuestionKey(questionKey.substring(0, Math.min(255, questionKey.length())));
        answer.setQuestionNumber(asInteger(body.get("questionNumber")));
        answer.setQuestionText(value(body.get("questionText")));
        answer.setChoicesText(value(body.get("choicesText")));
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
    public ResponseEntity<?> getStudentHistory(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> sessionUser = authSessionService.resolve(bearerToken(authorization));
        if (sessionUser.isEmpty()) return ResponseEntity.status(401).body("Session expirée. Veuillez vous reconnecter.");
        Long studentId = sessionUser.get().getId();
        List<StudentQcmAnswer> answers = new ArrayList<>(repository.findByStudentIdOrderByAnsweredAtDesc(studentId));
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
            attempt.put("filiere", first.getStudentFiliere());
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
        view.put("choicesText", answer.getChoicesText());
        view.put("selectedChoiceLabel", answer.getSelectedChoiceLabel());
        view.put("selectedChoiceText", answer.getSelectedChoiceText());
        view.put("correctChoiceLabel", answer.getCorrectChoiceLabel());
        view.put("correctChoiceText", answer.getCorrectChoiceText());
        view.put("explanation", answer.getExplanation());
        view.put("correct", answer.isCorrect());
        return view;
    }

    private String value(Object value) { return value == null ? "" : String.valueOf(value).trim(); }
    private String bearerToken(String authorization) { return authorization != null && authorization.regionMatches(true, 0, "Bearer ", 0, 7) ? authorization.substring(7).trim() : null; }
    private Long asLong(Object value) { try { return value == null ? null : Long.valueOf(String.valueOf(value)); } catch (NumberFormatException ignored) { return null; } }
    private Integer asInteger(Object value) { try { return value == null || String.valueOf(value).isBlank() ? null : Integer.valueOf(String.valueOf(value)); } catch (NumberFormatException ignored) { return null; } }
}
