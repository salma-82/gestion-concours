package com.gestionconcours.repository;

import com.gestionconcours.model.Concours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConcoursRepository extends JpaRepository<Concours, Long> {

    // Filtre b École, Matière, w Année
    @Query("SELECT c FROM Concours c WHERE " +
           "(:ecole IS NULL OR c.ecole = :ecole) AND " +
           "(:matiere IS NULL OR c.matiere = :matiere) AND " +
           "(:annee IS NULL OR c.annee = :annee)")
    List<Concours> filterConcours(@Param("ecole") String ecole, 
                                  @Param("matiere") String matiere, 
                                  @Param("annee") Integer annee);
}