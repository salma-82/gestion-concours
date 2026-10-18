package com.gestionconcours.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_mistakes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentMistake {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    private String studentName;
    private String studentEmail;

    private String sourceType; // "Concours blanc", "Concours", etc.
    private String resourceId;
    private String resourceTitle;
    private String subject;
    private String chapter;
    private String school;

    private String questionId;
    private Integer questionNumber;

    @Column(columnDefinition = "LONGTEXT")
    private String questionText;

    private String selectedChoiceLabel;

    @Column(columnDefinition = "LONGTEXT")
    private String selectedChoiceText;

    private String correctChoiceLabel;

    @Column(columnDefinition = "LONGTEXT")
    private String correctChoiceText;

    @Column(columnDefinition = "LONGTEXT")
    private String explanation;

    private String attemptId;

    @Column(nullable = false)
    @Builder.Default
    private boolean reviewed = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
