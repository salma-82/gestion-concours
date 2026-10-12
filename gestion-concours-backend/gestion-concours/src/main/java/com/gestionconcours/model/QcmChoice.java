package com.gestionconcours.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "qcm_choices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QcmChoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @JsonIgnore
    private QcmQuestion question;

    private String choiceLabel; // "A", "B", "C", "D"

    @Column(columnDefinition = "TEXT")
    private String choiceText;
}
