package com.gestionconcours.repository;

import com.gestionconcours.model.ExamenNational;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExamenNationalRepository extends JpaRepository<ExamenNational, Long> {

    List<ExamenNational> findAllByOrderByAnneeDescIdDesc();

    @Query("SELECT e FROM ExamenNational e WHERE " +
           "(:matiere IS NULL OR :matiere = '' OR LOWER(e.matiere) = LOWER(:matiere)) AND " +
           "(:annee IS NULL OR e.annee = :annee) AND " +
           "(:optionBac IS NULL OR :optionBac = '' OR LOWER(e.optionBac) = LOWER(:optionBac)) AND " +
           "(:session IS NULL OR :session = '' OR LOWER(e.session) = LOWER(:session)) " +
           "ORDER BY e.annee DESC, e.id DESC")
    List<ExamenNational> filterExamens(
            @Param("matiere") String matiere,
            @Param("annee") Integer annee,
            @Param("optionBac") String optionBac,
            @Param("session") String session
    );

    @Query("SELECT DISTINCT e.matiere FROM ExamenNational e WHERE e.matiere IS NOT NULL ORDER BY e.matiere ASC")
    List<String> findDistinctMatieres();

    @Query("SELECT DISTINCT e.annee FROM ExamenNational e WHERE e.annee IS NOT NULL ORDER BY e.annee DESC")
    List<Integer> findDistinctAnnees();

    @Query("SELECT DISTINCT e.optionBac FROM ExamenNational e WHERE e.optionBac IS NOT NULL ORDER BY e.optionBac ASC")
    List<String> findDistinctOptions();
}
