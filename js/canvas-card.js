/**
 * Divine Canvas 3:4 Quote Card Generator
 * Creates ultra-high-resolution 1200x1600 (3:4 ratio) cards optimized for:
 * - Instagram Feed (3:4 portrait)
 * - Instagram Stories & Reels cover
 * - WhatsApp Status & Chats
 * Features:
 * - Low-opacity background logo watermark
 * - 4 Sacred Color Themes (Cosmic Midnight, Sacred Saffron, Temple Sandalwood, Vrindavan Emerald)
 * - Bilingual support (Sanskrit + English / Hindi / Dual)
 * - Native Web Share API integration (Direct Instagram & WhatsApp sharing)
 */

class DivineCanvasGenerator {
    static THEMES = {
        midnight: {
            name: 'Cosmic Midnight',
            bgStart: '#142038',
            bgEnd: '#060B14',
            borderGold: '#D4AF37',
            innerBorder: 'rgba(212, 175, 55, 0.35)',
            textGold: '#FFD700',
            textSanskrit: '#FFFDF5',
            textTranslation: '#E2E8F0',
            accent: '#F59E0B',
            watermarkColor: 'rgba(255, 215, 0, 0.08)'
        },
        saffron: {
            name: 'Sacred Saffron',
            bgStart: '#3A1505',
            bgEnd: '#1A0802',
            borderGold: '#F59E0B',
            innerBorder: 'rgba(245, 158, 11, 0.35)',
            textGold: '#FDE68A',
            textSanskrit: '#FFFBEB',
            textTranslation: '#FED7AA',
            accent: '#EA580C',
            watermarkColor: 'rgba(254, 215, 170, 0.08)'
        },
        sandalwood: {
            name: 'Temple Sandalwood',
            bgStart: '#2A1F18',
            bgEnd: '#140E0B',
            borderGold: '#E5C07B',
            innerBorder: 'rgba(229, 192, 123, 0.35)',
            textGold: '#F6E05E',
            textSanskrit: '#FAF5EE',
            textTranslation: '#E2D8CE',
            accent: '#D97706',
            watermarkColor: 'rgba(246, 224, 94, 0.07)'
        },
        emerald: {
            name: 'Vrindavan Emerald',
            bgStart: '#0C2A1E',
            bgEnd: '#05140E',
            borderGold: '#34D399',
            innerBorder: 'rgba(52, 211, 153, 0.35)',
            textGold: '#A7F3D0',
            textSanskrit: '#ECFDF5',
            textTranslation: '#D1FAE5',
            accent: '#10B981',
            watermarkColor: 'rgba(167, 243, 208, 0.07)'
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

    /**
     * Generate high-res 1200x1600 (3:4 ratio) canvas
     */
    static async generateCardCanvas(verse, chapterTitle, options = {}) {
        const themeKey = options.theme || 'midnight';
        const language = options.language || 'english'; // 'english', 'hindi', 'dual'
        const showWatermark = options.showWatermark !== false;
        const watermarkOpacity = options.watermarkOpacity || 0.10;
        const theme = DivineCanvasGenerator.THEMES[themeKey] || DivineCanvasGenerator.THEMES.midnight;

        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1600; // Exactly 3:4 Aspect Ratio (300px * 4 = 1200, 400px * 4 = 1600)
        const ctx = canvas.getContext('2d');

        // 1. Background Gradient
        const grad = ctx.createRadialGradient(600, 800, 150, 600, 800, 950);
        grad.addColorStop(0, theme.bgStart);
        grad.addColorStop(1, theme.bgEnd);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 1600);

        // 2. Low-Opacity Background Logo & Sacred Chakra Watermark
        if (showWatermark) {
            ctx.save();
            ctx.globalAlpha = watermarkOpacity;

            // Render center sacred logo from icons/icon-512x512.png if loaded
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

            // Draw sacred geometric Sudarshana Chakra Mandala rays in low opacity
            DivineCanvasGenerator.drawSacredMandalaWatermark(ctx, 600, 760, 420, theme.borderGold);
            ctx.restore();
        }

        // 3. Ornate Double Golden Borders (Aesthetic Vedic Sanctuary Framing)
        // Outer border
        ctx.strokeStyle = theme.borderGold;
        ctx.lineWidth = 5;
        ctx.strokeRect(55, 55, 1090, 1490);

        // Inner border with soft opacity
        ctx.strokeStyle = theme.innerBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(72, 72, 1056, 1456);

        // Subtle corner embellishments
        DivineCanvasGenerator.drawOrnateCorner(ctx, 72, 72, 1, 1, theme.borderGold);
        DivineCanvasGenerator.drawOrnateCorner(ctx, 1128, 72, -1, 1, theme.borderGold);
        DivineCanvasGenerator.drawOrnateCorner(ctx, 72, 1528, 1, -1, theme.borderGold);
        DivineCanvasGenerator.drawOrnateCorner(ctx, 1128, 1528, -1, -1, theme.borderGold);

        // 4. Header: Sacred Symbol (ॐ) & Typography
        ctx.textAlign = 'center';
        
        // Sacred Om in radiant gold with soft glow
        ctx.save();
        ctx.shadowColor = theme.borderGold;
        ctx.shadowBlur = 18;
        ctx.fillStyle = theme.textGold;
        ctx.font = 'bold 64px "Noto Sans Devanagari", serif';
        ctx.fillText('ॐ', 600, 195);
        ctx.restore();

        // Main Header Title
        ctx.fillStyle = theme.borderGold;
        ctx.font = '700 24px "Inter", sans-serif';
        ctx.letterSpacing = '6px';
        ctx.fillText('SHRIMAD BHAGAVAD GITA', 600, 245);

        // Chapter & Verse Reference Pill
        const chNum = verse.chapterNumber || (verse.chapter ? verse.chapter.chapterNumber : '1');
        const vNum = verse.verseNumber || '1';
        ctx.fillStyle = theme.textGold;
        ctx.font = '600 22px "Inter", sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText(`CHAPTER ${chNum} • VERSE ${vNum}`, 600, 290);

        if (chapterTitle) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.font = 'italic 18px "Inter", sans-serif';
            ctx.fillText(chapterTitle.toUpperCase(), 600, 320);
        }

        // Decorative Divider with Diamond Crest
        DivineCanvasGenerator.drawDividerWithDiamond(ctx, 600, 360, 320, theme.borderGold);

        // 5. Sanskrit Shlok (Devanagari) - The Heart of the Card
        ctx.save();
        ctx.fillStyle = theme.textSanskrit;
        ctx.font = '600 38px "Noto Sans Devanagari", serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 10;
        
        const rawSanskrit = verse.sanskrit || '';
        const sanskritLines = DivineCanvasGenerator.wrapText(ctx, rawSanskrit, 920);
        
        // Center Sanskrit block vertically between 440 and ~820
        let currentY = 460;
        const sanskritLineHeight = 62;
        sanskritLines.forEach(line => {
            ctx.fillText(line, 600, currentY);
            currentY += sanskritLineHeight;
        });
        ctx.restore();

        // Subtle Mid-Section Divider
        currentY += 25;
        DivineCanvasGenerator.drawDividerWithDiamond(ctx, 600, currentY, 200, theme.innerBorder);
        currentY += 45;

        // 6. Translations (English / Hindi / Dual)
        let englishText = '';
        let hindiText = '';

        if (verse.translation) {
            if (typeof verse.translation === 'string') {
                englishText = verse.translation;
            } else {
                englishText = verse.translation.english || '';
                hindiText = verse.translation.hindi || '';
            }
        }

        if (language === 'english' || (language === 'dual' && englishText)) {
            ctx.fillStyle = theme.textTranslation;
            ctx.font = 'italic 400 30px "Inter", sans-serif';
            const engLines = DivineCanvasGenerator.wrapText(ctx, `"${englishText}"`, 940);
            const engLineHeight = 44;
            engLines.forEach(line => {
                if (currentY < 1400) {
                    ctx.fillText(line, 600, currentY);
                    currentY += engLineHeight;
                }
            });
        }

        if (language === 'hindi' || (language === 'dual' && hindiText)) {
            if (language === 'dual') currentY += 20;
            ctx.fillStyle = theme.textGold;
            ctx.font = '500 28px "Noto Sans Devanagari", serif';
            const hindiLines = DivineCanvasGenerator.wrapText(ctx, hindiText, 940);
            const hindiLineHeight = 42;
            hindiLines.forEach(line => {
                if (currentY < 1420) {
                    ctx.fillText(line, 600, currentY);
                    currentY += hindiLineHeight;
                }
            });
        }

        // 7. Footer: Sacred Attribution & Social Watermark
        ctx.fillStyle = theme.borderGold;
        ctx.font = '600 20px "Inter", sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillText('DIVINE WISDOM • DAILY GITA', 600, 1475);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '400 16px "Inter", sans-serif';
        ctx.letterSpacing = '1px';
        ctx.fillText('3:4 Instagram & WhatsApp Edition', 600, 1505);

        return canvas;
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
     * Trigger instant file download of the 3:4 PNG image
     */
    static async downloadCard(verse, chapterTitle, options = {}) {
        const dataUrl = await DivineCanvasGenerator.generateCardDataUrl(verse, chapterTitle, options);
        const chNum = verse.chapterNumber || (verse.chapter ? verse.chapter.chapterNumber : '1');
        const vNum = verse.verseNumber || '1';
        const filename = `Bhagavad-Gita-Ch${chNum}-V${vNum}-3x4.png`;

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

        const shareText = `🕉️ *Shrimad Bhagavad Gita* • Chapter ${chNum}, Verse ${vNum}\n\n"${sanskrit}"\n\n✨ *Meaning:*\n"${translation}"\n\n🪔 Shared via Bhagavad Gita Platform`;

        // Check if Web Share API with file is supported
        const blob = await DivineCanvasGenerator.generateCardBlob(verse, chapterTitle, options);
        const file = new File([blob], `Gita-Ch${chNum}-V${vNum}-3x4.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Bhagavad Gita Ch ${chNum} Verse ${vNum}`,
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

        const igCaption = `🕉️ Shrimad Bhagavad Gita • Chapter ${chNum}, Verse ${vNum}\n\n${sanskrit}\n\n"${translation}"\n\n#BhagavadGita #Krishna #SpiritualWisdom #SanatanDharma #DailyGita #YogaOfKnowledge #InnerPeace`;

        const blob = await DivineCanvasGenerator.generateCardBlob(verse, chapterTitle, options);
        const file = new File([blob], `Gita-Ch${chNum}-V${vNum}-3x4.png`, { type: 'image/png' });

        // If Web Share API with files is available (iOS / Android Instagram supports this directly)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Bhagavad Gita Ch ${chNum} Verse ${vNum}`,
                    text: igCaption
                });
                return { success: true, mode: 'web-share' };
            } catch (err) {
                if (err.name === 'AbortError') return { success: false, cancelled: true };
            }
        }

        // Desktop/Browser Fallback: Copy Instagram Caption & Download 3:4 image
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
