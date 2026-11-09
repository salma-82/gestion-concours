package com.gestionconcours.controller;

import com.gestionconcours.model.ConcoursBlanc;
import com.gestionconcours.model.StudentQcmAnswer;
import com.gestionconcours.model.User;
import com.gestionconcours.repository.ConcoursBlancRepository;
import com.gestionconcours.repository.ConcoursRepository;
import com.gestionconcours.repository.StudentQcmAnswerRepository;
import com.gestionconcours.service.AuthSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentQcmHistoryControllerTest {
    @Mock private StudentQcmAnswerRepository answers;
    @Mock private AuthSessionService auth;
    @Mock private ConcoursRepository concours;
    @Mock private ConcoursBlancRepository concoursBlancs;

    private StudentQcmHistoryController controller;
    private User student;
    private ConcoursBlanc concoursBlanc;

    @BeforeEach
    void setUp() {
        controller = new StudentQcmHistoryController(answers, auth, concours, concoursBlancs);
        student = new User();
        student.setId(41L);
        student.setPrenom("Samira");
        student.setNom("Test");
        student.setEmail("samira@example.test");
        student.setRole("CLIENT");
        student.setActive(1);

        concoursBlanc = new ConcoursBlanc();
        concoursBlanc.setId(9L);
        concoursBlanc.setTitre("Concours blanc national");
        concoursBlanc.setEcole("ENSA");
        concoursBlanc.setMatiere("Mathématiques");
        concoursBlanc.setChapitre("Suites");
        concoursBlanc.setAnnee(2025);
        concoursBlanc.setPublie(true);
    }

    @Test
    void rejectsAnswerHistoryWithoutAStudentSession() {
        when(auth.resolve(null)).thenReturn(Optional.empty());

        var response = controller.saveAnswer(null, wrongAnswer());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verifyNoInteractions(answers, concours, concoursBlancs);
    }

    @Test
    void storesAnswerWithContestMetadata() {
        authenticateStudent();
        when(concoursBlancs.findById(9L)).thenReturn(Optional.of(concoursBlanc));
        when(answers.findByStudentIdAndResourceTypeAndResourceIdAndAttemptIdAndQuestionKey(
                41L, "Concours blanc", "9", "attempt-1", "q-1")).thenReturn(Optional.empty());
        stubAnswerSave();

        var response = controller.saveAnswer("Bearer student-token", wrongAnswer());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ArgumentCaptor<StudentQcmAnswer> captor = ArgumentCaptor.forClass(StudentQcmAnswer.class);
        verify(answers).save(captor.capture());
        StudentQcmAnswer saved = captor.getValue();
        assertEquals(41L, saved.getStudentId());
        assertEquals("Concours blanc", saved.getResourceType());
        assertEquals("9", saved.getResourceId());
        assertEquals("Concours blanc national", saved.getResourceTitle());
        assertEquals("ENSA", saved.getSchool());
        assertEquals("Mathématiques", saved.getSubject());
        assertEquals("Suites", saved.getChapter());
        assertEquals(2025, saved.getYear());
        assertEquals("q-1", saved.getQuestionKey());
        assertEquals("B", saved.getSelectedChoiceLabel());
        assertEquals("A", saved.getCorrectChoiceLabel());
        assertFalse(saved.isCorrect());
    }

    @Test
    void updatesAnExistingAnswerForTheSameAttemptAndQuestion() {
        authenticateStudent();
        when(concoursBlancs.findById(9L)).thenReturn(Optional.of(concoursBlanc));
        StudentQcmAnswer existing = new StudentQcmAnswer();
        when(answers.findByStudentIdAndResourceTypeAndResourceIdAndAttemptIdAndQuestionKey(
                41L, "Concours blanc", "9", "attempt-1", "q-1")).thenReturn(Optional.of(existing));
        stubAnswerSave();
        Map<String, Object> retry = new java.util.HashMap<>(wrongAnswer());
        retry.put("selectedChoiceLabel", "A");
        retry.put("selectedChoiceText", "Oui");

        var response = controller.saveAnswer("Bearer student-token", retry);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ArgumentCaptor<StudentQcmAnswer> captor = ArgumentCaptor.forClass(StudentQcmAnswer.class);
        verify(answers).save(captor.capture());
        assertSame(existing, captor.getValue());
        assertEquals("A", existing.getSelectedChoiceLabel());
        assertTrue(existing.isCorrect());
    }

    @Test
    void rejectsAnUnknownContestWithoutSavingAnAnswer() {
        authenticateStudent();
        when(concoursBlancs.findById(9L)).thenReturn(Optional.empty());

        var response = controller.saveAnswer("Bearer student-token", wrongAnswer());

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(answers);
    }

    private void authenticateStudent() {
        when(auth.resolve("student-token")).thenReturn(Optional.of(student));
    }

    private void stubAnswerSave() {
        when(answers.save(any(StudentQcmAnswer.class))).thenAnswer(invocation -> {
            StudentQcmAnswer answer = invocation.getArgument(0);
            ReflectionTestUtils.setField(answer, "id", 71L);
            return answer;
        });
    }

    private Map<String, Object> wrongAnswer() {
        return Map.ofEntries(
                Map.entry("sourceType", "Concours blanc"), Map.entry("resourceId", "9"),
                Map.entry("attemptId", "attempt-1"), Map.entry("questionId", "q-1"),
                Map.entry("questionNumber", 1), Map.entry("questionText", "La suite converge-t-elle ?"),
                Map.entry("selectedChoiceLabel", "B"), Map.entry("selectedChoiceText", "Non"),
                Map.entry("correctChoiceLabel", "A"), Map.entry("correctChoiceText", "Oui"),
                Map.entry("explanation", "La bonne réponse est A."), Map.entry("totalQuestions", 10)
        );
    }
}
