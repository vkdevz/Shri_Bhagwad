package com.bhagavadgita.api.service;

import com.bhagavadgita.api.dto.DilemmaDTO;
import com.bhagavadgita.api.entity.DilemmaCategory;
import com.bhagavadgita.api.entity.VerseDilemma;
import com.bhagavadgita.api.exception.ResourceNotFoundException;
import com.bhagavadgita.api.repository.DilemmaCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DilemmaService {

    private final DilemmaCategoryRepository dilemmaCategoryRepository;
    private final VerseService verseService;

    @Transactional(readOnly = true)
    @Cacheable("dilemmas-all")
    public List<DilemmaDTO> getAllDilemmas() {
        return dilemmaCategoryRepository.findAllByOrderByIdAsc().stream()
                .map(this::toDTOWithoutVerses)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "dilemma-by-code", key = "#code")
    public DilemmaDTO getDilemmaByCode(String code) {
        DilemmaCategory category = dilemmaCategoryRepository.findWithVersesByCode(code.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Dilemma category not found: " + code));

        List<DilemmaDTO.PrescribedVerseDTO> prescribed = category.getVerseDilemmas().stream()
                .map(vd -> DilemmaDTO.PrescribedVerseDTO.builder()
                        .chapterNumber(vd.getVerse() != null && vd.getVerse().getChapter() != null ? vd.getVerse().getChapter().getChapterNumber() : null)
                        .verseNumber(vd.getVerse() != null ? vd.getVerse().getVerseNumber() : null)
                        .takeaway(vd.getTakeaway())
                        .verse(vd.getVerse() != null ? verseService.toDTO(vd.getVerse()) : null)
                        .build())
                .collect(Collectors.toList());

        return DilemmaDTO.builder()
                .id(category.getId())
                .code(category.getCode())
                .title(category.getTitle())
                .titleHindi(category.getTitleHindi())
                .description(category.getDescription())
                .icon(category.getIcon())
                .prescription(category.getPrescription())
                .verses(prescribed)
                .build();
    }

    private DilemmaDTO toDTOWithoutVerses(DilemmaCategory c) {
        return DilemmaDTO.builder()
                .id(c.getId())
                .code(c.getCode())
                .title(c.getTitle())
                .titleHindi(c.getTitleHindi())
                .description(c.getDescription())
                .icon(c.getIcon())
                .prescription(c.getPrescription())
                .build();
    }
}
