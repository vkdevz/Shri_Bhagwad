package com.bhagavadgita.api.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                "chapters-summary",
                "chapter-detail",
                "chapter-verses",
                "verse-single",
                "daily-verse",
                "dilemmas-all",
                "dilemma-by-code"
        );
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .initialCapacity(100)
                .maximumSize(1000)
                .expireAfterWrite(12, TimeUnit.HOURS)
                .recordStats());
        return cacheManager;
    }
}
