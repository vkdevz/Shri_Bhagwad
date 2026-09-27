// Divine Canvas: Generate aesthetic high-res quote cards for Instagram Stories & WhatsApp Status
class DivineCanvasGenerator {
    static generateCard(verse, chapterTitle, language = 'english') {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350; // 4:5 Instagram Portrait Ratio
        const ctx = canvas.getContext('2d');

        // Background: Deep Navy Radial Gradient
        const grad = ctx.createRadialGradient(540, 675, 100, 540, 675, 800);
        grad.addColorStop(0, '#162846');
        grad.addColorStop(1, '#070D18');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1350);

        // Outer Sacred Gold Border
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 4;
        ctx.strokeRect(50, 50, 980, 1250);

        // Inner Delicate Border
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(65, 65, 950, 1220);

        // Corner Ornaments
        DivineCanvasGenerator.drawCorner(ctx, 65, 65, 1, 1);
        DivineCanvasGenerator.drawCorner(ctx, 1015, 65, -1, 1);
        DivineCanvasGenerator.drawCorner(ctx, 65, 1285, 1, -1);
        DivineCanvasGenerator.drawCorner(ctx, 1015, 1285, -1, -1);

        // Sacred OM / Header Symbol
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 54px "Noto Sans Devanagari", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ॐ', 540, 180);

        // Header Title
        ctx.fillStyle = '#D4AF37';
        ctx.font = '600 24px "Inter", sans-serif';
        ctx.letterSpacing = '4px';
        ctx.fillText('SHRIMAD BHAGAVAD GITA', 540, 230);

        // Chapter & Verse Reference
        ctx.fillStyle = '#A0B2C6';
        ctx.font = '400 22px "Inter", sans-serif';
        const chNum = verse.chapterNumber || (verse.chapter ? verse.chapter.chapterNumber : '');
        ctx.fillText(`CHAPTER ${chNum} • VERSE ${verse.verseNumber}`, 540, 270);

        // Decorative Divider Line
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(420, 310);
        ctx.lineTo(660, 310);
        ctx.stroke();

        // Sanskrit Shlok (Devanagari)
        ctx.fillStyle = '#FFF8DC';
        ctx.font = '600 36px "Noto Sans Devanagari", serif';
        const sanskritLines = DivineCanvasGenerator.wrapText(ctx, verse.sanskrit || '', 820);
        let currentY = 420;
        sanskritLines.forEach(line => {
            ctx.fillText(line, 540, currentY);
            currentY += 58;
        });

        currentY += 40;

        // Translation
        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'italic 400 30px "Inter", sans-serif';
        let translationText = '';
        if (verse.translation) {
            translationText = typeof verse.translation === 'string'
                ? verse.translation
                : (verse.translation[language] || verse.translation.english || '');
        }
        const transLines = DivineCanvasGenerator.wrapText(ctx, `"${translationText}"`, 840);
        transLines.forEach(line => {
            ctx.fillText(line, 540, currentY);
            currentY += 46;
        });

        // Bottom Footer Brand
        ctx.fillStyle = '#D4AF37';
        ctx.font = '500 20px "Inter", sans-serif';
        ctx.fillText('Divine Wisdom • Daily Gita', 540, 1220);

        return canvas.toDataURL('image/png');
    }

    static drawCorner(ctx, x, y, dirX, dirY) {
        ctx.save();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + dirY * 30);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dirX * 30, y);
        ctx.stroke();
        ctx.restore();
    }

    static wrapText(ctx, text, maxWidth) {
        const words = text.split(/\s+/);
        const lines = [];
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
        return lines;
    }
}

window.DivineCanvasGenerator = DivineCanvasGenerator;
