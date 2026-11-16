package com.gestionconcours.controller;

import com.gestionconcours.model.User;
import com.gestionconcours.service.AuthSessionService;
import com.gestionconcours.service.QcmTimerService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/qcm/timer")
@CrossOrigin(origins = "*")
public class QcmTimerController {
    private final QcmTimerService timerService;
    private final AuthSessionService authSessionService;

    public QcmTimerController(QcmTimerService timerService, AuthSessionService authSessionService) {
        this.timerService = timerService;
        this.authSessionService = authSessionService;
    }

    @PostMapping("/session/open")
    public ResponseEntity<?> open(@RequestHeader(value = "Authorization", required = false) String authorization,
                                  @RequestBody Map<String, Object> body) {
        Optional<User> user = resolve(authorization);
        if (user.isEmpty()) return unauthorized();
        String type = value(body.get("sourceType"));
        String resourceId = value(body.get("resourceId"));
        try {
            return ResponseEntity.ok(timerService.open(user.get().getId(), type, resourceId, value(body.get("clientAttemptKey"))));
        } catch (DataIntegrityViolationException conflict) {
            return timerService.findActiveAfterConflict(user.get().getId(), type, resourceId)
                    .<ResponseEntity<?>>map(active -> ResponseEntity.ok(active))
                    .orElseGet(() -> failure(new QcmTimerService.TimerFailure(409, "Une session QCM est déjà ouverte pour ce concours.")));
        } catch (QcmTimerService.TimerFailure failure) {
            return failure(failure);
        }
    }

    @PostMapping("/session/{sessionId}/heartbeat")
    public ResponseEntity<?> heartbeat(@RequestHeader(value = "Authorization", required = false) String authorization,
                                       @PathVariable String sessionId, @RequestBody(required = false) Map<String, Object> body) {
        Optional<User> user = resolve(authorization);
        if (user.isEmpty()) return unauthorized();
        try {
            Map<String, Object> request = body == null ? Map.of() : body;
            return ResponseEntity.ok(timerService.heartbeat(user.get().getId(), sessionId,
                    integer(request.get("currentQuestion")), integer(request.get("totalQuestions"))));
        } catch (QcmTimerService.TimerFailure failure) { return failure(failure); }
    }

    @PostMapping("/session/{sessionId}/pause")
    public ResponseEntity<?> pause(@RequestHeader(value = "Authorization", required = false) String authorization,
                                   @PathVariable String sessionId) {
        Optional<User> user = resolve(authorization);
        if (user.isEmpty()) return unauthorized();
        try { return ResponseEntity.ok(timerService.pause(user.get().getId(), sessionId)); }
        catch (QcmTimerService.TimerFailure failure) { return failure(failure); }
    }

    @PostMapping("/session/{sessionId}/resume")
    public ResponseEntity<?> resume(@RequestHeader(value = "Authorization", required = false) String authorization,
                                    @PathVariable String sessionId) {
        Optional<User> user = resolve(authorization);
        if (user.isEmpty()) return unauthorized();
        try { return ResponseEntity.ok(timerService.resume(user.get().getId(), sessionId)); }
        catch (QcmTimerService.TimerFailure failure) { return failure(failure); }
    }

    @PostMapping("/session/{sessionId}/submit")
    public ResponseEntity<?> submit(@RequestHeader(value = "Authorization", required = false) String authorization,
                                    @PathVariable String sessionId, @RequestBody(required = false) Map<String, Object> body) {
        Optional<User> user = resolve(authorization);
        if (user.isEmpty()) return unauthorized();
        try {
            String reason = body == null ? "MANUAL" : value(body.get("reason"));
            return ResponseEntity.ok(timerService.submit(user.get().getId(), sessionId, reason));
        } catch (QcmTimerService.TimerFailure failure) { return failure(failure); }
    }

    private Optional<User> resolve(String authorization) {
        return authSessionService.resolve(bearerToken(authorization));
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("message", "Session expirée. Veuillez vous reconnecter."));
    }

    private ResponseEntity<?> failure(QcmTimerService.TimerFailure failure) {
        return ResponseEntity.status(failure.getStatus()).body(Map.of("message", failure.getMessage()));
    }

    private String value(Object value) { return value == null ? "" : String.valueOf(value).trim(); }

    private Integer integer(Object value) {
        try { return value == null ? null : Integer.valueOf(String.valueOf(value)); }
        catch (NumberFormatException ignored) { return null; }
    }

    private String bearerToken(String authorization) {
        return authorization != null && authorization.regionMatches(true, 0, "Bearer ", 0, 7)
                ? authorization.substring(7).trim() : null;
    }
}
