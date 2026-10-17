package com.gestionconcours.repository;

import com.gestionconcours.model.QcmResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface QcmResponseRepository extends JpaRepository<QcmResponse, Long> {
    Optional<QcmResponse> findByConcoursBlancIdAndAttemptIdAndQuestionKey(Long concoursBlancId, String attemptId, String questionKey);
    List<QcmResponse> findAllByOrderByAnsweredAtDesc();
    List<QcmResponse> findByStudentIdOrderByAnsweredAtDesc(Long studentId);
    Optional<QcmResponse> findByIdAndStudentIdAndCorrectFalse(Long id, Long studentId);
    @Transactional
    void deleteByConcoursBlancId(Long concoursBlancId);
}
