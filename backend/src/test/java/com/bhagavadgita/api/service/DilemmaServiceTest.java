package com.bhagavadgita.api.service;

import com.bhagavadgita.api.dto.DilemmaDTO;
import com.bhagavadgita.api.entity.DilemmaCategory;
import com.bhagavadgita.api.exception.ResourceNotFoundException;
import com.bhagavadgita.api.repository.DilemmaCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DilemmaServiceTest {

    @Mock
    private DilemmaCategoryRepository dilemmaCategoryRepository;

    @Mock
    private VerseService verseService;

    @InjectMocks
    private DilemmaService dilemmaService;

    private DilemmaCategory sampleDilemma;

    @BeforeEach
    void setUp() {
        sampleDilemma = DilemmaCategory.builder()
                .id(1L)
                .code("ANXIETY_OVERWHELM")
                .title("Anxiety & Overwhelm")
                .titleHindi("चिंता और व्याकुलता")
                .description("When mind races with what-if scenarios")
                .icon("🌊")
                .prescription("Focus on the present action; release attachment to outcomes.")
                .verseDilemmas(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("getAllDilemmas returns list of all emotional categories")
    void testGetAllDilemmas() {
        when(dilemmaCategoryRepository.findAllByOrderByIdAsc()).thenReturn(List.of(sampleDilemma));

        List<DilemmaDTO> result = dilemmaService.getAllDilemmas();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCode()).isEqualTo("ANXIETY_OVERWHELM");
        assertThat(result.get(0).getIcon()).isEqualTo("🌊");
    }

    @Test
    @DisplayName("getDilemmaByCode returns category details when found")
    void testGetDilemmaByCode_Success() {
        when(dilemmaCategoryRepository.findWithVersesByCode("ANXIETY_OVERWHELM"))
                .thenReturn(Optional.of(sampleDilemma));

        DilemmaDTO result = dilemmaService.getDilemmaByCode("ANXIETY_OVERWHELM");

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Anxiety & Overwhelm");
        assertThat(result.getPrescription()).contains("Focus on the present action");
    }

    @Test
    @DisplayName("getDilemmaByCode throws ResourceNotFoundException on invalid code")
    void testGetDilemmaByCode_NotFound() {
        when(dilemmaCategoryRepository.findWithVersesByCode("UNKNOWN"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> dilemmaService.getDilemmaByCode("UNKNOWN"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Dilemma category not found");
    }
}
