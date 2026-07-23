import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    console.log("Fetching ResultHub for 2024UME4113...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    try {
        await page.goto('https://www.resulthubdtu.com/NSUT/StudentProfile/2028/2024UME4113', { waitUntil: 'networkidle2' });
        const html = await page.content();
        fs.writeFileSync('resulthub_dump.html', html);
        console.log("Dumped HTML to resulthub_dump.html");
    } catch(e) {
        console.error(e);
    }
    await browser.close();
    process.exit();
})();
