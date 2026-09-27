package com.bhagavadgita.api.controller;

import com.bhagavadgita.api.dto.JournalRequestDTO;
import com.bhagavadgita.api.dto.JournalResponseDTO;
import com.bhagavadgita.api.service.JournalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/journals")
@RequiredArgsConstructor
@Tag(name = "Nishkama Karma Journal", description = "Personal reflection journaling and reading streak tracking (Requires JWT)")
@SecurityRequirement(name = "bearerAuth")
public class JournalController {

    private final JournalService journalService;

    @PostMapping
    @Operation(summary = "Create daily reflection entry", description = "Stores user's contemplation on a verse, action commitment, and increments reading streak.")
    public ResponseEntity<JournalResponseDTO> createEntry(
            @Valid @RequestBody JournalRequestDTO request,
            Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(journalService.createEntry(username, request));
    }

    @GetMapping
    @Operation(summary = "Get user reflection history", description = "Returns paginated list of user's past reflections.")
    public ResponseEntity<Page<JournalResponseDTO>> getUserEntries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(journalService.getUserEntries(username, PageRequest.of(page, size)));
    }
}
