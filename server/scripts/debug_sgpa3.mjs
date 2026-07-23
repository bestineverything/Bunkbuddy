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
    
    console.log('=== Full extraction with debug ===');
    const sgpa = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const semMatch = line.match(/^Semester\s+(I|II|III|IV|V|VI|VII|VIII|\d+)$/);
        if (semMatch) {
            console.log(`\nFound semester at ${i}: ${semMatch[1]}`);
            let foundCr = false;
            let foundSgpa = false;
            for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                const nextLine = lines[j].trim();
                const crMatch = nextLine.match(/^(\d+)\s*cr$/);
                if (!foundCr && crMatch) {
                    console.log(`  CR found at ${j}: ${crMatch[1]} cr`);
                    foundCr = true;
                    for (let k = j + 1; k < Math.min(j + 3, lines.length); k++) {
                        const sgpaLine = lines[k].trim();
                        const sgpaMatch = sgpaLine.match(/^(\d+\.\d+)$/);
                        if (sgpaMatch) {
                            console.log(`  SGPA found at ${k}: ${sgpaMatch[1]}`);
                            sgpa.push(parseFloat(sgpaMatch[1]));
                            foundSgpa = true;
                            break;
                        } else {
                            console.log(`  Line ${k}: "${sgpaLine}" (no match)`);
                        }
                    }
                    break;
                }
            }
            if (!foundSgpa) {
                console.log(`  -> NO SGPA FOUND!`);
            }
        }
    }
    
    console.log('\nFinal SGPA:', sgpa);
    
    await browser.close();
}

test().catch(console.error);
