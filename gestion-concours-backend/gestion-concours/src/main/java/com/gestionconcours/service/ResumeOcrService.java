package com.gestionconcours.service;

import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.File;

@Service
@RequiredArgsConstructor
public class ResumeOcrService {

    private final AiTextCleanerService aiTextCleanerService;

    public String extractText(File pdfFile) {
        StringBuilder extractedText = new StringBuilder();

        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            Tesseract tesseract = new Tesseract();
            // مسار ملفات اللغة في جهازك
            tesseract.setDatapath("C:/Program Files/Tesseract-OCR/tessdata");
            // قراءة بالفرنسية والإنجليزية (أو أضف لغات أخرى إذا احتجت)
            tesseract.setLanguage("fra+eng");

            PDFRenderer pdfRenderer = new PDFRenderer(document);
            
            // ÉTAPE 1: Extraction du texte brut via PDFBox / Tesseract OCR
            for (int page = 0; page < document.getNumberOfPages(); page++) {
                BufferedImage image = pdfRenderer.renderImageWithDPI(page, 300);
                String pageResult = tesseract.doOCR(image);
                extractedText.append(pageResult).append("\n");
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "Erreur lors de l'extraction du texte du PDF : " + e.getMessage();
        }

        String rawText = extractedText.toString().trim();
        if (rawText.isEmpty()) {
            return "Aucun texte n'a pu être extrait de ce PDF.";
        }

        // ÉTAPE 2: Traitement par IA avec injection du Prompt spécialisé LaTeX/Maths
        return aiTextCleanerService.cleanAndFormatWithAi(rawText);
    }

    public String formatAndCleanLatex(String text) {
        if (text == null) return "";

        return text
                // Limites et infini
                .replaceAll("(?i)n\\s*—\\s*\\+?00", "\\$n \\\\to +\\\\infty\\$")
                .replaceAll("(?i)n\\s*->\\s*\\+?00", "\\$n \\\\to +\\\\infty\\$")
                .replaceAll("(?i)lim\\s*U,", "\\$\\\\lim_{n \\\\to +\\\\infty} U_n\\$")
                .replaceAll("(?i)lim\\s*V,", "\\$\\\\lim_{n \\\\to +\\\\infty} V_n\\$")
                // Formules de suites
                .replaceAll("Un\\s*\\+\\s*Un\\+2\\s*=\\s*2Un\\+1", "\\$U_n + U_{n+2} = 2U_{n+1}\\$")
                .replaceAll("Un\\+1\\s*=\\s*f\\(Un\\)", "\\$U_{n+1} = f(U_n)\\$")
                .replaceAll("f\\(x\\)\\s*=\\s*x", "\\$f(x) = x\\$")
                .replaceAll("\n{3,}", "\n\n");
    }
}