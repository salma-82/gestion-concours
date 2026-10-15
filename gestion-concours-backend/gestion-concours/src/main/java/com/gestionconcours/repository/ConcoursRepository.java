package com.gestionconcours.repository;

import com.gestionconcours.model.Concours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConcoursRepository extends JpaRepository<Concours, Long> {

    // Filtre b École, Matière, w Année (chapitre supprimé)
    @Query("SELECT c FROM Concours c WHERE " +
           "(:ecole IS NULL OR c.ecole = :ecole) AND " +
           "(:matiere IS NULL OR c.matiere = :matiere) AND " +
           "(:annee IS NULL OR c.annee = :annee)")
    List<Concours> filterConcours(@Param("ecole") String ecole, 
                                  @Param("matiere") String matiere,
                                  @Param("annee") Integer annee);

    // Liste des écoles distinctes (pour le client)
    @Query("SELECT DISTINCT c.ecole FROM Concours c WHERE c.ecole IS NOT NULL ORDER BY c.ecole")
    List<String> findDistinctEcoles();

    // Concours par école, triés par année décroissante
    List<Concours> findByEcoleOrderByAnneeDesc(String ecole);
}