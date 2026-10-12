package com.gestionconcours.repository;

import com.gestionconcours.model.QcmQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface QcmQuestionRepository extends JpaRepository<QcmQuestion, Long> {

    List<QcmQuestion> findByConcoursBlancIdOrderByQuestionNumberAsc(Long concoursBlancId);

    long countByConcoursBlancId(Long concoursBlancId);

    @Query("SELECT COUNT(q) FROM QcmQuestion q WHERE q.concoursBlanc.id = :concoursBlancId AND q.correctChoiceLabel IS NOT NULL")
    long countCorrectedByConcoursBlancId(@Param("concoursBlancId") Long concoursBlancId);

    @Transactional
    @Modifying
    @Query("DELETE FROM QcmChoice c WHERE c.question.id IN (SELECT q.id FROM QcmQuestion q WHERE q.concoursBlanc.id = :concoursBlancId)")
    void deleteChoicesByConcoursBlancId(@Param("concoursBlancId") Long concoursBlancId);

    @Transactional
    @Modifying
    @Query("DELETE FROM QcmQuestion q WHERE q.concoursBlanc.id = :concoursBlancId")
    void deleteByConcoursBlancId(@Param("concoursBlancId") Long concoursBlancId);
}
