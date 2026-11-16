package com.gestionconcours.repository;

import com.gestionconcours.model.QcmTimerSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

public interface QcmTimerSessionRepository extends JpaRepository<QcmTimerSession, Long> {
    Optional<QcmTimerSession> findByStudentIdAndClientAttemptKey(Long studentId, String clientAttemptKey);
    Optional<QcmTimerSession> findFirstByActiveKeyAndStatusInOrderByStartedAtDesc(String activeKey, List<String> statuses);
    @Query(value = "select * from qcm_timer_sessions where public_id = :publicId and student_id = :studentId for update", nativeQuery = true)
    Optional<QcmTimerSession> findByPublicIdAndStudentIdForUpdate(@Param("publicId") String publicId, @Param("studentId") Long studentId);
    @Query(value = "select * from qcm_timer_sessions where status = :status and deadline_at <= :deadlineAt for update", nativeQuery = true)
    List<QcmTimerSession> findByStatusAndDeadlineAtLessThanEqual(@Param("status") String status, @Param("deadlineAt") LocalDateTime deadlineAt);
}
