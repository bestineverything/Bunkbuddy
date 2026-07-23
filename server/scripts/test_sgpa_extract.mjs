import puppeteer from 'puppeteer';

async function test() {
    const browser = await puppeteer.launch({ headless: "shell", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto('https://www.resulthubdtu.com/NSUT/StudentProfile/2028/2024UME4113', { 
        waitUntil: 'domcontentloaded', 
        timeout: 20000 
    });
    await new Promise(r => setTimeout(r, 2000));
    
    const renderedText = await page.evaluate(() => document.body.innerText);
    
    // Test the new extraction logic
    const lines = renderedText.split('\n');
    const sgpa = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const semMatch = line.match(/^Semester\s+(I+|\d+)$/);
        if (semMatch) {
            for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                const nextLine = lines[j].trim();
                const crMatch = nextLine.match(/^(\d+)\s*cr$/);
                if (crMatch) {
                    for (let k = j + 1; k < Math.min(j + 3, lines.length); k++) {
                        const sgpaLine = lines[k].trim();
                        const sgpaMatch = sgpaLine.match(/^(\d+\.\d+)$/);
                        if (sgpaMatch) {
                            sgpa.push(parseFloat(sgpaMatch[1]));
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }
    
    console.log('Extracted SGPA:', sgpa);
    console.log('Expected: [8.40, 6.50, 8.73, 9.20]');
    console.log('Match:', JSON.stringify(sgpa) === '[8.4,6.5,8.73,9.2]');
    
    await browser.close();
}

test().catch(console.error);
