package com.bhagavadgita.api.repository;

import com.bhagavadgita.api.entity.DilemmaCategory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DilemmaCategoryRepository extends JpaRepository<DilemmaCategory, Long> {

    List<DilemmaCategory> findAllByOrderByIdAsc();

    @EntityGraph(attributePaths = {"verseDilemmas", "verseDilemmas.verse", "verseDilemmas.verse.translations"})
    Optional<DilemmaCategory> findWithVersesByCode(String code);

    Optional<DilemmaCategory> findByCode(String code);
}
