import fs from 'fs';

let content = fs.readFileSync('ims/scraper.js', 'utf8');

const anchor1 = `    } catch (e) {
        console.error("ResultHub fetch error:", e.message);
    });

        await resultPage.goto(\`https://www.resulthubdtu.com/NSUT/Results/\${year}\`, { waitUntil: 'domcontentloaded', timeout: 30000 });`;

const replacement1 = `    } catch (e) {
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

const anchor2 = `const $ = cheerio.load(html);`;
const replacement2 = `const cheerio = await import('cheerio');\n            const $ = cheerio.load(html);`;

content = content.replace(anchor1, replacement1);
content = content.replace(anchor2, replacement2);

fs.writeFileSync('ims/scraper.js', content);
console.log("Fixed syntax");
