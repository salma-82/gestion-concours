package com.gestionconcours.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestionconcours.model.Concours;
import com.gestionconcours.model.ConcoursBlanc;
import com.gestionconcours.model.QcmTimerSession;
import com.gestionconcours.repository.ConcoursBlancRepository;
import com.gestionconcours.repository.ConcoursRepository;
import com.gestionconcours.repository.QcmTimerSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class QcmTimerService {
    private static final String RUNNING = "IN_PROGRESS";
    private static final String PAUSED = "PAUSED";
    private static final String COMPLETED = "COMPLETED";
    private static final String EXPIRED = "EXPIRED";
    private static final List<String> ACTIVE_STATUSES = List.of(RUNNING, PAUSED);
    private static final int THREE_HOURS_SECONDS = 3 * 60 * 60;
    private static final int MAX_CONFIGURED_DURATION_MINUTES = 24 * 60;
    private static final int SECONDS_PER_PRACTICE_QUESTION = 90;
    private static final int DEFAULT_PRACTICE_QUESTION_COUNT = 20;
    private static final int MAX_PRACTICE_QUESTION_COUNT = 1000;
    private static final String ENSA_SOURCE = "Consignes officielles candidat, concours commun du réseau ENSA 2025–2026 : durée globale de 3 heures.";
    private static final String ENSA_SOURCE_URL = "https://ensa-marrakech.uca.ma/wp-content/uploads/2025/07/Consignes-Candidat.pdf";
    private static final String MEDICINE_SOURCE = "Cadre de référence officiel du concours Médecine/Pharmacie/Dentaire 2022–2023 : 4 épreuves de 45 minutes (3 heures au total).";
    private static final String MEDICINE_SOURCE_URL = "https://www.enssup.gov.ma/storage/publications/communiques/CDR%20Medecine%202022%20-%20Franc%CC%A7ais.pdf";

    private final QcmTimerSessionRepository sessions;
    private final ConcoursRepository concours;
    private final ConcoursBlancRepository concoursBlancs;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public QcmTimerService(QcmTimerSessionRepository sessions, ConcoursRepository concours,
                           ConcoursBlancRepository concoursBlancs) {
        this.sessions = sessions;
        this.concours = concours;
        this.concoursBlancs = concoursBlancs;
    }

    @Transactional
    public Map<String, Object> open(Long studentId, String requestedType, String resourceId, String clientAttemptKey) {
        requireStudent(studentId);
        long id = parseResourceId(resourceId);
        String type = canonicalType(requestedType);
        UUID attemptKey = parseAttemptKey(clientAttemptKey);
        DurationProfile profile = durationFor(type, id);
        if (profile == null) {
            return Map.of("supported", false, "status", "UNCONFIRMED",
                    "message", "Durée officielle non confirmée. Un chronomètre libre est affiché sur cette page.");
        }

        String activeKey = activeKey(studentId, type, id);
        Optional<QcmTimerSession> sameAttempt = sessions.findByStudentIdAndClientAttemptKey(studentId, attemptKey.toString());
        if (sameAttempt.isPresent()) {
            QcmTimerSession prior = sameAttempt.get();
            if (!prior.getResourceType().equals(type) || !prior.getResourceId().equals(id)) {
                throw new TimerFailure(409, "Cette clé de tentative est déjà liée à un autre concours.");
            }
            expireIfNeeded(prior, LocalDateTime.now());
            if (ACTIVE_STATUSES.contains(prior.getStatus())) return view(prior);
        }

        Optional<QcmTimerSession> active = sessions.findFirstByActiveKeyAndStatusInOrderByStartedAtDesc(activeKey, ACTIVE_STATUSES);
        if (active.isPresent()) {
            QcmTimerSession session = active.get();
            expireIfNeeded(session, LocalDateTime.now());
            if (ACTIVE_STATUSES.contains(session.getStatus())) return view(session);
        }
        if (sameAttempt.isPresent()) return view(sameAttempt.get());

        LocalDateTime now = LocalDateTime.now();
        QcmTimerSession session = new QcmTimerSession();
        session.setPublicId(UUID.randomUUID().toString());
        session.setStudentId(studentId);
        session.setResourceType(type);
        session.setResourceId(id);
        session.setClientAttemptKey(attemptKey.toString());
        session.setActiveKey(activeKey);
        session.setStatus(RUNNING);
        session.setDurationSeconds(profile.seconds());
        session.setDurationSource(profile.description());
        session.setSourceUrl(profile.url());
        session.setStartedAt(now);
        session.setDeadlineAt(now.plusSeconds(profile.seconds()));
        session.setRemainingSeconds((long) profile.seconds());
        session.setSelectedAnswers("{}");
        session.setUpdatedAt(now);
        return view(sessions.saveAndFlush(session));
    }

    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> findActiveAfterConflict(Long studentId, String requestedType, String resourceId) {
        long id = parseResourceId(resourceId);
        String key = activeKey(studentId, canonicalType(requestedType), id);
        return sessions.findFirstByActiveKeyAndStatusInOrderByStartedAtDesc(key, ACTIVE_STATUSES).map(this::view);
    }

    @Transactional(readOnly = true)
    public boolean isTimedResource(String requestedType, String resourceId) {
        try {
            return durationFor(canonicalType(requestedType), parseResourceId(resourceId)) != null;
        } catch (TimerFailure ignored) {
            return false;
        }
    }

    @Transactional
    public Map<String, Object> heartbeat(Long studentId, String publicId, Integer currentQuestion, Integer totalQuestions) {
        QcmTimerSession session = requireSession(studentId, publicId);
        expireIfNeeded(session, LocalDateTime.now());
        if (currentQuestion != null && currentQuestion > 0) session.setCurrentQuestion(currentQuestion);
        if (totalQuestions != null && totalQuestions > 0) session.setTotalQuestions(totalQuestions);
        session.setUpdatedAt(LocalDateTime.now());
        return view(sessions.save(session));
    }

    @Transactional
    public Map<String, Object> pause(Long studentId, String publicId) {
        QcmTimerSession session = requireSession(studentId, publicId);
        LocalDateTime now = LocalDateTime.now();
        expireIfNeeded(session, now);
        if (!RUNNING.equals(session.getStatus())) throw new TimerFailure(409, "Cette session ne peut pas être mise en pause.");
        long remaining = Math.max(0, java.time.Duration.between(now, session.getDeadlineAt()).getSeconds());
        if (remaining == 0) {
            expireIfNeeded(session, now);
        } else {
            session.setRemainingSeconds(remaining);
            session.setDeadlineAt(null);
            session.setStatus(PAUSED);
            session.setUpdatedAt(now);
        }
        return view(sessions.save(session));
    }

    @Transactional
    public Map<String, Object> resume(Long studentId, String publicId) {
        QcmTimerSession session = requireSession(studentId, publicId);
        LocalDateTime now = LocalDateTime.now();
        if (!PAUSED.equals(session.getStatus())) throw new TimerFailure(409, "Cette session n’est pas en pause.");
        long remaining = Math.max(0, Optional.ofNullable(session.getRemainingSeconds()).orElse(0L));
        if (remaining == 0) {
            finish(session, EXPIRED, "TIMEOUT", now);
        } else {
            session.setDeadlineAt(now.plusSeconds(remaining));
            session.setStatus(RUNNING);
            session.setUpdatedAt(now);
        }
        return view(sessions.save(session));
    }

    @Transactional
    public Map<String, Object> submit(Long studentId, String publicId, String reason) {
        QcmTimerSession session = requireSession(studentId, publicId);
        LocalDateTime now = LocalDateTime.now();
        expireIfNeeded(session, now);
        if (RUNNING.equals(session.getStatus()) || PAUSED.equals(session.getStatus())) {
            boolean timedOut = "TIMEOUT".equalsIgnoreCase(reason);
            finish(session, timedOut ? EXPIRED : COMPLETED, timedOut ? "TIMEOUT" : "MANUAL", now);
        }
        return view(sessions.save(session));
    }

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void expireDueSessions() {
        LocalDateTime now = LocalDateTime.now();
        List<QcmTimerSession> due = sessions.findByStatusAndDeadlineAtLessThanEqual(RUNNING, now);
        due.forEach(session -> finish(session, EXPIRED, "TIMEOUT", now));
        if (!due.isEmpty()) sessions.saveAll(due);
    }

    @Transactional
    public QcmTimerSession saveSelectedAnswer(Long studentId, String publicId, String type, String resourceId,
                                              String questionKey, String selectedLabel, Integer totalQuestions) {
        QcmTimerSession session = requireSession(studentId, publicId);
        LocalDateTime now = LocalDateTime.now();
        expireIfNeeded(session, now);
        if (!RUNNING.equals(session.getStatus())) throw new TimerFailure(409, "La session est en pause ou terminée.");
        if (!session.getResourceId().equals(parseResourceId(resourceId))
                || !session.getResourceType().equals(canonicalType(type))) {
            throw new TimerFailure(403, "La réponse ne correspond pas à cette session.");
        }
        if (questionKey == null || questionKey.isBlank() || selectedLabel == null || selectedLabel.isBlank()) {
            throw new TimerFailure(400, "Réponse QCM incomplète.");
        }
        Map<String, String> answers = readAnswers(session);
        answers.put(questionKey.substring(0, Math.min(questionKey.length(), 255)), selectedLabel.trim());
        session.setSelectedAnswers(writeAnswers(answers));
        if (totalQuestions != null && totalQuestions > 0) session.setTotalQuestions(totalQuestions);
        session.setUpdatedAt(now);
        return sessions.save(session);
    }

    private QcmTimerSession requireSession(Long studentId, String publicId) {
        requireStudent(studentId);
        if (publicId == null || publicId.isBlank()) throw new TimerFailure(400, "Identifiant de session manquant.");
        return sessions.findByPublicIdAndStudentIdForUpdate(publicId, studentId)
                .orElseThrow(() -> new TimerFailure(404, "Session QCM introuvable."));
    }

    private void expireIfNeeded(QcmTimerSession session, LocalDateTime now) {
        if (RUNNING.equals(session.getStatus()) && session.getDeadlineAt() != null && !now.isBefore(session.getDeadlineAt())) {
            finish(session, EXPIRED, "TIMEOUT", now);
        }
    }

    private void finish(QcmTimerSession session, String status, String reason, LocalDateTime now) {
        session.setStatus(status);
        session.setFinishedReason(reason);
        session.setRemainingSeconds(0L);
        session.setDeadlineAt(null);
        session.setActiveKey(null);
        session.setUpdatedAt(now);
    }

    private Map<String, Object> view(QcmTimerSession session) {
        LocalDateTime now = LocalDateTime.now();
        expireIfNeeded(session, now);
        long remaining = RUNNING.equals(session.getStatus()) && session.getDeadlineAt() != null
                ? Math.max(0, java.time.Duration.between(now, session.getDeadlineAt()).getSeconds())
                : Math.max(0, Optional.ofNullable(session.getRemainingSeconds()).orElse(0L));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("supported", true);
        result.put("sessionId", session.getPublicId());
        result.put("clientAttemptKey", session.getClientAttemptKey());
        result.put("resourceType", session.getResourceType());
        result.put("resourceId", session.getResourceId());
        result.put("status", session.getStatus());
        result.put("durationSeconds", session.getDurationSeconds());
        result.put("remainingSeconds", remaining);
        result.put("durationSource", session.getDurationSource());
        result.put("sourceUrl", session.getSourceUrl());
        result.put("answers", readAnswers(session));
        result.put("currentQuestion", session.getCurrentQuestion());
        result.put("totalQuestions", session.getTotalQuestions());
        result.put("finishedReason", session.getFinishedReason());
        return result;
    }

    private Map<String, String> readAnswers(QcmTimerSession session) {
        try {
            return objectMapper.readValue(Optional.ofNullable(session.getSelectedAnswers()).orElse("{}"),
                    new TypeReference<Map<String, String>>() {});
        } catch (Exception ignored) {
            return new LinkedHashMap<>();
        }
    }

    private String writeAnswers(Map<String, String> answers) {
        try { return objectMapper.writeValueAsString(answers); }
        catch (Exception exception) { throw new IllegalStateException("Impossible d’enregistrer les réponses QCM.", exception); }
    }

    private DurationProfile durationFor(String type, long id) {
        String school;
        String title;
        Integer year;
        int whiteContestQuestionCount = DEFAULT_PRACTICE_QUESTION_COUNT;
        if ("Concours blanc".equals(type)) {
            ConcoursBlanc item = concoursBlancs.findById(id).filter(ConcoursBlanc::getPublie)
                    .orElseThrow(() -> new TimerFailure(404, "Concours blanc introuvable ou non publié."));
            school = null;
            title = item.getTitre();
            year = null;
            Integer configuredMinutes = item.getDureeMnutes();
            if (configuredMinutes != null && configuredMinutes > 0
                    && configuredMinutes <= MAX_CONFIGURED_DURATION_MINUTES) {
                return new DurationProfile(configuredMinutes * 60,
                        "Duree configuree pour ce concours blanc.", null);
            }
            Integer questionCount = item.getNombreQuestions();
            if (questionCount != null && questionCount > 0 && questionCount <= MAX_PRACTICE_QUESTION_COUNT) {
                whiteContestQuestionCount = questionCount;
            }
        } else {
            Concours item = concours.findById(id).orElseThrow(() -> new TimerFailure(404, "Concours introuvable."));
            school = item.getEcole();
            title = item.getTitre();
            year = item.getAnnee();
        }
        String normalizedSchool = normalize(school);
        String normalizedTitle = normalize(title);
        String metadata = normalizedSchool + " " + normalizedTitle;

        if (isMedicine(metadata) && year != null && year >= 2022 && year <= 2023) {
            return new DurationProfile(THREE_HOURS_SECONDS, MEDICINE_SOURCE, MEDICINE_SOURCE_URL);
        }
        if (isEnsa(normalizedSchool, normalizedTitle) && year != null && (year == 2025 || year == 2026)) {
            return new DurationProfile(THREE_HOURS_SECONDS, ENSA_SOURCE, ENSA_SOURCE_URL);
        }
        if ("Concours blanc".equals(type)) {
            return new DurationProfile(whiteContestQuestionCount * SECONDS_PER_PRACTICE_QUESTION,
                    "Duree indicative : 90 secondes par question.", null);
        }
        return null;
    }

    private boolean isMedicine(String value) {
        return value.matches(".*\\b(MEDECINE|MEDICAL|FMP|FMD|PHARMACIE|DENTAIRE)\\b.*");
    }

    private boolean isEnsa(String school, String title) {
        if (school.equals("ENSA") || school.startsWith("ENSA ") || school.startsWith("ENSA-")) return true;
        if (school.matches(".*\\bENSAM\\b.*")) return false;
        return title.matches(".*\\bENSA\\b.*")
                || school.contains("ECOLE NATIONALE DES SCIENCES APPLIQUEES")
                || title.contains("ECOLE NATIONALE DES SCIENCES APPLIQUEES");
    }

    private String normalize(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", " ").trim().replaceAll("\\s+", " ");
    }

    private String canonicalType(String requested) {
        if (requested != null && requested.toLowerCase(Locale.ROOT).contains("blanc")) return "Concours blanc";
        if (requested != null && requested.toLowerCase(Locale.ROOT).contains("concours")) return "Concours";
        throw new TimerFailure(400, "Type de concours invalide.");
    }

    private long parseResourceId(String raw) {
        try { return Long.parseLong(raw); }
        catch (Exception exception) { throw new TimerFailure(400, "Identifiant du concours invalide."); }
    }

    private UUID parseAttemptKey(String raw) {
        try { return UUID.fromString(raw); }
        catch (Exception exception) { throw new TimerFailure(400, "Clé de tentative invalide."); }
    }

    private String activeKey(Long studentId, String type, Long resourceId) {
        return studentId + "|" + type.toLowerCase(Locale.ROOT) + "|" + resourceId;
    }

    private void requireStudent(Long studentId) {
        if (studentId == null || studentId <= 0) throw new TimerFailure(403, "Connectez-vous pour utiliser le chronomètre et sauvegarder votre session.");
    }

    private record DurationProfile(int seconds, String description, String url) {}

    public static class TimerFailure extends RuntimeException {
        private final int status;
        public TimerFailure(int status, String message) { super(message); this.status = status; }
        public int getStatus() { return status; }
    }
}
