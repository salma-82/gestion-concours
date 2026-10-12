package com.gestionconcours.service;

import com.gestionconcours.model.ConcoursBlanc;
import com.gestionconcours.model.QcmChoice;
import com.gestionconcours.model.QcmQuestion;
import com.gestionconcours.repository.QcmQuestionRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service d'extraction automatique de questions QCM à partir de fichiers PDF et HTML.
 * Supporte les formats courants des concours marocains :
 *   - Numérotation: 1) 2) 3) ou 1. 2. 3. ou Q1: Q2: etc.
 *   - Choix: A) B) C) D) ou a) b) c) d) ou A. B. C. D.
 */
@Service
public class PdfQcmExtractorService {

    private final QcmQuestionRepository qcmQuestionRepository;

    public PdfQcmExtractorService(QcmQuestionRepository qcmQuestionRepository) {
        this.qcmQuestionRepository = qcmQuestionRepository;
    }

    /**
     * Extrait les questions QCM d'un fichier PDF et les sauvegarde en base.
     *
     * @param pdfFile       Le fichier PDF source
     * @param concoursBlanc L'entité ConcoursBlanc associée
     * @return Le nombre de questions extraites
     */
    public int extractAndSaveQuestions(File pdfFile, ConcoursBlanc concoursBlanc) throws IOException {
        String fullText = extractTextFromPdf(pdfFile);

        if (fullText == null || fullText.trim().isEmpty()) {
            System.err.println("[QCM Extractor] Aucun texte extractible du PDF: " + pdfFile.getName());
            return 0;
        }

        List<QcmQuestion> questions = parseQcmQuestions(fullText, concoursBlanc);

        if (!questions.isEmpty()) {
            qcmQuestionRepository.saveAll(questions);
        }

        System.out.println("[QCM Extractor] " + questions.size() + " questions extraites du PDF: " + pdfFile.getName());
        return questions.size();
    }

    /**
     * Extrait les questions QCM d'un fichier HTML et les sauvegarde en base.
     *
     * @param htmlFile      Le fichier HTML source
     * @param concoursBlanc L'entité ConcoursBlanc associée
     * @return Le nombre de questions extraites
     */
    public int extractAndSaveQuestionsFromHtml(File htmlFile, ConcoursBlanc concoursBlanc) throws IOException {
        String html = Files.readString(htmlFile.toPath());
        if (html == null || html.trim().isEmpty()) {
            System.err.println("[QCM Extractor] Aucun texte dans le fichier HTML: " + htmlFile.getName());
            return 0;
        }

        // Nettoyer les balises HTML tout en préservant la structure par saut de ligne
        String text = html.replaceAll("(?i)<br\\s*/?>", "\n")
                          .replaceAll("(?i)</?(p|div|li|tr|h[1-6])[^>]*>", "\n")
                          .replaceAll("<[^>]*>", " ")
                          .replaceAll("&nbsp;", " ")
                          .replaceAll("&amp;", "&")
                          .replaceAll("&lt;", "<")
                          .replaceAll("&gt;", ">");

        List<QcmQuestion> questions = parseQcmQuestions(text, concoursBlanc);

        if (!questions.isEmpty()) {
            qcmQuestionRepository.saveAll(questions);
        }

        System.out.println("[QCM Extractor] " + questions.size() + " questions extraites du HTML: " + htmlFile.getName());
        return questions.size();
    }

    /**
     * Extrait le texte brut d'un fichier PDF via PDFBox.
     */
    private String extractTextFromPdf(File pdfFile) throws IOException {
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        }
    }

    /**
     * Parse le texte brut pour détecter les questions QCM et leurs choix.
     * Supporte plusieurs formats de numérotation et de choix.
     */
    private List<QcmQuestion> parseQcmQuestions(String text, ConcoursBlanc concoursBlanc) {
        List<QcmQuestion> questions = new ArrayList<>();

        // Normaliser les retours à la ligne
        text = text.replace("\r\n", "\n").replace("\r", "\n");

        // Pattern pour détecter le début d'une question
        // Supporte: "1)", "1.", "1-", "Q1)", "Q1.", "Q1:", "Question 1:", "1/", etc.
        Pattern questionPattern = Pattern.compile(
            "(?:^|\\n)\\s*(?:(?:Q(?:uestion)?\\s*)?)(\\d{1,3})\\s*[).:\\-/]\\s*(.+?)(?=\\n\\s*(?:(?:Q(?:uestion)?\\s*)?\\d{1,3}\\s*[).:\\-/])|$)",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE
        );

        Matcher questionMatcher = questionPattern.matcher(text);

        while (questionMatcher.find()) {
            String questionNum = questionMatcher.group(1);
            String questionBlock = questionMatcher.group(2).trim();

            // Séparer l'énoncé des choix dans le bloc de la question
            List<QcmChoice> choices = new ArrayList<>();
            String questionText = extractChoicesFromBlock(questionBlock, choices);

            // On ne crée la question que si elle a au moins 2 choix (c'est un vrai QCM)
            if (choices.size() >= 2 && questionText != null && !questionText.trim().isEmpty()) {
                QcmQuestion question = new QcmQuestion();
                question.setConcoursBlanc(concoursBlanc);
                question.setQuestionNumber(Integer.parseInt(questionNum));
                question.setQuestionText(questionText.trim());

                // Lier les choix à la question
                for (QcmChoice choice : choices) {
                    choice.setQuestion(question);
                }
                question.setChoices(choices);

                // Détecter si la réponse est indiquée directement dans le bloc (ex: Réponse : B ou Corrigé: C)
                Pattern ansPat = Pattern.compile("(?i)(?:r[ée]ponse|corrig[ée]|bonne\\s+r[ée]ponse|solution)\\s*[:=\\-]\\s*([A-Fa-f])");
                Matcher ansMat = ansPat.matcher(questionBlock);
                if (ansMat.find()) {
                    question.setCorrectChoiceLabel(ansMat.group(1).toUpperCase());
                }

                // Détecter si une explication est présente (ex: Explication : ...)
                Pattern expPat = Pattern.compile("(?i)(?:explication|justification)\\s*[:=\\-]\\s*([^\n\r]+)");
                Matcher expMat = expPat.matcher(questionBlock);
                if (expMat.find()) {
                    question.setExplanation(expMat.group(1).trim());
                }

                questions.add(question);
            }
        }

        // Si le pattern principal ne détecte rien, essayer un pattern alternatif plus souple
        if (questions.isEmpty()) {
            questions = parseQcmQuestionsAlternative(text, concoursBlanc);
        }

        // Détection éventuelle d'une grille de correction globale à la fin du document (ex: Corrigé : 1-A, 2-B, 3-C...)
        detectAndApplyGridCorrection(text, questions);

        return questions;
    }

    /**
     * Recherche une grille de correction globale à la fin du document (ex: "Corrigé : 1-A 2-B 3-C")
     * et l'applique aux questions qui n'ont pas encore de corrigé.
     */
    private void detectAndApplyGridCorrection(String text, List<QcmQuestion> questions) {
        if (questions.isEmpty()) return;
        Pattern gridHeaderPattern = Pattern.compile("(?i)(?:corrig[ée]|grille\\s+de\\s+r[ée]ponses?|solutions?)\\s*[:\\n](.+)$", Pattern.DOTALL);
        Matcher gridHeaderMatcher = gridHeaderPattern.matcher(text);
        if (gridHeaderMatcher.find()) {
            String gridText = gridHeaderMatcher.group(1);
            Pattern itemPattern = Pattern.compile("(?:Q(?:uestion)?\\s*)?(\\d{1,3})\\s*[:\\-.)= ]\\s*([A-Fa-f])\\b");
            Matcher itemMatcher = itemPattern.matcher(gridText);
            while (itemMatcher.find()) {
                try {
                    int qNum = Integer.parseInt(itemMatcher.group(1));
                    String ans = itemMatcher.group(2).toUpperCase();
                    for (QcmQuestion q : questions) {
                        if (q.getQuestionNumber() != null && q.getQuestionNumber() == qNum && q.getCorrectChoiceLabel() == null) {
                            q.setCorrectChoiceLabel(ans);
                        }
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
    }

    /**
     * Pattern alternatif : cherche des blocs contenant des choix A/B/C/D
     * sans numérotation stricte des questions.
     */
    private List<QcmQuestion> parseQcmQuestionsAlternative(String text, ConcoursBlanc concoursBlanc) {
        List<QcmQuestion> questions = new ArrayList<>();

        // Découper le texte en lignes
        String[] lines = text.split("\\n");
        StringBuilder currentBlock = new StringBuilder();
        int questionCount = 0;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) {
                // Traiter le bloc accumulé s'il contient des choix
                if (currentBlock.length() > 0) {
                    QcmQuestion q = tryParseBlock(currentBlock.toString(), concoursBlanc, ++questionCount);
                    if (q != null) {
                        questions.add(q);
                    } else {
                        questionCount--; // Pas une vraie question, on décrémente
                    }
                    currentBlock = new StringBuilder();
                }
                continue;
            }
            currentBlock.append(line).append("\n");
        }

        // Traiter le dernier bloc
        if (currentBlock.length() > 0) {
            QcmQuestion q = tryParseBlock(currentBlock.toString(), concoursBlanc, ++questionCount);
            if (q != null) {
                questions.add(q);
            }
        }

        return questions;
    }

    /**
     * Essaye de parser un bloc de texte comme une question QCM.
     */
    private QcmQuestion tryParseBlock(String block, ConcoursBlanc concoursBlanc, int questionNumber) {
        List<QcmChoice> choices = new ArrayList<>();
        String questionText = extractChoicesFromBlock(block, choices);

        if (choices.size() >= 2 && questionText != null && !questionText.trim().isEmpty()
                && questionText.trim().length() > 5) {
            QcmQuestion question = new QcmQuestion();
            question.setConcoursBlanc(concoursBlanc);
            question.setQuestionNumber(questionNumber);

            // Nettoyer le numéro de question du début s'il existe
            String cleanedText = questionText.trim().replaceFirst("^(?:Q(?:uestion)?\\s*)?\\d{1,3}\\s*[).:\\-/]\\s*", "");
            question.setQuestionText(cleanedText.isEmpty() ? questionText.trim() : cleanedText);

            for (QcmChoice choice : choices) {
                choice.setQuestion(question);
            }
            question.setChoices(choices);

            return question;
        }

        return null;
    }

    /**
     * Extrait les choix (A/B/C/D) d'un bloc de texte et retourne l'énoncé de la question.
     * Supporte: "A)", "a)", "A.", "a.", "A-", "A :", etc.
     */
    private String extractChoicesFromBlock(String block, List<QcmChoice> choices) {
        // Pattern pour détecter les choix de réponse
        // Supporte: A) texte, a) texte, A. texte, A- texte, A : texte
        Pattern choicePattern = Pattern.compile(
            "(?:^|\\n)\\s*([A-Fa-f])\\s*[).:\\-]\\s*(.+?)(?=\\n\\s*[A-Fa-f]\\s*[).:\\-]|$)",
            Pattern.DOTALL
        );

        Matcher choiceMatcher = choicePattern.matcher(block);

        int firstChoiceStart = -1;

        while (choiceMatcher.find()) {
            if (firstChoiceStart == -1) {
                firstChoiceStart = choiceMatcher.start();
            }

            String label = choiceMatcher.group(1).toUpperCase();
            String text = choiceMatcher.group(2).trim()
                    .replaceAll("\\n\\s*", " ")  // Joindre les lignes qui font partie du même choix
                    .replaceAll("\\s+", " ");     // Normaliser les espaces

            QcmChoice choice = new QcmChoice();
            choice.setChoiceLabel(label);
            choice.setChoiceText(text);
            choices.add(choice);
        }

        // L'énoncé de la question est tout ce qui précède le premier choix
        if (firstChoiceStart > 0) {
            return block.substring(0, firstChoiceStart).trim()
                    .replaceAll("\\n\\s*", " ")
                    .replaceAll("\\s+", " ");
        } else if (firstChoiceStart == 0) {
            // Les choix commencent au début, pas d'énoncé clair
            return null;
        }

        return block.trim();
    }
}
