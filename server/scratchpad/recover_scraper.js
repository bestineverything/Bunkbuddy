import fs from 'fs';

let lines = fs.readFileSync('ims/scraper.js', 'utf8').split('\n');

const fetchResultHubDataCode = `
export async function fetchResultHubData(browser, username) {
    let cgpa = "0.00";
    let semester = "Semester 1";
    if (!username) return { name: null, cgpa, semester };
    
    // Attempt parsing 2024UEC4156 -> year: 2024
    const match = username.match(/^(\\d{4})/);
    if (!match) return { name: null, cgpa, semester };
    
    const admissionYear = parseInt(match[1]);
    const graduationYear = admissionYear + 4;
    const resultUrl = \`https://www.resulthubdtu.com/NSUT/Results/\${graduationYear}\`;
    
    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(resultUrl, { timeout: 8000 });
        if (res.ok) {
            const html = await res.text();
            
            // basic text search extraction instead of cheerio to save dependencies
            const rowRegex = new RegExp(\`<tr[^>]*>\\\\s*<td[^>]*>[^<]*</td>\\\\s*<td[^>]*>([^<]*)</td>\\\\s*<td[^>]*>\\\\s*\${username}\\\\s*</td>(.*?)</tr\`, 'i');
            
            const trMatch = html.match(rowRegex);
            
            if (trMatch) {
                const name = trMatch[1].trim();
                const restOfCells = trMatch[2];
                const tdMatches = [...restOfCells.matchAll(/<td[^>]*>(.*?)<\\/td>/gi)];
                
                let semCount = 0;
                for (let i = 1; i < tdMatches.length - 1; i++) {
                    const val = tdMatches[i][1].trim();
                    if (val !== '—' && val !== '0.00' && val !== '') semCount++;
                }
                cgpa = tdMatches[tdMatches.length - 1][1].trim();
                semester = \`Semester \${semCount > 0 ? semCount : 1}\`;
                return { name, cgpa, semester };
            }
        }
    } catch (e) {
        console.error("ResultHub fetch error:", e.message);
    }
    
    return { name: null, cgpa, semester };
}

export async function fetchResultHubBatch(year, branch) {
    let resultPage = null;
    let students = [];
    try {
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.default.launch({
            headless: 'shell',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-position=-32000,-32000']
        });
        
        resultPage = await browser.newPage();
        await resultPage.setRequestInterception(true);
        resultPage.on('request', req => {
            if (['image', 'stylesheet', 'font', 'media', 'script'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });
`;

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export async function fetchResultHubData')) {
        startIndex = i;
    }
    // we want to catch where it picks up await resultPage.goto for fetchResultHubBatch 
    if (lines[i].includes('await resultPage.goto(`https://www.resulthubdtu.com/NSUT/Results/${year}`, { waitUntil: \'domcontentloaded\', timeout: 30000 });')) {
        endIndex = i;
        break;
    }
}

if (startIndex !== -1 && endIndex !== -1) {
    const newLines = lines.slice(0, startIndex).concat([fetchResultHubDataCode]).concat(lines.slice(endIndex));
    fs.writeFileSync('ims/scraper.js', newLines.join('\n'));
    console.log("Restored successfully");
} else {
    console.log("Could not find bounds", startIndex, endIndex);
}
