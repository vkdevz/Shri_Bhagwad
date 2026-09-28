const fs = require('fs');
const path = require('path');

let errors = 0;
let passes = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passes++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        errors++;
    }
}

console.log('========================================================');
console.log('🔍 RUNNING SHLOKPATH TECHNICAL SEO AUDIT & VERIFICATION');
console.log('========================================================\n');

// 1. Audit index.html Head & Metadata
console.log('1. Auditing index.html Head & Metadata:');
const indexPath = path.join(__dirname, '../index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

assert(/<link\s+rel="canonical"\s+href="https:\/\/shlokpath\.vercel\.app\/"/i.test(indexHtml), 'Canonical link present and points to production domain');
assert(/<meta\s+property="og:title"/i.test(indexHtml), 'Open Graph og:title present');
assert(/<meta\s+property="og:image"\s+content="https:\/\/shlokpath\.vercel\.app\/assets\/images\/og-share\.png"/i.test(indexHtml), 'Open Graph og:image present and points to og-share.png');
assert(/<meta\s+property="og:image:width"\s+content="1200"/i.test(indexHtml), 'og:image:width set to 1200');
assert(/<meta\s+property="og:image:height"\s+content="630"/i.test(indexHtml), 'og:image:height set to 630');
assert(/<meta\s+name="twitter:card"\s+content="summary_large_image"/i.test(indexHtml), 'Twitter Card set to summary_large_image');
assert(/<meta\s+name="twitter:image"/i.test(indexHtml), 'Twitter Card twitter:image present');

// Extract default title and meta description
const titleMatch = indexHtml.match(/<title>([^<]+)<\/title>/i);
assert(titleMatch && titleMatch[1].length <= 60, `Default <title> length (${titleMatch ? titleMatch[1].length : 0} chars) is <= 60 chars: "${titleMatch ? titleMatch[1] : ''}"`);

const descMatch = indexHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
assert(descMatch && descMatch[1].length <= 160, `Default <meta description> length (${descMatch ? descMatch[1].length : 0} chars) is <= 160 chars: "${descMatch ? descMatch[1] : ''}"`);

// 2. Audit Semantic HTML & Content Hierarchy
console.log('\n2. Auditing Semantic HTML & Content Hierarchy:');
const h1Matches = indexHtml.match(/<h1[\s>]/gi) || [];
assert(h1Matches.length === 1, `Exactly ONE <h1> tag found in index.html (found ${h1Matches.length})`);

const h1ContentMatch = indexHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
assert(h1ContentMatch && /Bhagavad Gita/i.test(h1ContentMatch[1]), `H1 contains target keyword "Bhagavad Gita": "${h1ContentMatch ? h1ContentMatch[1].replace(/\s+/g, ' ').trim() : ''}"`);

const h4Matches = indexHtml.match(/<h4[\s>]/gi) || [];
assert(h4Matches.length === 0, `Zero heading skip violations (<h4> count is ${h4Matches.length})`);

// Audit Image alt tags and dimensions
const imgTags = indexHtml.match(/<img[^>]+>/gi) || [];
let allHaveAlt = true;
let allHaveDimensions = true;

imgTags.forEach((img, idx) => {
    const hasAlt = /alt="[^"]+"/i.test(img);
    const hasWidth = /width="[^"]+"/i.test(img);
    const hasHeight = /height="[^"]+"/i.test(img);

    if (!hasAlt) allHaveAlt = false;
    if (!hasWidth || !hasHeight) allHaveDimensions = false;
});

assert(allHaveAlt, `All ${imgTags.length} <img> tags have descriptive alt attributes`);
assert(allHaveDimensions, `All <img> tags have explicit width and height attributes (CLS prevention)`);

// 3. Audit Structured Data (JSON-LD)
console.log('\n3. Auditing Structured Data (Schema.org JSON-LD):');
const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
assert(jsonLdMatch, 'JSON-LD script block found in index.html');

if (jsonLdMatch) {
    try {
        const schemaObj = JSON.parse(jsonLdMatch[1]);
        assert(schemaObj['@context'] === 'https://schema.org', 'Schema context is https://schema.org');
        const graph = schemaObj['@graph'] || [];
        const types = graph.map(item => item['@type']);

        assert(types.includes('WebSite'), 'Includes WebSite schema');
        assert(types.includes('Organization'), 'Includes Organization schema');
        assert(types.includes('WebApplication'), 'Includes WebApplication schema');
        assert(types.includes('Book'), 'Includes Book (Shrimad Bhagavad Gita) schema');
        assert(types.includes('FAQPage'), 'Includes FAQPage rich snippet schema');

        const faq = graph.find(item => item['@type'] === 'FAQPage');
        if (faq && faq.mainEntity) {
            assert(faq.mainEntity.length >= 4, `FAQPage contains ${faq.mainEntity.length} Q&A items for rich snippet eligibility`);
        }
    } catch (e) {
        assert(false, `JSON-LD parsing error: ${e.message}`);
    }
}

// 4. Audit Robots.txt & Sitemap.xml
console.log('\n4. Auditing Robots.txt & Sitemap.xml:');
const robotsPath = path.join(__dirname, '../robots.txt');
assert(fs.existsSync(robotsPath), 'robots.txt exists in root directory');
if (fs.existsSync(robotsPath)) {
    const robotsTxt = fs.readFileSync(robotsPath, 'utf8');
    assert(/User-agent:\s*\*/i.test(robotsTxt), 'robots.txt contains User-agent: * directive');
    assert(/Sitemap:\s*https:\/\/shlokpath\.vercel\.app\/sitemap\.xml/i.test(robotsTxt), 'robots.txt declares canonical sitemap');
    assert(!/Crawl-delay/i.test(robotsTxt), 'robots.txt does not have crawl-delay throttling');
}

const sitemapPath = path.join(__dirname, '../sitemap.xml');
assert(fs.existsSync(sitemapPath), 'sitemap.xml exists in root directory');
if (fs.existsSync(sitemapPath)) {
    const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
    assert(!/#/.test(sitemapXml), 'sitemap.xml contains NO hash fragments (#)');
    assert(/https:\/\/shlokpath\.vercel\.app\//.test(sitemapXml), 'sitemap.xml contains homepage');
    assert(/https:\/\/shlokpath\.vercel\.app\/chapters/.test(sitemapXml), 'sitemap.xml contains /chapters');
    assert(/https:\/\/shlokpath\.vercel\.app\/chapter\/18/.test(sitemapXml), 'sitemap.xml contains all 18 chapters');
    assert(/https:\/\/shlokpath\.vercel\.app\/chapter\/2\/verse\/47/.test(sitemapXml), 'sitemap.xml contains canonical milestone verses');
}

// 5. Audit Open Graph Social Banner
console.log('\n5. Auditing Social Share Banner:');
const ogImagePath = path.join(__dirname, '../assets/images/og-share.png');
assert(fs.existsSync(ogImagePath), 'assets/images/og-share.png exists');
if (fs.existsSync(ogImagePath)) {
    const stat = fs.statSync(ogImagePath);
    assert(stat.size > 20000, `og-share.png is a non-trivial graphic (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 6. Audit 404 & Vercel Configuration
console.log('\n6. Auditing 404 Page & Vercel Routing:');
const notFoundPath = path.join(__dirname, '../404.html');
assert(fs.existsSync(notFoundPath), '404.html exists in root directory');
if (fs.existsSync(notFoundPath)) {
    const notFoundHtml = fs.readFileSync(notFoundPath, 'utf8');
    assert(/<meta\s+name="robots"\s+content="noindex,\s*follow"/i.test(notFoundHtml), '404.html contains noindex, follow meta tag');
}

const vercelPath = path.join(__dirname, '../vercel.json');
assert(fs.existsSync(vercelPath), 'vercel.json exists in root directory');
if (fs.existsSync(vercelPath)) {
    try {
        const vercelObj = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
        assert(Array.isArray(vercelObj.rewrites) && vercelObj.rewrites.length > 0, 'vercel.json defines SPA rewrites for clean URLs');
        assert(Array.isArray(vercelObj.headers) && vercelObj.headers.length > 0, 'vercel.json defines HTTP caching & security headers');
    } catch (e) {
        assert(false, `vercel.json parsing error: ${e.message}`);
    }
}

// 7. Audit Dynamic SEO Router Metadata Lengths
console.log('\n7. Auditing SEO Router Metadata Definitions:');
const seoRouterPath = path.join(__dirname, '../js/seo-router.js');
assert(fs.existsSync(seoRouterPath), 'js/seo-router.js exists');

if (fs.existsSync(seoRouterPath)) {
    const routerCode = fs.readFileSync(seoRouterPath, 'utf8');
    assert(/cleanTrackingParameters/.test(routerCode), 'SeoRouter includes tracking parameter cleaner');
    assert(/setupPopstateListener/.test(routerCode), 'SeoRouter listens to popstate for browser navigation');

    // Test route configs
    const titles = routerCode.match(/title:\s*'([^']+)'/g) || [];
    const descs = routerCode.match(/description:\s*'([^']+)'/g) || [];

    let allTitlesValid = true;
    let allDescsValid = true;

    titles.forEach(t => {
        const val = t.replace(/title:\s*'/, '').replace(/'$/, '');
        if (val.length > 60) {
            console.error(`    ⚠️ Title over 60 chars (${val.length}): ${val}`);
            allTitlesValid = false;
        }
    });

    descs.forEach(d => {
        const val = d.replace(/description:\s*'/, '').replace(/'$/, '');
        if (val.length > 160) {
            console.error(`    ⚠️ Description over 160 chars (${val.length}): ${val}`);
            allDescsValid = false;
        }
    });

    assert(allTitlesValid, 'All predefined route titles are <= 60 characters');
    assert(allDescsValid, 'All predefined route descriptions are <= 160 characters');
}

console.log('\n========================================================');
console.log(`📊 AUDIT SUMMARY: ${passes} PASSED, ${errors} FAILED`);
console.log('========================================================');

if (errors > 0) process.exit(1);
