package com.bhagavadgita.api.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponseDTO {
    private String response;
    private String guidanceTitle;
    private List<VerseReferenceDTO> citedVerses;
    private String contemplativeAction;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerseReferenceDTO {
        private Integer chapter;
        private Integer verse;
        private String sanskrit;
        private String translation;
        private String contextualApplication;
    }
}
