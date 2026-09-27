package com.bhagavadgita.api.service;

import com.bhagavadgita.api.dto.JournalRequestDTO;
import com.bhagavadgita.api.dto.JournalResponseDTO;
import com.bhagavadgita.api.entity.JournalEntry;
import com.bhagavadgita.api.entity.User;
import com.bhagavadgita.api.entity.Verse;
import com.bhagavadgita.api.exception.ResourceNotFoundException;
import com.bhagavadgita.api.repository.JournalEntryRepository;
import com.bhagavadgita.api.repository.UserRepository;
import com.bhagavadgita.api.repository.VerseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalEntryRepository journalEntryRepository;
    private final UserRepository userRepository;
    private final VerseRepository verseRepository;

    @Transactional
    public JournalResponseDTO createEntry(String username, JournalRequestDTO request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Verse verse = null;
        if (request.getChapterNumber() != null && request.getVerseNumber() != null) {
            verse = verseRepository.findWithDetailsByChapter_ChapterNumberAndVerseNumber(
                    request.getChapterNumber(), request.getVerseNumber()).orElse(null);
        }

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .verse(verse)
                .reflectionText(request.getReflectionText())
                .actionCommitment(request.getActionCommitment())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Update reading streak
        updateStreak(user);

        JournalEntry saved = journalEntryRepository.save(entry);
        userRepository.save(user);

        return toDTO(saved, user.getStreakCount());
    }

    @Transactional(readOnly = true)
    public Page<JournalResponseDTO> getUserEntries(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return journalEntryRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(e -> toDTO(e, user.getStreakCount()));
    }

    private void updateStreak(User user) {
        LocalDate today = LocalDate.now();
        LocalDate lastActive = user.getLastActiveDate();

        if (lastActive == null) {
            user.setStreakCount(1);
        } else if (lastActive.equals(today.minusDays(1))) {
            user.setStreakCount(user.getStreakCount() + 1);
        } else if (!lastActive.equals(today)) {
            user.setStreakCount(1);
        }
        user.setLastActiveDate(today);
    }

    private JournalResponseDTO toDTO(JournalEntry entry, Integer streak) {
        return JournalResponseDTO.builder()
                .id(entry.getId())
                .chapterNumber(entry.getVerse() != null && entry.getVerse().getChapter() != null ? entry.getVerse().getChapter().getChapterNumber() : null)
                .verseNumber(entry.getVerse() != null ? entry.getVerse().getVerseNumber() : null)
                .reflectionText(entry.getReflectionText())
                .actionCommitment(entry.getActionCommitment())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .streakCount(streak)
                .build();
    }
}
