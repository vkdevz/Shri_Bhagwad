package com.bhagavadgita.api.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalResponseDTO {
    private Long id;
    private Integer chapterNumber;
    private Integer verseNumber;
    private String reflectionText;
    private String actionCommitment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer streakCount;
}
