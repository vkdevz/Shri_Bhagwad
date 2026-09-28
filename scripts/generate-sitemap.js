const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://shlokpath.vercel.app';
const TODAY = new Date().toISOString().split('T')[0];

const KEY_VERSES = [
    { chapter: 2, verse: 47, desc: 'Karmanye Vadhikaraste' },
    { chapter: 2, verse: 14, desc: 'Matra-sparshas tu kaunteya' },
    { chapter: 2, verse: 20, desc: 'Na jayate mriyate va kadacin' },
    { chapter: 2, verse: 22, desc: 'Vasamsi jirnani yatha vihaya' },
    { chapter: 4, verse: 7, desc: 'Yada yada hi dharmasya' },
    { chapter: 4, verse: 8, desc: 'Paritranaya sadhunam' },
    { chapter: 6, verse: 5, desc: 'Uddhared atmanatmanam' },
    { chapter: 9, verse: 22, desc: 'Ananyas cintayanto mam' },
    { chapter: 9, verse: 26, desc: 'Patram puspam phalam toyam' },
    { chapter: 11, verse: 32, desc: 'Kalo smi loka-ksaya-krt pravrddho' },
    { chapter: 12, verse: 15, desc: 'Yasman nodvijate loko' },
    { chapter: 18, verse: 65, desc: 'Man-mana bhava mad-bhakto' },
    { chapter: 18, verse: 66, desc: 'Sarva-dharman parityajya' },
    { chapter: 18, verse: 78, desc: 'Yatra yogesvarah krsno' }
];

function generateSitemap() {
    const summaryPath = path.join(__dirname, '../data/chapters/chapters_summary.json');
    let chapters = [];
    if (fs.existsSync(summaryPath)) {
        chapters = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <!-- Homepage -->
    <url>
        <loc>${BASE_URL}/</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
        <image:image>
            <image:loc>${BASE_URL}/assets/images/og-share.png</image:loc>
            <image:title>ShlokPath — Complete Bhagavad Gita Online</image:title>
            <image:caption>All 18 Chapters and 701 Verses of the Shrimad Bhagavad Gita</image:caption>
        </image:image>
    </url>

    <!-- Main Screens & Experiences -->
    <url>
        <loc>${BASE_URL}/chapters</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${BASE_URL}/dilemmas</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${BASE_URL}/dhyana</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${BASE_URL}/search</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${BASE_URL}/settings</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
`;

    // 18 Canonical Chapters
    chapters.forEach(ch => {
        xml += `    <!-- Chapter ${ch.number}: ${ch.title} (${ch.sanskritName || ''}) -->
    <url>
        <loc>${BASE_URL}/chapter/${ch.number}</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
`;
    });

    // High-intent search verses
    KEY_VERSES.forEach(kv => {
        xml += `    <!-- Bhagavad Gita Verse ${kv.chapter}.${kv.verse} - ${kv.desc} -->
    <url>
        <loc>${BASE_URL}/chapter/${kv.chapter}/verse/${kv.verse}</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
`;
    });

    xml += `</urlset>\n`;

    const outPath = path.join(__dirname, '../sitemap.xml');
    fs.writeFileSync(outPath, xml, 'utf8');
    console.log(`Generated sitemap.xml with ${chapters.length} chapters and key canonical verses at ${outPath}`);
}

generateSitemap();
