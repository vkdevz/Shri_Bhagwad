const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '..', 'data', 'raw', 'gita-main', 'data');
const EXISTING_DATA_PATH = path.join(__dirname, '..', 'data', 'gita-data.json');
const MIGRATION_DIR = path.join(__dirname, '..', 'backend', 'src', 'main', 'resources', 'db', 'migration');
const CHAPTERS_OUTPUT_DIR = path.join(__dirname, '..', 'data', 'chapters');

// Ensure output dirs exist
fs.mkdirSync(MIGRATION_DIR, { recursive: true });
fs.mkdirSync(CHAPTERS_OUTPUT_DIR, { recursive: true });

console.log('Loading raw datasets...');
const rawChapters = require(path.join(RAW_DIR, 'chapters.json'));
const rawVerses = require(path.join(RAW_DIR, 'verse.json'));
const rawTranslations = require(path.join(RAW_DIR, 'translation.json'));
const rawCommentaries = require(path.join(RAW_DIR, 'commentary.json'));
const existingData = fs.existsSync(EXISTING_DATA_PATH) ? require(EXISTING_DATA_PATH) : null;

// Map existing curated data for chapters 1-5
const existingChaptersMap = new Map();
if (existingData && existingData.chapters) {
    existingData.chapters.forEach(ch => {
        const verseMap = new Map();
        if (ch.verses) {
            ch.verses.forEach(v => verseMap.set(v.number, v));
        }
        existingChaptersMap.set(ch.number, { ...ch, verseMap });
    });
}

// Index raw translations and commentaries by verse_id
const transByVerse = new Map();
rawTranslations.forEach(t => {
    if (!transByVerse.has(t.verse_id)) transByVerse.set(t.verse_id, []);
    transByVerse.get(t.verse_id).push(t);
});

const commByVerse = new Map();
rawCommentaries.forEach(c => {
    if (!commByVerse.has(c.verse_id)) commByVerse.set(c.verse_id, []);
    commByVerse.get(c.verse_id).push(c);
});

// Helper to escape SQL strings
function escapeSql(str) {
    if (!str) return "''";
    return "'" + String(str).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

// Helper to clean Sanskrit text
function cleanSanskrit(text) {
    if (!text) return '';
    return text.replace(/\r\n/g, '\n').trim();
}

// Chapter Colors & Themes for UI
const chapterThemes = [
    { number: 1, theme: 'Doubt & Despair', color: '#8B4513' },
    { number: 2, theme: 'Wisdom & Duty', color: '#D4AF37' },
    { number: 3, theme: 'Selfless Action', color: '#CD853F' },
    { number: 4, theme: 'Knowledge & Renunciation', color: '#B8860B' },
    { number: 5, theme: 'Renunciation of Action', color: '#DAA520' },
    { number: 6, theme: 'Meditation & Mind Control', color: '#4682B4' },
    { number: 7, theme: 'Knowledge of the Ultimate Truth', color: '#2E8B57' },
    { number: 8, theme: 'The Path to the Supreme', color: '#4B0082' },
    { number: 9, theme: 'The Sovereign Secret', color: '#800080' },
    { number: 10, theme: 'The Divine Glories', color: '#DA70D6' },
    { number: 11, theme: 'The Universal Cosmic Form', color: '#FF4500' },
    { number: 12, theme: 'The Way of Devotion', color: '#32CD32' },
    { number: 13, theme: 'The Field & The Knower', color: '#20B2AA' },
    { number: 14, theme: 'The Three Gunas of Nature', color: '#FF6347' },
    { number: 15, theme: 'The Supreme Divine Person', color: '#FFD700' },
    { number: 16, theme: 'Divine & Demonic Qualities', color: '#DC143C' },
    { number: 17, theme: 'The Threefold Divisions of Faith', color: '#008080' },
    { number: 18, theme: 'Liberation Through Renunciation', color: '#FF8C00' }
];

console.log('Processing all 18 chapters and 700+ verses...');

const processedChapters = [];
const allProcessedVerses = [];

rawChapters.sort((a, b) => a.chapter_number - b.chapter_number).forEach(rc => {
    const chNum = rc.chapter_number;
    const existingCh = existingChaptersMap.get(chNum);
    const themeInfo = chapterThemes.find(t => t.number === chNum) || { theme: 'Divine Wisdom', color: '#D4AF37' };

    const chapterObj = {
        number: chNum,
        title: existingCh ? existingCh.title : rc.name_translation || rc.name,
        subtitle: rc.name_meaning || (existingCh ? existingCh.subtitle : ''),
        sanskritName: rc.name,
        transliterated: rc.name_transliterated,
        theme: existingCh ? existingCh.theme : themeInfo.theme,
        verseCount: rc.verses_count,
        color: existingCh ? existingCh.color : themeInfo.color,
        summary: {
            english: existingCh && existingCh.summary ? existingCh.summary.english : rc.chapter_summary,
            hindi: existingCh && existingCh.summary ? existingCh.summary.hindi : rc.chapter_summary_hindi
        },
        verses: []
    };

    // Find verses belonging to this chapter
    const chVerses = rawVerses
        .filter(v => v.chapter_number === chNum)
        .sort((a, b) => a.verse_number - b.verse_number);

    chVerses.forEach(rv => {
        const vNum = rv.verse_number;
        const existingVerse = existingCh && existingCh.verseMap ? existingCh.verseMap.get(vNum) : null;
        const vTranslations = transByVerse.get(rv.id) || [];
        const vCommentaries = commByVerse.get(rv.id) || [];

        // English translation
        let enTrans = '';
        if (existingVerse && existingVerse.translation && existingVerse.translation.english) {
            enTrans = existingVerse.translation.english;
        } else {
            const sivanandaT = vTranslations.find(t => t.lang === 'english' && t.authorName.includes('Sivananda'));
            const adidevanandaT = vTranslations.find(t => t.lang === 'english' && t.authorName.includes('Adidevananda'));
            const generalEn = vTranslations.find(t => t.lang === 'english');
            enTrans = sivanandaT ? sivanandaT.description : (adidevanandaT ? adidevanandaT.description : (generalEn ? generalEn.description : ''));
        }

        // Hindi translation
        let hiTrans = '';
        if (existingVerse && existingVerse.translation && existingVerse.translation.hindi) {
            hiTrans = existingVerse.translation.hindi;
        } else {
            const ramsukhdasT = vTranslations.find(t => t.lang === 'hindi' && t.authorName.includes('Ramsukhdas'));
            const tejomayanandaT = vTranslations.find(t => t.lang === 'hindi' && t.authorName.includes('Tejomayananda'));
            const generalHi = vTranslations.find(t => t.lang === 'hindi');
            hiTrans = ramsukhdasT ? ramsukhdasT.description : (tejomayanandaT ? tejomayanandaT.description : (generalHi ? generalHi.description : ''));
        }

        // Clean Hindi leading markers like ।।1.1।।
        hiTrans = hiTrans.replace(/^।।\d+\.\d+।।\s*/, '').trim();

        // English explanation
        let enExpl = '';
        if (existingVerse && existingVerse.explanation && existingVerse.explanation.english) {
            enExpl = existingVerse.explanation.english;
        } else {
            const sivanandaC = vCommentaries.find(c => c.lang === 'english' && c.authorName.includes('Sivananda'));
            const chinmayanandaC = vCommentaries.find(c => c.lang === 'english' && c.authorName.includes('Chinmayananda'));
            enExpl = sivanandaC ? sivanandaC.description : (chinmayanandaC ? chinmayanandaC.description : '');
            // If empty, fall back to transliteration + meaning synthesis
            if (!enExpl && enTrans) {
                enExpl = `In this verse of Chapter ${chNum}, Lord Krishna addresses the profound aspect of spiritual wisdom and duty: "${enTrans}"`;
            }
        }

        // Hindi explanation
        let hiExpl = '';
        if (existingVerse && existingVerse.explanation && existingVerse.explanation.hindi) {
            hiExpl = existingVerse.explanation.hindi;
        } else {
            const ramsukhdasC = vCommentaries.find(c => c.lang === 'hindi' && c.authorName.includes('Ramsukhdas'));
            const chinmayanandaC = vCommentaries.find(c => c.lang === 'hindi' && c.authorName.includes('Chinmayananda'));
            hiExpl = ramsukhdasC ? ramsukhdasC.description : (chinmayanandaC ? chinmayanandaC.description : '');
            if (!hiExpl && hiTrans) {
                hiExpl = `इस श्लोक में भगवान श्री कृष्ण अध्याय ${chNum} के अंतर्गत जीवन और कर्म का गहन उपदेश देते हैं।`;
            }
        }

        // Keywords
        let keywords = [];
        if (existingVerse && existingVerse.keywords) {
            keywords = existingVerse.keywords;
        } else {
            // Extract from word meanings and theme
            keywords = [
                `chapter ${chNum}`,
                themeInfo.theme.toLowerCase(),
                `verse ${vNum}`
            ];
            if (rv.word_meanings) {
                const words = rv.word_meanings.split(/[;,—\-]/)
                    .map(w => w.trim().toLowerCase())
                    .filter(w => w.length > 3 && !w.includes('\n'))
                    .slice(0, 5);
                keywords.push(...words);
            }
        }

        const verseObj = {
            id: rv.id,
            chapterNumber: chNum,
            verseNumber: vNum,
            sanskrit: cleanSanskrit(rv.text),
            transliteration: (rv.transliteration || '').trim(),
            wordMeanings: (rv.word_meanings || '').trim(),
            translation: {
                english: enTrans.trim(),
                hindi: hiTrans.trim()
            },
            explanation: {
                english: enExpl.trim(),
                hindi: hiExpl.trim()
            },
            keywords: Array.from(new Set(keywords))
        };

        chapterObj.verses.push(verseObj);
        allProcessedVerses.push(verseObj);
    });

    processedChapters.push(chapterObj);
});

console.log(`Successfully processed ${processedChapters.length} chapters and ${allProcessedVerses.length} verses.`);

// 1. Write Partitioned Per-Chapter JSON Files for Frontend on-demand loading
processedChapters.forEach(ch => {
    const chFile = path.join(CHAPTERS_OUTPUT_DIR, `chapter_${String(ch.number).padStart(2, '0')}.json`);
    fs.writeFileSync(chFile, JSON.stringify(ch, null, 2), 'utf8');
});

// 2. Write Lightweight Chapters Summary (<15KB)
const chaptersSummary = processedChapters.map(ch => ({
    number: ch.number,
    title: ch.title,
    subtitle: ch.subtitle,
    sanskritName: ch.sanskritName,
    transliterated: ch.transliterated,
    theme: ch.theme,
    verseCount: ch.verseCount,
    color: ch.color,
    summary: ch.summary
}));
fs.writeFileSync(path.join(CHAPTERS_OUTPUT_DIR, 'chapters_summary.json'), JSON.stringify(chaptersSummary, null, 2), 'utf8');

// 3. Define Prashna-Marg (Dilemmas) Taxonomy & Verse Mappings
const dilemmaCategories = [
    {
        id: 1,
        code: 'ANXIETY_OVERWHELM',
        title: 'Anxiety & Overwhelm',
        titleHindi: 'चिंता और व्याकुलता',
        description: 'When mind races with what-if scenarios, panic, and uncertainty about outcomes.',
        icon: '🌊',
        prescription: 'Focus entirely on the present action; release attachment to outcomes. The mind is turbulent, but controlled by practice and detachment.',
        verses: [
            { ch: 2, v: 47, takeaway: 'You have right only to action, never to fruits. Be not anxious about results.' },
            { ch: 2, v: 14, takeaway: 'Pleasure and pain come and go like seasons. Learn to endure them with equanimity.' },
            { ch: 6, v: 35, takeaway: 'Doubtless the mind is restless, O Arjuna, but it is mastered by constant practice and detachment.' },
            { ch: 18, v: 66, takeaway: 'Abandon all worries and surrender in trust. I shall deliver you from all despair.' }
        ]
    },
    {
        id: 2,
        code: 'BURNOUT_PROCRASTINATION',
        title: 'Burnout & Procrastination',
        titleHindi: 'थकावट और काम टालना',
        description: 'When motivation is depleted, tasks feel meaningless, and lethargy takes over.',
        icon: '⚡',
        prescription: 'Action is superior to inaction. Perform your duty without ego-driven pressure, treating work as sacred dedication.',
        verses: [
            { ch: 3, v: 8, takeaway: 'Perform your prescribed duty, for action is indeed better than inaction.' },
            { ch: 3, v: 19, takeaway: 'Constantly perform your duties without attachment; thus one attains the highest state.' },
            { ch: 4, v: 18, takeaway: 'He who sees inaction in action, and action in inaction, is truly wise among humans.' }
        ]
    },
    {
        id: 3,
        code: 'ANGER_RESENTMENT',
        title: 'Anger & Frustration',
        titleHindi: 'क्रोध और अशांति',
        description: 'When expectations are violated, leading to frustration, bitterness, and loss of composure.',
        icon: '🔥',
        prescription: 'Trace anger back to attachment. Control the senses before anger clouds intellect and ruins peace.',
        verses: [
            { ch: 2, v: 62, takeaway: 'Brooding on objects creates attachment; attachment breeds desire; unfulfilled desire sparks anger.' },
            { ch: 2, v: 63, takeaway: 'From anger arises delusion, from delusion loss of memory, and thereby ruin of intellect.' },
            { ch: 5, v: 23, takeaway: 'One who can withstand the impulses of lust and anger before leaving the body is truly joyful.' }
        ]
    },
    {
        id: 4,
        code: 'GRIEF_LOSS',
        title: 'Grief & Heartbreak',
        titleHindi: 'शोक और बिछोह',
        description: 'Coping with loss of loved ones, broken relationships, or shattered expectations.',
        icon: '🕊️',
        prescription: 'The physical form is transient, but the soul is eternal, unkillable, and indestructible.',
        verses: [
            { ch: 2, v: 11, takeaway: 'The wise grieve neither for the living nor for the departed.' },
            { ch: 2, v: 20, takeaway: 'The soul is never born, nor does it ever die; unborn, eternal, undying, it is not slain when the body dies.' },
            { ch: 2, v: 22, takeaway: 'Just as a person casts off worn-out garments and puts on new ones, the soul casts off worn-out bodies.' }
        ]
    },
    {
        id: 5,
        code: 'DECISION_PARALYSIS',
        title: 'Decision Paralysis & Confusion',
        titleHindi: 'दुविधा और अनिर्णय',
        description: 'Stuck between hard choices, fearing making the wrong move or harming others.',
        icon: '⚖️',
        prescription: 'Consult your higher self, establish a one-pointed intellect (Vyavasayatmika Buddhi), and act with integrity.',
        verses: [
            { ch: 2, v: 7, takeaway: 'My heart is weighed down by confusion; tell me decisively what is best for me.' },
            { ch: 2, v: 41, takeaway: 'The resolute intellect is one-pointed; the intellect of the indecisive is many-branched.' },
            { ch: 18, v: 63, takeaway: 'Reflect on this wisdom thoroughly, and then act as you choose.' }
        ]
    },
    {
        id: 6,
        code: 'PURPOSE_SWADHARMA',
        title: 'Finding Purpose (Swadharma)',
        titleHindi: 'स्वधर्म और जीवन का उद्देश्य',
        description: 'Questioning your path, comparing yourself to others, or feeling lost in career and life.',
        icon: '🧭',
        prescription: 'Better is one’s own duty, though imperfect, than another’s duty well performed. Align action with your innate nature.',
        verses: [
            { ch: 3, v: 35, takeaway: 'Better is one’s own duty, though devoid of merit, than the duty of another well performed.' },
            { ch: 18, v: 46, takeaway: 'By worshiping the Supreme through performance of one’s natural duty, a person achieves perfection.' },
            { ch: 18, v: 47, takeaway: 'One who performs duties dictated by natural inclination incurs no sin.' }
        ]
    }
];

fs.writeFileSync(path.join(CHAPTERS_OUTPUT_DIR, 'dilemmas.json'), JSON.stringify(dilemmaCategories, null, 2), 'utf8');

// 4. Generate Flyway SQL Migrations for Spring Boot Backend
console.log('Generating Flyway SQL migrations...');

// V1__init_schema.sql
const v1SchemaSql = `
-- Flyway Migration V1: Schema Initialization
-- Compatible with PostgreSQL and H2

CREATE TABLE IF NOT EXISTS chapters (
    chapter_number INT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(200),
    sanskrit_name VARCHAR(150) NOT NULL,
    transliterated VARCHAR(150),
    theme TEXT,
    verse_count INT NOT NULL,
    color VARCHAR(20),
    summary_en TEXT,
    summary_hi TEXT
);

CREATE TABLE IF NOT EXISTS verses (
    id BIGINT PRIMARY KEY,
    chapter_number INT NOT NULL,
    verse_number INT NOT NULL,
    sanskrit TEXT NOT NULL,
    transliteration TEXT,
    word_meanings TEXT,
    CONSTRAINT fk_verse_chapter FOREIGN KEY (chapter_number) REFERENCES chapters(chapter_number) ON DELETE CASCADE,
    CONSTRAINT uk_chapter_verse UNIQUE (chapter_number, verse_number)
);

CREATE TABLE IF NOT EXISTS translations (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    verse_id BIGINT NOT NULL,
    language VARCHAR(10) NOT NULL,
    author VARCHAR(100) NOT NULL,
    translation_text TEXT NOT NULL,
    CONSTRAINT fk_trans_verse FOREIGN KEY (verse_id) REFERENCES verses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS explanations (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    verse_id BIGINT NOT NULL,
    language VARCHAR(10) NOT NULL,
    author VARCHAR(100) NOT NULL,
    explanation_text TEXT NOT NULL,
    CONSTRAINT fk_expl_verse FOREIGN KEY (verse_id) REFERENCES verses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verse_keywords (
    verse_id BIGINT NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    CONSTRAINT fk_kw_verse FOREIGN KEY (verse_id) REFERENCES verses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dilemma_categories (
    id BIGINT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    title_hindi VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(20),
    prescription TEXT
);

CREATE TABLE IF NOT EXISTS verse_dilemmas (
    dilemma_id BIGINT NOT NULL,
    verse_id BIGINT NOT NULL,
    takeaway TEXT,
    PRIMARY KEY (dilemma_id, verse_id),
    CONSTRAINT fk_vd_dilemma FOREIGN KEY (dilemma_id) REFERENCES dilemma_categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_vd_verse FOREIGN KEY (verse_id) REFERENCES verses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
    streak_count INT NOT NULL DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    verse_id BIGINT,
    reflection_text TEXT NOT NULL,
    action_commitment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_journal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_journal_verse FOREIGN KEY (verse_id) REFERENCES verses(id) ON DELETE SET NULL
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_verse_lookup ON verses(chapter_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_trans_lookup ON translations(verse_id, language);
CREATE INDEX IF NOT EXISTS idx_expl_lookup ON explanations(verse_id, language);
CREATE INDEX IF NOT EXISTS idx_kw_keyword ON verse_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id, created_at);
`;
fs.writeFileSync(path.join(MIGRATION_DIR, 'V1__init_schema.sql'), v1SchemaSql.trim(), 'utf8');

// V2__seed_chapters.sql
let v2ChaptersSql = '-- Flyway Migration V2: Seed 18 Chapters\n';
processedChapters.forEach(ch => {
    v2ChaptersSql += `INSERT INTO chapters (chapter_number, title, subtitle, sanskrit_name, transliterated, theme, verse_count, color, summary_en, summary_hi) VALUES (${ch.number}, ${escapeSql(ch.title)}, ${escapeSql(ch.subtitle)}, ${escapeSql(ch.sanskritName)}, ${escapeSql(ch.transliterated)}, ${escapeSql(ch.theme)}, ${ch.verseCount}, ${escapeSql(ch.color)}, ${escapeSql(ch.summary.english)}, ${escapeSql(ch.summary.hindi)});\n`;
});
fs.writeFileSync(path.join(MIGRATION_DIR, 'V2__seed_chapters.sql'), v2ChaptersSql, 'utf8');

// V3__seed_verses.sql
let v3VersesSql = '-- Flyway Migration V3: Seed 700+ Verses, Translations and Explanations\n';
allProcessedVerses.forEach(v => {
    v3VersesSql += `INSERT INTO verses (id, chapter_number, verse_number, sanskrit, transliteration, word_meanings) VALUES (${v.id}, ${v.chapterNumber}, ${v.verseNumber}, ${escapeSql(v.sanskrit)}, ${escapeSql(v.transliteration)}, ${escapeSql(v.wordMeanings)});\n`;

    // Translations
    if (v.translation.english) {
        v3VersesSql += `INSERT INTO translations (verse_id, language, author, translation_text) VALUES (${v.id}, 'en', 'Swami Sivananda', ${escapeSql(v.translation.english)});\n`;
    }
    if (v.translation.hindi) {
        v3VersesSql += `INSERT INTO translations (verse_id, language, author, translation_text) VALUES (${v.id}, 'hi', 'Swami Ramsukhdas', ${escapeSql(v.translation.hindi)});\n`;
    }

    // Explanations
    if (v.explanation.english) {
        v3VersesSql += `INSERT INTO explanations (verse_id, language, author, explanation_text) VALUES (${v.id}, 'en', 'Swami Sivananda', ${escapeSql(v.explanation.english)});\n`;
    }
    if (v.explanation.hindi) {
        v3VersesSql += `INSERT INTO explanations (verse_id, language, author, explanation_text) VALUES (${v.id}, 'hi', 'Swami Ramsukhdas', ${escapeSql(v.explanation.hindi)});\n`;
    }

    // Keywords
    v.keywords.forEach(kw => {
        v3VersesSql += `INSERT INTO verse_keywords (verse_id, keyword) VALUES (${v.id}, ${escapeSql(kw)});\n`;
    });
});
fs.writeFileSync(path.join(MIGRATION_DIR, 'V3__seed_verses.sql'), v3VersesSql, 'utf8');

// V4__seed_dilemmas.sql
let v4DilemmasSql = '-- Flyway Migration V4: Seed Prashna-Marg Dilemma Taxonomy\n';
dilemmaCategories.forEach(d => {
    v4DilemmasSql += `INSERT INTO dilemma_categories (id, code, title, title_hindi, description, icon, prescription) VALUES (${d.id}, ${escapeSql(d.code)}, ${escapeSql(d.title)}, ${escapeSql(d.titleHindi)}, ${escapeSql(d.description)}, ${escapeSql(d.icon)}, ${escapeSql(d.prescription)});\n`;

    d.verses.forEach(dv => {
        // Find matching verse id
        const targetV = allProcessedVerses.find(v => v.chapterNumber === dv.ch && v.verseNumber === dv.v);
        if (targetV) {
            v4DilemmasSql += `INSERT INTO verse_dilemmas (dilemma_id, verse_id, takeaway) VALUES (${d.id}, ${targetV.id}, ${escapeSql(dv.takeaway)});\n`;
        }
    });
});
fs.writeFileSync(path.join(MIGRATION_DIR, 'V4__seed_dilemmas.sql'), v4DilemmasSql, 'utf8');

console.log('✅ All seed files and Flyway migrations successfully generated!');
