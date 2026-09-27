package com.bhagavadgita.api.service;

import com.bhagavadgita.api.dto.ChapterDetailDTO;
import com.bhagavadgita.api.dto.ChapterSummaryDTO;
import com.bhagavadgita.api.dto.VerseDTO;
import com.bhagavadgita.api.entity.Chapter;
import com.bhagavadgita.api.exception.ResourceNotFoundException;
import com.bhagavadgita.api.repository.ChapterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final VerseService verseService;

    @Transactional(readOnly = true)
    @Cacheable("chapters-summary")
    public List<ChapterSummaryDTO> getAllChaptersSummary() {
        return chapterRepository.findAllByOrderByChapterNumberAsc().stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "chapter-detail", key = "#chapterNumber")
    public ChapterDetailDTO getChapterDetail(Integer chapterNumber) {
        Chapter chapter = chapterRepository.findById(chapterNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Chapter not found: " + chapterNumber));

        List<VerseDTO> verses = verseService.getVersesByChapter(chapterNumber);

        return ChapterDetailDTO.builder()
                .chapterNumber(chapter.getChapterNumber())
                .title(chapter.getTitle())
                .subtitle(chapter.getSubtitle())
                .sanskritName(chapter.getSanskritName())
                .transliterated(chapter.getTransliterated())
                .theme(chapter.getTheme())
                .verseCount(chapter.getVerseCount())
                .color(chapter.getColor())
                .summaryEn(chapter.getSummaryEn())
                .summaryHi(chapter.getSummaryHi())
                .verses(verses)
                .build();
    }

    private ChapterSummaryDTO toSummaryDTO(Chapter c) {
        return ChapterSummaryDTO.builder()
                .chapterNumber(c.getChapterNumber())
                .title(c.getTitle())
                .subtitle(c.getSubtitle())
                .sanskritName(c.getSanskritName())
                .transliterated(c.getTransliterated())
                .theme(c.getTheme())
                .verseCount(c.getVerseCount())
                .color(c.getColor())
                .summaryEn(c.getSummaryEn())
                .summaryHi(c.getSummaryHi())
                .build();
    }
}
