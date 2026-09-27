package com.bhagavadgita.api.service;

import com.bhagavadgita.api.dto.DailyVerseDTO;
import com.bhagavadgita.api.dto.VerseDTO;
import com.bhagavadgita.api.entity.Explanation;
import com.bhagavadgita.api.entity.Translation;
import com.bhagavadgita.api.entity.Verse;
import com.bhagavadgita.api.exception.ResourceNotFoundException;
import com.bhagavadgita.api.repository.VerseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VerseService {

    private final VerseRepository verseRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "verse-single", key = "#chapterNumber + '-' + #verseNumber")
    public VerseDTO getVerse(Integer chapterNumber, Integer verseNumber) {
        Verse verse = verseRepository.findWithDetailsByChapter_ChapterNumberAndVerseNumber(chapterNumber, verseNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Verse not found: Chapter " + chapterNumber + ", Verse " + verseNumber));
        return toDTO(verse);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "chapter-verses", key = "#chapterNumber")
    public List<VerseDTO> getVersesByChapter(Integer chapterNumber) {
        return verseRepository.findByChapter_ChapterNumberOrderByVerseNumberAsc(chapterNumber).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<VerseDTO> getVersesByChapterPaginated(Integer chapterNumber, Pageable pageable) {
        return verseRepository.findByChapter_ChapterNumberOrderByVerseNumberAsc(chapterNumber, pageable)
                .map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<VerseDTO> searchVerses(String query, Pageable pageable) {
        if (query == null || query.trim().isEmpty()) {
            return Page.empty(pageable);
        }
        return verseRepository.searchVerses(query.trim(), pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "daily-verse", key = "T(java.time.LocalDate).now().toString()")
    public DailyVerseDTO getDailyVerse() {
        LocalDate today = LocalDate.now();
        long totalCount = verseRepository.countTotalVerses();
        if (totalCount == 0) {
            throw new ResourceNotFoundException("No scripture data found");
        }

        // Deterministic daily index: day of year % total verses
        long targetId = (today.getDayOfYear() % totalCount) + 1;
        Verse verse = verseRepository.findWithDetailsById(targetId)
                .or(() -> verseRepository.findWithDetailsByChapter_ChapterNumberAndVerseNumber(2, 47))
                .orElseThrow(() -> new ResourceNotFoundException("Daily verse not found"));

        return DailyVerseDTO.builder()
                .date(today)
                .verse(toDTO(verse))
                .contemplationPrompt("Reflect today: How can you apply this sacred wisdom to remain equanimous in your daily work?")
                .build();
    }

    public VerseDTO toDTO(Verse verse) {
        Map<String, String> translations = new HashMap<>();
        if (verse.getTranslations() != null) {
            for (Translation t : verse.getTranslations()) {
                translations.put(t.getLanguage().equalsIgnoreCase("hi") ? "hindi" : "english", t.getTranslationText());
            }
        }

        Map<String, String> explanations = new HashMap<>();
        if (verse.getExplanations() != null) {
            for (Explanation e : verse.getExplanations()) {
                explanations.put(e.getLanguage().equalsIgnoreCase("hi") ? "hindi" : "english", e.getExplanationText());
            }
        }

        return VerseDTO.builder()
                .id(verse.getId())
                .chapterNumber(verse.getChapter() != null ? verse.getChapter().getChapterNumber() : null)
                .verseNumber(verse.getVerseNumber())
                .sanskrit(verse.getSanskrit())
                .transliteration(verse.getTransliteration())
                .wordMeanings(verse.getWordMeanings())
                .translation(translations)
                .explanation(explanations)
                .keywords(verse.getKeywords())
                .build();
    }
}
