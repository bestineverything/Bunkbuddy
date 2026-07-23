import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.goto('https://www.resulthubdtu.com/NSUT/Results/2028', { waitUntil: 'domcontentloaded' });
        
        await page.waitForSelector('input[placeholder="Name or Roll No..."]');
        await page.type('input[placeholder="Name or Roll No..."]', '2024UME4113');
        await new Promise(r => setTimeout(r, 1000));
        
        const data = await page.evaluate(() => {
            const row = document.querySelector('tbody tr');
            if (!row) return null;
            const cells = Array.from(row.querySelectorAll('td'));
            return cells.map(c => c.innerText.trim());
        });
        
        console.log("Extracted Data:", JSON.stringify(data, null, 2));
    } finally {
        await browser.close();
    }
})();
