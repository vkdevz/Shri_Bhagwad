package com.bhagavadgita.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "verse_dilemmas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(VerseDilemmaId.class)
public class VerseDilemma {

    @Id
    @Column(name = "dilemma_id")
    private Long dilemmaId;

    @Id
    @Column(name = "verse_id")
    private Long verseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dilemma_id", insertable = false, updatable = false)
    private DilemmaCategory dilemmaCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verse_id", insertable = false, updatable = false)
    private Verse verse;

    @Column(columnDefinition = "TEXT")
    private String takeaway;
}
