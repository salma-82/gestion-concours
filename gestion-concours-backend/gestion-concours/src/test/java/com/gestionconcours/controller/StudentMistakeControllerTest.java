package com.gestionconcours.controller;

import com.gestionconcours.model.StudentMistake;
import com.gestionconcours.model.User;
import com.gestionconcours.repository.StudentMistakeRepository;
import com.gestionconcours.repository.UserRepository;
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
    @Mock private UserRepository users;

    private StudentMistakeController controller;
    private User student;

    @BeforeEach
    void setUp() {
        controller = new StudentMistakeController(repository, users);
        student = new User();
        student.setId(12L);
        student.setNom("Etudiant");
        student.setPrenom("Lina");
        student.setEmail("lina@example.test");
        student.setRole("CLIENT");
        student.setActive(1);
    }

    @Test
    void savesMistakeForTheRequestedStudentAndAttempt() {
        when(users.findById(12L)).thenReturn(Optional.of(student));
        when(repository.findByStudentIdAndResourceIdAndAttemptIdAndQuestionId(
                12L, "course-3", "attempt-2", "q-4")).thenReturn(Optional.empty());
        when(repository.save(any(StudentMistake.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.saveMistakesBatch(batch("attempt-2"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ArgumentCaptor<StudentMistake> captor = ArgumentCaptor.forClass(StudentMistake.class);
        verify(repository).save(captor.capture());
        StudentMistake saved = captor.getValue();
        assertEquals(12L, saved.getStudentId());
        assertSame(student, saved.getUser());
        assertEquals("Cours de suites", saved.getResourceTitle());
        assertEquals("Mathématiques", saved.getSubject());
        assertEquals("Suites", saved.getChapter());
        assertEquals("Nouvelle explication", saved.getExplanation());
        assertEquals("attempt-2", saved.getAttemptId());
        assertTrue(saved.isSavedForReview());
    }

    @Test
    void automaticMistakesAreStoredOutsideTheReviewList() {
        when(users.findById(12L)).thenReturn(Optional.of(student));
        when(repository.findByStudentIdAndResourceIdAndAttemptIdAndQuestionId(
                12L, "course-3", "attempt-auto", "q-4")).thenReturn(Optional.empty());
        when(repository.save(any(StudentMistake.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Map<String, Object> request = batch("attempt-auto");

        var response = controller.saveAutomaticMistake(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ArgumentCaptor<StudentMistake> captor = ArgumentCaptor.forClass(StudentMistake.class);
        verify(repository).save(captor.capture());
        assertFalse(captor.getValue().isSavedForReview());
        assertEquals("attempt-auto", captor.getValue().getAttemptId());
    }

    @Test
    void resolvesMistakesForTheQuestion() {
        StudentMistake mistake = new StudentMistake();
        mistake.setSavedForReview(true);
        when(repository.findByStudentIdAndResourceIdAndQuestionId(12L, "course-3", "q-4"))
                .thenReturn(List.of(mistake));

        var response = controller.resolveMistake(Map.of(
                "studentId", 12L, "resourceId", "course-3", "questionId", "q-4"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertFalse(mistake.isSavedForReview());
        verify(repository).saveAll(List.of(mistake));
    }

    @Test
    void deleteChecksTheStudentIdWhenItIsProvided() {
        StudentMistake mistake = new StudentMistake();
        mistake.setId(31L);
        mistake.setStudentId(12L);
        when(repository.findById(31L)).thenReturn(Optional.of(mistake));

        var rejected = controller.deleteStudentMistake(31L, 15L);
        var deleted = controller.deleteStudentMistake(31L, 12L);

        assertEquals(HttpStatus.FORBIDDEN, rejected.getStatusCode());
        assertEquals(HttpStatus.OK, deleted.getStatusCode());
        verify(repository).deleteById(31L);
    }

    @Test
    void refusesReadsAndWritesWithoutAStudentId() {
        assertEquals(HttpStatus.BAD_REQUEST, controller.getStudentMistakes(null).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, controller.saveMistakesBatch(Map.of("mistakes", List.of(payload("a")))).getStatusCode());
        verifyNoInteractions(repository, users);
    }

    private Map<String, Object> batch(String attemptId) {
        Map<String, Object> request = new HashMap<>();
        request.put("studentId", 12L);
        request.put("mistakes", List.of(payload(attemptId)));
        return request;
    }

    private Map<String, Object> payload(String attemptId) {
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
}
