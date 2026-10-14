package com.gestionconcours.repository;

import com.gestionconcours.model.CoursBac;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CoursBacRepository extends JpaRepository<CoursBac, Long> {

    @Query("SELECT c FROM CoursBac c WHERE " +
           "(:matiere IS NULL OR :matiere = '' OR LOWER(c.matiere) LIKE LOWER(CONCAT('%', :matiere, '%'))) AND " +
           "(:chapitre IS NULL OR :chapitre = '' OR LOWER(c.chapitre) = LOWER(:chapitre)) " +
           "ORDER BY c.id DESC")
    List<CoursBac> filterCoursBac(@Param("matiere") String matiere, @Param("chapitre") String chapitre);

    List<CoursBac> findByMatiere(String matiere);

    List<CoursBac> findByMatiereAndChapitre(String matiere, String chapitre);

    @Query("SELECT DISTINCT c.matiere FROM CoursBac c WHERE c.matiere IS NOT NULL")
    List<String> findDistinctMatieres();

    @Query("SELECT DISTINCT c.chapitre FROM CoursBac c WHERE c.matiere = :matiere AND c.chapitre IS NOT NULL")
    List<String> findDistinctChapitresByMatiere(@Param("matiere") String matiere);
}
