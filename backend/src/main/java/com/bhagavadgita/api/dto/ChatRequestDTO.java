package com.bhagavadgita.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequestDTO {

    @NotBlank(message = "Query or dilemma question cannot be empty")
    private String query;

    private String userMood; // e.g. "anxious", "confused", "burnt out"
    private String language; // "english" or "hindi"
}
