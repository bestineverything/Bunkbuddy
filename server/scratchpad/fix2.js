import fs from 'fs';
let lines = fs.readFileSync('ims/scraper.js', 'utf8').split('\n');
lines[10] = "";
lines[11] = "  const $ = cheerio.load(html);";
fs.writeFileSync('ims/scraper.js', lines.join('\n'));
console.log("Fixed via array");
