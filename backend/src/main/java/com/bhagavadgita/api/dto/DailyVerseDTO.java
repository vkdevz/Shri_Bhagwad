package com.bhagavadgita.api.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyVerseDTO {
    private LocalDate date;
    private VerseDTO verse;
    private String contemplationPrompt;
}
