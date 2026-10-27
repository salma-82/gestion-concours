package com.gestionconcours.repository;

import com.gestionconcours.model.StudentActivityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentActivityEventRepository extends JpaRepository<StudentActivityEvent, Long> {
    List<StudentActivityEvent> findByStudentIdOrderByOccurredAtDesc(Long studentId);
}
