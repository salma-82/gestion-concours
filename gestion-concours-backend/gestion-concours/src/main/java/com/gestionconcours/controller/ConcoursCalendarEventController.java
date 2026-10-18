package com.gestionconcours.controller;

import com.gestionconcours.model.ConcoursCalendarEvent;
import com.gestionconcours.repository.ConcoursCalendarEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/calendrier")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"})
public class ConcoursCalendarEventController {
    private final ConcoursCalendarEventRepository repository;

    public ConcoursCalendarEventController(ConcoursCalendarEventRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ConcoursCalendarEvent> getAll() {
        return repository.findAllByOrderByStartAtAsc();
    }

    @PostMapping
    public ConcoursCalendarEvent create(@RequestBody ConcoursCalendarEvent event) {
        validate(event);
        event.setId(null);
        return repository.save(event);
    }

    @PutMapping("/{id}")
    public ConcoursCalendarEvent update(@PathVariable Long id, @RequestBody ConcoursCalendarEvent event) {
        if (!repository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Événement introuvable");
        validate(event);
        event.setId(id);
        return repository.save(event);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        if (!repository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Événement introuvable");
        repository.deleteById(id);
    }

    private void validate(ConcoursCalendarEvent event) {
        if (event.getTitle() == null || event.getTitle().isBlank() || event.getEventType() == null || event.getEventType().isBlank() || event.getStartAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le titre, le type et la date sont obligatoires");
        }
        if (event.getEndAt() != null && event.getEndAt().isBefore(event.getStartAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La date de fin doit être après la date de début");
        }
    }
}
