package com.bhagavadgita.api.dto;

import lombok.*;

import java.util.Map;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerseDTO {
    private Long id;
    private Integer chapterNumber;
    private Integer verseNumber;
    private String sanskrit;
    private String transliteration;
    private String wordMeanings;
    private Map<String, String> translation; // 'english' -> ..., 'hindi' -> ...
    private Map<String, String> explanation; // 'english' -> ..., 'hindi' -> ...
    private Set<String> keywords;
}
