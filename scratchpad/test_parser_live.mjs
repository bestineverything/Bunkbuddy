import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const url = 'https://www.resulthubdtu.com/NSUT/StudentProfile/2028/2024UME4113';
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  timeout: 15000
});
const html = await res.text();
const $ = cheerio.load(html);

const metaDesc = $('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').attr('content') || '';
const ldJson = $('script[type="application/ld+json"]').html() || '';
const bodyText = $.text();
const seed = [metaDesc, ldJson, bodyText].join('\n');

const cgpa = seed.match(/CGPA[:\s]+([\d]+\.[\d]+)/i)?.[1] || '--';
const uniRank = seed.match(/University Rank[:\s]+#?(\d+)/i)?.[1] || '--';
const deptRank = seed.match(/Dept\.? Rank[:\s]+#?(\d+)/i)?.[1] || '--';
const credits = seed.match(/Credits Completed[:\s]+(\d+)/i)?.[1] || '--';
const branch = seed.match(/Branch[:\s]+([^,]+)/i)?.[1]?.trim() || '--';

console.log('cgpa:', cgpa);
console.log('uniRank:', uniRank ? '#' + uniRank : '--');
console.log('deptRank:', deptRank ? '#' + deptRank : '--');
console.log('credits:', credits);
console.log('branch:', branch);
console.log('title:', $('title').text());
console.log('metaDesc:', metaDesc);
