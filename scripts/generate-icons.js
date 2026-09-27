const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ICONS_DIR = path.join(__dirname, '..', 'icons');
fs.mkdirSync(ICONS_DIR, { recursive: true });

// Function to generate an uncompressed PNG buffer using Node.js zlib
function createGoldenOmPng(size) {
    const width = size;
    const height = size;

    // RGBA buffer: (width * 4 + 1 for filter byte) * height
    const rowBytes = width * 4 + 1;
    const rawBuffer = Buffer.alloc(rowBytes * height);

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = width * 0.44;
    const innerRadius = width * 0.40;
    const coreRadius = width * 0.36;

    for (let y = 0; y < height; y++) {
        const rowOffset = y * rowBytes;
        rawBuffer[rowOffset] = 0; // Filter type: None

        for (let x = 0; x < width; x++) {
            const pixelOffset = rowOffset + 1 + x * 4;
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Default: Deep Navy #0A1628
            let r = 10, g = 22, b = 40, a = 255;

            // Outer golden ring
            if (dist >= innerRadius && dist <= outerRadius) {
                // Gold #D4AF37
                r = 212; g = 175; b = 55; a = 255;
            } else if (dist < innerRadius && dist >= coreRadius) {
                // Deep royal gold gradient
                r = 25; g = 38; b = 65; a = 255;
            } else if (dist < coreRadius) {
                // Center circular gradient with sacred glow
                const centerFactor = 1 - (dist / coreRadius);
                r = Math.min(255, Math.floor(10 + centerFactor * 80));
                g = Math.min(255, Math.floor(22 + centerFactor * 90));
                b = Math.min(255, Math.floor(40 + centerFactor * 120));

                // Golden center emblem (simplified radiant cross/star)
                const inCrossH = Math.abs(dy) < (width * 0.04) && Math.abs(dx) < (width * 0.22);
                const inCrossV = Math.abs(dx) < (width * 0.04) && Math.abs(dy) < (width * 0.22);
                const inRingCenter = Math.abs(dist - width * 0.14) < (width * 0.025);
                const inDotCenter = dist < (width * 0.05);

                if (inCrossH || inCrossV || inRingCenter || inDotCenter) {
                    r = 255; g = 215; b = 0; a = 255; // Bright Gold #FFD700
                }
            }

            rawBuffer[pixelOffset] = r;
            rawBuffer[pixelOffset + 1] = g;
            rawBuffer[pixelOffset + 2] = b;
            rawBuffer[pixelOffset + 3] = a;
        }
    }

    const compressed = zlib.deflateSync(rawBuffer);

    // PNG Header
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    // IHDR chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // Bit depth: 8
    ihdr[9] = 6; // Color type: RGBA (6)
    ihdr[10] = 0; // Compression: Deflate
    ihdr[11] = 0; // Filter: Standard
    ihdr[12] = 0; // Interlace: None
    const ihdrChunk = createChunk('IHDR', ihdr);

    // IDAT chunk
    const idatChunk = createChunk('IDAT', compressed);

    // IEND chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
    const length = data.length;
    const header = Buffer.alloc(8);
    header.writeUInt32BE(length, 0);
    header.write(type, 4, 4, 'ascii');

    const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = crc32(crcBuf);

    const crcOut = Buffer.alloc(4);
    crcOut.writeUInt32BE(crc, 0);

    return Buffer.concat([header.slice(0, 4), crcBuf, crcOut]);
}

// Table-based CRC32
const crcTable = [];
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        if (c & 1) {
            c = 0xedb88320 ^ (c >>> 1);
        } else {
            c = c >>> 1;
        }
    }
    crcTable[n] = c;
}

function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

// Generate Icons
console.log('Generating PWA icons...');
const icon192 = createGoldenOmPng(192);
fs.writeFileSync(path.join(ICONS_DIR, 'icon-192x192.png'), icon192);

const icon512 = createGoldenOmPng(512);
fs.writeFileSync(path.join(ICONS_DIR, 'icon-512x512.png'), icon512);

// Copy 192 for apple touch icon and favicon
fs.writeFileSync(path.join(ICONS_DIR, 'apple-touch-icon.png'), icon192);
fs.writeFileSync(path.join(ICONS_DIR, 'favicon.png'), createGoldenOmPng(64));

console.log('✅ PWA icons successfully generated in icons/');
