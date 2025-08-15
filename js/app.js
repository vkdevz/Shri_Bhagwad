// Shrimad Bhagavad Gita Mobile App
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
            theme: 'divine',
            fontSize: 16,
            autoReveal: false,
            hapticFeedback: true,
            language: 'english' // Default language
        };
        this.touchStart = { x: 0, y: 0 };
        this.touchEnd = { x: 0, y: 0 };
        this.isRevealed = false;
        this.dailyVerse = null;
        this.deferredPrompt = null;
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
            const response = await fetch('data/gita-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.gitaData = await response.json();
            this.buildSearchIndex();
            console.log('Gita data loaded successfully');
        } catch (error) {
            console.error('Error loading Gita data:', error);
            this.showToast('Failed to load scripture data. Please check your connection.', 'error');
            throw error;
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
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const screen = e.currentTarget.dataset.screen;
                if (screen) {
                    this.navigateToScreen(screen);
                }
            });
        });

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

        // Language toggle button
        const languageToggle = document.getElementById('language-toggle');
        if (languageToggle) {
            languageToggle.addEventListener('click', () => this.toggleLanguage());
        }

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
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

        // Home screen actions
        const continueReading = document.getElementById('continue-reading');
        if (continueReading) {
            continueReading.addEventListener('click', () => this.navigateToReader());
        }

        const viewBookmarks = document.getElementById('view-bookmarks');
        if (viewBookmarks) {
            viewBookmarks.addEventListener('click', () => this.showBookmarksSearch());
        }

        const dailyVerse = document.getElementById('daily-verse');
        if (dailyVerse) {
            dailyVerse.addEventListener('click', () => this.openDailyVerse());
        }

        // Settings
        this.setupSettingsEventListeners();

        // PWA install
        this.setupPWAEventListeners();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));

        console.log('Event listeners setup complete');
    }

    // Language functions
    toggleLanguage() {
        this.settings.language = this.settings.language === 'english' ? 'hindi' : 'english';
        this.saveUserData();
        this.updateLanguageButton();
        this.refreshCurrentView();
        this.showToast(`Language switched to ${this.settings.language.charAt(0).toUpperCase() + this.settings.language.slice(1)}`, 'success');
    }

    updateLanguageButton() {
        const languageBtn = document.getElementById('language-toggle');
        if (languageBtn) {
            const isHindi = this.settings.language === 'hindi';
            languageBtn.innerHTML = `
                <span class="lang-icon">${isHindi ? 'अ' : 'A'}</span>
                <span class="lang-text">${isHindi ? 'ENG' : 'हिं'}</span>
            `;
            languageBtn.setAttribute('title', `Switch to ${isHindi ? 'English' : 'Hindi'}`);
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
            navigator.serviceWorker.register('service-worker.js')
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

    setDailyVerse() {
        if (!this.gitaData || !this.gitaData.chapters) return;

        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
        const totalVerses = this.getTotalVerses();
        if (totalVerses === 0) return;

        const verseIndex = dayOfYear % totalVerses;
        let currentIndex = 0;

        for (const chapter of this.gitaData.chapters) {
            if (!chapter.verses) continue;
            for (const verse of chapter.verses) {
                if (currentIndex === verseIndex) {
                    this.dailyVerse = {
                        chapter: chapter.number,
                        verse: verse.number,
                        ...verse
                    };
                    this.updateDailyVerseDisplay();
                    return;
                }
                currentIndex++;
            }
        }
    }

    updateDailyVerseDisplay() {
        if (!this.dailyVerse) return;

        const sanskritEl = document.getElementById('daily-sanskrit');
        const translationEl = document.getElementById('daily-translation');
        const referenceEl = document.getElementById('daily-reference');

        if (sanskritEl) sanskritEl.textContent = this.dailyVerse.sanskrit || '';
        if (translationEl) translationEl.textContent = this.getTranslation(this.dailyVerse);
        if (referenceEl) {
            referenceEl.textContent = `Chapter ${this.dailyVerse.chapter} • Verse ${this.dailyVerse.verse}`;
        }
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

    renderChapters() {
        const chaptersGrid = document.getElementById('chapters-grid');
        if (!chaptersGrid || !this.gitaData || !this.gitaData.chapters) return;

        chaptersGrid.innerHTML = '';
        this.gitaData.chapters.forEach(chapter => {
            const chapterCard = this.createChapterCard(chapter);
            chaptersGrid.appendChild(chapterCard);
        });
    }

    createChapterCard(chapter) {
        const card = document.createElement('div');
        card.className = 'chapter-card';
        card.addEventListener('click', () => this.openChapter(chapter.number));

        const totalVerses = chapter.verses ? chapter.verses.length : 0;
        const readVerses = this.getChapterProgress(chapter.number);
        const progress = totalVerses > 0 ? Math.round((readVerses / totalVerses) * 100) : 0;

        card.innerHTML = `
            <div class="chapter-number">${chapter.number}</div>
            <div class="chapter-info">
                <h3 class="chapter-title">${this.escapeHtml(chapter.title || '')}</h3>
                <p class="chapter-subtitle">${this.escapeHtml(chapter.subtitle || '')}</p>
                <div class="chapter-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${readVerses}/${totalVerses} verses</span>
                </div>
            </div>
            <div class="chapter-theme">${this.escapeHtml(chapter.theme || '')}</div>
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

            navItems.forEach(item => {
                item.classList.toggle('active', item.dataset.screen === screenName);
            });

            screens.forEach(screen => {
                screen.classList.toggle('active', screen.id === `${screenName}-screen`);
            });

            this.updateHeader(screenName);
            this.currentScreen = screenName;

            if (screenName === 'search') {
                setTimeout(() => this.focusSearchInput(), 300);
            }
        } catch (error) {
            console.error('Error navigating to screen:', error);
        }
    }

    updateHeader(screenName) {
        const titles = {
            home: 'Shrimad Bhagavad Gita',
            chapters: 'Chapters',
            search: 'Search Verses',
            settings: 'Settings',
            reader: this.getChapterTitle()
        };

        const headerTitle = document.getElementById('header-title');
        if (headerTitle) {
            headerTitle.textContent = titles[screenName] || titles.home;
        }

        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.classList.toggle('hidden', screenName !== 'reader');
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
        } else {
            this.navigateToScreen('home');
        }
    }

    openChapter(chapterNumber) {
        if (this.isValidChapter(chapterNumber)) {
            this.currentChapter = chapterNumber;
            this.currentVerse = 1;
            this.navigateToReader();
        }
    }

    openDailyVerse() {
        if (this.dailyVerse) {
            this.currentChapter = this.dailyVerse.chapter;
            this.currentVerse = this.dailyVerse.verse;
            this.navigateToReader();
        }
    }

    loadReaderVerse() {
        try {
            const chapter = this.getChapter(this.currentChapter);
            const verse = this.getVerse(this.currentChapter, this.currentVerse);

            if (!chapter || !verse) {
                console.error('Chapter or verse not found:', this.currentChapter, this.currentVerse);
                return;
            }

            this.updateElement('reader-chapter-title', chapter.title || '');
            this.updateElement('reader-verse-count', `Verse ${this.currentVerse} of ${chapter.verses ? chapter.verses.length : 0}`);
            this.updateElement('current-verse-number', this.currentVerse.toString());
            this.updateElement('current-sanskrit', verse.sanskrit || '');
            this.updateElement('current-transliteration', verse.transliteration || '');
            this.updateElement('current-translation', this.getTranslation(verse));
            this.updateElement('current-explanation', this.getExplanation(verse));

            this.isRevealed = this.settings.autoReveal;
            this.updateRevealState();
            this.updateBookmarkButton();
            this.markAsRead(this.currentChapter, this.currentVerse);
            this.saveUserData();
            this.updateHomeScreen();
        } catch (error) {
            console.error('Error loading reader verse:', error);
            this.showToast('Error loading verse', 'error');
        }
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

            const shareText = `${verse.sanskrit}\n\n"${this.getTranslation(verse)}"\n\n- Bhagavad Gita ${chapter.number}.${verse.number}`;
            const shareTitle = `Bhagavad Gita ${chapter.number}.${verse.number}`;

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
            <div class="search-result" onclick="app.openSearchResult(${result.chapterNumber}, ${result.verseNumber})">
                <div class="result-reference">Chapter ${result.chapterNumber} • Verse ${result.verseNumber}</div>
                <div class="result-sanskrit">${this.escapeHtml(result.sanskrit)}</div>
                <div class="result-translation">${this.escapeHtml(result.translation)}</div>
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
        if (!this.gitaData || !this.gitaData.chapters) return 0;
        return this.gitaData.chapters.reduce((total, chapter) => {
            return total + (chapter.verses ? chapter.verses.length : 0);
        }, 0);
    }

    getChapter(chapterNumber) {
        if (!this.gitaData || !this.gitaData.chapters) return null;
        return this.gitaData.chapters.find(chapter => chapter.number === chapterNumber);
    }

    getVerse(chapterNumber, verseNumber) {
        const chapter = this.getChapter(chapterNumber);
        if (!chapter || !chapter.verses) return null;
        return chapter.verses.find(verse => verse.number === verseNumber);
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
        this.settings.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.saveUserData();
    }

    cycleTheme() {
        const themes = ['divine', 'dark', 'light'];
        const currentIndex = themes.indexOf(this.settings.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    setFontSize(size) {
        this.settings.fontSize = size;
        document.documentElement.style.setProperty('--font-size-base', `${size}px`);
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
