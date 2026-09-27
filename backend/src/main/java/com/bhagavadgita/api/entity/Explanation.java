package com.bhagavadgita.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "explanations", indexes = @Index(name = "idx_expl_lookup", columnList = "verse_id, language"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Explanation {

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

    @Column(name = "explanation_text", nullable = false, columnDefinition = "TEXT")
    private String explanationText;
}
