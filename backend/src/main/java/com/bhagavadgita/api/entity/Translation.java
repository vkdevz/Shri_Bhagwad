package com.bhagavadgita.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "translations", indexes = @Index(name = "idx_trans_lookup", columnList = "verse_id, language"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Translation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verse_id", nullable = false)
    private Verse verse;

    @Column(nullable = false, length = 10)
    private String language; // 'en' or 'hi'

    @Column(nullable = false, length = 100)
    private String author;

    @Column(name = "translation_text", nullable = false, columnDefinition = "TEXT")
    private String translationText;
}
