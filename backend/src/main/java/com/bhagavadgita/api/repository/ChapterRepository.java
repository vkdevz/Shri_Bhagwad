package com.bhagavadgita.api.repository;

import com.bhagavadgita.api.entity.Chapter;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Integer> {

    List<Chapter> findAllByOrderByChapterNumberAsc();

    @EntityGraph(attributePaths = {"verses"})
    Optional<Chapter> findWithVersesByChapterNumber(Integer chapterNumber);
}
