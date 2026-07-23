import puppeteer from 'puppeteer';

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: 'new', args: ['--window-size=1280,800'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log("Setting mock localStorage...");
    // Go to domain first to set localStorage
    await page.goto('http://localhost:3000/index.html');
    await page.evaluate(() => {
       localStorage.setItem('bb_session', 'mock_session_123');
       localStorage.setItem('bb_roll', '2024UME4113');
       localStorage.setItem('bb_data', JSON.stringify({
           home: {
               profile: { Name: 'Aman Guliani', cgpa: '9.0' },
               summary: [
                  { subject: 'Math', attended: '10', total: '12', percentage: '83%' }
               ]
           },
           attendance: [
              { subject: 'Math', attended: '10', total: '12', percentage: '83%', statusText: 'bunkable', statusNumber: 1 }
           ]
       }));
    });
    
    console.log("Navigating to app.html...");
    await page.goto('http://localhost:3000/app.html');
    
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: 'frontend_screenshot.png' });
    console.log("Saved frontend_screenshot.png!");
    await browser.close();
})();
