package com.bhagavadgita.api.controller;

import com.bhagavadgita.api.dto.DailyVerseDTO;
import com.bhagavadgita.api.dto.VerseDTO;
import com.bhagavadgita.api.service.VerseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/verses")
@RequiredArgsConstructor
@Tag(name = "Verses", description = "Endpoints for fetching verses, daily contemplations, and full-text searching")
public class VerseController {

    private final VerseService verseService;

    @GetMapping("/daily")
    @Operation(summary = "Get daily contemplation verse", description = "Returns today's divine verse rotated deterministically across the 700 verses.")
    public ResponseEntity<DailyVerseDTO> getDailyVerse() {
        return ResponseEntity.ok(verseService.getDailyVerse());
    }

    @GetMapping("/{chapterNumber}/{verseNumber}")
    @Operation(summary = "Get specific verse", description = "Returns full Sanskrit text, transliteration, English & Hindi translations and explanations.")
    public ResponseEntity<VerseDTO> getVerse(
            @PathVariable @Parameter(description = "Chapter number (1 to 18)", example = "2") Integer chapterNumber,
            @PathVariable @Parameter(description = "Verse number", example = "47") Integer verseNumber) {
        return ResponseEntity.ok(verseService.getVerse(chapterNumber, verseNumber));
    }

    @GetMapping("/search")
    @Operation(summary = "Search verses across all chapters", description = "Searches across Sanskrit text, Roman transliteration, English/Hindi translations, and keywords.")
    public ResponseEntity<Page<VerseDTO>> searchVerses(
            @RequestParam @Parameter(description = "Search keyword or phrase", example = "karma") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(verseService.searchVerses(q, PageRequest.of(page, size)));
    }
}
