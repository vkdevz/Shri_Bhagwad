package com.bhagavadgita.api.controller;

import com.bhagavadgita.api.config.JwtService;
import com.bhagavadgita.api.dto.ChapterSummaryDTO;
import com.bhagavadgita.api.service.ChapterService;
import com.bhagavadgita.api.service.VerseService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ChapterController.class)
@AutoConfigureMockMvc(addFilters = false) // Bypass security filters for isolated controller test
class ChapterControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChapterService chapterService;

    @MockBean
    private VerseService verseService;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("GET /api/v1/chapters returns JSON array of chapters")
    void testGetAllChapters() throws Exception {
        ChapterSummaryDTO ch1 = ChapterSummaryDTO.builder()
                .chapterNumber(1)
                .title("Arjuna Vishada Yoga")
                .sanskritName("अर्जुनविषादयोग")
                .verseCount(47)
                .build();

        when(chapterService.getAllChaptersSummary()).thenReturn(List.of(ch1));

        mockMvc.perform(get("/api/v1/chapters").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].chapterNumber").value(1))
                .andExpect(jsonPath("$[0].title").value("Arjuna Vishada Yoga"))
                .andExpect(jsonPath("$[0].verseCount").value(47));
    }
}
