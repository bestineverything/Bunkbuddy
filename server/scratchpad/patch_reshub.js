import fs from 'fs';

let code = fs.readFileSync('ims/scraper.js', 'utf8');

const replacement = `    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(resultUrl, { timeout: 8000 });
        if (res.ok) {
            const html = await res.text();
            const $ = cheerio.load(html);
            let targetRow = null;
            
            $('tbody tr').each((i, row) => {
                const cells = $(row).find('td').toArray();
                if (cells.length > 2 && $(cells[2]).text().includes(username)) {
                    targetRow = cells;
                    return false;
                }
            });

            if (targetRow) {
                let semCount = 0;
                for (let i = 4; i < targetRow.length - 1; i++) {
                    const val = $(targetRow[i]).text().trim();
                    if (val !== '—' && val !== '0.00' && val !== '') semCount++;
                }
                const cgpa = $(targetRow[targetRow.length - 1]).text().trim();
                const semester = \`Semester \${semCount > 0 ? semCount : 1}\`;
                return { name: $(targetRow[1]).text().trim(), cgpa, semester };
            }
        }
    } catch (e) {
        console.error("ResultHub fetch error:", e.message);
    }`;

const regex = /let resultPage;\s*try\s*\{[\s\S]*?finally\s*\{[\s\S]*?\}\s*\}/;

const newCode = code.replace(regex, replacement);
if(newCode !== code) {
    fs.writeFileSync('ims/scraper.js', newCode);
    console.log("Patched successfully.");
} else {
    console.log("Regex didn't match.");
}
