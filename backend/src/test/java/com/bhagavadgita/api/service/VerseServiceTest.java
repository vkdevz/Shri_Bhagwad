package com.bhagavadgita.api.service;

import com.bhagavadgita.api.dto.DailyVerseDTO;
import com.bhagavadgita.api.dto.VerseDTO;
import com.bhagavadgita.api.entity.Chapter;
import com.bhagavadgita.api.entity.Translation;
import com.bhagavadgita.api.entity.Verse;
import com.bhagavadgita.api.exception.ResourceNotFoundException;
import com.bhagavadgita.api.repository.VerseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerseServiceTest {

    @Mock
    private VerseRepository verseRepository;

    @InjectMocks
    private VerseService verseService;

    private Chapter sampleChapter;
    private Verse sampleVerse;

    @BeforeEach
    void setUp() {
        sampleChapter = Chapter.builder()
                .chapterNumber(2)
                .title("Sankhya Yoga")
                .verseCount(72)
                .build();

        sampleVerse = Verse.builder()
                .id(48L)
                .chapter(sampleChapter)
                .verseNumber(47)
                .sanskrit("कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।")
                .transliteration("karmaṇyevādhikāraste mā phaleṣhu kadāchana")
                .translations(List.of(
                        Translation.builder().language("en").translationText("Thy right is to work only, but never to its fruits.").build(),
                        Translation.builder().language("hi").translationText("कर्म करने में ही तुम्हारा अधिकार है, फल में कभी नहीं।").build()
                ))
                .build();
    }

    @Test
    @DisplayName("getVerse returns mapped VerseDTO when found")
    void testGetVerse_Success() {
        when(verseRepository.findWithDetailsByChapter_ChapterNumberAndVerseNumber(2, 47))
                .thenReturn(Optional.of(sampleVerse));

        VerseDTO result = verseService.getVerse(2, 47);

        assertThat(result).isNotNull();
        assertThat(result.getChapterNumber()).isEqualTo(2);
        assertThat(result.getVerseNumber()).isEqualTo(47);
        assertThat(result.getTranslation().get("english")).contains("right is to work only");
        assertThat(result.getTranslation().get("hindi")).contains("कर्म करने में ही");
    }

    @Test
    @DisplayName("getVerse throws ResourceNotFoundException when verse does not exist")
    void testGetVerse_NotFound() {
        when(verseRepository.findWithDetailsByChapter_ChapterNumberAndVerseNumber(99, 99))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> verseService.getVerse(99, 99))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Verse not found");
    }

    @Test
    @DisplayName("getDailyVerse returns a deterministic contemplation verse")
    void testGetDailyVerse_Success() {
        when(verseRepository.countTotalVerses()).thenReturn(701L);
        when(verseRepository.findWithDetailsById(anyLong())).thenReturn(Optional.of(sampleVerse));

        DailyVerseDTO result = verseService.getDailyVerse();

        assertThat(result).isNotNull();
        assertThat(result.getDate()).isNotNull();
        assertThat(result.getVerse()).isNotNull();
        assertThat(result.getContemplationPrompt()).isNotBlank();
    }
}
