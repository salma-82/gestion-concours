package com.gestionconcours.repository;

import com.gestionconcours.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByMatiere(String matiere);
    List<Resume> findByMatiereAndChapitre(String matiere, String chapitre);
}