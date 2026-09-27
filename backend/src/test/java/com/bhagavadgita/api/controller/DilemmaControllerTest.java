package com.bhagavadgita.api.controller;

import com.bhagavadgita.api.config.JwtService;
import com.bhagavadgita.api.dto.DilemmaDTO;
import com.bhagavadgita.api.service.DilemmaService;
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

@WebMvcTest(DilemmaController.class)
@AutoConfigureMockMvc(addFilters = false)
class DilemmaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DilemmaService dilemmaService;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("GET /api/v1/dilemmas returns available categories")
    void testGetAllDilemmas() throws Exception {
        DilemmaDTO d1 = DilemmaDTO.builder()
                .code("ANXIETY_OVERWHELM")
                .title("Anxiety & Overwhelm")
                .icon("🌊")
                .build();

        when(dilemmaService.getAllDilemmas()).thenReturn(List.of(d1));

        mockMvc.perform(get("/api/v1/dilemmas").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].code").value("ANXIETY_OVERWHELM"))
                .andExpect(jsonPath("$[0].icon").value("🌊"));
    }
}
