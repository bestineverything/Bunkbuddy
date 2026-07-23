import fs from 'fs';
let code = fs.readFileSync('ims/scraper.js', 'utf8');
const newCode = code.replace(/await delay\(100\)/g, 'await delay(10)');
if(newCode !== code) {
    fs.writeFileSync('ims/scraper.js', newCode);
    console.log("Speed patched successfully.");
}
