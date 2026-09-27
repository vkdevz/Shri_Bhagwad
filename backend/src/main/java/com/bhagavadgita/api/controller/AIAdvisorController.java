package com.bhagavadgita.api.controller;

import com.bhagavadgita.api.dto.ChatRequestDTO;
import com.bhagavadgita.api.dto.ChatResponseDTO;
import com.bhagavadgita.api.service.AIAdvisorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/advisor")
@RequiredArgsConstructor
@Tag(name = "Parthasarathi AI", description = "Socratic AI Counselor grounding modern life queries with Bhagavad Gita verses")
public class AIAdvisorController {

    private final AIAdvisorService aiAdvisorService;

    @PostMapping("/ask")
    @Operation(summary = "Seek guidance from Parthasarathi", description = "Submits a user query and returns compassionate, grounded Socratic advice citing relevant Gita verses.")
    public ResponseEntity<ChatResponseDTO> askAdvisor(@Valid @RequestBody ChatRequestDTO request) {
        return ResponseEntity.ok(aiAdvisorService.getGuidance(request));
    }
}
