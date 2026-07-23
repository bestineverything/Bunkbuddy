const fs = require('fs');
let code = fs.readFileSync('scraper.js', 'utf8');

code = code.replace(/textNodes\[i\]\.includes\('Cumulative CGPA'\) && i \+ 1 < textNodes\.length/g, "textNodes[i].includes('Cumulative CGPA')");
code = code.replace(/history\.cgpa = textNodes\[i\+1\];/g, "history.cgpa = textNodes[i+1]; if(textNodes[i].match(/[\\d\\.]+/)) history.cgpa = textNodes[i].match(/[\\d\\.]+/)[0];");

fs.writeFileSync('scraper.js', code);
console.log("Done patching.");
