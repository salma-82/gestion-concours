package com.gestionconcours.controller;

import com.gestionconcours.model.StudentMistake;
import com.gestionconcours.model.User;
import com.gestionconcours.repository.StudentMistakeRepository;
import com.gestionconcours.service.AuthSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentMistakeControllerTest {
    @Mock private StudentMistakeRepository repository;
    @Mock private AuthSessionService auth;

    private StudentMistakeController controller;
    private User student;

    @BeforeEach
    void setUp() {
        controller = new StudentMistakeController(repository, auth);
        student = new User();
        student.setId(12L);
        student.setNom("Étudiant");
        student.setPrenom("Lina");
        student.setEmail("lina@example.test");
        student.setRole("CLIENT");
        student.setActive(1);
        lenient().when(auth.resolve("student-token")).thenReturn(Optional.of(student));
    }

    @Test
    void manualCourseMistakeIsSavedAndUpdatedIndependentlyAcrossAttempts() {
        StudentMistake existingManual = manualMistake();
        when(repository.findByStudentIdAndResourceIdAndQuestionIdAndSourceTypeAndSavedManuallyTrueOrderByCreatedAtDesc(
                12L, "course-3", "q-4", "Exercice")).thenReturn(List.of(existingManual));
        when(repository.findByStudentIdAndResourceIdAndQuestionIdAndSourceTypeAndSavedManuallyIsNullOrderByCreatedAtDesc(
                12L, "course-3", "q-4", "Exercice")).thenReturn(List.of());
        when(repository.save(any(StudentMistake.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.saveMistakesBatch("Bearer student-token", Map.of("mistakes", List.of(manualPayload("attempt-2"))));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ArgumentCaptor<StudentMistake> captor = ArgumentCaptor.forClass(StudentMistake.class);
        verify(repository).save(captor.capture());
        StudentMistake saved = captor.getValue();
        assertSame(existingManual, saved);
        assertEquals(12L, saved.getStudentId());
        assertSame(student, saved.getUser());
        assertEquals("Cours de suites", saved.getResourceTitle());
        assertEquals("Mathématiques", saved.getSubject());
        assertEquals("Suites", saved.getChapter());
        assertEquals("Nouvelle explication", saved.getExplanation());
        assertEquals("attempt-2", saved.getAttemptId());
        assertTrue(saved.getSavedManually());
        assertTrue(saved.isSavedForReview());
        verify(repository, never()).findByStudentIdAndResourceIdAndQuestionIdAndSourceTypeAndSavedManuallyFalse(
                any(), any(), any(), any());
    }

    @Test
    void automaticAttemptUpsertDoesNotChangeManualCopyOfTheSameQuestion() {
        StudentMistake savedManual = manualMistake();
        StudentMistake automatic = new StudentMistake();
        automatic.setId(22L);
        automatic.setStudentId(12L);
        automatic.setSourceType("Exercice");
        automatic.setResourceId("course-3");
        automatic.setQuestionId("q-4");
        automatic.setSavedManually(false);
        automatic.setSavedForReview(true);
        when(repository.findByStudentIdAndResourceIdAndQuestionIdAndSourceTypeAndSavedManuallyFalse(
                12L, "course-3", "q-4", "Exercice")).thenReturn(List.of(automatic));
        when(repository.save(any(StudentMistake.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.saveAutomaticMistake("Bearer student-token", Map.of("mistakes", List.of(manualPayload("contest-attempt-1"))));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(savedManual.getSavedManually());
        assertTrue(savedManual.isSavedForReview());
        assertFalse(automatic.getSavedManually());
        assertTrue(automatic.isSavedForReview());
        assertEquals("contest-attempt-1", automatic.getAttemptId());
        verify(repository, never()).findByStudentIdAndResourceIdAndQuestionIdAndSourceTypeAndSavedManuallyTrueOrderByCreatedAtDesc(
                any(), any(), any(), any());
    }

    @Test
    void explicitDeleteRemovesManualDuplicatesButRejectsAutomaticRows() {
        StudentMistake selected = manualMistake();
        selected.setId(31L);
        when(repository.findById(31L)).thenReturn(Optional.of(selected));
        when(repository.findByStudentIdAndResourceIdAndQuestionIdAndSourceTypeAndSavedManuallyTrueOrderByCreatedAtDesc(
                12L, "course-3", "q-4", "Exercice")).thenReturn(List.of(selected));
        when(repository.findByStudentIdAndResourceIdAndQuestionIdAndSourceTypeAndSavedManuallyIsNullOrderByCreatedAtDesc(
                12L, "course-3", "q-4", "Exercice")).thenReturn(List.of());

        var deleted = controller.deleteStudentMistake(31L, "Bearer student-token", null);

        assertEquals(HttpStatus.OK, deleted.getStatusCode());
        verify(repository).deleteByIdAndStudentId(31L, 12L);

        StudentMistake automatic = new StudentMistake();
        automatic.setId(32L);
        automatic.setStudentId(12L);
        automatic.setSavedManually(false);
        when(repository.findById(32L)).thenReturn(Optional.of(automatic));
        var rejected = controller.deleteStudentMistake(32L, "Bearer student-token", null);

        assertEquals(HttpStatus.FORBIDDEN, rejected.getStatusCode());
        verify(repository, never()).deleteByIdAndStudentId(32L, 12L);
    }

    @Test
    void refusesMistakeReadsAndWritesWithoutAnAuthenticatedStudent() {
        when(auth.resolve(null)).thenReturn(Optional.empty());

        assertEquals(HttpStatus.UNAUTHORIZED, controller.getStudentMistakes(null, null, "all").getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, controller.saveMistakesBatch(null, Map.of("mistakes", List.of(manualPayload("a")))).getStatusCode());
        verifyNoInteractions(repository);
    }

    private Map<String, Object> manualPayload(String attemptId) {
        Map<String, Object> item = new HashMap<>();
        item.put("sourceType", "Exercice");
        item.put("resourceId", "course-3");
        item.put("resourceTitle", "Cours de suites");
        item.put("subject", "Mathématiques");
        item.put("chapter", "Suites");
        item.put("questionId", "q-4");
        item.put("questionNumber", 4);
        item.put("questionText", "Étudier la suite.");
        item.put("selectedChoiceLabel", "B");
        item.put("correctChoiceLabel", "A");
        item.put("explanation", "Nouvelle explication");
        item.put("attemptId", attemptId);
        return item;
    }

    private StudentMistake manualMistake() {
        StudentMistake mistake = new StudentMistake();
        mistake.setId(21L);
        mistake.setStudentId(12L);
        mistake.setUser(student);
        mistake.setSourceType("Exercice");
        mistake.setResourceId("course-3");
        mistake.setQuestionId("q-4");
        mistake.setAttemptId("attempt-1");
        mistake.setSavedManually(true);
        mistake.setSavedForReview(true);
        return mistake;
    }
}
