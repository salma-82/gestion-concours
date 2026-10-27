package com.gestionconcours.controller;

import com.gestionconcours.model.*;
import com.gestionconcours.repository.*;
import com.gestionconcours.service.AuthSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/student-activities")
@CrossOrigin(origins = "*")
public class StudentActivityController {
    private final StudentActivityEventRepository events;
    private final AuthSessionService auth;
    private final ConcoursRepository concours;
    private final ConcoursBlancRepository concoursBlancs;
    private final CoursBacRepository courses;
    private final ExamenNationalRepository exams;
    private final ResumeRepository resumes;

    public StudentActivityController(StudentActivityEventRepository events, AuthSessionService auth,
                                     ConcoursRepository concours, ConcoursBlancRepository concoursBlancs,
                                     CoursBacRepository courses, ExamenNationalRepository exams,
                                     ResumeRepository resumes) {
        this.events = events;
        this.auth = auth;
        this.concours = concours;
        this.concoursBlancs = concoursBlancs;
        this.courses = courses;
        this.exams = exams;
        this.resumes = resumes;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyActivities(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<User> student = resolveStudent(authorization);
        if (student.isEmpty()) return ResponseEntity.status(401).body("Session invalide. Veuillez vous reconnecter.");
        List<Map<String, Object>> result = events.findByStudentIdOrderByOccurredAtDesc(student.get().getId())
                .stream().map(this::view).toList();
        return ResponseEntity.ok(Map.of("events", result));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> recordActivity(@RequestHeader(value = "Authorization", required = false) String authorization,
                                            @RequestBody Map<String, Object> body) {
        Optional<User> student = resolveStudent(authorization);
        if (student.isEmpty()) return ResponseEntity.status(401).body("Session invalide. Veuillez vous reconnecter.");

        String activityType = canonicalType(value(body.get("type")));
        String eventType = value(body.get("eventType")).toUpperCase(Locale.ROOT);
        String resourceKey = value(body.get("resourceId"));
        if (activityType == null || !Set.of("VIEW", "COMPLETE", "UNCOMPLETE", "DURATION").contains(eventType)
                || resourceKey.isBlank()) {
            return ResponseEntity.badRequest().body("Événement d’activité incomplet ou non pris en charge.");
        }

        String[] parts = resourceKey.split(":", 2);
        Long resourceId;
        try { resourceId = Long.valueOf(parts[0]); }
        catch (NumberFormatException exception) { return ResponseEntity.badRequest().body("Identifiant de ressource invalide."); }
        String variant = parts.length == 2 ? parts[1] : null;

        StudentActivityEvent event = new StudentActivityEvent();
        event.setStudent(student.get());
        event.setActivityType(activityType);
        event.setEventType(eventType);
        event.setResourceVariant(variant);
        event.setOccurredAt(LocalDateTime.now());

        boolean found = switch (activityType) {
            case "CONCOURS" -> {
                Concours item = concours.findById(resourceId).orElse(null);
                event.setConcours(item);
                yield item != null;
            }
            case "CONCOURS_BLANC" -> {
                ConcoursBlanc item = concoursBlancs.findById(resourceId).orElse(null);
                if (item != null && item.getPublie()) event.setConcoursBlanc(item);
                yield item != null && item.getPublie();
            }
            case "COURS" -> {
                CoursBac item = courses.findById(resourceId).orElse(null);
                event.setCoursBac(item);
                yield item != null;
            }
            case "EXAMEN" -> {
                ExamenNational item = exams.findById(resourceId).orElse(null);
                event.setExamenNational(item);
                yield item != null;
            }
            case "RESUME" -> {
                Resume item = resumes.findById(resourceId).orElse(null);
                event.setResume(item);
                yield item != null;
            }
            default -> false;
        };
        if (!found) return ResponseEntity.badRequest().body("Ressource introuvable ou indisponible.");

        if ("DURATION".equals(eventType)) {
            Integer seconds = asInteger(body.get("durationSeconds"));
            if (seconds == null || seconds <= 0 || seconds > 3600) return ResponseEntity.badRequest().body("Durée invalide.");
            event.setDurationSeconds(seconds);
        }
        StudentActivityEvent saved = events.save(event);
        return ResponseEntity.ok(Map.of("saved", true, "id", saved.getId()));
    }

    private Optional<User> resolveStudent(String authorization) {
        String token = authorization != null && authorization.regionMatches(true, 0, "Bearer ", 0, 7)
                ? authorization.substring(7).trim() : null;
        return auth.resolve(token).filter(user -> {
            String role = value(user.getRole());
            return ("CLIENT".equalsIgnoreCase(role) || "ETUDIANT".equalsIgnoreCase(role))
                    && (user.getActive() == null || user.getActive() != 0);
        });
    }

    private Map<String, Object> view(StudentActivityEvent event) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", event.getId());
        view.put("type", event.getActivityType());
        view.put("eventType", event.getEventType());
        view.put("resourceVariant", event.getResourceVariant());
        view.put("resourceId", resourceId(event));
        view.put("title", title(event));
        view.put("subject", subject(event));
        view.put("chapter", chapter(event));
        view.put("occurredAt", event.getOccurredAt());
        view.put("durationSeconds", event.getDurationSeconds());
        return view;
    }

    private String resourceId(StudentActivityEvent event) {
        Long id = event.getConcours() != null ? event.getConcours().getId()
                : event.getConcoursBlanc() != null ? event.getConcoursBlanc().getId()
                : event.getCoursBac() != null ? event.getCoursBac().getId()
                : event.getExamenNational() != null ? event.getExamenNational().getId()
                : event.getResume() != null ? event.getResume().getId() : null;
        return id == null ? "" : String.valueOf(id);
    }

    private String title(StudentActivityEvent event) {
        String title = event.getConcours() != null ? event.getConcours().getTitre()
                : event.getConcoursBlanc() != null ? event.getConcoursBlanc().getTitre()
                : event.getCoursBac() != null ? event.getCoursBac().getTitre()
                : event.getExamenNational() != null ? event.getExamenNational().getTitre()
                : event.getResume() != null ? event.getResume().getTitre() : null;
        return title == null ? "" : title;
    }

    private String subject(StudentActivityEvent event) {
        String subject = event.getConcours() != null ? event.getConcours().getMatiere()
                : event.getConcoursBlanc() != null ? event.getConcoursBlanc().getMatiere()
                : event.getCoursBac() != null ? event.getCoursBac().getMatiere()
                : event.getExamenNational() != null ? event.getExamenNational().getMatiere()
                : event.getResume() != null ? event.getResume().getMatiere() : null;
        return subject == null ? "" : subject;
    }

    private String chapter(StudentActivityEvent event) {
        String chapter = event.getConcoursBlanc() != null ? event.getConcoursBlanc().getChapitre()
                : event.getCoursBac() != null ? event.getCoursBac().getChapitre()
                : event.getResume() != null ? event.getResume().getChapitre()
                : event.getExamenNational() != null && event.getExamenNational().getAnnee() != null
                    ? String.valueOf(event.getExamenNational().getAnnee()) : null;
        return chapter == null ? "" : chapter;
    }

    private String canonicalType(String raw) {
        String value = Normalizer.normalize(raw, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
        if (value.contains("concours blanc")) return "CONCOURS_BLANC";
        if (value.equals("concours")) return "CONCOURS";
        if (value.equals("cours")) return "COURS";
        if (value.contains("examen")) return "EXAMEN";
        if (value.equals("resume")) return "RESUME";
        return null;
    }

    private String value(Object value) { return value == null ? "" : String.valueOf(value).trim(); }
    private Integer asInteger(Object value) {
        try { return value == null ? null : Integer.valueOf(String.valueOf(value)); }
        catch (NumberFormatException exception) { return null; }
    }
}
