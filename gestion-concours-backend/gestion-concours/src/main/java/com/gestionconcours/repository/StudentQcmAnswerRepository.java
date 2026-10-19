package com.gestionconcours.repository;

import com.gestionconcours.model.StudentQcmAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StudentQcmAnswerRepository extends JpaRepository<StudentQcmAnswer, Long> {
    Optional<StudentQcmAnswer> findByStudentIdAndResourceTypeAndResourceIdAndAttemptIdAndQuestionKey(
            Long studentId, String resourceType, String resourceId, String attemptId, String questionKey);
    List<StudentQcmAnswer> findByStudentIdOrderByAnsweredAtDesc(Long studentId);
}
