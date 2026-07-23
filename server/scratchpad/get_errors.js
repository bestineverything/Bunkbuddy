import puppeteer from 'puppeteer';
import fs from 'fs';

let logs = [];

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const loc = msg.location();
            logs.push(`[BROWSER ERROR]: ${msg.text()} | URL: ${loc.url} | Line: ${loc.lineNumber}`);
        }
    });

    page.on('response', response => {
        if (!response.ok()) {
            // skip
        }
    });

    page.on('pageerror', err => {
        logs.push(`[PAGE UNCAUGHT ERROR]: ${err.message}`);
    });

    console.log("Setting up session...");
    await page.evaluateOnNewDocument(() => {
        window.addEventListener('error', (event) => {
            console.log(`[NATIVE ERROR] -> MSG: ${event.message} | LOC: ${event.filename}:${event.lineno}`);
        });
    });

    await page.goto('http://localhost:3000/index.html');
    await page.evaluate(() => {
       localStorage.setItem('bb_session', 'mock_session_123');
       localStorage.setItem('bb_roll', '2024UME4113');
       localStorage.setItem('bb_data', JSON.stringify({
           home: {
               profile: { Name: 'Aman Guliani', cgpa: '9.0' },
           },
           attendance: []
       }));
    });
    
    console.log("Navigating to app.html...");
    await page.goto('http://localhost:3000/app.html', { waitUntil: 'load' });
    
    await new Promise(r => setTimeout(r, 2000));
    const isStuck = await page.evaluate(() => {
        const cards = document.getElementById('subjectCardsContainer');
        return cards ? cards.innerHTML : "NOT FOUND";
    });
    
    logs.push(`Subject cards container HTML: ${isStuck}`);
    fs.writeFileSync('clean_log.txt', logs.join('\n\n'));

    await browser.close();
})();
