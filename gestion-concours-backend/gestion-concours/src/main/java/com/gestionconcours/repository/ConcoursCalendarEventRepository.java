package com.gestionconcours.repository;

import com.gestionconcours.model.ConcoursCalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConcoursCalendarEventRepository extends JpaRepository<ConcoursCalendarEvent, Long> {
    List<ConcoursCalendarEvent> findAllByOrderByStartAtAsc();
}
