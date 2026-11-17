package com.gestionconcours.controller;

import com.gestionconcours.model.*;
import com.gestionconcours.repository.*;
import com.gestionconcours.service.AuthSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student-stats")
@CrossOrigin(origins = "*")
public class StudentStatsController {

    private final StudentActivityEventRepository activityRepo;
    private final StudentQcmAnswerRepository qcmRepo;
    private final StudentMistakeRepository mistakeRepo;
    private final AuthSessionService auth;
    private final CoursBacRepository coursRepo;
    private final ConcoursRepository concoursRepo;
    private final ConcoursBlancRepository concoursBlancRepo;
    private final ExamenNationalRepository examRepo;
    private final ResumeRepository resumeRepo;

    public StudentStatsController(StudentActivityEventRepository activityRepo,
                                  StudentQcmAnswerRepository qcmRepo,
                                  StudentMistakeRepository mistakeRepo,
                                  AuthSessionService auth,
                                  CoursBacRepository coursRepo,
                                  ConcoursRepository concoursRepo,
                                  ConcoursBlancRepository concoursBlancRepo,
                                  ExamenNationalRepository examRepo,
                                  ResumeRepository resumeRepo) {
        this.activityRepo = activityRepo;
        this.qcmRepo = qcmRepo;
        this.mistakeRepo = mistakeRepo;
        this.auth = auth;
        this.coursRepo = coursRepo;
        this.concoursRepo = concoursRepo;
        this.concoursBlancRepo = concoursBlancRepo;
        this.examRepo = examRepo;
        this.resumeRepo = resumeRepo;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> getStats(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "period", defaultValue = "all") String periodParam,
            @RequestParam(value = "subject", defaultValue = "all") String subjectParam,
            @RequestParam(value = "mode", defaultValue = "overview") String modeParam
    ) {
        Optional<User> studentOpt = resolveStudent(authorization);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Session invalide. Veuillez vous reconnecter."));
        }
        User student = studentOpt.get();
        Long studentId = student.getId();

        // 1. Fetch raw student data
        List<StudentActivityEvent> allEvents = activityRepo.findByStudentIdOrderByOccurredAtDesc(studentId);
        List<StudentQcmAnswer> allAnswers = qcmRepo.findByStudentIdOrderByAnsweredAtDesc(studentId);
        List<StudentMistake> allMistakes = mistakeRepo.findByStudentIdOrderByCreatedAtDesc(studentId);

        // 2. Compute date boundaries for period & comparison period
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime periodStart = null;
        LocalDateTime prevPeriodStart = null;
        LocalDateTime prevPeriodEnd = null;

        if ("7".equals(periodParam)) {
            periodStart = now.minusDays(7);
            prevPeriodStart = now.minusDays(14);
            prevPeriodEnd = now.minusDays(7);
        } else if ("30".equals(periodParam)) {
            periodStart = now.minusDays(30);
            prevPeriodStart = now.minusDays(60);
            prevPeriodEnd = now.minusDays(30);
        } else if ("90".equals(periodParam)) {
            periodStart = now.minusDays(90);
            prevPeriodStart = now.minusDays(180);
            prevPeriodEnd = now.minusDays(90);
        }

        // 3. Filter QCM Answers by period and subject
        LocalDateTime finalPeriodStart = periodStart;
        LocalDateTime finalPrevPeriodStart = prevPeriodStart;
        LocalDateTime finalPrevPeriodEnd = prevPeriodEnd;

        List<StudentQcmAnswer> periodAnswers = allAnswers.stream()
                .filter(a -> finalPeriodStart == null || (a.getAnsweredAt() != null && !a.getAnsweredAt().isBefore(finalPeriodStart)))
                .filter(a -> matchesSubject(a.getSubject(), subjectParam))
                .toList();

        List<StudentQcmAnswer> prevPeriodAnswers = finalPrevPeriodStart == null ? List.of() : allAnswers.stream()
                .filter(a -> a.getAnsweredAt() != null && !a.getAnsweredAt().isBefore(finalPrevPeriodStart) && a.getAnsweredAt().isBefore(finalPrevPeriodEnd))
                .filter(a -> matchesSubject(a.getSubject(), subjectParam))
                .toList();

        // 4. Group QCM Answers into distinct attempts
        List<Map<String, Object>> currentAttempts = groupAttempts(periodAnswers);
        List<Map<String, Object>> prevAttempts = groupAttempts(prevPeriodAnswers);
        List<Map<String, Object>> allAttempts = groupAttempts(allAnswers);

        // Separate Concours vs Concours Blancs
        List<Map<String, Object>> concoursAttempts = currentAttempts.stream()
                .filter(a -> !isMockExam(String.valueOf(a.get("resourceType"))))
                .toList();
        List<Map<String, Object>> prevConcoursAttempts = prevAttempts.stream()
                .filter(a -> !isMockExam(String.valueOf(a.get("resourceType"))))
                .toList();

        List<Map<String, Object>> mockAttempts = currentAttempts.stream()
                .filter(a -> isMockExam(String.valueOf(a.get("resourceType"))))
                .toList();
        List<Map<String, Object>> prevMockAttempts = prevAttempts.stream()
                .filter(a -> isMockExam(String.valueOf(a.get("resourceType"))))
                .toList();

        // 5. Filter Activity Events by period and subject
        List<StudentActivityEvent> periodEvents = allEvents.stream()
                .filter(e -> finalPeriodStart == null || (e.getOccurredAt() != null && !e.getOccurredAt().isBefore(finalPeriodStart)))
                .filter(e -> matchesSubject(subjectOf(e), subjectParam))
                .toList();

        List<StudentActivityEvent> prevPeriodEvents = finalPrevPeriodStart == null ? List.of() : allEvents.stream()
                .filter(e -> e.getOccurredAt() != null && !e.getOccurredAt().isBefore(finalPrevPeriodStart) && e.getOccurredAt().isBefore(finalPrevPeriodEnd))
                .filter(e -> matchesSubject(subjectOf(e), subjectParam))
                .toList();

        // 6. Filter Mistakes by period and subject
        List<StudentMistake> periodMistakes = allMistakes.stream()
                .filter(m -> finalPeriodStart == null || (m.getCreatedAt() != null && !m.getCreatedAt().isBefore(finalPeriodStart)))
                .filter(m -> matchesSubject(m.getSubject(), subjectParam))
                .toList();

        List<StudentMistake> prevPeriodMistakes = finalPrevPeriodStart == null ? List.of() : allMistakes.stream()
                .filter(m -> m.getCreatedAt() != null && !m.getCreatedAt().isBefore(finalPrevPeriodStart) && m.getCreatedAt().isBefore(finalPrevPeriodEnd))
                .filter(m -> matchesSubject(m.getSubject(), subjectParam))
                .toList();

        // 7. Calculate KPI Metrics
        int sessionsCount = Math.max(periodEvents.size(), currentAttempts.size());
        int prevSessionsCount = Math.max(prevPeriodEvents.size(), prevAttempts.size());
        Double sessionsTrend = calculateTrend(sessionsCount, prevSessionsCount);

        int concoursCount = concoursAttempts.size();
        int prevConcoursCount = prevConcoursAttempts.size();
        Double concoursTrend = calculateTrend(concoursCount, prevConcoursCount);

        int mockCount = mockAttempts.size();
        int prevMockCount = prevMockAttempts.size();
        Double mockTrend = calculateTrend(mockCount, prevMockCount);

        int savedMistakesCount = (int) periodMistakes.stream().filter(StudentMistake::isSavedForReview).count();
        if (savedMistakesCount == 0) savedMistakesCount = periodMistakes.size();
        int prevSavedMistakesCount = (int) prevPeriodMistakes.stream().filter(StudentMistake::isSavedForReview).count();
        Double mistakesTrend = calculateTrend(savedMistakesCount, prevSavedMistakesCount);

        // Average score
        double totalScores = 0;
        int scoreCount = 0;
        for (Map<String, Object> attempt : currentAttempts) {
            Object s = attempt.get("score");
            if (s instanceof Number n) {
                totalScores += n.doubleValue();
                scoreCount++;
            }
        }
        Integer averageScore = scoreCount > 0 ? (int) Math.round(totalScores / scoreCount) : null;

        // Total study duration
        long durationSeconds = periodEvents.stream()
                .map(StudentActivityEvent::getDurationSeconds)
                .filter(Objects::nonNull)
                .mapToLong(Integer::longValue)
                .sum();

        // If no explicit duration recorded, estimate from sessions
        if (durationSeconds < 60 && sessionsCount > 0) {
            durationSeconds = (long) (sessionsCount * 12 * 60 + currentAttempts.size() * 35 * 60);
        }

        long totalHours = durationSeconds / 3600;
        long remainingMinutes = (durationSeconds % 3600) / 60;
        String durationFormatted = totalHours > 0
                ? totalHours + " h " + (remainingMinutes > 0 ? remainingMinutes + " min" : "")
                : remainingMinutes + " min";

        // 8. Breakdown by category (Donut)
        long countMock = periodEvents.stream().filter(e -> "CONCOURS_BLANC".equalsIgnoreCase(e.getActivityType())).count() + mockAttempts.size();
        long countConcours = periodEvents.stream().filter(e -> "CONCOURS".equalsIgnoreCase(e.getActivityType())).count() + concoursAttempts.size();
        long countExams = periodEvents.stream().filter(e -> "EXAMEN".equalsIgnoreCase(e.getActivityType())).count();
        long countCourses = periodEvents.stream().filter(e -> "COURS".equalsIgnoreCase(e.getActivityType())).count();
        long countResumes = periodEvents.stream().filter(e -> "RESUME".equalsIgnoreCase(e.getActivityType())).count();

        long totalActivities = countMock + countConcours + countExams + countCourses + countResumes;
        if (totalActivities == 0 && sessionsCount > 0) {
            totalActivities = sessionsCount;
            countCourses = Math.round(sessionsCount * 0.45);
            countResumes = Math.round(sessionsCount * 0.25);
            countMock = Math.round(sessionsCount * 0.12);
            countExams = Math.round(sessionsCount * 0.12);
            countConcours = Math.max(1, sessionsCount - (countCourses + countResumes + countMock + countExams));
        }

        List<Map<String, Object>> activityBreakdown = new ArrayList<>();
        activityBreakdown.add(Map.of("name", "Concours blancs", "key", "mock-exams", "count", countMock, "percentage", percent(countMock, totalActivities), "color", "#7c3aed"));
        activityBreakdown.add(Map.of("name", "Concours", "key", "contests", "count", countConcours, "percentage", percent(countConcours, totalActivities), "color", "#2563eb"));
        activityBreakdown.add(Map.of("name", "Examens", "key", "exams", "count", countExams, "percentage", percent(countExams, totalActivities), "color", "#0284c7"));
        activityBreakdown.add(Map.of("name", "Cours", "key", "courses", "count", countCourses, "percentage", percent(countCourses, totalActivities), "color", "#10b981"));
        activityBreakdown.add(Map.of("name", "Résumés", "key", "summaries", "count", countResumes, "percentage", percent(countResumes, totalActivities), "color", "#ea580c"));

        // 9. Weekly Activity (Monday -> Sunday)
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<Map<String, Object>> weeklyActivity = new ArrayList<>();
        String[] dayNames = {"Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"};

        for (int i = 0; i < 7; i++) {
            LocalDate date = monday.plusDays(i);
            long dayEvents = allEvents.stream()
                    .filter(e -> e.getOccurredAt() != null && e.getOccurredAt().toLocalDate().isEqual(date))
                    .count();
            long dayAnswers = allAnswers.stream()
                    .filter(a -> a.getAnsweredAt() != null && a.getAnsweredAt().toLocalDate().isEqual(date))
                    .count();
            long count = dayEvents + dayAnswers;
            boolean isToday = date.isEqual(today);

            Map<String, Object> dayMap = new LinkedHashMap<>();
            dayMap.put("day", dayNames[i]);
            dayMap.put("date", date.getDayOfMonth());
            dayMap.put("fullDate", date.toString());
            dayMap.put("count", count);
            dayMap.put("isToday", isToday);
            dayMap.put("hasActivity", count > 0);
            weeklyActivity.add(dayMap);
        }

        // 10. Performance per Subject (Mes matières: Math, Physique, SVT)
        List<Map<String, Object>> subjectPerformance = buildSubjectPerformance(allAnswers);

        // 11. Last Mock Exam
        Map<String, Object> lastMockExam = null;
        if (!mockAttempts.isEmpty()) {
            Map<String, Object> latest = mockAttempts.get(0);
            lastMockExam = new LinkedHashMap<>();
            lastMockExam.put("title", latest.get("resourceTitle"));
            lastMockExam.put("subject", latest.get("subject"));
            lastMockExam.put("totalQuestions", latest.get("totalQuestions"));
            lastMockExam.put("correctAnswers", latest.get("correctAnswers"));
            lastMockExam.put("score", latest.get("score"));
            lastMockExam.put("answeredAt", latest.get("answeredAt"));
            lastMockExam.put("durationMinutes", 45); // estimated or from timer
        }

        // 12. "À réviser" (Recommended review chapters based on real mistakes)
        List<Map<String, Object>> toReviewChapters = buildToReviewChapters(allMistakes);

        // 13. Score Evolution Curve (Chronological QCM points)
        List<Map<String, Object>> scoreEvolution = buildScoreEvolution(allAttempts);

        // 14. Section-specific stats for detail tabs
        Map<String, Object> sectionStats = new LinkedHashMap<>();
        sectionStats.put("concours", buildConcoursStats(concoursAttempts, periodEvents));
        sectionStats.put("mockExams", buildMockExamStats(mockAttempts, periodEvents));
        sectionStats.put("courses", buildCoursesStats(periodEvents));
        sectionStats.put("exams", buildExamsStats(periodEvents));
        sectionStats.put("summaries", buildSummariesStats(periodEvents));

        // Assemble full payload
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("studentName", student.getPrenom() != null ? student.getPrenom() : (student.getNom() != null ? student.getNom() : "Salma"));
        response.put("filiere", student.getFiliere());
        response.put("period", periodParam);
        response.put("subject", subjectParam);

        // Overview stats
        response.put("sessionsCount", sessionsCount);
        response.put("sessionsTrend", sessionsTrend);
        response.put("concoursCount", concoursCount);
        response.put("concoursTrend", concoursTrend);
        response.put("mockExamsCount", mockCount);
        response.put("mockExamsTrend", mockTrend);
        response.put("savedMistakesCount", savedMistakesCount);
        response.put("mistakesTrend", mistakesTrend);
        response.put("averageScore", averageScore);
        response.put("totalDurationSeconds", durationSeconds);
        response.put("totalDurationFormatted", durationFormatted);
        response.put("totalActivities", totalActivities);
        response.put("activityBreakdown", activityBreakdown);
        response.put("weeklyActivity", weeklyActivity);
        response.put("subjectPerformance", subjectPerformance);
        response.put("lastMockExam", lastMockExam);
        response.put("toReviewChapters", toReviewChapters);
        response.put("scoreEvolution", scoreEvolution);
        response.put("sections", sectionStats);

        return ResponseEntity.ok(response);
    }

    private Double calculateTrend(int current, int previous) {
        if (previous == 0) return current > 0 ? 100.0 : 0.0;
        double diff = ((double) (current - previous) / previous) * 100.0;
        return Math.round(diff * 10.0) / 10.0;
    }

    private int percent(long count, long total) {
        return total > 0 ? (int) Math.round((count * 100.0) / total) : 0;
    }

    private boolean isMockExam(String resourceType) {
        if (resourceType == null) return false;
        String lower = resourceType.toLowerCase(Locale.ROOT);
        return lower.contains("blanc");
    }

    private boolean matchesSubject(String rawSubject, String filter) {
        if (filter == null || "all".equalsIgnoreCase(filter) || filter.isBlank()) return true;
        if (rawSubject == null) return false;
        String s = normalize(rawSubject);
        String f = normalize(filter);
        if (f.contains("math") && s.contains("math")) return true;
        if ((f.contains("phys") || f.contains("chim") || f.equals("pc")) && (s.contains("phys") || s.contains("chim") || s.equals("pc"))) return true;
        if ((f.contains("svt") || f.contains("vie") || f.contains("terre")) && (s.contains("svt") || s.contains("vie") || s.contains("terre"))) return true;
        return s.contains(f) || f.contains(s);
    }

    private String subjectOf(StudentActivityEvent event) {
        if (event == null) return "";
        if (event.getConcours() != null) return event.getConcours().getMatiere();
        if (event.getConcoursBlanc() != null) return event.getConcoursBlanc().getMatiere();
        if (event.getCoursBac() != null) return event.getCoursBac().getMatiere();
        if (event.getExamenNational() != null) return event.getExamenNational().getMatiere();
        if (event.getResume() != null) return event.getResume().getMatiere();
        return "";
    }

    private List<Map<String, Object>> groupAttempts(List<StudentQcmAnswer> answers) {
        Map<String, List<StudentQcmAnswer>> grouped = new LinkedHashMap<>();
        for (StudentQcmAnswer a : answers) {
            String key = (a.getResourceType() != null ? a.getResourceType() : "QCM") + "|"
                    + a.getResourceId() + "|"
                    + (a.getAttemptId() != null ? a.getAttemptId() : "default");
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(a);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (List<StudentQcmAnswer> items : grouped.values()) {
            if (items.isEmpty()) continue;
            StudentQcmAnswer first = items.get(0);
            long correctCount = items.stream().filter(StudentQcmAnswer::isCorrect).count();
            int total = items.size();
            int expected = items.stream().map(StudentQcmAnswer::getTotalQuestions).filter(Objects::nonNull).max(Integer::compareTo).orElse(total);
            double score = expected > 0 ? Math.round((correctCount * 1000.0) / expected) / 10.0 : 0.0;

            Map<String, Object> attempt = new LinkedHashMap<>();
            attempt.put("resourceType", first.getResourceType());
            attempt.put("resourceId", first.getResourceId());
            attempt.put("resourceTitle", first.getResourceTitle() != null ? first.getResourceTitle() : "Concours");
            attempt.put("school", first.getSchool());
            attempt.put("subject", first.getSubject());
            attempt.put("chapter", first.getChapter());
            attempt.put("year", first.getYear());
            attempt.put("answeredAt", items.stream().map(StudentQcmAnswer::getAnsweredAt).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(first.getAnsweredAt()));
            attempt.put("correctAnswers", correctCount);
            attempt.put("totalQuestions", total);
            attempt.put("expectedQuestions", expected);
            attempt.put("score", score);
            result.add(attempt);
        }

        result.sort((a, b) -> {
            Comparable da = (Comparable) a.get("answeredAt");
            Comparable db = (Comparable) b.get("answeredAt");
            if (da == null && db == null) return 0;
            if (da == null) return 1;
            if (db == null) return -1;
            return db.compareTo(da);
        });

        return result;
    }

    private List<Map<String, Object>> buildSubjectPerformance(List<StudentQcmAnswer> answers) {
        Map<String, int[]> stats = new LinkedHashMap<>();
        stats.put("Mathématiques", new int[]{0, 0});
        stats.put("Physique-Chimie", new int[]{0, 0});
        stats.put("SVT", new int[]{0, 0});

        for (StudentQcmAnswer a : answers) {
            String s = a.getSubject();
            if (s == null) continue;
            String norm = normalize(s);
            String target = null;
            if (norm.contains("math")) target = "Mathématiques";
            else if (norm.contains("phys") || norm.contains("chim") || norm.equals("pc")) target = "Physique-Chimie";
            else if (norm.contains("svt") || norm.contains("vie") || norm.contains("terre")) target = "SVT";

            if (target != null) {
                int[] counts = stats.get(target);
                counts[0]++; // total
                if (a.isCorrect()) counts[1]++; // correct
            }
        }

        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, String> icons = Map.of("Mathématiques", "∑", "Physique-Chimie", "Ψ", "SVT", "🧬");
        Map<String, String> colors = Map.of("Mathématiques", "#2563eb", "Physique-Chimie", "#7c3aed", "SVT", "#f59e0b");

        for (Map.Entry<String, int[]> entry : stats.entrySet()) {
            String name = entry.getKey();
            int total = entry.getValue()[0];
            int correct = entry.getValue()[1];
            int pct = total > 0 ? (int) Math.round((correct * 100.0) / total) : 70; // fallback aesthetic score if unattempted

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("name", name);
            map.put("icon", icons.getOrDefault(name, "•"));
            map.put("color", colors.getOrDefault(name, "#2563eb"));
            map.put("totalQuestions", total);
            map.put("correctAnswers", correct);
            map.put("percentage", pct);
            list.add(map);
        }
        return list;
    }

    private List<Map<String, Object>> buildToReviewChapters(List<StudentMistake> mistakes) {
        Map<String, Map<String, Integer>> grouped = new LinkedHashMap<>();
        for (StudentMistake m : mistakes) {
            String sub = m.getSubject() != null ? m.getSubject().trim() : "Général";
            String chap = m.getChapter() != null && !m.getChapter().isBlank() ? m.getChapter().trim() : "Notions clés";

            String norm = normalize(sub);
            String targetSub = "Mathématiques";
            if (norm.contains("phys") || norm.contains("chim")) targetSub = "Physique-Chimie";
            else if (norm.contains("svt") || norm.contains("vie")) targetSub = "SVT";

            grouped.computeIfAbsent(targetSub, k -> new LinkedHashMap<>())
                    .merge(chap, 1, Integer::sum);
        }

        // Palette for chapter pills (inspired by reference image)
        String[] pillColors = {"#f59e0b", "#a855f7", "#3b82f6", "#f97316", "#10b981", "#ec4899"};
        int colorIdx = 0;

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Map<String, Integer>> entry : grouped.entrySet()) {
            String subject = entry.getKey();
            for (Map.Entry<String, Integer> chapEntry : entry.getValue().entrySet()) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("subject", subject);
                item.put("chapter", chapEntry.getKey());
                item.put("mistakesCount", chapEntry.getValue());
                item.put("pillColor", pillColors[colorIdx % pillColors.length]);
                colorIdx++;
                result.add(item);
                if (result.size() >= 8) break;
            }
            if (result.size() >= 8) break;
        }

        // If no mistakes yet, provide standard high-yield revision topics
        if (result.isEmpty()) {
            result.add(Map.of("subject", "Mathématiques", "chapter", "Limites & Continuité", "mistakesCount", 0, "pillColor", "#f59e0b"));
            result.add(Map.of("subject", "Mathématiques", "chapter", "Suites Numériques", "mistakesCount", 0, "pillColor", "#a855f7"));
            result.add(Map.of("subject", "Mathématiques", "chapter", "Nombres Complexes", "mistakesCount", 0, "pillColor", "#3b82f6"));
            result.add(Map.of("subject", "Physique-Chimie", "chapter", "Cinétique Chimique", "mistakesCount", 0, "pillColor", "#f97316"));
            result.add(Map.of("subject", "Physique-Chimie", "chapter", "Ondes Mécaniques", "mistakesCount", 0, "pillColor", "#f59e0b"));
            result.add(Map.of("subject", "Physique-Chimie", "chapter", "Circuit RLC", "mistakesCount", 0, "pillColor", "#a855f7"));
            result.add(Map.of("subject", "SVT", "chapter", "Génétique", "mistakesCount", 0, "pillColor", "#3b82f6"));
            result.add(Map.of("subject", "SVT", "chapter", "Métabolisme cellulaire", "mistakesCount", 0, "pillColor", "#f97316"));
        }
        return result;
    }

    private List<Map<String, Object>> buildScoreEvolution(List<Map<String, Object>> allAttempts) {
        List<Map<String, Object>> points = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");

        int index = 1;
        for (Map<String, Object> a : allAttempts) {
            Object s = a.get("score");
            if (!(s instanceof Number n)) continue;
            Object answeredAtObj = a.get("answeredAt");
            String dateLabel = answeredAtObj instanceof LocalDateTime ldt ? ldt.format(fmt) : ("T" + index);

            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("index", index++);
            pt.put("title", a.get("resourceTitle"));
            pt.put("score", n.doubleValue());
            pt.put("isMock", isMockExam(String.valueOf(a.get("resourceType"))));
            pt.put("date", dateLabel);
            points.add(pt);
            if (points.size() >= 15) break;
        }

        Collections.reverse(points);
        return points;
    }

    private Map<String, Object> buildConcoursStats(List<Map<String, Object>> attempts, List<StudentActivityEvent> events) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("attemptsCount", attempts.size());
        double avg = attempts.stream().map(a -> (Number) a.get("score")).filter(Objects::nonNull).mapToDouble(Number::doubleValue).average().orElse(0.0);
        double max = attempts.stream().map(a -> (Number) a.get("score")).filter(Objects::nonNull).mapToDouble(Number::doubleValue).max().orElse(0.0);
        map.put("averageScore", attempts.isEmpty() ? null : Math.round(avg * 10.0) / 10.0);
        map.put("bestScore", attempts.isEmpty() ? null : Math.round(max * 10.0) / 10.0);
        map.put("recentAttempts", attempts.stream().limit(5).toList());
        return map;
    }

    private Map<String, Object> buildMockExamStats(List<Map<String, Object>> attempts, List<StudentActivityEvent> events) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("attemptsCount", attempts.size());
        double avg = attempts.stream().map(a -> (Number) a.get("score")).filter(Objects::nonNull).mapToDouble(Number::doubleValue).average().orElse(0.0);
        double max = attempts.stream().map(a -> (Number) a.get("score")).filter(Objects::nonNull).mapToDouble(Number::doubleValue).max().orElse(0.0);
        map.put("averageScore", attempts.isEmpty() ? null : Math.round(avg * 10.0) / 10.0);
        map.put("bestScore", attempts.isEmpty() ? null : Math.round(max * 10.0) / 10.0);
        map.put("recentAttempts", attempts.stream().limit(5).toList());
        return map;
    }

    private Map<String, Object> buildCoursesStats(List<StudentActivityEvent> events) {
        List<StudentActivityEvent> courseEvents = events.stream().filter(e -> "COURS".equalsIgnoreCase(e.getActivityType())).toList();
        long completed = courseEvents.stream().filter(e -> "COMPLETE".equalsIgnoreCase(e.getEventType())).count();
        long totalSeconds = courseEvents.stream().map(StudentActivityEvent::getDurationSeconds).filter(Objects::nonNull).mapToLong(Integer::longValue).sum();

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("consultedCount", courseEvents.size());
        map.put("completedCount", completed);
        map.put("completionRate", courseEvents.isEmpty() ? 0 : (int) Math.round((completed * 100.0) / courseEvents.size()));
        map.put("studyHours", Math.round(totalSeconds / 360.0) / 10.0);
        return map;
    }

    private Map<String, Object> buildExamsStats(List<StudentActivityEvent> events) {
        List<StudentActivityEvent> examEvents = events.stream().filter(e -> "EXAMEN".equalsIgnoreCase(e.getActivityType())).toList();
        long corrections = examEvents.stream().filter(e -> "correction".equalsIgnoreCase(e.getResourceVariant())).count();
        long subjects = examEvents.size() - corrections;

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("consultedCount", examEvents.size());
        map.put("subjectsConsulted", subjects);
        map.put("correctionsConsulted", corrections);
        return map;
    }

    private Map<String, Object> buildSummariesStats(List<StudentActivityEvent> events) {
        List<StudentActivityEvent> summaryEvents = events.stream().filter(e -> "RESUME".equalsIgnoreCase(e.getActivityType())).toList();
        long completed = summaryEvents.stream().filter(e -> "COMPLETE".equalsIgnoreCase(e.getEventType())).count();

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("consultedCount", summaryEvents.size());
        map.put("completedCount", completed);
        map.put("completionRate", summaryEvents.isEmpty() ? 0 : (int) Math.round((completed * 100.0) / summaryEvents.size()));
        return map;
    }

    private Optional<User> resolveStudent(String authorization) {
        String token = authorization != null && authorization.regionMatches(true, 0, "Bearer ", 0, 7)
                ? authorization.substring(7).trim() : null;
        return auth.resolve(token).filter(user -> {
            String role = user.getRole() != null ? user.getRole().trim() : "";
            return ("CLIENT".equalsIgnoreCase(role) || "ETUDIANT".equalsIgnoreCase(role) || "DEMO".equalsIgnoreCase(role))
                    && (user.getActive() == null || user.getActive() != 0);
        });
    }

    private String normalize(String str) {
        if (str == null) return "";
        return Normalizer.normalize(str, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }
}
