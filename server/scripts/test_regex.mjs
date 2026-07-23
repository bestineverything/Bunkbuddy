import puppeteer from 'puppeteer';

async function test() {
    const browser = await puppeteer.launch({ headless: "shell", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto('https://www.resulthubdtu.com/NSUT/StudentProfile/2028/2024UME4113', { 
        waitUntil: 'domcontentloaded', 
        timeout: 20000 
    });
    await new Promise(r => setTimeout(r, 3000));
    
    const renderedText = await page.evaluate(() => document.body.innerText);
    const lines = renderedText.split('\n');
    
    // Test the regex directly
    console.log('=== Testing regex matches ===');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const match = line.match(/^Semester\s+(I|II|III|IV|V|VI|VII|VIII|\d+)$/);
        if (match) {
            console.log(`Line ${i}: "${line}" -> matched: ${match[1]}`);
        }
    }
    
    await browser.close();
}

test().catch(console.error);
