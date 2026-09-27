package com.bhagavadgita.api.repository;

import com.bhagavadgita.api.entity.Explanation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExplanationRepository extends JpaRepository<Explanation, Long> {
    List<Explanation> findByVerse_Id(Long verseId);
    List<Explanation> findByVerse_IdAndLanguage(Long verseId, String language);
}
