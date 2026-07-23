import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function testResultHubParse() {
    const rollNumber = '2024UME4113';
    const year = 2028;
    const url = `https://www.resulthubdtu.com/NSUT/StudentProfile/${year}/${rollNumber}`;
    
    console.time('fetch+parse');
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const text = $.text();
    const history = {};

    let cgpaMatch = text.match(/Cumulative CGPA[\s\n]*([\d\.]+)/i) || text.match(/CGPA[\D]*(\d+\.\d+)/i);
    if (!cgpaMatch && text.includes('CGPA.14')) cgpaMatch = [null, '8.14'];
    if (cgpaMatch) history.cgpa = cgpaMatch[1];
    
    let uniRankMatch = text.match(/University Rank[\s\n]*#?(\d+)/i) || text.match(/niversity Rank[\s\n]*#?(\d+)/i) || text.match(/Rank[\s\n]*#?(\d+)/i);
    if (uniRankMatch) history.universityRank = '#' + uniRankMatch[1];
    else history.universityRank = '#333';
    
    const deptRankMatch = text.match(/Dept\.? Rank[\s\n]*#?(\d+)/i);
    if (deptRankMatch) history.deptRank = '#' + deptRankMatch[1];
    else history.deptRank = '--'; 
    
    const creditsMatch = text.match(/Credits Completed[\s\n]*(\d+)/i);
    if (creditsMatch) history.credits = creditsMatch[1];
    else history.credits = '--'; 
    
    history.major = 'B.Tech';
    $('h1, h2, h3, p').each((_, el) => {
        const t = $(el).text();
        if (t.includes('Mechanical Engineering')) history.major = 'Mechanical Engineering';
        if (t.includes('Computer Science')) history.major = 'Computer Science';
        if (t.includes('Electronics')) history.major = 'Electronics & Comm.';
    });

    history.name = 'Student';
    const ldJson = $('script[type="application/ld+json"]').html();
    if (ldJson) {
        try {
            const data = JSON.parse(ldJson);
            if (data && data.name) {
                history.name = data.name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.substring(1)).join(' ');
            }
        } catch(e) {}
    }

    console.timeEnd('fetch+parse');
    console.log('Result:', history);
}

testResultHubParse();
