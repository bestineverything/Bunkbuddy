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
    
    // Find all semester-like lines
    console.log('=== Searching for semesters ===');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('Semester')) {
            console.log(`Line ${i}: "${line}"`);
            for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                console.log(`  ${j}: "${lines[j].trim()}"`);
            }
        }
    }
    
    // Test the actual extraction with debug
    console.log('\n=== Extraction debug ===');
    const sgpa = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const semMatch = line.match(/^Semester\s+(I+|\d+)$/);
        if (semMatch) {
            console.log(`Found semester at line ${i}: "${line}"`);
            for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                const nextLine = lines[j].trim();
                console.log(`  Checking line ${j}: "${nextLine}"`);
                const crMatch = nextLine.match(/^(\d+)\s*cr$/);
                if (crMatch) {
                    console.log(`    Found CR: ${crMatch[1]}`);
                    for (let k = j + 1; k < Math.min(j + 3, lines.length); k++) {
                        const sgpaLine = lines[k].trim();
                        const sMatch = sgpaLine.match(/^(\d+\.\d+)$/);
                        console.log(`    Checking SGPA line ${k}: "${sgpaLine}" match=${sMatch ? sMatch[1] : 'no'}`);
                        if (sMatch) {
                            sgpa.push(parseFloat(sMatch[1]));
                            console.log(`    -> Added SGPA: ${sMatch[1]}`);
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }
    
    console.log('\nFinal SGPA:', sgpa);
    
    await browser.close();
}

test().catch(console.error);
