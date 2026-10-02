package com.gestionconcours.repository;

import com.gestionconcours.model.InscriptionRequest; // Ila knti dayro f model, wla bddlo l dto 3la ḥsab fin kayn
import org.springframework.data.jpa.repository.JpaRepository;

public interface InscriptionRequestRepository extends JpaRepository<InscriptionRequest, Long> {
}