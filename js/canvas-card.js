/**
 * Divine Canvas Sacred Wisdom Folio Generator
 * Creates ultra-high-resolution vertical editorial cards optimized for:
 * - Contemplation and reflection
 * - Instagram Stories, Feed & Reels
 * - WhatsApp Status & Community sharing
 * Features:
 * - Low-opacity background logo watermark
 * - Sacred Color Themes (Manuscript Obsidian, Imperial Linen)
 * - Bilingual support (Sanskrit + English / Hindi / Dual)
 * - Native Web Share API integration (Direct Instagram & WhatsApp sharing)
 */

class DivineCanvasGenerator {
    static THEMES = {
        midnight: {
            name: 'Manuscript Obsidian',
            bgStart: '#131418',
            bgEnd: '#0c0d10',
            borderGold: '#c5a059',
            innerBorder: 'rgba(197, 160, 89, 0.25)',
            textGold: '#c5a059',
            textSanskrit: '#f0ede6',
            textTranslation: '#cfcac0',
            accent: '#b38e47',
            watermarkColor: 'rgba(197, 160, 89, 0.05)'
        },
        saffron: {
            name: 'Imperial Linen',
            bgStart: '#f8f6f0',
            bgEnd: '#ede8dd',
            borderGold: '#8c5f3e',
            innerBorder: 'rgba(140, 95, 62, 0.25)',
            textGold: '#8c5f3e',
            textSanskrit: '#18181c',
            textTranslation: '#424147',
            accent: '#704728',
            watermarkColor: 'rgba(140, 95, 62, 0.05)'
        }
    };

    // Cached logo image
    static logoImage = null;

    static async init() {
        if (!DivineCanvasGenerator.logoImage) {
            DivineCanvasGenerator.logoImage = new Image();
            DivineCanvasGenerator.logoImage.crossOrigin = 'anonymous';
            DivineCanvasGenerator.logoImage.src = 'icons/icon-512x512.png';
            await new Promise(resolve => {
                DivineCanvasGenerator.logoImage.onload = () => resolve(true);
                DivineCanvasGenerator.logoImage.onerror = () => resolve(false);
            });
        }
    }

    static getTranslationText(verse, lang) {
        if (!verse || !verse.translation) return '';
        if (typeof verse.translation === 'string') return verse.translation;
        if (lang === 'hindi') return verse.translation.hindi || verse.translation.english || '';
        return verse.translation.english || verse.translation.hindi || '';
    }

    static getExplanationText(verse, lang) {
        if (!verse) return '';
        const exp = verse.explanation || verse.commentary;
        if (!exp) return '';
        if (typeof exp === 'string') return exp;
        if (lang === 'hindi') return exp.hindi || exp.english || '';
        return exp.english || exp.hindi || '';
    }

    /**
     * Generate high-res 1200x1600 canvas
     */
    static async generateCardCanvas(verse, chapterTitle, options = {}) {
        const themeKey = options.theme || 'midnight';
        const language = options.language || 'english'; // 'english', 'hindi', 'dual'
        const showWatermark = options.showWatermark !== false;
        const showCommentary = options.showCommentary !== false;
        const watermarkOpacity = themeKey === 'midnight' ? 0.08 : 0.065;
        const theme = DivineCanvasGenerator.THEMES[themeKey] || DivineCanvasGenerator.THEMES.midnight;

        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1600;
        const ctx = canvas.getContext('2d');

        // 1. Background Gradient
        const grad = ctx.createRadialGradient(600, 800, 150, 600, 800, 950);
        grad.addColorStop(0, theme.bgStart);
        grad.addColorStop(1, theme.bgEnd);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 1600);

        // 2. Permanent Low-Opacity Background Logo & Sacred Chakra Watermark
        ctx.save();
        ctx.globalAlpha = watermarkOpacity;

        if (DivineCanvasGenerator.logoImage && DivineCanvasGenerator.logoImage.complete && DivineCanvasGenerator.logoImage.naturalWidth > 0) {
            const logoSize = 640;
            ctx.drawImage(
                DivineCanvasGenerator.logoImage,
                (1200 - logoSize) / 2,
                (1600 - logoSize) / 2 - 40,
                logoSize,
                logoSize
            );
        }

        DivineCanvasGenerator.drawSacredMandalaWatermark(ctx, 600, 760, 420, theme.borderGold);
        ctx.restore();

        // 3. Clean Hairline Architectural Framing
        ctx.strokeStyle = theme.borderGold;
        ctx.lineWidth = 2;
        ctx.strokeRect(60, 60, 1080, 1480);

        ctx.strokeStyle = theme.innerBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(76, 76, 1048, 1448);

        DivineCanvasGenerator.drawOrnateCorner(ctx, 76, 76, 1, 1, theme.borderGold);
        DivineCanvasGenerator.drawOrnateCorner(ctx, 1124, 76, -1, 1, theme.borderGold);
        DivineCanvasGenerator.drawOrnateCorner(ctx, 76, 1524, 1, -1, theme.borderGold);
        DivineCanvasGenerator.drawOrnateCorner(ctx, 1124, 1524, -1, -1, theme.borderGold);

        // 4. Header: Sacred Symbol (ॐ) & Chapter Reference
        ctx.textAlign = 'center';
        
        // Sacred Om
        ctx.fillStyle = theme.textGold;
        ctx.font = '500 64px "Noto Sans Devanagari", serif';
        ctx.fillText('ॐ', 600, 175);

        // Main Header Title
        ctx.fillStyle = theme.borderGold;
        ctx.font = '600 22px "Cinzel", serif';
        ctx.letterSpacing = '5px';
        ctx.fillText('SHRIMAD BHAGAVAD GITA', 600, 222);

        // Chapter & Verse Reference
        const chNum = verse.chapterNumber || (verse.chapter ? verse.chapter.chapterNumber : '1');
        const vNum = verse.verseNumber || '1';
        ctx.fillStyle = theme.textGold;
        ctx.font = '600 22px "Inter", sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText(`CHAPTER ${chNum} • VERSE ${vNum}`, 600, 260);

        if (chapterTitle) {
            ctx.fillStyle = theme.innerBorder;
            ctx.font = 'italic 16px "Inter", sans-serif';
            ctx.fillText(chapterTitle.toUpperCase(), 600, 290);
        }

        // Top Divider with Diamond Crest
        DivineCanvasGenerator.drawDividerWithDiamond(ctx, 600, 318, 300, theme.innerBorder);

        // 5. Sanskrit Shlok (Devanagari) — Enhanced Prominent Calligraphy
        ctx.save();
        ctx.fillStyle = theme.textSanskrit;

        // Clean any verse markers such as ।।2.47।।, ||2.47||, ॥२.४७॥, (2.47), trailing numbers
        let rawSanskrit = (verse.sanskrit || '')
            .replace(/[।॥|\(\[\{]+\s*[\d\.\s\u0966-\u096F\-\:]+\s*[।॥|\)\]\}]*/g, '')
            .replace(/\s*[\d\.\s\u0966-\u096F\-\:]+\s*[।॥|]+$/g, '')
            .replace(/[।॥|]+\s*[\d\.\s\u0966-\u096F\-\:]+$/g, '')
            .trim();

        // Split into lines & normalize poetic verse dandas (Line 1 ends with ।, Line 2 ends with ॥)
        let sLines = rawSanskrit.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
        if (sLines.length === 1 && sLines[0].includes('।')) {
            const idx = sLines[0].indexOf('।');
            if (idx > -1 && idx < sLines[0].length - 1) {
                sLines = [
                    sLines[0].substring(0, idx + 1).trim(),
                    sLines[0].substring(idx + 1).trim()
                ];
            }
        }
        if (sLines.length >= 2) {
            sLines[0] = sLines[0].replace(/[।॥|]+$/g, '').trim() + '।';
            sLines[sLines.length - 1] = sLines[sLines.length - 1].replace(/[।॥|]+$/g, '').trim() + '॥';
        } else if (sLines.length === 1) {
            sLines[0] = sLines[0].replace(/[।॥|]+$/g, '').trim() + '॥';
        }
        const cleanedSanskrit = sLines.join('\n');

        // Dynamically scale Sanskrit font: 44px for standard verses, 38px for longer verses
        ctx.font = '600 44px "Noto Sans Devanagari", serif';
        let sanskritLines = DivineCanvasGenerator.wrapText(ctx, cleanedSanskrit, 940);
        let sanskritLineHeight = 68;

        if (sanskritLines.length > 3) {
            ctx.font = '600 38px "Noto Sans Devanagari", serif';
            sanskritLines = DivineCanvasGenerator.wrapText(ctx, cleanedSanskrit, 940);
            sanskritLineHeight = 60;
        }

        let currentY = 385;
        sanskritLines.forEach(line => {
            ctx.fillText(line, 600, currentY);
            currentY += sanskritLineHeight;
        });
        ctx.restore();

        // Divider after Sanskrit
        currentY += 15;
        DivineCanvasGenerator.drawDividerWithDiamond(ctx, 600, currentY, 200, theme.innerBorder);
        currentY += 35;

        // 6. Translations (English / Hindi / Dual) — High-Legibility Editorial Typography
        const englishText = DivineCanvasGenerator.getTranslationText(verse, 'english');
        const hindiText = DivineCanvasGenerator.getTranslationText(verse, 'hindi');

        if (language === 'english' || (language === 'dual' && englishText)) {
            // Label
            ctx.fillStyle = theme.borderGold;
            ctx.font = '600 14px "Cinzel", serif';
            ctx.letterSpacing = '3px';
            ctx.fillText('SACRED MEANING', 600, currentY);
            currentY += 30;

            ctx.fillStyle = theme.textTranslation;
            ctx.font = 'italic 400 32px "Inter", sans-serif';
            const engLines = DivineCanvasGenerator.wrapText(ctx, `"${englishText}"`, 940);
            const engLineHeight = 48;
            engLines.forEach(line => {
                if (currentY < 1400) {
                    ctx.fillText(line, 600, currentY);
                    currentY += engLineHeight;
                }
            });
        }

        if (language === 'hindi' || (language === 'dual' && hindiText)) {
            if (language === 'dual') {
                currentY += 15;
            } else {
                ctx.fillStyle = theme.borderGold;
                ctx.font = '600 14px "Cinzel", serif';
                ctx.letterSpacing = '3px';
                ctx.fillText('भावार्थ • MEANING', 600, currentY);
                currentY += 30;
            }

            ctx.fillStyle = theme.textGold;
            ctx.font = '500 32px "Noto Sans Devanagari", serif';
            const hindiLines = DivineCanvasGenerator.wrapText(ctx, hindiText, 940);
            const hindiLineHeight = 48;
            hindiLines.forEach(line => {
                if (currentY < 1400) {
                    ctx.fillText(line, 600, currentY);
                    currentY += hindiLineHeight;
                }
            });
        }

        // 7. Philosophical Commentary / Explanation Section
        const explanationText = DivineCanvasGenerator.getExplanationText(verse, language);
        if (showCommentary && explanationText && currentY < 1280) {
            currentY += 20;
            DivineCanvasGenerator.drawDividerWithDiamond(ctx, 600, currentY, 180, theme.innerBorder);
            currentY += 32;

            // Section Label
            ctx.fillStyle = theme.accent;
            ctx.font = '600 14px "Cinzel", serif';
            ctx.letterSpacing = '3px';
            const expLabel = language === 'hindi' ? 'तात्पर्य • COMMENTARY' : 'PHILOSOPHICAL COMMENTARY';
            ctx.fillText(expLabel, 600, currentY);
            currentY += 30;

            // Commentary Text
            ctx.save();
            ctx.fillStyle = theme.textTranslation;
            ctx.globalAlpha = 0.92;
            const expFont = language === 'hindi'
                ? '400 23px "Noto Sans Devanagari", serif'
                : '400 23px "Inter", sans-serif';
            ctx.font = expFont;

            const expLines = DivineCanvasGenerator.wrapText(ctx, explanationText, 940);
            const expLineHeight = 36;
            expLines.forEach(line => {
                if (currentY < 1400) {
                    ctx.fillText(line, 600, currentY);
                    currentY += expLineHeight;
                }
            });
            ctx.restore();
        }

        // 8. Bottom Footer: Sacred Attribution & Brand Signature
        DivineCanvasGenerator.drawDividerWithDiamond(ctx, 600, 1435, 260, theme.innerBorder);

        ctx.fillStyle = theme.borderGold;
        ctx.font = '600 17px "Cinzel", serif';
        ctx.letterSpacing = '4px';
        ctx.fillText('SHRIMAD BHAGAVAD GITA', 600, 1472);

        // Highlighted Brand Signature (Clean editorial text, full opacity, no pill/border/bg)
        ctx.fillStyle = themeKey === 'midnight' ? '#f0d28d' : '#7a4b27';
        ctx.font = '700 15px "Cinzel", serif';
        ctx.letterSpacing = '3px';
        ctx.fillText('SHLOKPATH — BY VK DEVZ', 600, 1504);

        return canvas;
    }

    /**
     * Draw rounded rectangle path
     */
    static drawRoundedRect(ctx, x, y, width, height, radius, fill = false, stroke = false) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    /**
     * Draw ornate corner elements
     */
    static drawOrnateCorner(ctx, x, y, dirX, dirY, color) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        // L-bracket
        ctx.moveTo(x, y + dirY * 36);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dirX * 36, y);
        ctx.stroke();

        // Little corner diamond
        ctx.fillStyle = color;
        const dSize = 5;
        ctx.beginPath();
        ctx.moveTo(x + dirX * 12, y + dirY * (12 - dSize));
        ctx.lineTo(x + dirX * (12 + dSize), y + dirY * 12);
        ctx.lineTo(x + dirX * 12, y + dirY * (12 + dSize));
        ctx.lineTo(x + dirX * (12 - dSize), y + dirY * 12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    /**
     * Draw elegant divider with center diamond
     */
    static drawDividerWithDiamond(ctx, cx, cy, width, color) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.5;

        const half = width / 2;
        // Left line
        ctx.beginPath();
        ctx.moveTo(cx - half, cy);
        ctx.lineTo(cx - 16, cy);
        ctx.stroke();

        // Right line
        ctx.beginPath();
        ctx.moveTo(cx + 16, cy);
        ctx.lineTo(cx + half, cy);
        ctx.stroke();

        // Center diamond
        ctx.beginPath();
        ctx.moveTo(cx, cy - 7);
        ctx.lineTo(cx + 7, cy);
        ctx.lineTo(cx, cy + 7);
        ctx.lineTo(cx - 7, cy);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    /**
     * Draw subtle geometric Sudarshana Chakra Mandala in low opacity
     */
    static drawSacredMandalaWatermark(ctx, cx, cy, radius, color) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        // Concentric circles
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.75, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
        ctx.stroke();

        // 16 radial rays (Chakra petals)
        const rays = 16;
        for (let i = 0; i < rays; i++) {
            const angle = (i * Math.PI * 2) / rays;
            const x1 = cx + Math.cos(angle) * (radius * 0.45);
            const y1 = cy + Math.sin(angle) * (radius * 0.45);
            const x2 = cx + Math.cos(angle) * radius;
            const y2 = cy + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Clean text wrapping
     */
    static wrapText(ctx, text, maxWidth) {
        if (!text) return [];
        const lines = [];
        const paragraphs = text.split('\n');

        paragraphs.forEach(p => {
            const words = p.split(/\s+/).filter(Boolean);
            let currentLine = '';

            for (let i = 0; i < words.length; i++) {
                const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);
        });

        return lines;
    }

    /**
     * Generate DataURL
     */
    static async generateCardDataUrl(verse, chapterTitle, options = {}) {
        await DivineCanvasGenerator.init();
        const canvas = await DivineCanvasGenerator.generateCardCanvas(verse, chapterTitle, options);
        return canvas.toDataURL('image/png');
    }

    /**
     * Generate Blob for file sharing
     */
    static async generateCardBlob(verse, chapterTitle, options = {}) {
        await DivineCanvasGenerator.init();
        const canvas = await DivineCanvasGenerator.generateCardCanvas(verse, chapterTitle, options);
        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), 'image/png');
        });
    }

    /**
     * Trigger instant file download of the high-resolution PNG image
     */
    static async downloadCard(verse, chapterTitle, options = {}) {
        const dataUrl = await DivineCanvasGenerator.generateCardDataUrl(verse, chapterTitle, options);
        const chNum = verse.chapterNumber || (verse.chapter ? verse.chapter.chapterNumber : '1');
        const vNum = verse.verseNumber || '1';
        const filename = `ShlokPath-Gita-Ch${chNum}-V${vNum}.png`;

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
    }

    /**
     * Share to WhatsApp (Direct intent or Web Share API with File)
     */
    static async shareToWhatsApp(verse, chapterTitle, options = {}) {
        const chNum = verse.chapterNumber || (verse.chapter ? verse.chapter.chapterNumber : '1');
        const vNum = verse.verseNumber || '1';
        const sanskrit = verse.sanskrit || '';
        let translation = '';
        if (verse.translation) {
            translation = typeof verse.translation === 'string'
                ? verse.translation
                : (verse.translation.english || verse.translation.hindi || '');
        }

        const shareText = `*Bhagavad Gita* • Chapter ${chNum}, Verse ${vNum}\n\n${sanskrit}\n\n*Translation:*\n"${translation}"\n\nShared via ShlokPath`;

        // Check if Web Share API with file is supported
        const blob = await DivineCanvasGenerator.generateCardBlob(verse, chapterTitle, options);
        const file = new File([blob], `ShlokPath-Ch${chNum}-V${vNum}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Bhagavad Gita ${chNum}.${vNum} — ShlokPath`,
                    text: shareText
                });
                return { success: true, mode: 'web-share' };
            } catch (err) {
                if (err.name === 'AbortError') return { success: false, cancelled: true };
            }
        }

        // Fallback: Open WhatsApp with encoded text
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, '_blank');
        return { success: true, mode: 'whatsapp-url' };
    }

    /**
     * Share to Instagram (Native share sheet or Download + Copy Caption)
     */
    static async shareToInstagram(verse, chapterTitle, options = {}) {
        const chNum = verse.chapterNumber || (verse.chapter ? verse.chapter.chapterNumber : '1');
        const vNum = verse.verseNumber || '1';
        const sanskrit = verse.sanskrit || '';
        let translation = '';
        if (verse.translation) {
            translation = typeof verse.translation === 'string'
                ? verse.translation
                : (verse.translation.english || verse.translation.hindi || '');
        }

        const igCaption = `Bhagavad Gita • Chapter ${chNum}, Verse ${vNum}\n\n${sanskrit}\n\n"${translation}"\n\n#ShlokPath #BhagavadGita #Philosophy #Sanskrit #AncientWisdom #DailyGita`;

        const blob = await DivineCanvasGenerator.generateCardBlob(verse, chapterTitle, options);
        const file = new File([blob], `ShlokPath-Ch${chNum}-V${vNum}.png`, { type: 'image/png' });

        // If Web Share API with files is available (iOS / Android Instagram supports this directly)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Bhagavad Gita ${chNum}.${vNum} — ShlokPath`,
                    text: igCaption
                });
                return { success: true, mode: 'web-share' };
            } catch (err) {
                if (err.name === 'AbortError') return { success: false, cancelled: true };
            }
        }

        // Desktop/Browser Fallback: Copy Instagram Caption & Save high-res card image
        try {
            await navigator.clipboard.writeText(igCaption);
        } catch (e) {
            console.warn('Clipboard write failed', e);
        }
        await DivineCanvasGenerator.downloadCard(verse, chapterTitle, options);
        return { success: true, mode: 'download_and_copy', caption: igCaption };
    }
}

window.DivineCanvasGenerator = DivineCanvasGenerator;
