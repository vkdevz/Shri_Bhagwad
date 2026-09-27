package com.bhagavadgita.api.service;

import com.bhagavadgita.api.dto.ChatRequestDTO;
import com.bhagavadgita.api.dto.ChatResponseDTO;
import com.bhagavadgita.api.dto.VerseDTO;
import com.bhagavadgita.api.entity.Verse;
import com.bhagavadgita.api.repository.VerseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIAdvisorService {

    private final VerseRepository verseRepository;
    private final VerseService verseService;

    @Value("${app.ai.gemini-api-key:}")
    private String geminiApiKey;

    @Value("${app.ai.model:gemini-1.5-flash}")
    private String geminiModel;

    private final RestTemplate restTemplate = new RestTemplate();

    public ChatResponseDTO getGuidance(ChatRequestDTO request) {
        String query = request.getQuery();
        String mood = request.getUserMood() != null ? request.getUserMood() : "seeking guidance";
        String lang = request.getLanguage() != null && request.getLanguage().equalsIgnoreCase("hindi") ? "hindi" : "english";

        // 1. RAG Retrieval: Find top 3 relevant verses
        List<VerseDTO> relevantVerses = retrieveRelevantVerses(query, mood);

        // 2. If Gemini API Key is available, invoke Gemini AI with context grounding
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                return callGeminiAI(query, mood, lang, relevantVerses);
            } catch (Exception ex) {
                log.warn("Gemini API call failed, falling back to rule-grounded response: {}", ex.getMessage());
            }
        }

        // 3. Fallback: Intelligent Grounded Socratic Response
        return buildSocraticFallback(query, mood, lang, relevantVerses);
    }

    private List<VerseDTO> retrieveRelevantVerses(String query, String mood) {
        // Search by query terms first
        Page<Verse> searchResults = verseRepository.searchVerses(query, PageRequest.of(0, 3));
        List<VerseDTO> verses = new ArrayList<>();

        if (searchResults.hasContent()) {
            searchResults.getContent().forEach(v -> verses.add(verseService.toDTO(v)));
        }

        // If fewer than 2 found, add core foundational verses (2.47, 6.35, 18.66)
        if (verses.size() < 2) {
            verseRepository.findWithDetailsByChapter_ChapterNumberAndVerseNumber(2, 47)
                    .ifPresent(v -> verses.add(verseService.toDTO(v)));
            verseRepository.findWithDetailsByChapter_ChapterNumberAndVerseNumber(6, 35)
                    .ifPresent(v -> verses.add(verseService.toDTO(v)));
        }

        return verses.subList(0, Math.min(3, verses.size()));
    }

    private ChatResponseDTO callGeminiAI(String query, String mood, String lang, List<VerseDTO> verses) {
        StringBuilder context = new StringBuilder();
        for (VerseDTO v : verses) {
            context.append(String.format("Chapter %d, Verse %d: %s (Meaning: %s)\n",
                    v.getChapterNumber(), v.getVerseNumber(), v.getSanskrit(),
                    v.getTranslation().getOrDefault(lang, v.getTranslation().get("english"))));
        }

        String prompt = String.format("""
            You are Parthasarathi, Lord Krishna acting as a gentle, wise, and compassionate philosophical counselor on the battlefield of modern life.
            The seeker is currently experiencing: %s.
            Their question: "%s"
            
            Refer to these relevant verses from the Bhagavad Gita:
            %s
            
            Provide structured guidance in %s:
            1. An empathetic acknowledgment of their struggle.
            2. The divine philosophical principle (e.g. Nishkama Karma, Sthitaprajna, Swadharma).
            3. A practical 1-sentence action step they can do right now.
            Keep the tone warm, grounded, sacred, and practical. Keep it concise (under 180 words).
            """, mood, query, context.toString(), lang);

        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, geminiApiKey);

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
        String aiText = extractGeminiResponse(response.getBody());

        return ChatResponseDTO.builder()
                .guidanceTitle("Divine Counsel from Parthasarathi")
                .response(aiText)
                .citedVerses(buildCitedVerses(verses, lang))
                .contemplativeAction("Take three slow deep breaths. Dedicate your next action without anxiety over its outcome.")
                .build();
    }

    @SuppressWarnings("unchecked")
    private String extractGeminiResponse(Map responseBody) {
        if (responseBody == null) return "Reflect deeply upon the verses and act with devotion and clarity.";
        List<Map> candidates = (List<Map>) responseBody.get("candidates");
        if (candidates != null && !candidates.isEmpty()) {
            Map content = (Map) candidates.get(0).get("content");
            if (content != null) {
                List<Map> parts = (List<Map>) content.get("parts");
                if (parts != null && !parts.isEmpty()) {
                    return (String) parts.get(0).get("text");
                }
            }
        }
        return "Focus your mind upon your duty, renouncing attachment to success or failure.";
    }

    private ChatResponseDTO buildSocraticFallback(String query, String mood, String lang, List<VerseDTO> verses) {
        boolean isHindi = "hindi".equalsIgnoreCase(lang);

        String title = isHindi ? "पार्थसारथि का दिव्य संदेश" : "Divine Counsel from Parthasarathi";
        String mainResponse;

        if (isHindi) {
            mainResponse = "हे प्रिय साधक, जीवन का यह कुरुक्षेत्र जब भी व्याकुल करे, याद रखें कि कर्म पर ही आपका अधिकार है, उसके फल पर कभी नहीं। जब आप वर्तमान पल में पूरी निष्ठा से अपना कर्तव्य करते हैं और परिणाम का भय त्याग देते हैं, तो मन तुरंत शांत और स्थिर हो जाता है।";
        } else {
            mainResponse = "O seeker, when the inner battlefield feels overwhelming, remember the supreme truth: your right is to perform your duty with pure intent, never to be burdened by anxiety over the fruits. Release the illusion of control over future outcomes, anchor yourself in the present, and act with an equanimous heart.";
        }

        String action = isHindi
                ? "अभी तीन गहरी सांसें लें और अपने अगले कार्य को फल की चिंता किए बिना पूरी एकाग्रता से करें।"
                : "Pause for three conscious breaths. Anchor in Nishkama Karma: execute your immediate task with 100% effort, surrendering the result.";

        return ChatResponseDTO.builder()
                .guidanceTitle(title)
                .response(mainResponse)
                .citedVerses(buildCitedVerses(verses, lang))
                .contemplativeAction(action)
                .build();
    }

    private List<ChatResponseDTO.VerseReferenceDTO> buildCitedVerses(List<VerseDTO> verses, String lang) {
        List<ChatResponseDTO.VerseReferenceDTO> list = new ArrayList<>();
        for (VerseDTO v : verses) {
            list.add(ChatResponseDTO.VerseReferenceDTO.builder()
                    .chapter(v.getChapterNumber())
                    .verse(v.getVerseNumber())
                    .sanskrit(v.getSanskrit())
                    .translation(v.getTranslation().getOrDefault(lang, v.getTranslation().get("english")))
                    .contextualApplication(String.format("Chapter %d, Verse %d provides direct spiritual grounding for this state.",
                            v.getChapterNumber(), v.getVerseNumber()))
                    .build());
        }
        return list;
    }
}
