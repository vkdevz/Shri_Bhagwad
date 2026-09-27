// API Client for ShlokPath (श्लोकपथ)
// Supports both Spring Boot REST API (http://localhost:8080/api/v1) and offline/local fallback

class GitaApiClient {
    constructor() {
        this.baseUrl = 'http://localhost:8080/api/v1';
        this.token = localStorage.getItem('gita_jwt_token') || null;
        this.isApiAvailable = false;
        this.chaptersCache = new Map();
        this.checkApiHealth();
    }

    async checkApiHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const response = await fetch(`${this.baseUrl}/chapters`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            this.isApiAvailable = response.ok;
            if (this.isApiAvailable) {
                console.log('✅ Spring Boot REST API detected & active');
            }
        } catch (e) {
            this.isApiAvailable = false;
            console.log('ℹ️ Running in local/offline mode (partitioned chapter data)');
        }
    }

    // Chapters list (lightweight summary)
    async getChapters() {
        if (this.isApiAvailable) {
            try {
                const res = await fetch(`${this.baseUrl}/chapters`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API error, falling back to local chapters summary');
            }
        }
        // Fallback to local lightweight summary file
        const res = await fetch('data/chapters/chapters_summary.json');
        return await res.json();
    }

    // Get specific chapter with verses
    async getChapter(chapterNumber) {
        if (this.chaptersCache.has(chapterNumber)) {
            return this.chaptersCache.get(chapterNumber);
        }

        if (this.isApiAvailable) {
            try {
                const res = await fetch(`${this.baseUrl}/chapters/${chapterNumber}`);
                if (res.ok) {
                    const data = await res.json();
                    this.chaptersCache.set(chapterNumber, data);
                    return data;
                }
            } catch (e) {
                console.warn('API error, falling back to local partitioned chapter');
            }
        }

        // Fallback to partitioned JSON chapter file (e.g. data/chapters/chapter_02.json)
        const paddedNum = String(chapterNumber).padStart(2, '0');
        const res = await fetch(`data/chapters/chapter_${paddedNum}.json`);
        const data = await res.json();
        this.chaptersCache.set(chapterNumber, data);
        return data;
    }

    // Daily Verse
    async getDailyVerse() {
        if (this.isApiAvailable) {
            try {
                const res = await fetch(`${this.baseUrl}/verses/daily`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API error on daily verse, using local rotation');
            }
        }

        // Local rotation logic: day of year % 18
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const chNum = (dayOfYear % 18) + 1;
        const chapter = await this.getChapter(chNum);
        const verse = (chapter.verses && chapter.verses.length > 0)
            ? chapter.verses[dayOfYear % chapter.verses.length]
            : null;

        return {
            date: new Date().toISOString().split('T')[0],
            verse: verse,
            contemplationPrompt: 'Reflect today: How can you apply this sacred wisdom to remain calm and selfless?'
        };
    }

    // Search Verses
    async search(query) {
        if (!query || !query.trim()) return [];

        if (this.isApiAvailable) {
            try {
                const res = await fetch(`${this.baseUrl}/verses/search?q=${encodeURIComponent(query)}&size=30`);
                if (res.ok) {
                    const page = await res.json();
                    return page.content || [];
                }
            } catch (e) {
                console.warn('API search failed, falling back to cached search');
            }
        }

        // Search across loaded chapters or chapter 1-5 fallback
        const results = [];
        const q = query.toLowerCase().trim();
        for (let i = 1; i <= 18; i++) {
            if (this.chaptersCache.has(i)) {
                const ch = this.chaptersCache.get(i);
                ch.verses.forEach(v => {
                    const enTrans = (v.translation && (v.translation.english || v.translation)) || '';
                    const hiTrans = (v.translation && v.translation.hindi) || '';
                    if (
                        (v.sanskrit && v.sanskrit.toLowerCase().includes(q)) ||
                        (v.transliteration && v.transliteration.toLowerCase().includes(q)) ||
                        enTrans.toLowerCase().includes(q) ||
                        hiTrans.toLowerCase().includes(q)
                    ) {
                        results.push(v);
                    }
                });
            }
        }
        return results;
    }

    // Dilemma Categories (Prashna-Marg)
    async getDilemmas() {
        if (this.isApiAvailable) {
            try {
                const res = await fetch(`${this.baseUrl}/dilemmas`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API dilemmas failed, falling back to local file');
            }
        }
        const res = await fetch('data/chapters/dilemmas.json');
        return await res.json();
    }

    // Dilemma by code
    async getDilemmaByCode(code) {
        if (this.isApiAvailable) {
            try {
                const res = await fetch(`${this.baseUrl}/dilemmas/${code}`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API dilemma detail failed');
            }
        }
        const dilemmas = await this.getDilemmas();
        return dilemmas.find(d => d.code === code) || null;
    }

    // Ask Parthasarathi AI Advisor
    async askAdvisor(query, mood, language = 'english') {
        if (this.isApiAvailable) {
            try {
                const res = await fetch(`${this.baseUrl}/advisor/ask`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, userMood: mood, language })
                });
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API advisor failed, falling back to local wisdom synthesis');
            }
        }

        // Local Socratic advice fallback
        const isHindi = language.toLowerCase() === 'hindi';
        return {
            guidanceTitle: isHindi ? 'पार्थसारथि का दिव्य संदेश' : 'Divine Counsel from Parthasarathi',
            response: isHindi
                ? 'हे प्रिय साधक, जब भी मन व्याकुल हो, स्मरण रखें कि आपका अधिकार केवल निष्ठापूर्वक कर्म करने में है, फल की चिंता में नहीं। परिणाम का मोह त्यागकर वर्तमान कर्तव्य में पूर्ण एकाग्रता से समर्पित हो जाएं।'
                : 'O seeker, when facing this dilemma, ground yourself in the supreme truth of Nishkama Karma: fulfill your immediate duty with a pure heart, freeing yourself from anxiety over the fruits. That which is transient passes away; your inner peace remains eternal.',
            citedVerses: [
                {
                    chapter: 2,
                    verse: 47,
                    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
                    translation: isHindi
                        ? 'कर्म करने में ही तुम्हारा अधिकार है, उसके फलों में कभी नहीं।'
                        : 'You have a right to perform your prescribed duty, but never to the fruits of action.',
                    contextualApplication: 'The ultimate shield against anxiety and burnout.'
                }
            ],
            contemplativeAction: isHindi
                ? 'तीन गहरी सांसें लें और अपने अगले कार्य को फल के भय के बिना करें।'
                : 'Pause for three conscious breaths. Execute your immediate duty with devotion and detachment.'
        };
    }

    // Save Journal Reflection
    async saveJournal(chapterNumber, verseNumber, reflectionText, actionCommitment) {
        if (this.isApiAvailable && this.token) {
            try {
                const res = await fetch(`${this.baseUrl}/journals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({ chapterNumber, verseNumber, reflectionText, actionCommitment })
                });
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API journal save failed, saving to localStorage');
            }
        }

        // Local storage journal
        const entries = JSON.parse(localStorage.getItem('gita_journal_entries') || '[]');
        const newEntry = {
            id: Date.now(),
            chapterNumber,
            verseNumber,
            reflectionText,
            actionCommitment,
            createdAt: new Date().toISOString()
        };
        entries.unshift(newEntry);
        localStorage.setItem('gita_journal_entries', JSON.stringify(entries));
        return newEntry;
    }

    getStoredJournals() {
        return JSON.parse(localStorage.getItem('gita_journal_entries') || '[]');
    }
}

window.gitaApi = new GitaApiClient();
