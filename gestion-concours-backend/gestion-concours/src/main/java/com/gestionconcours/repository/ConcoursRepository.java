package com.gestionconcours.repository;

import com.gestionconcours.model.Concours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConcoursRepository extends JpaRepository<Concours, Long> {

    // Filtre b École, Matière, Chapitre, w Année
    @Query("SELECT c FROM Concours c WHERE " +
           "(:ecole IS NULL OR c.ecole = :ecole) AND " +
           "(:matiere IS NULL OR c.matiere = :matiere) AND " +
           "(:chapitre IS NULL OR c.chapitre = :chapitre) AND " +
           "(:annee IS NULL OR c.annee = :annee)")
    List<Concours> filterConcours(@Param("ecole") String ecole, 
                                  @Param("matiere") String matiere,
                                  @Param("chapitre") String chapitre,
                                  @Param("annee") Integer annee);
}