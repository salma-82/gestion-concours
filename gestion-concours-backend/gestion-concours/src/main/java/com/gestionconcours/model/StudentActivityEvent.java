package com.gestionconcours.model;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_activity_events", indexes = {
        @Index(name = "idx_student_activity_student_date", columnList = "student_id, occurred_at"),
        @Index(name = "idx_student_activity_type", columnList = "activity_type")
})
public class StudentActivityEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User student;

    @Column(name = "activity_type", nullable = false, length = 40)
    private String activityType;

    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType;

    @Column(name = "resource_variant", length = 30)
    private String resourceVariant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "concours_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Concours concours;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "concours_blanc_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ConcoursBlanc concoursBlanc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cours_bac_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private CoursBac coursBac;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examen_national_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ExamenNational examenNational;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Resume resume;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getResourceVariant() { return resourceVariant; }
    public void setResourceVariant(String resourceVariant) { this.resourceVariant = resourceVariant; }
    public Concours getConcours() { return concours; }
    public void setConcours(Concours concours) { this.concours = concours; }
    public ConcoursBlanc getConcoursBlanc() { return concoursBlanc; }
    public void setConcoursBlanc(ConcoursBlanc concoursBlanc) { this.concoursBlanc = concoursBlanc; }
    public CoursBac getCoursBac() { return coursBac; }
    public void setCoursBac(CoursBac coursBac) { this.coursBac = coursBac; }
    public ExamenNational getExamenNational() { return examenNational; }
    public void setExamenNational(ExamenNational examenNational) { this.examenNational = examenNational; }
    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
}
