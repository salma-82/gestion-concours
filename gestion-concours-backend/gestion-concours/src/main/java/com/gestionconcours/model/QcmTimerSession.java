package com.gestionconcours.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "qcm_timer_sessions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_qcm_timer_client_attempt", columnNames = {"student_id", "client_attempt_key"}),
        @UniqueConstraint(name = "uk_qcm_timer_active_key", columnNames = {"active_key"})
}, indexes = {
        @Index(name = "idx_qcm_timer_student_resource", columnList = "student_id, resource_type, resource_id, status")
})
public class QcmTimerSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "resource_type", nullable = false, length = 80)
    private String resourceType;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @Column(name = "client_attempt_key", nullable = false, length = 36)
    private String clientAttemptKey;

    @Column(name = "active_key", length = 255)
    private String activeKey;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    @Column(name = "duration_source", length = 800)
    private String durationSource;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "deadline_at")
    private LocalDateTime deadlineAt;

    @Column(name = "remaining_seconds")
    private Long remainingSeconds;

    @Column(name = "selected_answers", columnDefinition = "TEXT")
    private String selectedAnswers = "{}";

    @Column(name = "current_question")
    private Integer currentQuestion;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "finished_reason", length = 24)
    private String finishedReason;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public String getPublicId() { return publicId; }
    public void setPublicId(String publicId) { this.publicId = publicId; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public Long getResourceId() { return resourceId; }
    public void setResourceId(Long resourceId) { this.resourceId = resourceId; }
    public String getClientAttemptKey() { return clientAttemptKey; }
    public void setClientAttemptKey(String clientAttemptKey) { this.clientAttemptKey = clientAttemptKey; }
    public String getActiveKey() { return activeKey; }
    public void setActiveKey(String activeKey) { this.activeKey = activeKey; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
    public String getDurationSource() { return durationSource; }
    public void setDurationSource(String durationSource) { this.durationSource = durationSource; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getDeadlineAt() { return deadlineAt; }
    public void setDeadlineAt(LocalDateTime deadlineAt) { this.deadlineAt = deadlineAt; }
    public Long getRemainingSeconds() { return remainingSeconds; }
    public void setRemainingSeconds(Long remainingSeconds) { this.remainingSeconds = remainingSeconds; }
    public String getSelectedAnswers() { return selectedAnswers; }
    public void setSelectedAnswers(String selectedAnswers) { this.selectedAnswers = selectedAnswers; }
    public Integer getCurrentQuestion() { return currentQuestion; }
    public void setCurrentQuestion(Integer currentQuestion) { this.currentQuestion = currentQuestion; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    public String getFinishedReason() { return finishedReason; }
    public void setFinishedReason(String finishedReason) { this.finishedReason = finishedReason; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
