import * as cheerio from 'cheerio';
import fs from 'fs';

const html = fs.readFileSync('C:/Users/Theam/OneDrive/Desktop/bunkbuddy.in/server/ims/logs/resulthub_dump.html', 'utf8');
const $ = cheerio.load(html);

const metaDesc = $('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').attr('content') || '';
const ldJsonScript = $('script[type="application/ld+json"]').html() || '';
const bodyText = $.text();

const seed = [metaDesc, ldJsonScript, bodyText].join('\n');

const history = {};

let cgpaMatch = seed.match(/Cumulative CGPA[\s\n]*([\d\.]+)/i) || seed.match(/CGPA[\s:]*([\d]+\.[\d]+)/i);
if (cgpaMatch) history.cgpa = cgpaMatch[1];
else history.cgpa = '--';

let uniRankMatch = seed.match(/University Rank[\s\n]*#?(\d+)/i) || seed.match(/Rank[\s\n]*#?(\d+)/i);
if (uniRankMatch) history.universityRank = '#' + uniRankMatch[1];
else history.universityRank = '--';

const deptRankMatch = seed.match(/Dept\.? Rank[\s\n]*#?(\d+)/i);
if (deptRankMatch) history.deptRank = '#' + deptRankMatch[1];
else history.deptRank = '--';

const creditsMatch = seed.match(/Credits Completed[\s\n]*(\d+)/i);
if (creditsMatch) history.credits = creditsMatch[1];
else history.credits = '--';

history.major = 'B.Tech';
if (/Mechanical Engineering/.test(seed)) history.major = 'Mechanical Engineering';
else if (/Computer Science|COE|CSE/.test(seed)) history.major = 'Computer Science';
else if (/Electronics/.test(seed)) history.major = 'Electronics & Comm.';

history.name = 'Student';
try {
    const ldData = JSON.parse(ldJsonScript);
    if (ldData && ldData.name) {
        history.name = ldData.name;
    }
} catch(e) {
    const nameMatch = seed.match(/<title>([^<]+?)\(/);
    if (nameMatch) history.name = nameMatch[1].trim();
}

console.log('Parsed ResultHub data:', JSON.stringify(history, null, 2));
