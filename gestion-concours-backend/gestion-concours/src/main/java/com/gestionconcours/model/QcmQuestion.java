package com.gestionconcours.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "qcm_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QcmQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "concours_blanc_id", nullable = false)
    private ConcoursBlanc concoursBlanc;

    private Integer questionNumber;

    @Column(columnDefinition = "TEXT")
    private String questionText;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("choiceLabel ASC")
    private List<QcmChoice> choices = new ArrayList<>();

    // Bonne réponse (ex: "A", "B", "C", "D") — nullable si corrigé absent
    private String correctChoiceLabel;

    // Explication détaillée — nullable si corrigé absent
    @Column(columnDefinition = "TEXT")
    private String explanation;

    private LocalDateTime createdAt = LocalDateTime.now();
}
