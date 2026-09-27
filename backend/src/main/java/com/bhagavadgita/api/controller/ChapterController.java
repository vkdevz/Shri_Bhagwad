package com.bhagavadgita.api.controller;

import com.bhagavadgita.api.dto.ChapterDetailDTO;
import com.bhagavadgita.api.dto.ChapterSummaryDTO;
import com.bhagavadgita.api.dto.VerseDTO;
import com.bhagavadgita.api.service.ChapterService;
import com.bhagavadgita.api.service.VerseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chapters")
@RequiredArgsConstructor
@Tag(name = "Chapters", description = "Endpoints for exploring the 18 chapters of Bhagavad Gita")
public class ChapterController {

    private final ChapterService chapterService;
    private final VerseService verseService;

    @GetMapping
    @Operation(summary = "Get summary of all 18 chapters", description = "Returns lightweight metadata, summaries in English and Hindi, and themes for all 18 chapters.")
    public ResponseEntity<List<ChapterSummaryDTO>> getAllChapters() {
        return ResponseEntity.ok(chapterService.getAllChaptersSummary());
    }

    @GetMapping("/{chapterNumber}")
    @Operation(summary = "Get chapter details", description = "Returns chapter metadata along with all verses.")
    public ResponseEntity<ChapterDetailDTO> getChapterDetail(
            @PathVariable @Parameter(description = "Chapter number (1 to 18)", example = "2") Integer chapterNumber) {
        return ResponseEntity.ok(chapterService.getChapterDetail(chapterNumber));
    }

    @GetMapping("/{chapterNumber}/verses")
    @Operation(summary = "Get paginated verses for a chapter", description = "Returns paginated verses for lazy-loading in client applications.")
    public ResponseEntity<Page<VerseDTO>> getChapterVersesPaginated(
            @PathVariable Integer chapterNumber,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(verseService.getVersesByChapterPaginated(chapterNumber, PageRequest.of(page, size)));
    }
}
