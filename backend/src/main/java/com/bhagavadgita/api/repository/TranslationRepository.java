package com.bhagavadgita.api.repository;

import com.bhagavadgita.api.entity.Translation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TranslationRepository extends JpaRepository<Translation, Long> {
    List<Translation> findByVerse_Id(Long verseId);
    List<Translation> findByVerse_IdAndLanguage(Long verseId, String language);
}
