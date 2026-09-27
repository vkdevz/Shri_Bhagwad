package com.bhagavadgita.api.repository;

import com.bhagavadgita.api.entity.Verse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VerseRepository extends JpaRepository<Verse, Long> {

    @EntityGraph(attributePaths = {"translations", "explanations", "keywords"})
    Optional<Verse> findWithDetailsByChapter_ChapterNumberAndVerseNumber(Integer chapterNumber, Integer verseNumber);

    @EntityGraph(attributePaths = {"translations", "explanations", "keywords"})
    Optional<Verse> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"translations", "explanations"})
    List<Verse> findByChapter_ChapterNumberOrderByVerseNumberAsc(Integer chapterNumber);

    Page<Verse> findByChapter_ChapterNumberOrderByVerseNumberAsc(Integer chapterNumber, Pageable pageable);

    @Query("""
        SELECT DISTINCT v FROM Verse v
        LEFT JOIN v.translations t
        LEFT JOIN v.explanations e
        LEFT JOIN v.keywords k
        WHERE LOWER(v.sanskrit) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(v.transliteration) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(t.translationText) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(e.explanationText) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(k) LIKE LOWER(CONCAT('%', :query, '%'))
    """)
    Page<Verse> searchVerses(@Param("query") String query, Pageable pageable);

    @Query("SELECT COUNT(v) FROM Verse v")
    long countTotalVerses();
}
