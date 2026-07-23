import fs from 'fs';
let content = fs.readFileSync('ims/scraper.js', 'utf8');
content = content.replace(/attempts < 40;/g, 'attempts < 400;');
fs.writeFileSync('ims/scraper.js', content);
console.log("Fixed scraper timeouts.");
