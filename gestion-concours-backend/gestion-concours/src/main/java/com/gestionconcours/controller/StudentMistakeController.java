package com.gestionconcours.controller;

import com.gestionconcours.model.StudentMistake;
import com.gestionconcours.model.User;
import com.gestionconcours.repository.StudentMistakeRepository;
import com.gestionconcours.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/student-mistakes")
@CrossOrigin(origins = "*")
public class StudentMistakeController {

    private final StudentMistakeRepository studentMistakeRepository;
    private final UserRepository userRepository;

    public StudentMistakeController(StudentMistakeRepository studentMistakeRepository, UserRepository userRepository) {
        this.studentMistakeRepository = studentMistakeRepository;
        this.userRepository = userRepository;
    }

    /**
     * Récupère toutes les erreurs sauvegardées d'un étudiant.
     */
    @GetMapping
    public ResponseEntity<?> getStudentMistakes(@RequestParam(required = false) Long studentId) {
        if (studentId == null) {
            return ResponseEntity.badRequest().body("Le paramètre studentId est requis.");
        }
        List<StudentMistake> list = studentMistakeRepository.findByStudentIdAndSavedForReviewTrueOrderByCreatedAtDesc(studentId);
        return ResponseEntity.ok(list);
    }

    /**
     * Sauvegarde une ou plusieurs erreurs pour un étudiant (option « Sauvegarder mes erreurs »).
     */
    @PostMapping("/batch")
    @Transactional
    public ResponseEntity<?> saveMistakesBatch(@RequestBody Map<String, Object> body) {
        Long studentId = parseLong(body.get("studentId"));
        if (studentId == null) {
            return ResponseEntity.badRequest().body("studentId est requis.");
        }

        User user = userRepository.findById(studentId).orElse(null);
        String studentName = user != null
                ? ((user.getPrenom() != null ? user.getPrenom() : "") + " " + (user.getNom() != null ? user.getNom() : "")).trim()
                : String.valueOf(body.getOrDefault("studentName", "Étudiant"));
        String studentEmail = user != null ? user.getEmail() : String.valueOf(body.getOrDefault("studentEmail", ""));

        Object mistakesObj = body.get("mistakes");
        if (!(mistakesObj instanceof List<?> rawList) || rawList.isEmpty()) {
            return ResponseEntity.badRequest().body("La liste d'erreurs est vide.");
        }

        List<StudentMistake> savedList = new ArrayList<>();

        for (Object item : rawList) {
            if (!(item instanceof Map<?, ?> m)) continue;

            String resourceId = stringOf(m.get("resourceId"));
            String questionId = stringOf(m.get("questionId"));
            if (questionId.isEmpty()) {
                questionId = stringOf(m.get("questionNumber"));
            }
            if (questionId.isEmpty()) {
                questionId = String.valueOf(stringOf(m.get("questionText")).hashCode());
            }

            // Vérifier si cette question a déjà été enregistrée pour cet étudiant et ce test
            Optional<StudentMistake> existingOpt = studentMistakeRepository
                    .findByStudentIdAndResourceIdAndAttemptIdAndQuestionId(studentId, resourceId, stringOf(m.get("attemptId")), questionId);

            StudentMistake mistake = existingOpt.orElseGet(StudentMistake::new);
            boolean alreadyInReview = existingOpt.map(StudentMistake::isSavedForReview).orElse(false);
            mistake.setStudentId(studentId);
            mistake.setUser(user);
            mistake.setStudentName(studentName);
            mistake.setStudentEmail(studentEmail);
            mistake.setSourceType(defaultIfEmpty(stringOf(m.get("sourceType")), "QCM"));
            mistake.setResourceId(resourceId);
            mistake.setResourceTitle(defaultIfEmpty(stringOf(m.get("resourceTitle")), "QCM"));
            mistake.setSubject(stringOf(m.get("subject")));
            mistake.setChapter(stringOf(m.get("chapter")));
            mistake.setSchool(stringOf(m.get("school")));
            mistake.setYear(parseInteger(m.get("year")));
            mistake.setQuestionId(questionId);
            mistake.setQuestionNumber(parseInteger(m.get("questionNumber")));
            mistake.setQuestionText(stringOf(m.get("questionText")));
            mistake.setSelectedChoiceLabel(stringOf(m.get("selectedChoiceLabel")));
            mistake.setSelectedChoiceText(stringOf(m.get("selectedChoiceText")));
            mistake.setCorrectChoiceLabel(stringOf(m.get("correctChoiceLabel")));
            mistake.setCorrectChoiceText(stringOf(m.get("correctChoiceText")));
            mistake.setExplanation(stringOf(m.get("explanation")));
            mistake.setAttemptId(stringOf(m.get("attemptId")));
            mistake.setReviewed(false);
            mistake.setSavedForReview(alreadyInReview || !Boolean.FALSE.equals(body.get("saveForReview")));
            if (mistake.getCreatedAt() == null) {
                mistake.setCreatedAt(LocalDateTime.now());
            }

            savedList.add(studentMistakeRepository.save(mistake));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "savedCount", savedList.size(),
                "mistakes", savedList
        ));
    }

    /** Enregistre automatiquement l'erreur dans l'historique sans l'ajouter au carnet choisi. */
    @PostMapping("/auto")
    @Transactional
    public ResponseEntity<?> saveAutomaticMistake(@RequestBody Map<String, Object> body) {
        body.put("saveForReview", false);
        return saveMistakesBatch(body);
    }

    /** Retire de la liste de révision les erreurs réussies lors d'une nouvelle tentative. */
    @PostMapping("/resolve")
    @Transactional
    public ResponseEntity<?> resolveMistake(@RequestBody Map<String, Object> body) {
        Long studentId = parseLong(body.get("studentId"));
        String resourceId = stringOf(body.get("resourceId"));
        String questionId = stringOf(body.get("questionId"));
        if (studentId == null || resourceId.isBlank() || questionId.isBlank()) {
            return ResponseEntity.badRequest().body("studentId, resourceId et questionId sont requis.");
        }
        List<StudentMistake> history = studentMistakeRepository.findByStudentIdAndResourceIdAndQuestionId(studentId, resourceId, questionId);
        history.forEach(mistake -> mistake.setSavedForReview(false));
        studentMistakeRepository.saveAll(history);
        return ResponseEntity.ok(Map.of("resolvedCount", history.size()));
    }

    /**
     * Sauvegarde une seule erreur.
     */
    @PostMapping
    @Transactional
    public ResponseEntity<?> saveSingleMistake(@RequestBody Map<String, Object> body) {
        Long studentId = parseLong(body.get("studentId"));
        if (studentId == null) {
            return ResponseEntity.badRequest().body("studentId est requis.");
        }

        List<Map<String, Object>> list = List.of(body);
        Map<String, Object> batchReq = new HashMap<>();
        batchReq.put("studentId", studentId);
        batchReq.put("mistakes", list);
        return saveMistakesBatch(batchReq);
    }

    /**
     * Côté étudiant : Bouton « Supprimer de mes erreurs » pour retirer une question une fois maîtrisée.
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteStudentMistake(
            @PathVariable Long id,
            @RequestParam(required = false) Long studentId) {
        Optional<StudentMistake> optional = studentMistakeRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StudentMistake mistake = optional.get();
        // Vérification de sécurité : si studentId est fourni, vérifier la correspondance
        if (studentId != null && !studentId.equals(mistake.getStudentId())) {
            return ResponseEntity.status(403).body("Vous n'êtes pas autorisé à supprimer cette erreur.");
        }

        studentMistakeRepository.deleteById(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Question retirée de vos erreurs avec succès.",
                "deletedId", id
        ));
    }

    /**
     * Bascule l'état révisée d'une erreur.
     */
    @PatchMapping("/{id}/reviewed")
    public ResponseEntity<?> toggleReviewed(
            @PathVariable Long id,
            @RequestParam(required = false) Long studentId,
            @RequestBody Map<String, Boolean> body) {
        Optional<StudentMistake> optional = studentMistakeRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StudentMistake mistake = optional.get();
        if (studentId != null && !studentId.equals(mistake.getStudentId())) {
            return ResponseEntity.status(403).body("Action non autorisée.");
        }

        boolean reviewed = Boolean.TRUE.equals(body.get("reviewed"));
        mistake.setReviewed(reviewed);
        studentMistakeRepository.save(mistake);

        return ResponseEntity.ok(Map.of("id", id, "reviewed", reviewed));
    }

    // =========================================================================
    //  ENDPOINTS DASHBOARD ADMIN
    // =========================================================================

    /**
     * Admin : consulter toutes les erreurs sauvegardées par tous les étudiants.
     */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllMistakesForAdmin() {
        List<StudentMistake> list = studentMistakeRepository.findAllByOrderByCreatedAtDesc();

        // Statistiques globales pour l'admin
        long totalMistakes = list.size();
        Set<Long> uniqueStudents = new HashSet<>();
        Map<String, Integer> bySubject = new HashMap<>();
        long reviewedCount = 0;

        for (StudentMistake m : list) {
            if (m.getStudentId() != null) uniqueStudents.add(m.getStudentId());
            if (m.isReviewed()) reviewedCount++;
            String subj = (m.getSubject() != null && !m.getSubject().isBlank()) ? m.getSubject() : "Non spécifié";
            bySubject.put(subj, bySubject.getOrDefault(subj, 0) + 1);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMistakes", totalMistakes);
        stats.put("uniqueStudents", uniqueStudents.size());
        stats.put("reviewedCount", reviewedCount);
        stats.put("pendingCount", totalMistakes - reviewedCount);
        stats.put("bySubject", bySubject);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("stats", stats);
        response.put("mistakes", list);

        return ResponseEntity.ok(response);
    }

    /**
     * Admin : supprimer une erreur spécifique.
     */
    @DeleteMapping("/admin/{id}")
    @Transactional
    public ResponseEntity<?> adminDeleteMistake(@PathVariable Long id) {
        if (!studentMistakeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        studentMistakeRepository.deleteById(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Erreur supprimée avec succès par l'administrateur.",
                "deletedId", id
        ));
    }

    /**
     * Admin : supprimer toutes les erreurs d'un étudiant.
     */
    @DeleteMapping("/admin/student/{studentId}")
    @Transactional
    public ResponseEntity<?> adminDeleteAllStudentMistakes(@PathVariable Long studentId) {
        long count = studentMistakeRepository.countByStudentId(studentId);
        studentMistakeRepository.deleteByStudentId(studentId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", count + " erreur(s) supprimée(s) pour cet étudiant.",
                "deletedCount", count
        ));
    }

    // =========================================================================
    //  UTILITAIRES
    // =========================================================================

    private Long parseLong(Object value) {
        if (value == null) return null;
        try {
            return Long.valueOf(String.valueOf(value).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer parseInteger(Object value) {
        if (value == null) return null;
        try {
            return Integer.valueOf(String.valueOf(value).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String stringOf(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String defaultIfEmpty(String val, String def) {
        return (val == null || val.isBlank()) ? def : val;
    }
}
