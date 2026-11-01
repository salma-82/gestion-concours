package com.gestionconcours.repository;

import com.gestionconcours.model.StudentActivityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface StudentActivityEventRepository extends JpaRepository<StudentActivityEvent, Long> {
    List<StudentActivityEvent> findByStudentIdOrderByOccurredAtDesc(Long studentId);

    @Transactional
    @Modifying
    @Query("DELETE FROM StudentActivityEvent event WHERE event.concours.id = :resourceId")
    int deleteByConcoursId(@Param("resourceId") Long resourceId);

    @Transactional
    @Modifying
    @Query("DELETE FROM StudentActivityEvent event WHERE event.concoursBlanc.id = :resourceId")
    int deleteByConcoursBlancId(@Param("resourceId") Long resourceId);

    @Transactional
    @Modifying
    @Query("DELETE FROM StudentActivityEvent event WHERE event.resume.id = :resourceId")
    int deleteByResumeId(@Param("resourceId") Long resourceId);

    @Transactional
    @Modifying
    @Query("DELETE FROM StudentActivityEvent event WHERE event.examenNational.id = :resourceId")
    int deleteByExamenNationalId(@Param("resourceId") Long resourceId);
}
