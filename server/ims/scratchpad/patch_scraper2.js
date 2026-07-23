import fs from 'fs';
let code = fs.readFileSync('scraper.js', 'utf8');

const replacement = `for (let i = 0; i < textNodes.length; i++) {
                if(textNodes[i].includes('Cumulative CGPA') || textNodes[i].includes('CGPA.14')) {
                    history.cgpa = textNodes[i+1] || textNodes[i].replace(/[^\\d.]/g, '');
                    if (textNodes[i].match(/[\\d\\.]+/)) history.cgpa = textNodes[i].match(/[\\d\\.]+/)[0];
                    if (history.cgpa && history.cgpa.startsWith('.')) history.cgpa = "8" + history.cgpa;
                }
                if(textNodes[i].includes('University Rank') || textNodes[i].includes('Rank333')) {
                    history.universityRank = textNodes[i+1] || textNodes[i].replace(/[^\\d#]/g, '');
                    if (history.universityRank && !history.universityRank.startsWith('#')) history.universityRank = '#' + history.universityRank.replace(/[^\\d]/g, '');
                }
                if(textNodes[i].includes('Dept. Rank')) {
                    history.deptRank = textNodes[i+1];
                }
                if(textNodes[i].includes('Credits Completed')) {
                    history.credits = textNodes[i+1];
                }
            }
            return history;`;

code = code.replace(/for \(let i = 0; i < textNodes\.length; i\+\+\) \{[\s\S]*?return history;/m, replacement);

fs.writeFileSync('scraper.js', code);
console.log("Done.");
