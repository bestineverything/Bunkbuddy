import puppeteer from 'puppeteer';

async function test() {
    const browser = await puppeteer.launch({ headless: "shell" });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto('https://www.resulthubdtu.com/NSUT/StudentProfile/2028/2024UME4113', { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
    });
    
    // Wait for page to fully render
    await new Promise(r => setTimeout(r, 5000));
    
    // Get all text from the page
    const fullText = await page.evaluate(() => document.body.innerText);
    console.log('=== FULL PAGE TEXT ===');
    console.log(fullText);
    
    // Get all HTML
    const html = await page.content();
    console.log('\n=== HTML LENGTH ===');
    console.log(html.length);
    
    // Search for specific values
    const has16 = html.includes('16');
    const has86 = html.includes('86');
    const hasDept = html.includes('Dept');
    const hasCredit = html.includes('Credit');
    
    console.log('\n=== SEARCH RESULTS ===');
    console.log('Has 16:', has16);
    console.log('Has 86:', has86);
    console.log('Has Dept:', hasDept);
    console.log('Has Credit:', hasCredit);
    
    await browser.close();
}

test().catch(console.error);
