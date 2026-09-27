package com.bhagavadgita.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chapters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter {

    @Id
    @Column(name = "chapter_number")
    private Integer chapterNumber;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 200)
    private String subtitle;

    @Column(name = "sanskrit_name", nullable = false, length = 150)
    private String sanskritName;

    @Column(length = 150)
    private String transliterated;

    @Column(columnDefinition = "TEXT")
    private String theme;

    @Column(name = "verse_count", nullable = false)
    private Integer verseCount;

    @Column(length = 20)
    private String color;

    @Column(name = "summary_en", columnDefinition = "TEXT")
    private String summaryEn;

    @Column(name = "summary_hi", columnDefinition = "TEXT")
    private String summaryHi;

    @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("verseNumber ASC")
    @Builder.Default
    private List<Verse> verses = new ArrayList<>();
}
