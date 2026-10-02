package com.gestionconcours.controller;

import com.gestionconcours.model.InscriptionRequest;
import com.gestionconcours.model.User;
import com.gestionconcours.repository.InscriptionRequestRepository;
import com.gestionconcours.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final InscriptionRequestRepository inscriptionRequestRepository;
    private final UserRepository userRepository;

    public AdminController(InscriptionRequestRepository inscriptionRequestRepository, UserRepository userRepository) {
        this.inscriptionRequestRepository = inscriptionRequestRepository;
        this.userRepository = userRepository;
    }

    // 1. Récupérer toutes les demandes d'inscription
    @GetMapping("/demandes-inscription")
    public List<InscriptionRequest> getDemandes() {
        return inscriptionRequestRepository.findAll();
    }

    // 2. Accepter la demande (Transférer vers la table users)
    @PostMapping("/accepter/{id}")
    public ResponseEntity<?> accepterDemande(@PathVariable Long id) {
        InscriptionRequest demande = inscriptionRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        User newUser = new User();
        newUser.setNom(demande.getUsername());
        newUser.setEmail(demande.getEmail());
        newUser.setMotDePasse(demande.getPassword()); // Déjà crypté
        newUser.setRole("CLIENT");

        userRepository.save(newUser);
        inscriptionRequestRepository.delete(demande);

        return ResponseEntity.ok("Utilisateur accepté et ajouté avec succès !");
    }

    // 3. Refuser la demande
    @DeleteMapping("/refuser/{id}")
    public ResponseEntity<?> refuserDemande(@PathVariable Long id) {
        inscriptionRequestRepository.deleteById(id);
        return ResponseEntity.ok("Demande refusée.");
    }
}