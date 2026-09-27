package com.bhagavadgita.api.repository;

import com.bhagavadgita.api.entity.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    Page<JournalEntry> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<JournalEntry> findByUser_IdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    Optional<JournalEntry> findByIdAndUser_Id(Long id, Long userId);

    long countByUser_Id(Long userId);
}
