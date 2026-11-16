package com.gestionconcours.security;

import com.gestionconcours.model.*;
import com.gestionconcours.repository.*;
import com.gestionconcours.service.DemoContentAccessService;
import com.gestionconcours.service.AuthSessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.function.Predicate;

@Component
public class DemoUploadAccessFilter extends OncePerRequestFilter {
    private final DemoContentAccessService access;
    private final AuthSessionService sessions;
    private final CoursBacRepository coursRepository;
    private final ResumeRepository resumeRepository;
    private final ExamenNationalRepository examenRepository;
    private final ConcoursRepository concoursRepository;
    private final ConcoursBlancRepository concoursBlancRepository;

    public DemoUploadAccessFilter(DemoContentAccessService access, AuthSessionService sessions, CoursBacRepository coursRepository,
            ResumeRepository resumeRepository, ExamenNationalRepository examenRepository,
            ConcoursRepository concoursRepository, ConcoursBlancRepository concoursBlancRepository) {
        this.access = access;
        this.sessions = sessions;
        this.coursRepository = coursRepository;
        this.resumeRepository = resumeRepository;
        this.examenRepository = examenRepository;
        this.concoursRepository = concoursRepository;
        this.concoursBlancRepository = concoursBlancRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return !isProtectedContentPath(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        String path = request.getRequestURI().substring(request.getContextPath().length());
        boolean protectedContentPath = isProtectedContentPath(path);
        if (protectedContentPath && authorization != null
                && authorization.regionMatches(true, 0, "Bearer ", 0, 7)
                && sessions.resolve(authorization.substring(7).trim()).isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"code\":\"SESSION_EXPIRED\",\"message\":\"Session expirée. Reconnectez-vous.\"}");
            return;
        }
        // Demo file-level blocking applies only to /uploads/ paths.
        // API listing endpoints (/api/...) are handled by their own controllers
        // via DemoContentAccessService.protect*() which nullify URLs for non-free items.
        if (access.isDemo(authorization) && path.startsWith("/uploads/")) {
            String filename = URLDecoder.decode(
                    request.getRequestURI().substring(request.getRequestURI().lastIndexOf('/') + 1),
                    StandardCharsets.UTF_8);
            boolean free = containsFreeFile(coursRepository.findAll(), CoursBac::isFree, item -> item.getHtmlUrl(), filename)
                    || containsFreeFile(resumeRepository.findAll(), Resume::isFree, item -> java.util.Arrays.asList(
                            item.getHtmlUrl(), item.getPageImages()), filename)
                    || containsFreeFile(examenRepository.findAll(), ExamenNational::isFree, item -> java.util.Arrays.asList(
                            item.getPdfSujetUrl(), item.getPdfCorrectionUrl(),
                            item.getSujetPageImages(), item.getCorrectionPageImages()), filename)
                    || containsFreeFile(concoursRepository.findAll(), Concours::isFree, item -> java.util.Arrays.asList(
                            item.getHtmlUrl()), filename)
                    || containsFreeFile(concoursBlancRepository.findAll(), ConcoursBlanc::isFree, item -> java.util.Arrays.asList(
                            item.getHtmlUrl()), filename);
            if (!free) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"code\":\"DEMO_CONTENT_LOCKED\",\"message\":\"Contenu réservé aux abonnés\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private boolean isProtectedContentPath(String path) {
        return path.startsWith("/uploads/") || path.startsWith("/api/cours-bac")
                || path.startsWith("/api/resumes") || path.startsWith("/api/examens-nationaux")
                || path.startsWith("/api/concours/") || path.equals("/api/concours")
                || path.startsWith("/api/concours-blancs");
    }

    private <T> boolean containsFreeFile(List<T> items, Predicate<T> isFree,
            java.util.function.Function<T, Object> urls, String filename) {
        return items.stream().filter(isFree).map(urls).anyMatch(value -> containsFilename(value, filename));
    }

    private boolean containsFilename(Object values, String filename) {
        if (values == null) return false;
        if (values instanceof Iterable<?> iterable) {
            for (Object value : iterable) if (containsFilename(value, filename)) return true;
            return false;
        }
        String value = URLDecoder.decode(String.valueOf(values), StandardCharsets.UTF_8);
        return value.matches("(?s).*[/\\\\]" + java.util.regex.Pattern.quote(filename) + "(?:[?#].*)?$");
    }
}
