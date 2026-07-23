import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const url = 'https://www.resulthubdtu.com/NSUT/StudentProfile/2028/2024UME4113';
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Check for next.js data script
    const nextData = await page.evaluate(() => {
        const tag = document.getElementById('__NEXT_DATA__');
        return tag ? tag.innerText.substring(0, 500) : "No NextData";
    });
    
    console.log("NEXT DATA:", nextData);
    await browser.close();
})();
