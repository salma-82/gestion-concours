package com.gestionconcours.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "concours_calendar_events")
public class ConcoursCalendarEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String eventType;

    private String concoursName;
    private String school;

    @Column(nullable = false)
    private LocalDateTime startAt;

    private LocalDateTime endAt;

    @Column(length = 1500)
    private String description;

    private String registrationUrl;

    public ConcoursCalendarEvent() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getConcoursName() { return concoursName; }
    public void setConcoursName(String concoursName) { this.concoursName = concoursName; }
    public String getSchool() { return school; }
    public void setSchool(String school) { this.school = school; }
    public LocalDateTime getStartAt() { return startAt; }
    public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRegistrationUrl() { return registrationUrl; }
    public void setRegistrationUrl(String registrationUrl) { this.registrationUrl = registrationUrl; }
}
