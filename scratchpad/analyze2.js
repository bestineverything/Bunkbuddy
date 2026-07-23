const fs = require('fs');
const html = fs.readFileSync('C:/Users/Theam/OneDrive/Desktop/bunkbuddy.in/server/ims/logs/resulthub_dump.html', 'utf8');

console.log('Looking for data patterns...');

// 1. Check meta description
const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/);
if (descMatch) {
  console.log('Meta description:', descMatch[1]);
}

// 2. Find all script tags with JSON-like content
const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
for (const script of scripts) {
  const content = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
  if (content.includes('8.14') || content.includes('cgpa') || content.includes('rollNumber')) {
    console.log('Script contains data:', content.substring(0, 300));
    console.log('---');
  }
}

// 3. Check for JSON data
const jsonMatches = html.match(/\{[^{}]*"cgpa"[^{}]*\}/g);
console.log('JSON cgpa matches:', jsonMatches ? jsonMatches.length : 0);
if (jsonMatches) {
  jsonMatches.forEach(m => console.log(m.substring(0, 200)));
}

// 4. Check if it's a cloudflare challenge
if (html.includes('cloudflare') || html.includes('challenge') || html.includes('verify')) {
  console.log('WARNING: Possible bot challenge page!');
}

// 5. Check for __NEXT_DATA__ with different encoding
const nextIdx = html.indexOf('__NEXT_DATA__');
console.log('NEXT_DATA:', nextIdx > -1 ? 'found' : 'not found');

// 6. Check what cheerio text() would produce
const cheerio = require('cheerio');
const $ = cheerio.load(html);
const bodyText = $('body').text();
console.log('Body text length:', bodyText.length);
console.log('Body contains CGPA:', bodyText.includes('CGPA'));
console.log('Body contains 8.14:', bodyText.includes('8.14'));
console.log('Body contains AMAN:', bodyText.includes('AMAN'));

const fullText = $.text();
console.log('Full text length:', fullText.length);
console.log('Full text contains CGPA:', fullText.includes('CGPA'));
console.log('Full text contains 8.14:', fullText.includes('8.14'));

if (fullText.includes('CGPA')) {
  const idx = fullText.indexOf('CGPA');
  console.log('CGPA context:', fullText.substring(idx - 50, idx + 100));
}
