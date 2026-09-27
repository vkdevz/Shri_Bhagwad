package com.bhagavadgita.api.controller;

import com.bhagavadgita.api.dto.DilemmaDTO;
import com.bhagavadgita.api.service.DilemmaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dilemmas")
@RequiredArgsConstructor
@Tag(name = "Prashna-Marg (Dilemmas)", description = "Emotional & Mental State Navigator mapping modern life challenges to Krishna's teachings")
public class DilemmaController {

    private final DilemmaService dilemmaService;

    @GetMapping
    @Operation(summary = "List all dilemma categories", description = "Returns available emotional states such as Anxiety, Burnout, Anger, Grief, Purpose, Decision Paralysis.")
    public ResponseEntity<List<DilemmaDTO>> getAllDilemmas() {
        return ResponseEntity.ok(dilemmaService.getAllDilemmas());
    }

    @GetMapping("/{code}")
    @Operation(summary = "Get prescription for a dilemma", description = "Returns Krishna's guidance, action steps, and prescribed shlokas with practical takeaways.")
    public ResponseEntity<DilemmaDTO> getDilemmaByCode(
            @PathVariable @Parameter(description = "Category code (e.g. ANXIETY_OVERWHELM, BURNOUT_PROCRASTINATION)", example = "ANXIETY_OVERWHELM") String code) {
        return ResponseEntity.ok(dilemmaService.getDilemmaByCode(code));
    }
}
