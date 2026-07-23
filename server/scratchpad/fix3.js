import fs from 'fs';

let lines = fs.readFileSync('ims/scraper.js', 'utf8').split('\n');

const correctLines = `        }
    } catch (e) {
        console.error("ResultHub fetch error:", e.message);
    }
    
    return { name: null, cgpa: "N/A", semester: "N/A" };
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

        await resultPage.goto(\`https://www.resulthubdtu.com/NSUT/Results/\${year}\`, { waitUntil: 'domcontentloaded', timeout: 30000 });`;

// Replace lines 411 to 417 inclusive
lines.splice(411, 7, correctLines);

fs.writeFileSync('ims/scraper.js', lines.join('\n'));
console.log("Reconstructed logic manually");
