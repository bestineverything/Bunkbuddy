import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const url = 'https://www.resulthubdtu.com/NSUT/StudentProfile/2028/2024UME4113';
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  timeout: 15000
});
const html = await res.text();
const $ = cheerio.load(html);

// Get ALL text including hidden elements
const bodyText = $.text();
const cleanText = bodyText.replace(/\s+/g, ' ');

console.log('=== ALL TEXT CONTENT ===');
console.log(cleanText);

// Find script tags with JSON
$('script').each((i, el) => {
  const content = $(el).html();
  if (content && (content.includes('16') || content.includes('86') || content.includes('dept') || content.includes('credit'))) {
    console.log(`\n=== Script ${i} ===`);
    console.log(content.substring(0, 500));
  }
});
