package com.gestionconcours.service;

import com.gestionconcours.model.AuthSession;
import com.gestionconcours.model.User;
import com.gestionconcours.repository.AuthSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class AuthSessionService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long SESSION_DAYS = 30;
    private final AuthSessionRepository sessions;

    public AuthSessionService(AuthSessionRepository sessions) {
        this.sessions = sessions;
    }

    @Transactional
    public String create(User user) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        LocalDateTime now = LocalDateTime.now();
        AuthSession session = new AuthSession();
        session.setTokenHash(hash(token));
        session.setUser(user);
        session.setCreatedAt(now);
        session.setExpiresAt(now.plusDays(SESSION_DAYS));
        sessions.deleteByExpiresAtBefore(now);
        sessions.save(session);
        return token;
    }

    @Transactional(readOnly = true)
    public Optional<User> resolve(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        return sessions.findByTokenHashAndExpiresAtAfter(hash(token), LocalDateTime.now()).map(AuthSession::getUser);
    }

    @Transactional
    public void revoke(String token) {
        if (token != null && !token.isBlank()) sessions.deleteByTokenHash(hash(token));
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
