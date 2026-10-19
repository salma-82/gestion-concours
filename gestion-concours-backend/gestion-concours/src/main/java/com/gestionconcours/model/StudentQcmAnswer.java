package com.gestionconcours.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_qcm_answers", uniqueConstraints = @UniqueConstraint(
        columnNames = {"student_id", "resource_type", "resource_id", "attempt_id", "question_key"}))
public class StudentQcmAnswer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "resource_type", nullable = false, length = 80)
    private String resourceType;
    @Column(name = "resource_id", nullable = false, length = 160)
    private String resourceId;
    @Column(name = "resource_title", length = 300)
    private String resourceTitle;
    @Column(length = 160)
    private String school;
    @Column(length = 120)
    private String subject;
    @Column(length = 160)
    private String chapter;
    private Integer year;
    @Column(name = "total_questions")
    private Integer totalQuestions;
    @Column(name = "attempt_id", nullable = false, length = 100)
    private String attemptId;
    @Column(name = "question_key", nullable = false, length = 255)
    private String questionKey;
    private Integer questionNumber;
    @Column(columnDefinition = "TEXT")
    private String questionText;
    private String selectedChoiceLabel;
    private String correctChoiceLabel;
    @Column(columnDefinition = "TEXT")
    private String selectedChoiceText;
    @Column(columnDefinition = "TEXT")
    private String correctChoiceText;
    @Column(columnDefinition = "TEXT")
    private String explanation;
    @Column(name = "is_correct", nullable = false)
    private boolean correct;
    @Column(name = "answered_at", nullable = false)
    private LocalDateTime answeredAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getResourceTitle() { return resourceTitle; }
    public void setResourceTitle(String resourceTitle) { this.resourceTitle = resourceTitle; }
    public String getSchool() { return school; }
    public void setSchool(String school) { this.school = school; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getChapter() { return chapter; }
    public void setChapter(String chapter) { this.chapter = chapter; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
    public String getAttemptId() { return attemptId; }
    public void setAttemptId(String attemptId) { this.attemptId = attemptId; }
    public String getQuestionKey() { return questionKey; }
    public void setQuestionKey(String questionKey) { this.questionKey = questionKey; }
    public Integer getQuestionNumber() { return questionNumber; }
    public void setQuestionNumber(Integer questionNumber) { this.questionNumber = questionNumber; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public String getSelectedChoiceLabel() { return selectedChoiceLabel; }
    public void setSelectedChoiceLabel(String selectedChoiceLabel) { this.selectedChoiceLabel = selectedChoiceLabel; }
    public String getCorrectChoiceLabel() { return correctChoiceLabel; }
    public void setCorrectChoiceLabel(String correctChoiceLabel) { this.correctChoiceLabel = correctChoiceLabel; }
    public String getSelectedChoiceText() { return selectedChoiceText; }
    public void setSelectedChoiceText(String selectedChoiceText) { this.selectedChoiceText = selectedChoiceText; }
    public String getCorrectChoiceText() { return correctChoiceText; }
    public void setCorrectChoiceText(String correctChoiceText) { this.correctChoiceText = correctChoiceText; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }
    public LocalDateTime getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(LocalDateTime answeredAt) { this.answeredAt = answeredAt; }
}
