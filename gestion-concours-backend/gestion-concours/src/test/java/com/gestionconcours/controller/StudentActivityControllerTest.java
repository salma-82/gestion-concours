package com.gestionconcours.controller;

import com.gestionconcours.model.Concours;
import com.gestionconcours.model.StudentActivityEvent;
import com.gestionconcours.model.User;
import com.gestionconcours.repository.*;
import com.gestionconcours.service.AuthSessionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class StudentActivityControllerTest {
    @Mock private StudentActivityEventRepository events;
    @Mock private AuthSessionService auth;
    @Mock private ConcoursRepository concours;
    @Mock private ConcoursBlancRepository concoursBlancs;
    @Mock private CoursBacRepository courses;
    @Mock private ExamenNationalRepository exams;
    @Mock private ResumeRepository resumes;
    @InjectMocks private StudentActivityController controller;

    @Test
    void rejectsDashboardReadsWithoutAValidSession() {
        when(auth.resolve(null)).thenReturn(Optional.empty());
        assertEquals(HttpStatus.UNAUTHORIZED, controller.getMyActivities(null).getStatusCode());
        verifyNoInteractions(events);
    }

    @Test
    void readsOnlyTheAuthenticatedStudentsActivityRows() {
        User student = new User();
        student.setId(12L);
        student.setRole("CLIENT");
        student.setActive(1);
        when(auth.resolve("valid-token")).thenReturn(Optional.of(student));
        when(events.findByStudentIdOrderByOccurredAtDesc(12L)).thenReturn(java.util.List.of());

        var response = controller.getMyActivities("Bearer valid-token");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(events).findByStudentIdOrderByOccurredAtDesc(12L);
        verifyNoMoreInteractions(events);
    }

    @Test
    void recordsAResourceAgainstTheAuthenticatedStudentInsteadOfAClientSuppliedId() {
        User student = new User();
        student.setId(12L);
        student.setRole("CLIENT");
        student.setActive(1);
        Concours resource = new Concours();
        resource.setId(7L);
        resource.setTitre("Concours 2025");
        when(auth.resolve("valid-token")).thenReturn(Optional.of(student));
        when(concours.findById(7L)).thenReturn(Optional.of(resource));
        when(events.save(any(StudentActivityEvent.class))).thenAnswer(invocation -> {
            StudentActivityEvent saved = invocation.getArgument(0);
            saved.setId(22L);
            return saved;
        });

        var response = controller.recordActivity("Bearer valid-token", Map.of(
                "type", "Concours", "resourceId", "7:sujet", "eventType", "VIEW", "studentId", 99
        ));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ArgumentCaptor<StudentActivityEvent> captor = ArgumentCaptor.forClass(StudentActivityEvent.class);
        verify(events).save(captor.capture());
        StudentActivityEvent stored = captor.getValue();
        assertSame(student, stored.getStudent());
        assertSame(resource, stored.getConcours());
        assertEquals("CONCOURS", stored.getActivityType());
        assertEquals("sujet", stored.getResourceVariant());
        verifyNoInteractions(concoursBlancs, courses, exams, resumes);
    }

    @Test
    void rejectsAValidSessionThatDoesNotBelongToAStudentRole() {
        User admin = new User();
        admin.setRole("ADMIN");
        when(auth.resolve("admin-token")).thenReturn(Optional.of(admin));
        assertEquals(HttpStatus.UNAUTHORIZED, controller.getMyActivities("Bearer admin-token").getStatusCode());
        verifyNoInteractions(events);
    }
}
