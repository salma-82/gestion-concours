package com.gestionconcours.repository;

import com.gestionconcours.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConcoursBlancRepository extends JpaRepository<ConcoursBlanc, Long> {

    // Récupérer les concours publiés uniquement (pour clients)
    List<ConcoursBlanc> findByPublieTrue();

    // Récupérer par matière (publiés)
    List<ConcoursBlanc> findByMatiereAndPublieTrue(String matiere);

    // Récupérer par matière ET chapitre (publiés)
    List<ConcoursBlanc> findByMatiereAndChapitreAndPublieTrue(String matiere, String chapitre);

    // Récupérer les matières distinctes (publiées)
    @Query("SELECT DISTINCT c.matiere FROM ConcoursBlanc c WHERE c.publie = true AND c.matiere IS NOT NULL ORDER BY c.matiere ASC")
    List<String> findDistinctMatierePublie();

    // Récupérer les chapitres d'une matière (publiés)
    @Query("SELECT DISTINCT c.chapitre FROM ConcoursBlanc c WHERE c.matiere = :matiere AND c.publie = true AND c.chapitre IS NOT NULL ORDER BY c.chapitre ASC")
    List<String> findDistinctChapitreByMatiere(@Param("matiere") String matiere);

    // Récupérer les matières distinctes (tous — pour admin)
    @Query("SELECT DISTINCT c.matiere FROM ConcoursBlanc c WHERE c.matiere IS NOT NULL ORDER BY c.matiere ASC")
    List<String> findDistinctMatiere();

    // Récupérer les chapitres d'une matière (tous — pour admin)
    @Query("SELECT DISTINCT c.chapitre FROM ConcoursBlanc c WHERE c.matiere = :matiere AND c.chapitre IS NOT NULL ORDER BY c.chapitre ASC")
    List<String> findDistinctChapitreByMatiereAll(@Param("matiere") String matiere);

    // Compter les QCM par matière (publiés)
    @Query("SELECT COUNT(c) FROM ConcoursBlanc c WHERE c.matiere = :matiere AND c.publie = true")
    long countByMatiereAndPublie(@Param("matiere") String matiere);

    // Compter les QCM par chapitre (publiés)
    @Query("SELECT COUNT(c) FROM ConcoursBlanc c WHERE c.matiere = :matiere AND c.chapitre = :chapitre AND c.publie = true")
    long countByMatiereAndChapitreAndPublie(@Param("matiere") String matiere, @Param("chapitre") String chapitre);
}
