// ShlokPath (श्लोकपथ) — The Path of the Verse
class GitaApp {
    constructor() {
        this.currentChapter = 1;
        this.currentVerse = 1;
        this.gitaData = null;
        this.readingProgress = {};
        this.bookmarks = new Set();
        this.searchIndex = [];
        this.currentScreen = 'home';
        this.settings = {
            theme: 'dark', // 'dark' (Manuscript Obsidian) or 'light' (Imperial Linen)
            fontSize: 16,
            autoReveal: false,
            hapticFeedback: true,
            language: 'hindi' // Default language is Hindi
        };
        this.touchStart = { x: 0, y: 0 };
        this.touchEnd = { x: 0, y: 0 };
        this.isRevealed = false;
        this.dailyVerse = null;
        this.deferredPrompt = null;
        this.dilemmas = [];
        this.currentDilemma = null;
        this.isBreathingActive = false;
        this.breathTimer = null;
        this.init();
    }

    // Helper functions for bilingual support
    getTranslation(verse) {
        if (!verse.translation) return '';
        if (typeof verse.translation === 'string') return verse.translation;
        return verse.translation[this.settings.language] || verse.translation.english || '';
    }

    getExplanation(verse) {
        if (!verse.explanation) return '';
        if (typeof verse.explanation === 'string') return verse.explanation;
        return verse.explanation[this.settings.language] || verse.explanation.english || '';
    }

    async init() {
        try {
            this.showLoadingScreen();
            await this.loadGitaData();
            this.loadUserData();
            this.setupEventListeners();
            this.setupPWA();
            this.setupTouchGestures();
            this.initializeApp();
            if (window.seoRouter) {
                window.seoRouter.parseInitialRoute();
            }
            this.hideLoadingScreen();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Failed to load app. Please refresh.', 'error');
            this.hideLoadingScreen();
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 1500);
    }

    async loadGitaData() {
        try {
            // Load all 18 chapters summary via Spring Boot API or local summary JSON
            let chapters = [];
            if (window.gitaApi) {
                chapters = await window.gitaApi.getChapters();
            } else {
                const res = await fetch('/data/chapters/chapters_summary.json');
                chapters = await res.json();
            }

            this.gitaData = {
                metadata: { title: 'ShlokPath', totalChapters: 18, totalVerses: 700 },
                chapters: chapters
            };

            // Pre-load chapter 1 verses
            if (window.gitaApi) {
                const ch1 = await window.gitaApi.getChapter(1);
                if (this.gitaData.chapters[0]) {
                    this.gitaData.chapters[0].verses = ch1.verses;
                }
            }

            this.buildSearchIndex();
            console.log(`Gita data loaded: ${chapters.length} chapters`);
        } catch (error) {
            console.warn('API/summary load failed, trying fallback gita-data.json:', error);
            try {
                const response = await fetch('/data/gita-data.json');
                this.gitaData = await response.json();
                this.buildSearchIndex();
            } catch (e) {
                this.showToast('Failed to load scripture data.', 'error');
            }
        }
    }

    buildSearchIndex() {
        this.searchIndex = [];
        if (!this.gitaData || !this.gitaData.chapters) {
            console.error('Invalid Gita data structure');
            return;
        }

        this.gitaData.chapters.forEach(chapter => {
            if (chapter.verses && Array.isArray(chapter.verses)) {
                chapter.verses.forEach(verse => {
                    this.searchIndex.push({
                        chapterNumber: chapter.number,
                        verseNumber: verse.number,
                        sanskrit: verse.sanskrit || '',
                        transliteration: verse.transliteration || '',
                        translation: this.getTranslation(verse),
                        explanation: this.getExplanation(verse),
                        keywords: verse.keywords || []
                    });
                });
            }
        });
        console.log(`Search index built with ${this.searchIndex.length} verses`);
    }

    loadUserData() {
        try {
            const savedProgress = localStorage.getItem('gita-progress');
            if (savedProgress) {
                this.readingProgress = JSON.parse(savedProgress);
            }

            const savedBookmarks = localStorage.getItem('gita-bookmarks');
            if (savedBookmarks) {
                this.bookmarks = new Set(JSON.parse(savedBookmarks));
            }

            const savedSettings = localStorage.getItem('gita-settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
                // Ensure Hindi is default unless user has manually chosen another language
                if (!localStorage.getItem('gita-language-chosen')) {
                    this.settings.language = 'hindi';
                }
            } else {
                this.settings.language = 'hindi';
            }

            const savedPosition = localStorage.getItem('gita-current-position');
            if (savedPosition) {
                const position = JSON.parse(savedPosition);
                this.currentChapter = position.chapter || 1;
                this.currentVerse = position.verse || 1;
            }

            console.log('User data loaded successfully');
        } catch (error) {
            console.error('Error loading user data:', error);
            this.readingProgress = {};
            this.bookmarks = new Set();
            this.currentChapter = 1;
            this.currentVerse = 1;
        }
    }

    saveUserData() {
        try {
            localStorage.setItem('gita-progress', JSON.stringify(this.readingProgress));
            localStorage.setItem('gita-bookmarks', JSON.stringify([...this.bookmarks]));
            localStorage.setItem('gita-settings', JSON.stringify(this.settings));
            localStorage.setItem('gita-current-position', JSON.stringify({
                chapter: this.currentChapter,
                verse: this.currentVerse
            }));
        } catch (error) {
            console.error('Error saving user data:', error);
            this.showToast('Failed to save progress', 'error');
        }
    }

    setupEventListeners() {
        // Desktop & Mobile Navigation
        document.querySelectorAll('.nav-item, .desktop-nav-link').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const screen = e.currentTarget.dataset.screen;
                if (screen) {
                    this.navigateToScreen(screen);
                }
            });
        });

        // Brand Logo click -> Home
        const brandLogo = document.getElementById('brand-logo');
        if (brandLogo) {
            brandLogo.addEventListener('click', () => this.navigateToScreen('home'));
        }

        // Header controls
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.navigateBack());
        }

        const searchToggle = document.getElementById('search-toggle');
        if (searchToggle) {
            searchToggle.addEventListener('click', () => this.toggleSearch());
        }

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.cycleTheme());
        }

        // Language toggle buttons (Mobile floating & Desktop pill)
        const languageToggle = document.getElementById('language-toggle');
        if (languageToggle) {
            languageToggle.addEventListener('click', () => this.toggleLanguage());
        }
        const langToggleBtn = document.getElementById('language-toggle-btn');
        if (langToggleBtn) {
            langToggleBtn.addEventListener('click', () => this.toggleLanguage());
        }

        // Desktop and Mobile Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') e.preventDefault();
            });
        }
        const desktopSearch = document.getElementById('desktop-search-input');
        if (desktopSearch) {
            desktopSearch.addEventListener('input', (e) => {
                const val = e.target.value;
                if (val.trim()) {
                    if (this.currentScreen !== 'search') this.navigateToScreen('search');
                    this.handleSearch(val);
                }
            });
        }

        const clearSearch = document.getElementById('clear-search');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => this.clearSearch());
        }

        // Reader controls
        const bookmarkBtn = document.getElementById('bookmark-btn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => this.toggleBookmark());
        }

        const revealBtn = document.getElementById('reveal-btn');
        if (revealBtn) {
            revealBtn.addEventListener('click', () => this.toggleReveal());
        }

        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareVerse());
        }

        // Reader Stepper & Arrows
        document.getElementById('desktop-prev-verse-btn')?.addEventListener('click', () => this.previousVerse());
        document.getElementById('desktop-next-verse-btn')?.addEventListener('click', () => this.nextVerse());
        document.getElementById('prev-verse-mobile')?.addEventListener('click', () => this.previousVerse());
        document.getElementById('next-verse-mobile')?.addEventListener('click', () => this.nextVerse());

        // Reader Chapter Dropdown Select
        const readerChSelect = document.getElementById('reader-chapter-select');
        if (readerChSelect) {
            readerChSelect.addEventListener('change', (e) => {
                const ch = parseInt(e.target.value);
                if (ch) this.openChapter(ch);
            });
        }

        // Reader Translation Tabs (English / Hindi)
        const primaryTab = document.getElementById('trans-tab-primary');
        const secondaryTab = document.getElementById('trans-tab-secondary');
        if (primaryTab && secondaryTab) {
            primaryTab.addEventListener('click', () => {
                primaryTab.classList.add('active');
                secondaryTab.classList.remove('active');
                this.activeReaderLang = 'english';
                this.updateReaderTranslationDisplay();
            });
            secondaryTab.addEventListener('click', () => {
                secondaryTab.classList.add('active');
                primaryTab.classList.remove('active');
                this.activeReaderLang = 'hindi';
                this.updateReaderTranslationDisplay();
            });
        }

        // Commentary accordion toggle
        document.getElementById('commentary-toggle')?.addEventListener('click', () => {
            const btn = document.getElementById('commentary-toggle');
            const exp = document.getElementById('current-explanation');
            if (exp) {
                const isHidden = exp.classList.toggle('hidden');
                if (btn) btn.classList.toggle('expanded', !isHidden);
            }
        });

        // Home screen actions
        const continueReading = document.getElementById('continue-reading');
        if (continueReading) {
            continueReading.addEventListener('click', () => this.navigateToReader());
        }

        const homeExplore = document.getElementById('home-explore-chapters');
        if (homeExplore) {
            homeExplore.addEventListener('click', () => this.navigateToScreen('chapters'));
        }

        const homeViewAll = document.getElementById('home-view-all-chapters-btn');
        if (homeViewAll) {
            homeViewAll.addEventListener('click', () => this.navigateToScreen('chapters'));
        }

        const viewBookmarks = document.getElementById('view-bookmarks');
        if (viewBookmarks) {
            viewBookmarks.addEventListener('click', () => this.showBookmarksSearch());
        }

        const dailyVerse = document.getElementById('daily-verse');
        if (dailyVerse) {
            dailyVerse.addEventListener('click', () => this.openDailyVerse());
        }

        // Daily Verse Card Direct Actions (Desktop)
        document.getElementById('daily-card-share-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.dailyVerse) {
                this.openCanvasModal(this.dailyVerse.chapter, this.dailyVerse.verse);
            }
        });
        document.getElementById('daily-card-listen-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.dhyanaAudio) {
                const isPlaying = window.dhyanaAudio.toggleDrone();
                const btn = document.getElementById('daily-card-listen-btn');
                if (btn) {
                    btn.innerHTML = isPlaying
                        ? '<span><strong>Stillness Active</strong></span>'
                        : '<span>Stillness ↗</span>';
                }
                this.showToast(isPlaying ? 'Meditative Soundscape Started' : 'Soundscape Paused', 'info');
            }
        });
        document.getElementById('daily-card-reflect-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.dailyVerse) {
                this.currentChapter = this.dailyVerse.chapter;
                this.currentVerse = this.dailyVerse.verse;
                this.openJournalModal();
            }
        });

        // Native Mobile App View Listeners
        const mobileDailyVerse = document.getElementById('mobile-daily-verse-card');
        if (mobileDailyVerse) {
            mobileDailyVerse.addEventListener('click', () => this.openDailyVerse());
        }

        document.getElementById('mobile-daily-share-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.dailyVerse) {
                this.openCanvasModal(this.dailyVerse.chapter, this.dailyVerse.verse);
            }
        });

        document.getElementById('mobile-daily-listen-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.dhyanaAudio) {
                const isPlaying = window.dhyanaAudio.toggleDrone();
                const btn = document.getElementById('mobile-daily-listen-btn');
                if (btn) {
                    btn.innerHTML = isPlaying
                        ? '<span><strong>Stillness Active</strong></span>'
                        : '<span>Stillness ↗</span>';
                }
                this.showToast(isPlaying ? 'Meditative Soundscape Started' : 'Soundscape Paused', 'info');
            }
        });

        document.getElementById('mobile-daily-reflect-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.dailyVerse) {
                this.currentChapter = this.dailyVerse.chapter;
                this.currentVerse = this.dailyVerse.verse;
                this.openJournalModal();
            }
        });

        // Mobile 1-Tap Resume Reading
        document.getElementById('mobile-continue-reading')?.addEventListener('click', () => {
            this.navigateToReader();
        });

        // Mobile App Mode Tiles
        document.querySelectorAll('.mobile-mode-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                const screen = tile.dataset.screenTarget;
                const isCounsel = tile.dataset.counselTrigger;
                if (screen) {
                    this.navigateToScreen(screen);
                } else if (isCounsel) {
                    document.getElementById('open-ai-advisor')?.click();
                }
            });
        });

        // Mobile Mood Capsules (Immediate Socratic / Scriptural Relief)
        document.querySelectorAll('.apple-mood-capsule, .mobile-mood-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const mood = chip.dataset.mood;
                this.navigateToScreen('dilemmas');
                if (mood) {
                    setTimeout(() => {
                        const targetCard = document.querySelector(`.home-dilemma-card[data-mood="${mood}"], .dilemma-card[data-mood="${mood}"]`);
                        if (targetCard) {
                            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            targetCard.click();
                        }
                    }, 180);
                }
            });
        });

        // Mobile Counsel Bar
        document.getElementById('mobile-counsel-cta-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('open-ai-advisor')?.click();
        });
        document.getElementById('mobile-counsel-bar')?.addEventListener('click', () => {
            document.getElementById('open-ai-advisor')?.click();
        });

        // Chapter Category Filters on Chapters Screen
        document.querySelectorAll('.cat-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.filterChaptersByCategory(e.currentTarget.dataset.filter);
            });
        });

        // Settings
        this.setupSettingsEventListeners();

        // PWA install
        this.setupPWAEventListeners();

        // Creative Features Setup (Prashna-Marg, Dhyana, AI Counselor, Canvas Card, Journal)
        this.setupCreativeFeatures();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));

        console.log('Event listeners setup complete');
    }

    setupCreativeFeatures() {
        // Quick Mood Chips on Home Screen
        document.querySelectorAll('.mood-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const mood = btn.dataset.mood;
                this.navigateToScreen('dilemmas');
                this.openDilemma(mood);
            });
        });

        // AI Advisor Modal
        const openAiBtn = document.getElementById('open-ai-advisor');
        const closeAiBtn = document.getElementById('close-ai-modal');
        const sendAiBtn = document.getElementById('send-ai-query');
        const aiInput = document.getElementById('ai-query-input');

        if (openAiBtn) {
            openAiBtn.addEventListener('click', () => {
                const aiModal = document.getElementById('ai-modal');
                if (aiModal) {
                    aiModal.classList.remove('hidden');
                    setTimeout(() => {
                        document.getElementById('ai-query-input')?.focus();
                    }, 80);
                }
            });
        }
        if (closeAiBtn) {
            closeAiBtn.addEventListener('click', () => {
                document.getElementById('ai-modal')?.classList.add('hidden');
            });
        }
        if (sendAiBtn && aiInput) {
            sendAiBtn.addEventListener('click', () => this.submitAIQuery());
            aiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.submitAIQuery();
                }
            });
        }

        // Overlay click to close any modal & Escape key listener
        document.querySelectorAll('.gita-modal-overlay').forEach(modalOverlay => {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    modalOverlay.classList.add('hidden');
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.gita-modal-overlay').forEach(modal => {
                    modal.classList.add('hidden');
                });
            }
        });

        // Divine Canvas Modal
        const canvasCardBtn = document.getElementById('canvas-card-btn');
        const closeCanvasBtn = document.getElementById('close-canvas-modal');
        if (canvasCardBtn) {
            canvasCardBtn.addEventListener('click', () => this.openCanvasModal());
        }
        if (closeCanvasBtn) {
            closeCanvasBtn.addEventListener('click', () => {
                document.getElementById('canvas-modal')?.classList.add('hidden');
            });
        }

        // Journal Modal
        const journalBtn = document.getElementById('journal-open-btn');
        const closeJournalBtn = document.getElementById('close-journal-modal');
        const saveJournalBtn = document.getElementById('save-journal-btn');
        if (journalBtn) {
            journalBtn.addEventListener('click', () => this.openJournalModal());
        }
        if (closeJournalBtn) {
            closeJournalBtn.addEventListener('click', () => {
                document.getElementById('journal-modal')?.classList.add('hidden');
            });
        }
        if (saveJournalBtn) {
            saveJournalBtn.addEventListener('click', () => this.saveJournalReflection());
        }

        // Dhyana Screen Controls
        const droneBtn = document.getElementById('toggle-audio-drone');
        const breathBtn = document.getElementById('toggle-breath-timer');
        if (droneBtn) {
            droneBtn.addEventListener('click', () => {
                if (window.dhyanaAudio) {
                    const isPlaying = window.dhyanaAudio.toggleDrone();
                    droneBtn.innerHTML = isPlaying
                        ? '<span>Tanpura Drone: <strong class="text-accent">Playing</strong></span>'
                        : '<span>Tanpura Drone: Off</span>';
                    droneBtn.classList.toggle('primary', isPlaying);
                    droneBtn.classList.toggle('secondary', !isPlaying);
                }
            });
        }
        if (breathBtn) {
            breathBtn.addEventListener('click', () => this.toggleBreathingExercise());
        }

        // 1. Four Yogas Pathway Cards on Home
        document.querySelectorAll('.yoga-pathway-card').forEach(card => {
            card.addEventListener('click', () => {
                const yoga = card.dataset.yoga;
                if (yoga === 'dhyana') {
                    this.navigateToScreen('dhyana');
                } else {
                    this.navigateToScreen('chapters');
                    document.querySelectorAll('.cat-tab').forEach(tab => {
                        tab.classList.toggle('active', tab.dataset.filter === yoga);
                    });
                    this.filterChaptersByCategory(yoga);
                }
            });
        });

        // 2. Parthasarathi Socratic Counsel Showcase on Home
        const homeCounselCta = document.getElementById('home-counsel-cta');
        if (homeCounselCta) {
            homeCounselCta.addEventListener('click', () => {
                const aiModal = document.getElementById('ai-modal');
                if (aiModal) {
                    aiModal.classList.remove('hidden');
                    setTimeout(() => {
                        document.getElementById('ai-query-input')?.focus();
                    }, 80);
                }
            });
        }

        // 3. Parthasarathi Prompt Pills on Home
        document.querySelectorAll('.counsel-prompt-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const query = pill.dataset.query || pill.textContent.trim().replace(/^"|"$/g, '');
                const aiModal = document.getElementById('ai-modal');
                const aiInput = document.getElementById('ai-query-input');
                if (aiModal && aiInput) {
                    aiInput.value = query;
                    aiModal.classList.remove('hidden');
                    this.submitAIQuery();
                }
            });
        });

        // 4. Prashna-Marg Dilemma Preview Cards on Home
        document.querySelectorAll('.home-dilemma-card').forEach(card => {
            card.addEventListener('click', () => {
                const mood = card.dataset.mood;
                if (mood) {
                    this.openDilemma(mood);
                }
            });
        });

        // 5. Sacred Soundscape Banner CTAs on Home
        const homeDhyanaBtn = document.getElementById('home-dhyana-chamber-btn');
        if (homeDhyanaBtn) {
            homeDhyanaBtn.addEventListener('click', () => this.navigateToScreen('dhyana'));
        }

        const homeDhyanaToggle = document.getElementById('home-dhyana-play-toggle');
        if (homeDhyanaToggle) {
            homeDhyanaToggle.addEventListener('click', () => {
                if (window.dhyanaAudio) {
                    const isPlaying = window.dhyanaAudio.toggleDrone();
                    homeDhyanaToggle.innerHTML = isPlaying
                        ? '<span><strong>Stillness Active</strong></span>'
                        : '<span>Harmonic Stillness</span>';
                    this.showToast(isPlaying ? 'Meditative Stillness Begun' : 'Stillness Paused', 'info');
                }
            });
        }

        // 6. Footer Back to Top
        const backToTopBtn = document.getElementById('footer-back-to-top');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    async loadDilemmas() {
        const grid = document.getElementById('dilemmas-grid');
        if (!grid) return;

        if (this.dilemmas.length === 0 && window.gitaApi) {
            grid.innerHTML = '<div class="loading-placeholder">Loading sacred remedies...</div>';
            this.dilemmas = await window.gitaApi.getDilemmas();
        }

        grid.innerHTML = '';
        this.dilemmas.forEach(d => {
            const isHindi = this.settings.language === 'hindi';
            const card = document.createElement('div');
            card.className = 'dilemma-card';
            const verseCount = d.verses ? d.verses.length : 0;
            card.innerHTML = `
                <div class="dilemma-card-header">
                    <span class="dilemma-category-tag">Prashna-Marg</span>
                    <h3 class="dilemma-title">${this.escapeHtml(isHindi ? (d.titleHindi || d.title) : d.title)}</h3>
                </div>
                <p class="dilemma-desc">${this.escapeHtml(d.description || '')}</p>
                <div class="dilemma-card-footer">
                    <span class="dilemma-verse-count">${verseCount} Prescribed Verses</span>
                    <span class="dilemma-explore-link">Seek Counsel →</span>
                </div>
            `;
            card.addEventListener('click', () => this.openDilemma(d.code));
            grid.appendChild(card);
        });
    }

    async openDilemma(code) {
        const container = document.getElementById('dilemma-detail-container');
        if (!container) return;

        container.innerHTML = '<div class="loading-placeholder">Seeking Krishna\'s counsel...</div>';
        this.navigateToScreen('dilemma-detail');

        let dilemma = this.dilemmas.find(d => d.code === code);
        if (!dilemma && window.gitaApi) {
            dilemma = await window.gitaApi.getDilemmaByCode(code);
        }
        if (!dilemma) return;

        const isHindi = this.settings.language === 'hindi';
        const title = isHindi ? (dilemma.titleHindi || dilemma.title) : dilemma.title;

        let versesHtml = '';
        if (dilemma.verses && dilemma.verses.length > 0) {
            versesHtml = dilemma.verses.map(v => `
                <div class="prescribed-verse-card" onclick="window.app.openPrescribedVerse(${v.chapterNumber || v.ch}, ${v.verseNumber || v.v})">
                    <div class="prescribed-verse-ref">Chapter ${v.chapterNumber || v.ch} • Verse ${v.verseNumber || v.v}</div>
                    <div class="prescribed-takeaway">"${this.escapeHtml(v.takeaway || '')}"</div>
                    <div class="prescribed-verse-link">Read verse & commentary →</div>
                </div>
            `).join('');
        }

        container.innerHTML = `
            <button class="dilemma-back-btn" onclick="window.app.navigateToScreen('dilemmas')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Back to Dilemmas</span>
            </button>
            <div class="dilemma-detail-header">
                <span class="dilemma-category-tag">Scriptural Remedy</span>
                <h2 class="dilemma-detail-title">${this.escapeHtml(title)}</h2>
            </div>
            <div class="dilemma-remedy-box">
                <div class="dilemma-remedy-title">Krishna's Prescription</div>
                <p class="dilemma-remedy-text">${this.escapeHtml(dilemma.prescription || '')}</p>
            </div>
            <h3 class="prescribed-verses-heading">Prescribed Verses for this State</h3>
            <div class="prescribed-verses-list">
                ${versesHtml}
            </div>
        `;
    }

    async openPrescribedVerse(ch, v) {
        this.currentChapter = ch;
        this.currentVerse = v;
        const chapter = this.getChapter(ch);
        if (chapter && (!chapter.verses || chapter.verses.length === 0)) {
            if (window.gitaApi) {
                const fullChapter = await window.gitaApi.getChapter(ch);
                chapter.verses = fullChapter.verses;
            }
        }
        this.navigateToReader();
    }

    toggleBreathingExercise() {
        const btn = document.getElementById('toggle-breath-timer');
        const circle = document.getElementById('breathing-circle');
        const phaseText = document.getElementById('breath-phase');
        const timerText = document.getElementById('breath-timer');

        if (this.isBreathingActive) {
            clearInterval(this.breathTimer);
            this.isBreathingActive = false;
            circle.className = 'breathing-circle';
            phaseText.textContent = 'Ready';
            timerText.textContent = 'Tap Start';
            btn.innerHTML = '<span>▶ Start Breathing</span>';
            btn.classList.add('primary');
            btn.classList.remove('secondary');
            return;
        }

        this.isBreathingActive = true;
        btn.innerHTML = '<span>⏹ Pause</span>';
        btn.classList.remove('primary');
        btn.classList.add('secondary');

        // 4-7-8 Pranayama Cycle
        const runCycle = () => {
            if (!this.isBreathingActive) return;

            // Inhale 4s
            circle.className = 'breathing-circle inhale';
            phaseText.textContent = 'Inhale';
            let sec = 4;
            timerText.textContent = `${sec}s`;
            const inhaleCountdown = setInterval(() => {
                sec--;
                if (sec > 0 && this.isBreathingActive) timerText.textContent = `${sec}s`;
                else clearInterval(inhaleCountdown);
            }, 1000);

            // Hold 7s
            setTimeout(() => {
                if (!this.isBreathingActive) return;
                circle.className = 'breathing-circle hold';
                phaseText.textContent = 'Hold';
                let holdSec = 7;
                timerText.textContent = `${holdSec}s`;
                const holdCountdown = setInterval(() => {
                    holdSec--;
                    if (holdSec > 0 && this.isBreathingActive) timerText.textContent = `${holdSec}s`;
                    else clearInterval(holdCountdown);
                }, 1000);
            }, 4000);

            // Exhale 8s
            setTimeout(() => {
                if (!this.isBreathingActive) return;
                circle.className = 'breathing-circle exhale';
                phaseText.textContent = 'Exhale';
                let exSec = 8;
                timerText.textContent = `${exSec}s`;
                const exCountdown = setInterval(() => {
                    exSec--;
                    if (exSec > 0 && this.isBreathingActive) timerText.textContent = `${exSec}s`;
                    else clearInterval(exCountdown);
                }, 1000);

                if (window.dhyanaAudio) {
                    window.dhyanaAudio.playTempleChime();
                }
            }, 11000);
        };

        runCycle();
        this.breathTimer = setInterval(runCycle, 19000); // 4 + 7 + 8 = 19 seconds per cycle
    }

    async openCanvasModal(ch = null, v = null) {
        const targetChapter = ch || this.currentChapter;
        const targetVerse = v || this.currentVerse;

        let chapter = this.getChapter(targetChapter);
        if (!chapter || !chapter.verses || chapter.verses.length === 0) {
            await this.loadChapter(targetChapter);
            chapter = this.getChapter(targetChapter);
        }

        let verse = this.getVerse(targetChapter, targetVerse);
        if (!verse && this.dailyVerse && this.dailyVerse.chapter === targetChapter && this.dailyVerse.verse === targetVerse) {
            verse = { ...this.dailyVerse };
        }
        if (!verse && this.dailyVerse) {
            verse = { ...this.dailyVerse };
        }
        if (!verse || !window.DivineCanvasGenerator) return;

        // Ensure explanation is attached if available in chapter
        if (!verse.explanation && chapter && chapter.verses) {
            const found = chapter.verses.find(v => (v.number === targetVerse || v.verseNumber === targetVerse));
            if (found && found.explanation) {
                verse.explanation = found.explanation;
            }
        }
        if (!verse.explanation && targetChapter === 2 && targetVerse === 47) {
            verse.explanation = {
                english: "This is one of the most famous verses in the Gita, establishing the principle of Karma Yoga. We have the right and responsibility to act, but not to control results. Neither should we claim to be the cause of outcomes, nor should we be attached to inaction.",
                hindi: "यह गीता के सबसे प्रसिद्ध श्लोकों में से एक है, जो कर्मयोग का सिद्धांत स्थापित करता है। हमारा अधिकार और जिम्मेदारी कर्म करने में है, परिणामों को नियंत्रित करने में नहीं। न हमें परिणामों का कारण होने का दावा करना चाहिए, न निष्क्रियता में आसक्त होना चाहिए।"
            };
        }

        this.canvasTarget = { verse, chapter: chapter || { title: 'Bhagavad Gita' }, ch: targetChapter, v: targetVerse };
        this.canvasOptions = {
            theme: this.canvasOptions?.theme || 'midnight',
            language: this.canvasOptions?.language || this.settings.language || 'english',
            showWatermark: true,
            showCommentary: this.canvasOptions?.showCommentary !== false
        };

        this.setupCanvasModalListeners();
        if (window.DivineCanvasGenerator) {
            await window.DivineCanvasGenerator.init();
        }
        this.updateCanvasCardPreview();
        document.getElementById('canvas-modal')?.classList.remove('hidden');
    }

    async updateCanvasCardPreview() {
        if (!this.canvasTarget || !window.DivineCanvasGenerator) return;
        const { verse, chapter } = this.canvasTarget;
        const previewImg = document.getElementById('canvas-card-preview');
        if (!previewImg) return;

        try {
            previewImg.style.opacity = '0.4';
            const dataUrl = await window.DivineCanvasGenerator.generateCardDataUrl(
                verse,
                chapter ? chapter.title : 'Bhagavad Gita',
                this.canvasOptions
            );
            previewImg.src = dataUrl;
            previewImg.style.opacity = '1';
        } catch (err) {
            console.error('Error generating card preview:', err);
        }
    }

    setupCanvasModalListeners() {
        if (this.canvasListenersSetup) return;
        this.canvasListenersSetup = true;

        // Theme selection pills
        document.querySelectorAll('.theme-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-pill').forEach(p => p.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                this.canvasOptions.theme = target.dataset.theme;
                this.updateCanvasCardPreview();
            });
        });

        // Language selection pills
        document.querySelectorAll('.lang-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                document.querySelectorAll('.lang-pill').forEach(p => p.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                this.canvasOptions.language = target.dataset.lang;
                this.updateCanvasCardPreview();
            });
        });

        // Commentary toggle
        const commentaryToggle = document.getElementById('canvas-commentary-toggle');
        if (commentaryToggle) {
            commentaryToggle.addEventListener('change', (e) => {
                this.canvasOptions.showCommentary = e.target.checked;
                this.updateCanvasCardPreview();
            });
        }

        // 1. Save Wisdom Card Button
        const downloadBtn = document.getElementById('download-canvas-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => {
                if (!this.canvasTarget) return;
                await window.DivineCanvasGenerator.downloadCard(
                    this.canvasTarget.verse,
                    this.canvasTarget.chapter.title,
                    this.canvasOptions
                );
                this.showToast('📥 Sacred Wisdom Card Saved!', 'success');
            });
        }

        // 2. Share to WhatsApp Button
        const waBtn = document.getElementById('whatsapp-share-btn');
        if (waBtn) {
            waBtn.addEventListener('click', async () => {
                if (!this.canvasTarget) return;
                this.showToast('Sharing to WhatsApp... 💬', 'info');
                await window.DivineCanvasGenerator.shareToWhatsApp(
                    this.canvasTarget.verse,
                    this.canvasTarget.chapter.title,
                    this.canvasOptions
                );
            });
        }

        // 3. Share to Instagram Button
        const igBtn = document.getElementById('instagram-share-btn');
        if (igBtn) {
            igBtn.addEventListener('click', async () => {
                if (!this.canvasTarget) return;
                const result = await window.DivineCanvasGenerator.shareToInstagram(
                    this.canvasTarget.verse,
                    this.canvasTarget.chapter.title,
                    this.canvasOptions
                );
                if (result.mode === 'download_and_copy') {
                    this.showToast('📸 Wisdom card saved & caption copied to clipboard!', 'success');
                } else if (result.success) {
                    this.showToast('Sharing to Instagram... 📸', 'success');
                }
            });
        }

        // 4. Copy Caption Button
        const copyBtn = document.getElementById('copy-caption-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                if (!this.canvasTarget) return;
                const ch = this.canvasTarget.ch;
                const v = this.canvasTarget.v;
                const verse = this.canvasTarget.verse;
                const text = this.getTranslation(verse);
                const caption = `Bhagavad Gita • Chapter ${ch}, Verse ${v}\n\n${verse.sanskrit || ''}\n\n"${text}"\n\n#ShlokPath #BhagavadGita #Philosophy #Sanskrit #AncientWisdom #DailyGita`;
                await navigator.clipboard.writeText(caption);
                this.showToast('Contemplation verse & translation copied', 'success');
            });
        }

        // Close button
        const closeBtn = document.getElementById('close-canvas-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('canvas-modal')?.classList.add('hidden');
            });
        }
    }

    openJournalModal() {
        const summary = document.getElementById('journal-verse-summary');
        if (summary) {
            summary.textContent = `Contemplating Chapter ${this.currentChapter} • Verse ${this.currentVerse}`;
        }
        document.getElementById('journal-modal')?.classList.remove('hidden');
    }

    async saveJournalReflection() {
        const reflection = document.getElementById('journal-reflection-input')?.value;
        const commitment = document.getElementById('journal-action-input')?.value;

        if (!reflection || !reflection.trim()) {
            this.showToast('Please write a short reflection before saving', 'error');
            return;
        }

        if (window.gitaApi) {
            await window.gitaApi.saveJournal(this.currentChapter, this.currentVerse, reflection, commitment);
        }

        this.showToast('Reflection saved to your Nishkama Karma journal! 🌟', 'success');
        document.getElementById('journal-modal')?.classList.add('hidden');
        document.getElementById('journal-reflection-input').value = '';
        document.getElementById('journal-action-input').value = '';
    }

    async submitAIQuery() {
        const input = document.getElementById('ai-query-input');
        const history = document.getElementById('ai-chat-history');
        if (!input || !history) return;

        const query = input.value.trim();
        if (!query) return;

        // Append user bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user';
        userBubble.textContent = query;
        history.appendChild(userBubble);
        input.value = '';
        history.scrollTop = history.scrollHeight;

        // Append loading bubble
        const loadingBubble = document.createElement('div');
        loadingBubble.className = 'chat-bubble ai';
        loadingBubble.textContent = 'Parthasarathi is contemplating your question...';
        history.appendChild(loadingBubble);
        history.scrollTop = history.scrollHeight;

        if (window.gitaApi) {
            const counsel = await window.gitaApi.askAdvisor(query, 'seeking guidance', this.settings.language);
            let citedHtml = '';
            if (counsel.citedVerses && counsel.citedVerses.length > 0) {
                citedHtml = counsel.citedVerses.map(cv => `
                    <div class="cited-shloka-box">
                        <strong>Chapter ${cv.chapter}, Verse ${cv.verse}</strong>: "${cv.translation}"
                    </div>
                `).join('');
            }

            loadingBubble.innerHTML = `
                <div class="ai-guidance-title">${this.escapeHtml(counsel.guidanceTitle || 'Parthasarathi:')}</div>
                <div class="ai-response-text">${counsel.response}</div>
                ${citedHtml}
                <div class="ai-contemplative-action">Action: ${this.escapeHtml(counsel.contemplativeAction || '')}</div>
            `;
            history.scrollTop = history.scrollHeight;
        }
    }

    // Language functions
    toggleLanguage() {
        this.settings.language = this.settings.language === 'english' ? 'hindi' : 'english';
        localStorage.setItem('gita-language-chosen', 'true');
        this.saveUserData();
        this.updateLanguageButton();
        this.refreshCurrentView();
        const langName = this.settings.language === 'hindi' ? 'हिन्दी' : 'English';
        this.showToast(`भाषा: ${langName}`, 'success');
    }

    updateLanguageButton() {
        const isHindi = this.settings.language === 'hindi';
        const languageBtn = document.getElementById('language-toggle');
        if (languageBtn) {
            languageBtn.innerHTML = `
                <span class="lang-icon">${isHindi ? 'अ' : 'A'}</span>
                <span class="lang-text">${isHindi ? 'ENG' : 'हिं'}</span>
            `;
            languageBtn.setAttribute('title', `Switch to ${isHindi ? 'English' : 'Hindi'}`);
        }
        const curLabel = document.getElementById('lang-current-label');
        const altLabel = document.getElementById('lang-alt-label');
        if (curLabel && altLabel) {
            curLabel.textContent = isHindi ? 'हिं' : 'ENG';
            altLabel.textContent = isHindi ? 'ENG' : 'हिं';
        }
    }

    refreshCurrentView() {
        if (this.currentScreen === 'reader') {
            this.loadReaderVerse();
        } else if (this.currentScreen === 'home') {
            this.updateDailyVerseDisplay();
        }
        this.buildSearchIndex();
    }

    setupSettingsEventListeners() {
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                if (theme) {
                    this.setTheme(theme);
                }
            });
        });

        const fontSizeSlider = document.getElementById('font-size');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                this.setFontSize(parseInt(e.target.value));
            });
        }

        const autoReveal = document.getElementById('auto-reveal');
        if (autoReveal) {
            autoReveal.addEventListener('change', (e) => {
                this.settings.autoReveal = e.target.checked;
                this.saveUserData();
            });
        }

        const hapticFeedback = document.getElementById('haptic-feedback');
        if (hapticFeedback) {
            hapticFeedback.addEventListener('change', (e) => {
                this.settings.hapticFeedback = e.target.checked;
                this.saveUserData();
            });
        }

        const resetProgress = document.getElementById('reset-progress');
        if (resetProgress) {
            resetProgress.addEventListener('click', () => this.resetProgress());
        }

        const clearBookmarks = document.getElementById('clear-bookmarks');
        if (clearBookmarks) {
            clearBookmarks.addEventListener('click', () => this.clearAllBookmarks());
        }
    }

    setupPWAEventListeners() {
        const installButton = document.getElementById('install-button');
        if (installButton) {
            installButton.addEventListener('click', () => this.installPWA());
        }

        const dismissInstall = document.getElementById('dismiss-install');
        if (dismissInstall) {
            dismissInstall.addEventListener('click', () => this.dismissInstallBanner());
        }
    }

    handleKeyboardNavigation(e) {
        if (this.currentScreen !== 'reader') return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousVerse();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextVerse();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.previousChapter();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.nextChapter();
                break;
            case ' ':
                e.preventDefault();
                this.toggleReveal();
                break;
            case 'b':
                e.preventDefault();
                this.toggleBookmark();
                break;
            case 'l':
                e.preventDefault();
                this.toggleLanguage();
                break;
        }
    }

    setupTouchGestures() {
        // Disable mobile pinch zoom, iOS gesture zoom, and accidental double-tap zoom
        document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

        let lastTouchEndTime = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEndTime <= 300) {
                if (!e.target.closest('input, textarea, select')) {
                    e.preventDefault();
                }
            }
            lastTouchEndTime = now;
        }, { passive: false });

        const readerScreen = document.getElementById('reader-screen');
        if (!readerScreen) return;

        let startX, startY, startTime;

        readerScreen.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
            this.touchStart = { x: startX, y: startY };
        }, { passive: true });

        readerScreen.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                this.touchEnd = { x: touch.clientX, y: touch.clientY };
            }
        }, { passive: true });

        readerScreen.addEventListener('touchend', (e) => {
            const endTime = Date.now();
            const timeDiff = endTime - startTime;
            if (timeDiff < 300) {
                this.handleSwipeGesture();
            }
        }, { passive: true });

        const verseDisplay = document.getElementById('verse-display');
        if (verseDisplay) {
            verseDisplay.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.toggleReveal();
                }
            });
        }
    }

    handleSwipeGesture() {
        const deltaX = this.touchEnd.x - this.touchStart.x;
        const deltaY = this.touchEnd.y - this.touchStart.y;
        const minSwipeDistance = 50;
        const maxVerticalDeviation = 100;

        if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalDeviation) {
            if (deltaX > 0) {
                this.previousVerse();
            } else {
                this.nextVerse();
            }
            this.hapticFeedback();
        } else if (Math.abs(deltaY) > minSwipeDistance && Math.abs(deltaX) < maxVerticalDeviation) {
            if (deltaY > 0) {
                this.previousChapter();
            } else {
                this.nextChapter();
            }
            this.hapticFeedback();
        }
    }

    setupPWA() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallBanner();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.showToast('App installed successfully!', 'success');
            this.dismissInstallBanner();
        });
    }

    initializeApp() {
        try {
            this.setDailyVerse();
            this.updateHomeScreen();
            this.renderChapters();
            this.loadReaderVerse();
            this.applySettings();
            this.updateLanguageButton();
            console.log('App initialization complete');
        } catch (error) {
            console.error('Error during app initialization:', error);
            this.showToast('Error initializing app', 'error');
        }
    }

    async setDailyVerse() {
        // Immediate default: Chapter 2, Verse 47 (The crown jewel of the Gita)
        this.dailyVerse = {
            chapter: 2,
            verse: 47,
            sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
            transliteration: "karmaṇy-evādhikāras te mā phaleṣhu kadāchana\nmā karma-phala-hetur bhūr mā te saṅgo 'stvakarmaṇi",
            translation: {
                english: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself to be the cause of results, nor be attached to inaction.",
                hindi: "तुम्हारा अधिकार केवल कर्म करने में है, उसके फलों में कभी नहीं। इसलिए तुम कर्मों के फल के हेतु मत बनो और तुम्हारी अकर्मण्यता में भी आसक्ति न हो।"
            },
            explanation: {
                english: "This sacred verse expounds the foundational doctrine of Karma Yoga: perform action purely as self-offering, free from the thirst for reward. True inner mastery arises when one remains unperturbed by triumph or defeat, focusing entirely on righteous duty without succumbing to the paralysis of inaction.",
                hindi: "यह श्लोक निष्काम कर्मयोग का सार समझाता है: कर्तव्य का पालन निस्वार्थ भाव से करें और फल की तृष्णा से मुक्त रहें। सफलता या असफलता में समभाव रखना ही योग है।"
            }
        };
        this.updateDailyVerseDisplay();

        try {
            if (window.gitaApi) {
                const apiDaily = await window.gitaApi.getDailyVerse();
                if (apiDaily && apiDaily.verse) {
                    this.dailyVerse = {
                        chapter: apiDaily.verse.chapterNumber || (apiDaily.verse.chapter ? apiDaily.verse.chapter.chapterNumber : 2),
                        verse: apiDaily.verse.verseNumber || 47,
                        ...apiDaily.verse
                    };
                    this.updateDailyVerseDisplay();
                }
            }
        } catch (e) {
            console.log('Using canonical daily verse');
        }
    }

    formatSanskritHtml(raw) {
        if (!raw) return '';
        // 1. Remove trailing numbers like ।।2.56।। or ||2.56|| or ॥५६॥ or 2.56
        let clean = raw
            .replace(/[।॥|\(\[\{]+\s*[\d\.\s\u0966-\u096F\-\:]+\s*[।॥|\)\]\}]*/g, '')
            .replace(/\s*[\d\.\s\u0966-\u096F\-\:]+\s*[।॥|]+$/g, '')
            .replace(/[।॥|]+\s*[\d\.\s\u0966-\u096F\-\:]+$/g, '')
            .trim();

        // 2. Normalize double dandas
        clean = clean.replace(/।।|\|\|/g, '॥').replace(/\|/g, '।');

        // 3. Split into lines
        let lines = clean.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 1 && lines[0].includes('।')) {
            const idx = lines[0].indexOf('।');
            if (idx > -1 && idx < lines[0].length - 1) {
                lines = [
                    lines[0].substring(0, idx + 1).trim(),
                    lines[0].substring(idx + 1).trim()
                ];
            }
        }

        // Format line 1 (ends with single danda)
        if (lines[0]) {
            lines[0] = lines[0].replace(/[।॥]+$/g, '').trim() + '।';
        }

        // Format line 2 (ends with double danda)
        if (lines[1]) {
            lines[1] = lines[1].replace(/[।॥]+$/g, '').trim() + '॥';
        } else if (lines[0]) {
            lines[0] = lines[0].replace(/[।॥]+$/g, '').trim() + '॥';
        }

        return lines.map(line => `<span class="shlok-line">${this.escapeHtml(line)}</span>`).join('');
    }

    updateDailyVerseDisplay() {
        if (!this.dailyVerse) return;

        const sanskritText = this.dailyVerse.sanskrit || '';
        const translationText = this.getTranslation(this.dailyVerse);
        const referenceText = `Chapter ${this.dailyVerse.chapter} • Verse ${this.dailyVerse.verse}`;
        const formattedSanskritHtml = this.formatSanskritHtml(sanskritText);

        // Desktop Daily Verse
        const sanskritEl = document.getElementById('daily-sanskrit');
        const translationEl = document.getElementById('daily-translation');
        const referenceEl = document.getElementById('daily-reference');
        if (sanskritEl) sanskritEl.innerHTML = formattedSanskritHtml;
        if (translationEl) translationEl.textContent = translationText;
        if (referenceEl) referenceEl.textContent = referenceText;

        // Native Mobile App Daily Verse
        const mSanskritEl = document.getElementById('mobile-daily-sanskrit');
        const mTranslationEl = document.getElementById('mobile-daily-translation');
        const mReferenceEl = document.getElementById('mobile-daily-reference');
        if (mSanskritEl) mSanskritEl.innerHTML = formattedSanskritHtml;
        if (mTranslationEl) mTranslationEl.textContent = translationText;
        if (mReferenceEl) mReferenceEl.textContent = referenceText;
    }

    updateHomeScreen() {
        try {
            const totalVerses = this.getTotalVerses();
            const readVerses = Object.keys(this.readingProgress).length;
            const bookmarkCount = this.bookmarks.size;
            const streak = this.calculateStreak();
            const percentage = totalVerses > 0 ? Math.round((readVerses / totalVerses) * 100) : 0;

            this.updateElement('total-read', readVerses.toString());
            this.updateElement('streak-count', streak.toString());
            this.updateElement('bookmark-count', bookmarkCount.toString());
            this.updateElement('progress-percentage', `${percentage}%`);

            // Native Mobile App Streak & Resume Title
            const mobileStreakLabel = document.getElementById('mobile-streak-label');
            if (mobileStreakLabel) {
                mobileStreakLabel.textContent = `${streak} Day Streak`;
            }

            const mobileResumeTitle = document.getElementById('mobile-resume-title');
            if (mobileResumeTitle && this.currentChapter) {
                mobileResumeTitle.textContent = `Chapter ${this.currentChapter}: Verse ${this.currentVerse || 1}`;
            }

            const mobileReadingProgress = document.getElementById('mobile-reading-progress');
            if (mobileReadingProgress) {
                mobileReadingProgress.style.width = `${Math.max(8, percentage)}%`;
            }

            const progressFill = document.getElementById('overall-progress');
            if (progressFill) {
                progressFill.style.width = `${percentage}%`;
            }
        } catch (error) {
            console.error('Error updating home screen:', error);
        }
    }

    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    toRoman(num) {
        const romanMap = [
            [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
        ];
        let roman = '';
        let n = num;
        for (const [val, letter] of romanMap) {
            while (n >= val) {
                roman += letter;
                n -= val;
            }
        }
        return roman || 'I';
    }

    renderChapters() {
        const chaptersGrid = document.getElementById('chapters-grid');
        const homeChaptersGrid = document.getElementById('home-chapters-grid');
        if (!this.gitaData || !this.gitaData.chapters) return;

        if (chaptersGrid) {
            chaptersGrid.innerHTML = '';
            this.gitaData.chapters.forEach(chapter => {
                chaptersGrid.appendChild(this.createChapterCard(chapter));
            });
        }

        if (homeChaptersGrid) {
            homeChaptersGrid.innerHTML = '';
            // First 6 chapters preview grid on home screen
            this.gitaData.chapters.slice(0, 6).forEach(chapter => {
                homeChaptersGrid.appendChild(this.createChapterCard(chapter));
            });
        }

        // Also populate reader chapter select dropdown
        this.populateReaderChapterSelect();
    }

    populateReaderChapterSelect() {
        const select = document.getElementById('reader-chapter-select');
        if (!select || !this.gitaData || !this.gitaData.chapters) return;
        select.innerHTML = '';
        this.gitaData.chapters.forEach(ch => {
            const opt = document.createElement('option');
            opt.value = ch.number;
            const sanskrit = ch.titleSanskrit || ch.name_translation || ch.title;
            opt.textContent = `Chapter ${ch.number}: ${sanskrit}`;
            select.appendChild(opt);
        });
        select.value = this.currentChapter;
    }

    filterChaptersByCategory(category) {
        const chaptersGrid = document.getElementById('chapters-grid');
        if (!chaptersGrid || !this.gitaData || !this.gitaData.chapters) return;

        let filtered = this.gitaData.chapters;
        if (category === 'karma') {
            filtered = this.gitaData.chapters.filter(ch => ch.number >= 1 && ch.number <= 6);
        } else if (category === 'bhakti') {
            filtered = this.gitaData.chapters.filter(ch => ch.number >= 7 && ch.number <= 12);
        } else if (category === 'jnana') {
            filtered = this.gitaData.chapters.filter(ch => ch.number >= 13 && ch.number <= 18);
        }

        chaptersGrid.innerHTML = '';
        filtered.forEach(chapter => {
            chaptersGrid.appendChild(this.createChapterCard(chapter));
        });
    }

    createChapterCard(chapter) {
        const card = document.createElement('div');
        card.className = 'chapter-card';
        card.addEventListener('click', () => this.openChapter(chapter.number));

        const totalVerses = chapter.verses && chapter.verses.length > 0 ? chapter.verses.length : (chapter.verseCount || 0);
        const sanskritName = chapter.sanskritName || chapter.titleSanskrit || '';
        const englishTitle = chapter.title || '';
        const subtitle = chapter.subtitle || '';
        const romanNumeral = this.toRoman(chapter.number);

        card.innerHTML = `
            <div class="chapter-number">${romanNumeral}</div>
            ${sanskritName ? `<div class="chapter-name-sanskrit">${this.escapeHtml(sanskritName)}</div>` : ''}
            <div class="chapter-name-english">${this.escapeHtml(englishTitle)}</div>
            ${subtitle ? `<div class="chapter-theme-preview">${this.escapeHtml(subtitle)}</div>` : ''}
            <div class="chapter-verse-count">${totalVerses} Verses</div>
        `;

        return card;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    navigateToScreen(screenName) {
        try {
            const screens = document.querySelectorAll('.screen');
            const navItems = document.querySelectorAll('.nav-item');
            const desktopNavLinks = document.querySelectorAll('.desktop-nav-link');

            navItems.forEach(item => {
                item.classList.toggle('active', item.dataset.screen === screenName);
            });

            desktopNavLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.screen === screenName);
            });

            screens.forEach(screen => {
                screen.classList.toggle('active', screen.id === `${screenName}-screen`);
            });

            this.updateHeader(screenName);
            this.currentScreen = screenName;

            if (window.seoRouter && screenName !== 'reader') {
                window.seoRouter.updateRoute(screenName);
            }

            // Scroll to top of content
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (screenName === 'search') {
                setTimeout(() => this.focusSearchInput(), 300);
            } else if (screenName === 'dilemmas') {
                this.loadDilemmas();
            }
        } catch (error) {
            console.error('Error navigating to screen:', error);
        }
    }

    updateHeader(screenName) {
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) {
            headerTitle.textContent = 'ShlokPath';
        }

        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.classList.toggle('hidden', screenName !== 'reader' && screenName !== 'dilemma-detail');
        }
    }

    getChapterTitle() {
        const chapter = this.getChapter(this.currentChapter);
        return chapter ? `Chapter ${chapter.number}` : 'Chapter';
    }

    navigateToReader() {
        this.navigateToScreen('reader');
        this.loadReaderVerse();
    }

    navigateBack() {
        if (this.currentScreen === 'reader') {
            this.navigateToScreen('chapters');
        } else if (this.currentScreen === 'dilemma-detail') {
            this.navigateToScreen('dilemmas');
        } else {
            this.navigateToScreen('home');
        }
    }

    async openChapter(chapterNumber) {
        if (this.isValidChapter(chapterNumber)) {
            this.currentChapter = chapterNumber;
            this.currentVerse = 1;
            await this.loadChapter(chapterNumber);
            this.navigateToReader();
        }
    }

    async openDailyVerse() {
        if (this.dailyVerse) {
            this.currentChapter = this.dailyVerse.chapter;
            this.currentVerse = this.dailyVerse.verse;
            await this.loadChapter(this.currentChapter);
            this.navigateToReader();
        }
    }

    async loadReaderVerse() {
        try {
            let chapter = this.getChapter(this.currentChapter);
            if (!chapter) {
                console.error('Chapter not found:', this.currentChapter);
                return;
            }

            if (!chapter.verses || chapter.verses.length === 0) {
                await this.loadChapter(this.currentChapter);
                chapter = this.getChapter(this.currentChapter);
            }

            const verse = this.getVerse(this.currentChapter, this.currentVerse);
            if (!verse) {
                console.error('Verse not found:', this.currentChapter, this.currentVerse);
                return;
            }

            this.updateElement('reader-chapter-title', chapter.title || '');
            const total = chapter.verses ? chapter.verses.length : (chapter.verseCount || 0);
            this.updateElement('reader-verse-count', `Verse ${this.currentVerse} of ${total}`);
            this.updateElement('current-verse-number', this.currentVerse.toString());
            
            const currentSanskritEl = document.getElementById('current-sanskrit');
            if (currentSanskritEl) {
                currentSanskritEl.innerHTML = this.formatSanskritHtml(verse.sanskrit || '');
            }
            this.updateElement('current-transliteration', verse.transliteration || '');

            const badge = document.getElementById('current-verse-badge');
            if (badge) badge.textContent = `CHAPTER ${this.currentChapter} • VERSE ${this.currentVerse}`;

            const chSelect = document.getElementById('reader-chapter-select');
            if (chSelect) chSelect.value = this.currentChapter;

            this.updateReaderTranslationDisplay();
            this.updateElement('current-explanation', this.getExplanation(verse));

            this.isRevealed = this.settings.autoReveal;
            this.updateRevealState();
            this.updateBookmarkButton();
            this.markAsRead(this.currentChapter, this.currentVerse);
            this.saveUserData();
            this.updateHomeScreen();

            if (this.currentScreen === 'reader' && window.seoRouter) {
                window.seoRouter.updateRoute('reader', {
                    chapter: this.currentChapter,
                    verse: this.currentVerse,
                    chapterTitle: chapter.title
                });
            }
        } catch (error) {
            console.error('Error loading reader verse:', error);
            this.showToast('Error loading verse', 'error');
        }
    }

    updateReaderTranslationDisplay() {
        const verse = this.getVerse(this.currentChapter, this.currentVerse);
        if (!verse) return;
        const transEl = document.getElementById('current-translation');
        if (!transEl) return;

        let text = '';
        const lang = this.activeReaderLang || this.settings.language || 'english';
        if (verse.translation) {
            if (typeof verse.translation === 'string') {
                text = verse.translation;
            } else {
                text = verse.translation[lang] || verse.translation.english || verse.translation.hindi || '';
            }
        }
        transEl.textContent = text || 'Loading translation...';
    }

    updateRevealState() {
        const elements = {
            transliteration: document.getElementById('current-transliteration'),
            translation: document.getElementById('current-translation'),
            explanation: document.getElementById('current-explanation'),
            revealBtn: document.getElementById('reveal-btn')
        };

        if (this.isRevealed) {
            elements.transliteration?.classList.remove('hidden');
            elements.translation?.classList.remove('hidden');
            elements.explanation?.classList.remove('hidden');
            if (elements.revealBtn) elements.revealBtn.textContent = 'Hide meaning';
        } else {
            elements.transliteration?.classList.add('hidden');
            elements.translation?.classList.add('hidden');
            elements.explanation?.classList.add('hidden');
            if (elements.revealBtn) elements.revealBtn.textContent = 'Tap to reveal meaning';
        }
    }

    toggleReveal() {
        this.isRevealed = !this.isRevealed;
        this.updateRevealState();
        this.hapticFeedback();
    }

    nextVerse() {
        const chapter = this.getChapter(this.currentChapter);
        if (!chapter || !chapter.verses) return;

        if (this.currentVerse < chapter.verses.length) {
            this.currentVerse++;
        } else if (this.currentChapter < this.gitaData.chapters.length) {
            this.currentChapter++;
            this.currentVerse = 1;
        } else {
            this.showToast('You have reached the end of the Gita', 'info');
            return;
        }

        this.loadReaderVerse();
    }

    previousVerse() {
        if (this.currentVerse > 1) {
            this.currentVerse--;
        } else if (this.currentChapter > 1) {
            this.currentChapter--;
            const prevChapter = this.getChapter(this.currentChapter);
            if (prevChapter && prevChapter.verses) {
                this.currentVerse = prevChapter.verses.length;
            }
        } else {
            this.showToast('You are at the beginning of the Gita', 'info');
            return;
        }

        this.loadReaderVerse();
    }

    nextChapter() {
        if (this.currentChapter < this.gitaData.chapters.length) {
            this.currentChapter++;
            this.currentVerse = 1;
            this.loadReaderVerse();
        } else {
            this.showToast('You are at the last chapter', 'info');
        }
    }

    previousChapter() {
        if (this.currentChapter > 1) {
            this.currentChapter--;
            this.currentVerse = 1;
            this.loadReaderVerse();
        } else {
            this.showToast('You are at the first chapter', 'info');
        }
    }

    toggleBookmark() {
        const verseKey = `${this.currentChapter}:${this.currentVerse}`;
        
        if (this.bookmarks.has(verseKey)) {
            this.bookmarks.delete(verseKey);
            this.showToast('Bookmark removed', 'info');
        } else {
            this.bookmarks.add(verseKey);
            this.showToast('Verse bookmarked', 'success');
        }

        this.updateBookmarkButton();
        this.updateHomeScreen();
        this.saveUserData();
        this.hapticFeedback();
    }

    updateBookmarkButton() {
        const verseKey = `${this.currentChapter}:${this.currentVerse}`;
        const bookmarkIcon = document.querySelector('.bookmark-icon');
        if (!bookmarkIcon) return;

        const isBookmarked = this.bookmarks.has(verseKey);
        bookmarkIcon.classList.toggle('bookmarked', isBookmarked);

        if (isBookmarked) {
            bookmarkIcon.classList.add('bookmark-animation');
            setTimeout(() => {
                bookmarkIcon.classList.remove('bookmark-animation');
            }, 600);
        }
    }

    shareVerse() {
        try {
            const verse = this.getVerse(this.currentChapter, this.currentVerse);
            const chapter = this.getChapter(this.currentChapter);

            if (!verse || !chapter) {
                this.showToast('Unable to share verse', 'error');
                return;
            }

            const shareText = `${verse.sanskrit}\n\n"${this.getTranslation(verse)}"\n\n— Bhagavad Gita ${chapter.number}.${verse.number}\nvia ShlokPath`;
            const shareTitle = `Bhagavad Gita ${chapter.number}.${verse.number} — ShlokPath`;

            if (navigator.share && navigator.canShare && navigator.canShare({ text: shareText })) {
                navigator.share({
                    title: shareTitle,
                    text: shareText
                }).catch(error => {
                    console.error('Error sharing:', error);
                    this.fallbackShare(shareText);
                });
            } else {
                this.fallbackShare(shareText);
            }

            this.hapticFeedback();
        } catch (error) {
            console.error('Error in shareVerse:', error);
            this.showToast('Unable to share verse', 'error');
        }
    }

    fallbackShare(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Verse copied to clipboard', 'success');
            }).catch(() => {
                this.showToast('Unable to copy verse', 'error');
            });
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                this.showToast('Verse copied to clipboard', 'success');
            } catch (error) {
                this.showToast('Unable to copy verse', 'error');
            }
            document.body.removeChild(textarea);
        }
    }

    toggleSearch() {
        const searchContainer = document.getElementById('search-container');
        if (!searchContainer) return;

        const isHidden = searchContainer.classList.contains('hidden');
        searchContainer.classList.toggle('hidden');

        if (isHidden) {
            setTimeout(() => this.focusSearchInput(), 100);
        } else {
            this.clearSearch();
        }
    }

    focusSearchInput() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    handleSearch(query) {
        if (!query || !query.trim()) {
            this.clearSearchResults();
            return;
        }

        try {
            const results = this.searchVerses(query.trim());
            this.displaySearchResults(results, query);
        } catch (error) {
            console.error('Error in search:', error);
            this.showToast('Search error occurred', 'error');
        }
    }

    searchVerses(query) {
        if (!this.searchIndex || this.searchIndex.length === 0) {
            return [];
        }

        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);

        return this.searchIndex.filter(verse => {
            const searchableText = [
                verse.sanskrit || '',
                verse.transliteration || '',
                this.getTranslation(verse),
                this.getExplanation(verse),
                ...(verse.keywords || [])
            ].join(' ').toLowerCase();

            return searchTerms.every(term => searchableText.includes(term));
        }).slice(0, 50);
    }

    displaySearchResults(results, query = '') {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <h3>No verses found for "${this.escapeHtml(query)}"</h3>
                    <p>Try different keywords or check spelling</p>
                </div>
            `;
            return;
        }

        const resultsHTML = results.map(result => `
            <div class="search-result-item" onclick="app.openSearchResult(${result.chapterNumber}, ${result.verseNumber})">
                <div class="search-result-ref">Chapter ${result.chapterNumber} • Verse ${result.verseNumber}</div>
                <div class="search-result-sanskrit">${this.escapeHtml(result.sanskrit)}</div>
                <div class="search-result-translation">${this.escapeHtml(result.translation)}</div>
            </div>
        `).join('');

        resultsContainer.innerHTML = `
            <div class="search-results-header">
                <h3>${results.length} verse${results.length !== 1 ? 's' : ''} found</h3>
            </div>
            ${resultsHTML}
        `;
    }

    openSearchResult(chapterNumber, verseNumber) {
        this.currentChapter = chapterNumber;
        this.currentVerse = verseNumber;
        this.navigateToReader();
        this.clearSearch();
    }

    clearSearch() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        
        if (searchInput) searchInput.value = '';
        if (searchResults) searchResults.innerHTML = '';
    }

    clearSearchResults() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) searchResults.innerHTML = '';
    }

    // Helper methods (add the missing methods from your original file)
    getTotalVerses() {
        if (!this.gitaData || !this.gitaData.chapters) return 700;
        return this.gitaData.chapters.reduce((total, chapter) => {
            return total + (chapter.verses ? chapter.verses.length : (chapter.verseCount || 0));
        }, 0);
    }

    getChapter(chapterNumber) {
        if (!this.gitaData || !this.gitaData.chapters) return null;
        return this.gitaData.chapters.find(chapter => chapter.number === chapterNumber);
    }

    async loadChapter(chapterNumber) {
        if (!this.gitaData || !this.gitaData.chapters) return null;
        let chapter = this.getChapter(chapterNumber);
        if (!chapter) return null;
        if (chapter.verses && chapter.verses.length > 0) return chapter;

        if (window.gitaApi) {
            try {
                const fullChapter = await window.gitaApi.getChapter(chapterNumber);
                if (fullChapter && fullChapter.verses) {
                    chapter.verses = fullChapter.verses;
                    return chapter;
                }
            } catch (err) {
                console.warn(`Failed to fetch chapter ${chapterNumber} via gitaApi:`, err);
            }
        }

        try {
            const paddedNum = String(chapterNumber).padStart(2, '0');
            const res = await fetch(`/data/chapters/chapter_${paddedNum}.json`);
            if (res.ok) {
                const fullChapter = await res.json();
                if (fullChapter && fullChapter.verses) {
                    chapter.verses = fullChapter.verses;
                    return chapter;
                }
            }
        } catch (err) {
            console.error(`Error loading chapter ${chapterNumber}:`, err);
        }

        return chapter;
    }

    getVerse(chapterNumber, verseNumber) {
        const chapter = this.getChapter(chapterNumber);
        if (!chapter || !chapter.verses) return null;
        return chapter.verses.find(verse => (verse.number === verseNumber || verse.verseNumber === verseNumber));
    }

    isValidChapter(chapterNumber) {
        return this.getChapter(chapterNumber) !== null;
    }

    getChapterProgress(chapterNumber) {
        let count = 0;
        Object.keys(this.readingProgress).forEach(key => {
            const [chapter] = key.split(':').map(Number);
            if (chapter === chapterNumber) count++;
        });
        return count;
    }

    markAsRead(chapterNumber, verseNumber) {
        const key = `${chapterNumber}:${verseNumber}`;
        this.readingProgress[key] = Date.now();
    }

    calculateStreak() {
        // Simple streak calculation - can be enhanced
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        const readToday = Object.values(this.readingProgress).some(timestamp => 
            new Date(timestamp).toDateString() === today
        );
        
        const readYesterday = Object.values(this.readingProgress).some(timestamp => 
            new Date(timestamp).toDateString() === yesterday
        );

        return readToday ? (readYesterday ? 2 : 1) : 0;
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    hapticFeedback() {
        if (this.settings.hapticFeedback && navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    // Add other missing methods like setTheme, setFontSize, etc.
    setTheme(theme) {
        const validTheme = theme === 'light' ? 'light' : 'dark';
        this.settings.theme = validTheme;
        document.documentElement.setAttribute('data-theme', validTheme);
        this.saveUserData();

        // Update Theme Toggle Button in Header
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.title = validTheme === 'dark'
                ? 'Switch to Light Theme'
                : 'Switch to Dark Theme';
            themeBtn.innerHTML = validTheme === 'dark'
                ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
                : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
        }

        // Update Theme buttons in Settings
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === validTheme);
        });
    }

    cycleTheme() {
        const nextTheme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.setTheme(nextTheme);
        this.showToast(nextTheme === 'light' ? 'Imperial Linen theme activated' : 'Manuscript Obsidian theme activated');
    }

    setFontSize(size) {
        this.settings.fontSize = size;
        document.documentElement.style.setProperty('--font-size-base', `${size}px`);
        const display = document.getElementById('font-size-display');
        if (display) display.textContent = `${size}px`;
        this.saveUserData();
    }

    applySettings() {
        this.setTheme(this.settings.theme);
        this.setFontSize(this.settings.fontSize);
        
        const autoRevealCheckbox = document.getElementById('auto-reveal');
        if (autoRevealCheckbox) autoRevealCheckbox.checked = this.settings.autoReveal;
        
        const hapticCheckbox = document.getElementById('haptic-feedback');
        if (hapticCheckbox) hapticCheckbox.checked = this.settings.hapticFeedback;
        
        const fontSlider = document.getElementById('font-size');
        if (fontSlider) fontSlider.value = this.settings.fontSize;

        const display = document.getElementById('font-size-display');
        if (display) display.textContent = `${this.settings.fontSize}px`;
    }

    // Placeholder methods for missing functionality
    showBookmarksSearch() {
        // Implementation for showing bookmarked verses
        console.log('Show bookmarks search');
    }

    resetProgress() {
        if (confirm('Are you sure you want to reset all reading progress?')) {
            this.readingProgress = {};
            this.saveUserData();
            this.updateHomeScreen();
            this.showToast('Reading progress reset', 'success');
        }
    }

    clearAllBookmarks() {
        if (confirm('Are you sure you want to clear all bookmarks?')) {
            this.bookmarks.clear();
            this.saveUserData();
            this.updateHomeScreen();
            this.updateBookmarkButton();
            this.showToast('All bookmarks cleared', 'success');
        }
    }

    showInstallBanner() {
        const banner = document.getElementById('install-banner');
        if (banner) banner.classList.remove('hidden');
    }

    dismissInstallBanner() {
        const banner = document.getElementById('install-banner');
        if (banner) banner.classList.add('hidden');
    }

    installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                this.deferredPrompt = null;
            });
        }
    }
}

// Initialize the app
const app = new GitaApp();
window.app = app;
