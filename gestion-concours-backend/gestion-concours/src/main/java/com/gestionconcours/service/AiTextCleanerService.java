package com.gestionconcours.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiTextCleanerService {

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    public String cleanAndFormatWithAi(String rawOcrText) {
        if (rawOcrText == null || rawOcrText.trim().isEmpty()) {
            return "";
        }

        // Si aucune clé API n'est configurée, utiliser le moteur de nettoyage intelligent par règles
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equalsIgnoreCase("demo")) {
            System.out.println("⚠️ Aucune clé OpenAI API trouvée (ou clé 'demo'). Utilisation du moteur de nettoyage LaTeX de secours.");
            return fallbackRuleBasedClean(rawOcrText);
        }

        try {
            System.out.println("🤖 Envoi du texte OCR brut à l'IA pour nettoyage et conversion LaTeX...");

            String systemPrompt = """
                    You are an expert professor and document layout reconstructor. I will provide raw, broken OCR text extracted from a PDF course sheet.
                    Your task is to reconstruct this course into a clean, modern, interactive web-formatted document using Markdown and LaTeX:
                    
                    RULES:
                    1. Fix all OCR errors, typos, missing symbols, and broken words based on the scientific context.
                    2. Convert all mathematical equations and formulas into valid LaTeX ($...$ for inline math and $$...$$ for block math).
                    3. For main section titles (like "1- Suites...", "2- Encadrement..."), format them as Markdown headers with a badge indicator, e.g.:
                       ### BADGE: 1- Title
                    4. Convert any tabular comparisons or property matrices into clean Markdown tables:
                       | Propriété | S. Géométrique | S. Arithmétique |
                       |-----------|----------------|-----------------|
                       | Définition | $U_{n+1} = q U_n$ | $U_{n+1} = U_n + r$ |
                    5. Use bold text, bullet points (- or *), and clean spacing to organize subsections.
                    6. Preserve ALL content, formulas, and explanations without cutting or summarizing.
                    """;

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", rawOcrText));
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.2);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    Map<String, String> message = (Map<String, String>) firstChoice.get("message");
                    if (message != null && message.containsKey("content")) {
                        String aiCleanedText = message.get("content");
                        System.out.println("✅ Correction IA effectuée avec succès !");
                        return aiCleanedText;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'appel à l'API IA : " + e.getMessage() + ". Utilisation du mode de secours.");
        }

        return fallbackRuleBasedClean(rawOcrText);
    }

    private String fallbackRuleBasedClean(String text) {
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
