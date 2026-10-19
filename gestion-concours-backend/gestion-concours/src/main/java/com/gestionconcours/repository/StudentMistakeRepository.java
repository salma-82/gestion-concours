package com.gestionconcours.repository;

import com.gestionconcours.model.StudentMistake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentMistakeRepository extends JpaRepository<StudentMistake, Long> {

    List<StudentMistake> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<StudentMistake> findByStudentIdAndSavedForReviewTrueOrderByCreatedAtDesc(Long studentId);

    List<StudentMistake> findByStudentIdAndResourceIdAndQuestionId(Long studentId, String resourceId, String questionId);

    List<StudentMistake> findAllByOrderByCreatedAtDesc();

    Optional<StudentMistake> findByIdAndStudentId(Long id, Long studentId);

    Optional<StudentMistake> findByStudentIdAndResourceIdAndAttemptIdAndQuestionId(Long studentId, String resourceId, String attemptId, String questionId);

    void deleteByIdAndStudentId(Long id, Long studentId);

    void deleteByStudentId(Long studentId);

    long countByStudentId(Long studentId);
}
