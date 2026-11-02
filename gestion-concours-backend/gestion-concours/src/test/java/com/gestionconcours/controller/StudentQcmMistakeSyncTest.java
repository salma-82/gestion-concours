package com.gestionconcours.controller;

import com.gestionconcours.model.ConcoursBlanc;
import com.gestionconcours.model.StudentMistake;
import com.gestionconcours.model.StudentQcmAnswer;
import com.gestionconcours.model.User;
import com.gestionconcours.repository.ConcoursBlancRepository;
import com.gestionconcours.repository.ConcoursRepository;
import com.gestionconcours.repository.QcmResponseRepository;
import com.gestionconcours.repository.StudentMistakeRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentQcmMistakeSyncTest {
    @Mock private StudentQcmAnswerRepository answers;
    @Mock private StudentMistakeRepository mistakes;
    @Mock private QcmResponseRepository legacyAnswers;
    @Mock private AuthSessionService auth;
    @Mock private ConcoursRepository concours;
    @Mock private ConcoursBlancRepository concoursBlancs;

    private StudentQcmHistoryController controller;
    private User student;
    private ConcoursBlanc concoursBlanc;

    @BeforeEach
    void setUp() {
        controller = new StudentQcmHistoryController(answers, mistakes, legacyAnswers, auth, concours, concoursBlancs);
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
        lenient().when(auth.resolve("student-token")).thenReturn(Optional.of(student));
        lenient().when(concoursBlancs.findById(9L)).thenReturn(Optional.of(concoursBlanc));
        lenient().when(answers.save(any(StudentQcmAnswer.class))).thenAnswer(invocation -> {
            StudentQcmAnswer answer = invocation.getArgument(0);
            ReflectionTestUtils.setField(answer, "id", 71L);
            return answer;
        });
        lenient().when(mistakes.save(any(StudentMistake.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void rejectsAnswerHistoryWithoutAStudentSession() {
        when(auth.resolve(null)).thenReturn(Optional.empty());

        var response = controller.saveAnswer(null, wrongAnswer());

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verifyNoInteractions(answers, mistakes, concoursBlancs);
    }

    @Test
    void automaticallyStoresWrongAnswerAndContestContext() {
        when(answers.findByStudentIdAndResourceTypeAndResourceIdAndAttemptIdAndQuestionKey(
                41L, "Concours blanc", "9", "attempt-1", "q-1")).thenReturn(Optional.empty());
        when(mistakes.findByStudentIdAndResourceIdAndQuestionIdAndSourceTypeAndSavedManuallyFalse(
                41L, "9", "q-1", "Concours blanc")).thenReturn(List.of());

        var response = controller.saveAnswer("Bearer student-token", wrongAnswer());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ArgumentCaptor<StudentMistake> captor = ArgumentCaptor.forClass(StudentMistake.class);
        verify(mistakes).save(captor.capture());
        StudentMistake saved = captor.getValue();
        assertEquals(41L, saved.getStudentId());
        assertSame(student, saved.getUser());
        assertEquals("Concours blanc", saved.getSourceType());
        assertEquals("9", saved.getResourceId());
        assertEquals(2025, saved.getYear());
        assertEquals("Mathématiques", saved.getSubject());
        assertEquals("Suites", saved.getChapter());
        assertEquals("q-1", saved.getQuestionId());
        assertEquals("La suite converge-t-elle ?", saved.getQuestionText());
        assertEquals("B", saved.getSelectedChoiceLabel());
        assertEquals("A", saved.getCorrectChoiceLabel());
        assertEquals("La bonne réponse est A.", saved.getExplanation());
        assertFalse(saved.getSavedManually());
        assertTrue(saved.isSavedForReview());
    }

    @Test
    void correctedRetryClearsOnlyTheAutomaticMistake() {
        StudentMistake automatic = automaticMistake();
        StudentMistake manual = automaticMistake();
        manual.setId(88L);
        manual.setSavedManually(true);
        manual.setSavedForReview(true);
        when(answers.findByStudentIdAndResourceTypeAndResourceIdAndAttemptIdAndQuestionKey(
                41L, "Concours blanc", "9", "attempt-2", "q-1")).thenReturn(Optional.empty());
        when(mistakes.findByStudentIdAndResourceIdAndQuestionIdAndSourceTypeAndSavedManuallyFalse(
                41L, "9", "q-1", "Concours blanc")).thenReturn(List.of(automatic));

        var response = controller.saveAnswer("Bearer student-token", correctRetry());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertFalse(automatic.isSavedForReview());
        assertTrue(manual.isSavedForReview());
        assertTrue(manual.getSavedManually());
        verify(mistakes).saveAll(List.of(automatic));
        verify(mistakes, never()).delete(any());
    }

    @Test
    void persistentWrongRetryUpdatesTheSameAutomaticRowWithoutAddingADuplicate() {
        StudentMistake existing = automaticMistake();
        existing.setCreatedAt(LocalDateTime.now().minusDays(1));
        when(answers.findByStudentIdAndResourceTypeAndResourceIdAndAttemptIdAndQuestionKey(
                41L, "Concours blanc", "9", "attempt-2", "q-1")).thenReturn(Optional.empty());
        when(mistakes.findByStudentIdAndResourceIdAndQuestionIdAndSourceTypeAndSavedManuallyFalse(
                41L, "9", "q-1", "Concours blanc")).thenReturn(List.of(existing));

        controller.saveAnswer("Bearer student-token", persistentWrongRetry());

        ArgumentCaptor<StudentMistake> captor = ArgumentCaptor.forClass(StudentMistake.class);
        verify(mistakes).save(captor.capture());
        assertSame(existing, captor.getValue());
        assertEquals("C", existing.getSelectedChoiceLabel());
        assertEquals("attempt-2", existing.getAttemptId());
        assertTrue(existing.isSavedForReview());
        assertFalse(existing.getSavedManually());
        verify(mistakes, never()).saveAll(any());
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

    private Map<String, Object> correctRetry() {
        Map<String, Object> answer = new java.util.HashMap<>(wrongAnswer());
        answer.put("attemptId", "attempt-2");
        answer.put("selectedChoiceLabel", "A");
        answer.put("selectedChoiceText", "Oui");
        return answer;
    }

    private Map<String, Object> persistentWrongRetry() {
        Map<String, Object> answer = new java.util.HashMap<>(wrongAnswer());
        answer.put("attemptId", "attempt-2");
        answer.put("selectedChoiceLabel", "C");
        answer.put("selectedChoiceText", "Je ne sais pas");
        return answer;
    }

    private StudentMistake automaticMistake() {
        StudentMistake mistake = new StudentMistake();
        mistake.setId(77L);
        mistake.setStudentId(41L);
        mistake.setUser(student);
        mistake.setSourceType("Concours blanc");
        mistake.setResourceId("9");
        mistake.setQuestionId("q-1");
        mistake.setAttemptId("attempt-1");
        mistake.setSavedManually(false);
        mistake.setSavedForReview(true);
        mistake.setCreatedAt(LocalDateTime.now());
        return mistake;
    }
}
