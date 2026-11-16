package com.gestionconcours.service;

import com.gestionconcours.model.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DemoContentAccessService {
    private final AuthSessionService sessions;

    public DemoContentAccessService(AuthSessionService sessions) {
        this.sessions = sessions;
    }

    public boolean isDemo(String authorization) {
        return resolve(authorization).map(user -> "demo".equalsIgnoreCase(user.getRole())).orElse(false);
    }

    public boolean isAdmin(String authorization) {
        return resolve(authorization).map(user -> "ADMIN".equalsIgnoreCase(user.getRole())).orElse(false);
    }

    private java.util.Optional<User> resolve(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) return java.util.Optional.empty();
        return sessions.resolve(authorization.substring(7).trim());
    }

    public boolean isLocked(boolean free, String authorization) {
        return isDemo(authorization) && !free;
    }

    public ResponseEntity<Map<String, String>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("code", "DEMO_CONTENT_LOCKED", "message", "Contenu réservé aux abonnés"));
    }

    public void protect(List<CoursBac> items, String authorization) {
        if (!isDemo(authorization)) return;
        items.stream().filter(item -> !item.isFree()).forEach(item -> item.setHtmlUrl(null));
    }

    public void protectResumes(List<Resume> items, String authorization) {
        if (!isDemo(authorization)) return;
        items.stream().filter(item -> !item.isFree()).forEach(item -> {
            item.setHtmlUrl(null);
            item.setPageImages(List.of());
        });
    }

    public void protectExams(List<ExamenNational> items, String authorization) {
        if (!isDemo(authorization)) return;
        items.stream().filter(item -> !item.isFree()).forEach(item -> {
            item.setPdfSujetUrl(null);
            item.setPdfCorrectionUrl(null);
            item.setSujetPageImages(List.of());
            item.setCorrectionPageImages(List.of());
        });
    }

    public void protectConcours(List<Concours> items, String authorization) {
        if (!isDemo(authorization)) return;
        items.stream().filter(item -> !item.isFree()).forEach(item -> {
            item.setHtmlUrl(null);
        });
    }

    public void protectConcoursBlancs(List<ConcoursBlanc> items, String authorization) {
        if (!isDemo(authorization)) return;
        items.stream().filter(item -> !item.isFree()).forEach(item -> {
            item.setHtmlUrl(null);
            item.setDescription(null);
        });
    }
}
