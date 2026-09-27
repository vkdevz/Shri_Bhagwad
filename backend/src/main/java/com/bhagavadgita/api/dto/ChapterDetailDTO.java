package com.bhagavadgita.api.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChapterDetailDTO {
    private Integer chapterNumber;
    private String title;
    private String subtitle;
    private String sanskritName;
    private String transliterated;
    private String theme;
    private Integer verseCount;
    private String color;
    private String summaryEn;
    private String summaryHi;
    private List<VerseDTO> verses;
}
