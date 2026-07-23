import puppeteer from 'puppeteer';

(async () => {
    console.log("Launching browser to test direct URL access...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Attempting to go straight to dashboard without logging in first
    console.log("Navigating to http://localhost:3000/app.html...");
    await page.goto('http://localhost:3000/app.html', { waitUntil: 'load' });
    
    // Check if it redirected
    const currentUrl = page.url();
    console.log(`Current URL after navigation: ${currentUrl}`);
    
    if (currentUrl.includes('index.html')) {
        console.log("SUCCESS: The app.html correctly redirected to index.html!");
    } else {
        console.log("FAILED: The app.html did not redirect!", await page.content());
    }
    
    await browser.close();
})();
