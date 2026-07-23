import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const url = 'https://www.resulthubdtu.com/NSUT/StudentProfile/2028/2024UME4113';
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  timeout: 15000
});
const html = await res.text();
const $ = cheerio.load(html);

const metaDesc = $('meta[name="description"]').attr('content') || '';
const ldJson = $('script[type="application/ld+json"]').html() || '';
const title = $('title').text();

console.log('Title:', title);
console.log('Meta description:', metaDesc);
console.log('LD+JSON:', ldJson);

// Search for numbers that might be ranks/credits
const bodyText = $.text();
const cleanText = bodyText.replace(/\s+/g, ' ');

// Find patterns like "Rank: 16" or "Dept Rank 16"
const rankPatterns = [
  /Dept\.?\s*Rank[:\s]+#?(\d+)/i,
  /Department\s*Rank[:\s]+#?(\d+)/i,
  /Rank[:\s]+#?(\d+)/i,
  /#(\d+)[\s\n]+Rank/i
];

for (const pattern of rankPatterns) {
  const match = cleanText.match(pattern);
  if (match) {
    console.log(`Found rank pattern "${pattern}" :`, match[0]);
  }
}

// Find credits
const creditPatterns = [
  /Credits[:\s]+(\d+)/i,
  /(\d+)[\s]+Credits/i,
  /Completed[:\s]+(\d+)/i
];

for (const pattern of creditPatterns) {
  const match = cleanText.match(pattern);
  if (match) {
    console.log(`Found credit pattern "${pattern}" :`, match[0]);
  }
}

// Search for all numbers that could be ranks
const allNumbers = cleanText.match(/#?\d{1,3}/g);
if (allNumbers) {
  console.log('All numbers found:', [...new Set(allNumbers)].slice(0, 20));
}
