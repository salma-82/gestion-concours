package com.gestionconcours.repository;

import com.gestionconcours.model.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {
    Optional<AuthSession> findByTokenHashAndExpiresAtAfter(String tokenHash, LocalDateTime now);
    void deleteByTokenHash(String tokenHash);
    void deleteByExpiresAtBefore(LocalDateTime now);
}
