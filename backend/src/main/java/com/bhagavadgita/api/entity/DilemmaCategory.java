package com.bhagavadgita.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dilemma_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DilemmaCategory {

    @Id
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "title_hindi", nullable = false, length = 100)
    private String titleHindi;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 20)
    private String icon;

    @Column(columnDefinition = "TEXT")
    private String prescription;

    @OneToMany(mappedBy = "dilemmaCategory", cascade = CascadeType.ALL)
    @Builder.Default
    private List<VerseDilemma> verseDilemmas = new ArrayList<>();
}
