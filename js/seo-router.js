/**
 * ShlokPath — SEO Router & Dynamic Meta Tag Manager
 * Handles HTML5 History API routing, clean canonical URLs,
 * and dynamic <title>, <meta description>, Open Graph & Twitter Card synchronization.
 */

class SeoRouter {
    constructor() {
        this.baseUrl = 'https://shlokpath.vercel.app';
        this.defaultImage = `${this.baseUrl}/assets/images/og-share.png`;

        this.routeConfigs = {
            home: {
                path: '/',
                title: 'ShlokPath | Bhagavad Gita Divine Wisdom & Daily Shloka',
                description: 'Read all 18 chapters and 701 verses of the Bhagavad Gita with 432Hz Tanpura meditation, dilemma guidance, and Parthasarathi AI.'
            },
            chapters: {
                path: '/chapters',
                title: 'All 18 Chapters | Shrimad Bhagavad Gita — ShlokPath',
                description: 'Explore all 18 canonical chapters of the Bhagavad Gita with authentic Sanskrit Devanagari text, English, and Hindi commentaries.'
            },
            dilemmas: {
                path: '/dilemmas',
                title: 'Prashna-Marg | Bhagavad Gita Guidance for Life Dilemmas',
                description: 'Navigate real-world anxiety, grief, duty, and anger through targeted verses and solutions spoken by Lord Krishna in the Gita.'
            },
            dhyana: {
                path: '/dhyana',
                title: 'Dhyana Chamber | 432Hz Tanpura Meditation — ShlokPath',
                description: 'Immerse in deep meditative stillness with authentic 432 Hz Indian Tanpura drone audio oscillators and Pranayama breathing pacer.'
            },
            search: {
                path: '/search',
                title: 'Search 701 Gita Verses & Commentary | ShlokPath',
                description: 'Instant search across all 701 verses, chapters, Sanskrit keywords, and English/Hindi commentaries of the Shrimad Bhagavad Gita.'
            },
            settings: {
                path: '/settings',
                title: 'Preferences & Reading Settings | ShlokPath',
                description: 'Customize script language, typography, reading theme, and audio options for your Bhagavad Gita sacred study.'
            }
        };

        this.init();
    }

    init() {
        this.cleanTrackingParameters();
        this.setupPopstateListener();
    }

    cleanTrackingParameters() {
        try {
            const url = new URL(window.location.href);
            const trackingParams = ['fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
            let modified = false;

            trackingParams.forEach(param => {
                if (url.searchParams.has(param)) {
                    url.searchParams.delete(param);
                    modified = true;
                }
            });

            if (modified && window.history.replaceState) {
                window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash);
            }
        } catch (e) {
            // Non-critical cleanup
        }
    }

    setupPopstateListener() {
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.screen && window.app) {
                if (event.state.screen === 'reader' && event.state.chapter) {
                    window.app.currentChapter = event.state.chapter;
                    if (event.state.verse) window.app.currentVerse = event.state.verse;
                    window.app.navigateToReader();
                } else {
                    window.app.navigateToScreen(event.state.screen);
                }
            } else {
                this.parseInitialRoute();
            }
        });
    }

    parseInitialRoute() {
        const path = window.location.pathname.replace(/\/$/, '') || '/';
        const hash = window.location.hash.replace(/^#\/?/, '');

        const target = hash || path;

        if (target.startsWith('/chapter/') || target.startsWith('chapter/')) {
            const parts = target.replace(/^\/?chapter\//, '').split('/');
            const ch = parseInt(parts[0], 10);
            const v = parts[2] ? parseInt(parts[2], 10) : 1;
            if (ch >= 1 && ch <= 18 && window.app) {
                window.app.currentChapter = ch;
                window.app.currentVerse = v;
                setTimeout(() => window.app.navigateToReader(), 100);
                return;
            }
        }

        const screenMap = {
            'chapters': 'chapters',
            'dilemmas': 'dilemmas',
            'dhyana': 'dhyana',
            'search': 'search',
            'settings': 'settings'
        };

        const cleanKey = target.replace(/^\//, '');
        if (screenMap[cleanKey] && window.app) {
            setTimeout(() => window.app.navigateToScreen(screenMap[cleanKey]), 100);
        }
    }

    updateRoute(screenName, params = {}, pushHistory = true) {
        let meta = null;
        let routePath = '/';

        if (screenName === 'reader') {
            const ch = params.chapter || 1;
            const v = params.verse;
            const chTitle = params.chapterTitle ? `: ${params.chapterTitle}` : '';

            if (v) {
                routePath = `/chapter/${ch}/verse/${v}`;
                meta = {
                    title: `BG ${ch}.${v} | Shrimad Bhagavad Gita — ShlokPath`,
                    description: `Read Bhagavad Gita Chapter ${ch}, Verse ${v} with original Sanskrit shloka, English translation, and Hindi commentary.`
                };
            } else {
                routePath = `/chapter/${ch}`;
                meta = {
                    title: `Chapter ${ch}${chTitle} | Bhagavad Gita — ShlokPath`,
                    description: `Explore Chapter ${ch} of the Shrimad Bhagavad Gita with Sanskrit verses, translations, and spiritual insights.`
                };
            }
        } else if (this.routeConfigs[screenName]) {
            meta = this.routeConfigs[screenName];
            routePath = meta.path;
        } else {
            meta = this.routeConfigs.home;
            routePath = '/';
        }

        const canonicalUrl = `${this.baseUrl}${routePath}`;

        // 1. Update Document Title (enforcing < 60 chars)
        if (meta.title) {
            document.title = meta.title.length > 60 ? meta.title.substring(0, 57) + '...' : meta.title;
        }

        // 2. Update Meta Description (enforcing < 160 chars)
        if (meta.description) {
            const descEl = document.querySelector('meta[name="description"]');
            if (descEl) {
                descEl.setAttribute('content', meta.description.length > 160 ? meta.description.substring(0, 157) + '...' : meta.description);
            }
        }

        // 3. Update Canonical Link
        let canonicalEl = document.querySelector('link[rel="canonical"]');
        if (!canonicalEl) {
            canonicalEl = document.createElement('link');
            canonicalEl.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalEl);
        }
        canonicalEl.setAttribute('href', canonicalUrl);

        // 4. Update Open Graph Tags
        this.setMetaProperty('og:title', document.title);
        if (meta.description) this.setMetaProperty('og:description', meta.description);
        this.setMetaProperty('og:url', canonicalUrl);
        this.setMetaProperty('og:image', this.defaultImage);

        // 5. Update Twitter Cards
        this.setMetaName('twitter:title', document.title);
        if (meta.description) this.setMetaName('twitter:description', meta.description);
        this.setMetaName('twitter:image', this.defaultImage);

        // 6. Update Browser History State
        if (pushHistory && window.history.pushState) {
            const state = { screen: screenName, chapter: params.chapter, verse: params.verse };
            const currentPath = window.location.pathname;

            // Use clean path if supported, or hash fallback for direct file opening
            if (window.location.protocol === 'file:') {
                window.location.hash = routePath.replace(/^\//, '');
            } else if (currentPath !== routePath) {
                window.history.pushState(state, document.title, routePath);
            } else {
                window.history.replaceState(state, document.title, routePath);
            }
        }
    }

    setMetaProperty(prop, value) {
        let el = document.querySelector(`meta[property="${prop}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute('property', prop);
            document.head.appendChild(el);
        }
        el.setAttribute('content', value);
    }

    setMetaName(name, value) {
        let el = document.querySelector(`meta[name="${name}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute('name', name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', value);
    }
}

// Global instance
window.seoRouter = new SeoRouter();
