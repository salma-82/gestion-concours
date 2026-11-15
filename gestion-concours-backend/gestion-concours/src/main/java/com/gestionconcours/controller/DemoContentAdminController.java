package com.gestionconcours.controller;

import com.gestionconcours.model.*;
import com.gestionconcours.repository.*;
import com.gestionconcours.service.DemoContentAccessService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Function;

@RestController
@RequestMapping("/api/admin/demo-content")
@CrossOrigin(origins = "*")
public class DemoContentAdminController {
    private final CoursBacRepository coursRepository;
    private final ResumeRepository resumeRepository;
    private final ExamenNationalRepository examenRepository;
    private final ConcoursRepository concoursRepository;
    private final ConcoursBlancRepository concoursBlancRepository;
    private final DemoContentAccessService access;

    public DemoContentAdminController(CoursBacRepository coursRepository, ResumeRepository resumeRepository,
            ExamenNationalRepository examenRepository, ConcoursRepository concoursRepository,
            ConcoursBlancRepository concoursBlancRepository, DemoContentAccessService access) {
        this.coursRepository = coursRepository;
        this.resumeRepository = resumeRepository;
        this.examenRepository = examenRepository;
        this.concoursRepository = concoursRepository;
        this.concoursBlancRepository = concoursBlancRepository;
        this.access = access;
    }

    @PatchMapping("/{type}/{id}/free")
    public ResponseEntity<?> setFree(@PathVariable String type, @PathVariable Long id,
            @RequestBody Map<String, Boolean> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        if (!access.isAdmin(authorization)) return ResponseEntity.status(403).body(Map.of("message", "Accès administrateur requis."));
        Boolean free = body.get("isFree");
        if (free == null) return ResponseEntity.badRequest().body(Map.of("message", "Le champ isFree est requis."));

        String key = type.toLowerCase(Locale.ROOT);
        return switch (key) {
            case "cours-bac" -> update(coursRepository.findAll(), id, free, 
                    item -> (item.getFiliere() != null && !item.getFiliere().isBlank()) ? item.getFiliere() : item.getMatiere(), 
                    CoursBac::isFree, CoursBac::setFree, coursRepository::save);
            case "resumes" -> update(resumeRepository.findAll(), id, free, 
                    Resume::getMatiere, Resume::isFree, Resume::setFree, resumeRepository::save);
            case "examens-nationaux" -> update(examenRepository.findAll(), id, free, 
                    ExamenNational::getDemoFreeGroup, ExamenNational::isFree, ExamenNational::setFree, examenRepository::save);
            case "concours" -> update(concoursRepository.findAll(), id, free, 
                    Concours::getEcole, Concours::isFree, Concours::setFree, concoursRepository::save);
            case "concours-blancs" -> update(concoursBlancRepository.findAll(), id, free, 
                    null, ConcoursBlanc::isFree, ConcoursBlanc::setFree, concoursBlancRepository::save);
            default -> ResponseEntity.badRequest().body(Map.of("message", "Type de contenu inconnu."));
        };
    }

    private <T> ResponseEntity<?> update(List<T> items, Long id, boolean free, Function<T, String> groupKey,
            Function<T, Boolean> isFree, BiConsumer<T, Boolean> setFree, Function<T, T> save) {
        T selected = items.stream().filter(item -> id.equals(getId(item))).findFirst().orElse(null);
        if (selected == null) return ResponseEntity.notFound().build();
        
        // Si groupKey est fourni et qu'on active le contenu gratuit, on désactive les autres contenus du même groupe
        if (free && groupKey != null) {
            String group = groupKey.apply(selected);
            if (group != null && !group.isBlank()) {
                for (T item : items) {
                    if (item != selected && sameGroup(group, groupKey.apply(item))) {
                        setFree.accept(item, false);
                        save.apply(item);
                    }
                }
            }
        }
        setFree.accept(selected, free);
        T saved = save.apply(selected);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", getId(saved));
        response.put("isFree", isFree.apply(saved));
        response.put("message", free ? "Contenu autorisé en accès gratuit." : "Contenu bloqué (réservé aux abonnés).");
        return ResponseEntity.ok(response);
    }

    private Long getId(Object item) {
        if (item instanceof CoursBac value) return value.getId();
        if (item instanceof Resume value) return value.getId();
        if (item instanceof ExamenNational value) return value.getId();
        if (item instanceof Concours value) return value.getId();
        if (item instanceof ConcoursBlanc value) return value.getId();
        return null;
    }

    private boolean sameGroup(String left, String right) {
        return left != null && right != null && left.trim().equalsIgnoreCase(right.trim());
    }
}
