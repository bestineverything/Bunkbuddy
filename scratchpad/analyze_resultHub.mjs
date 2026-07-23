import * as cheerio from 'cheerio';

const fetch = (await import('node-fetch')).default;

async function test() {
    const url = 'https://www.resulthubdtu.com/NSUT/StudentProfile/2028/2024UME4113';
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const metaDesc = $('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').attr('content') || '';
    const ldJsonScript = $('script[type="application/ld+json"]').html() || '';
    const bodyText = $.text();
    const seed = [metaDesc, ldJsonScript, bodyText].join('\n');
    
    console.log('=== SEARCHING FOR PATTERNS ===');
    
    // Search for all occurrences of "Rank"
    const rankMatches = [...seed.matchAll(/Rank/gi)];
    console.log('Rank occurrences:', rankMatches.length);
    for (const m of rankMatches) {
        const ctx = seed.substring(Math.max(0, m.index - 30), Math.min(seed.length, m.index + 50));
        console.log('  Context:', JSON.stringify(ctx));
    }
    
    // Search for all occurrences of "#" followed by digits
    const hashMatches = [...seed.matchAll(/#(\d+)/g)];
    console.log('\nHash+number occurrences:', hashMatches.length);
    for (const m of hashMatches) {
        const ctx = seed.substring(Math.max(0, m.index - 30), Math.min(seed.length, m.index + 30));
        console.log('  #' + m[1] + ' at', m.index, 'Context:', JSON.stringify(ctx));
    }
    
    // Search for "Credits"
    const creditMatches = [...seed.matchAll(/Credit/gi)];
    console.log('\nCredit occurrences:', creditMatches.length);
    for (const m of creditMatches) {
        const ctx = seed.substring(Math.max(0, m.index - 30), Math.min(seed.length, m.index + 50));
        console.log('  Context:', JSON.stringify(ctx));
    }
    
    // Search for "Dept"
    const deptMatches = [...seed.matchAll(/Dept/gi)];
    console.log('\nDept occurrences:', deptMatches.length);
    for (const m of deptMatches) {
        const ctx = seed.substring(Math.max(0, m.index - 30), Math.min(seed.length, m.index + 50));
        console.log('  Context:', JSON.stringify(ctx));
    }
    
    // Show ld+json content
    if (ldJsonScript) {
        console.log('\n=== LD+JSON ===');
        try {
            const data = JSON.parse(ldJsonScript);
            console.log(JSON.stringify(data, null, 2).substring(0, 2000));
        } catch(e) {
            console.log('LD+JSON parse error:', e.message);
            console.log(ldJsonScript.substring(0, 500));
        }
    }
    
    // Show meta description
    console.log('\n=== META DESCRIPTION ===');
    console.log(metaDesc);
    
    // Show title
    const title = $('title').text();
    console.log('\n=== TITLE ===');
    console.log(title);
}

test().catch(e => console.error(e));
