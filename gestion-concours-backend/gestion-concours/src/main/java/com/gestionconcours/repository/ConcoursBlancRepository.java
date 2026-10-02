package com.gestionconcours.repository;

import com.gestionconcours.model.*;
import org.springframework.data.jpa.repository.JpaRepository;



public interface ConcoursBlancRepository extends JpaRepository<ConcoursBlanc, Long> {
    // JpaRepository kay-wffir lina gaa les méthodes (findAll, save, findById, delete...) automatiquement!
}
