package com.gestionconcours.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "qcm_responses", uniqueConstraints = @UniqueConstraint(
        columnNames = {"concours_blanc_id", "attempt_id", "question_key"}))
public class QcmResponse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "concours_blanc_id", nullable = false)
    private ConcoursBlanc concoursBlanc;

    @Column(name = "attempt_id", nullable = false, length = 100)
    private String attemptId;

    @Column(name = "student_id")
    private Long studentId;

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

    @Column(nullable = false)
    private boolean reviewed = false;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;
    private LocalDateTime answeredAt = LocalDateTime.now();

    public Long getId() { return id; }
    public ConcoursBlanc getConcoursBlanc() { return concoursBlanc; }
    public void setConcoursBlanc(ConcoursBlanc concoursBlanc) { this.concoursBlanc = concoursBlanc; }
    public String getAttemptId() { return attemptId; }
    public void setAttemptId(String attemptId) { this.attemptId = attemptId; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
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
    public boolean isReviewed() { return reviewed; }
    public void setReviewed(boolean reviewed) { this.reviewed = reviewed; }
    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }
    public LocalDateTime getAnsweredAt() { return answeredAt; }
}
