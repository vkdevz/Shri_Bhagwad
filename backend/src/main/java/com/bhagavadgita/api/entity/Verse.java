package com.bhagavadgita.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(
    name = "verses",
    uniqueConstraints = @UniqueConstraint(name = "uk_chapter_verse", columnNames = {"chapter_number", "verse_number"}),
    indexes = @Index(name = "idx_verse_lookup", columnList = "chapter_number, verse_number")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Verse {

    @Id
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_number", nullable = false)
    private Chapter chapter;

    @Column(name = "verse_number", nullable = false)
    private Integer verseNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String sanskrit;

    @Column(columnDefinition = "TEXT")
    private String transliteration;

    @Column(name = "word_meanings", columnDefinition = "TEXT")
    private String wordMeanings;

    @OneToMany(mappedBy = "verse", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Translation> translations = new ArrayList<>();

    @OneToMany(mappedBy = "verse", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Explanation> explanations = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "verse_keywords", joinColumns = @JoinColumn(name = "verse_id"))
    @Column(name = "keyword")
    @Builder.Default
    private Set<String> keywords = new HashSet<>();

    @OneToMany(mappedBy = "verse", cascade = CascadeType.ALL)
    @Builder.Default
    private List<VerseDilemma> verseDilemmas = new ArrayList<>();
}
