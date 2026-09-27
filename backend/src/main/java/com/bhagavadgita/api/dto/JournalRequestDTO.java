package com.bhagavadgita.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalRequestDTO {

    private Integer chapterNumber;
    private Integer verseNumber;

    @NotBlank(message = "Reflection text cannot be empty")
    private String reflectionText;

    private String actionCommitment;
}
