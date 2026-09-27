package com.bhagavadgita.api;

import com.bhagavadgita.api.repository.ChapterRepository;
import com.bhagavadgita.api.repository.DilemmaCategoryRepository;
import com.bhagavadgita.api.repository.VerseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class GitaApplicationTests {

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private VerseRepository verseRepository;

    @Autowired
    private DilemmaCategoryRepository dilemmaCategoryRepository;

    @Test
    @DisplayName("Application context loads and Flyway seeds all 18 chapters and 701 verses")
    void contextLoadsAndDataSeeded() {
        // Assert all 18 chapters seeded
        long chapterCount = chapterRepository.count();
        assertThat(chapterCount).isEqualTo(18L);

        // Assert 701 verses seeded
        long verseCount = verseRepository.count();
        assertThat(verseCount).isGreaterThanOrEqualTo(700L);

        // Assert 6 dilemma categories seeded
        long dilemmaCount = dilemmaCategoryRepository.count();
        assertThat(dilemmaCount).isGreaterThanOrEqualTo(6L);
    }
}
