package com.gestionconcours.repository;

import com.gestionconcours.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByMatiere(String matiere);
    List<Resume> findByMatiereAndChapitre(String matiere, String chapitre);

    @Query("SELECT DISTINCT r.matiere FROM Resume r")
    List<String> findDistinctMatieres();

    @Query("SELECT DISTINCT r.chapitre FROM Resume r WHERE r.matiere = :matiere")
    List<String> findDistinctChapitresByMatiere(@Param("matiere") String matiere);
}