package com.bhagavadgita.api.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DilemmaDTO {
    private Long id;
    private String code;
    private String title;
    private String titleHindi;
    private String description;
    private String icon;
    private String prescription;
    private List<PrescribedVerseDTO> verses;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PrescribedVerseDTO {
        private Integer chapterNumber;
        private Integer verseNumber;
        private String takeaway;
        private VerseDTO verse;
    }
}
