import { loginToIms } from './login.js';
import { fetchPage, postPage, absUrl } from './client.js';
import * as cheerio from 'cheerio';

async function testFast() {
    console.time("PuppeteerLogin");
    const result = await loginToIms('2024UME4113', 'Amanguliani@12345');
    console.timeEnd("PuppeteerLogin");
    
    if(!result.success) return console.log("Login failed");
    
    try {
        console.time("FastScrape");
        const client = result.client; // Contains cookies!
        
        // 1. We know IMS defaults to student_main.php frameset, but maybe the menu is on another page?
        // Let's scrape the main page directly!
        let html = await fetchPage(client, 'https://www.imsnsit.org/imsnsit/student_main.php');
        if(html.includes('<frame')) {
            console.log("student_main is a Frameset! It has:");
            const $f = cheerio.load(html);
            $f('frame').each((_, f) => console.log("Frame src:", $f(f).attr('src')));
        }
        
        let framesToCheck = ['student_main.php', 'studentnav.php', 'top.php', 'student_activities.php', 'studentav.php', 'list_student_activities.php'];
        
        for (const url of framesToCheck) {
            console.log("Checking:", url);
            let checkHtml = await fetchPage(client, 'https://www.imsnsit.org/imsnsit/' + url);
            const $ = cheerio.load(checkHtml);
            let found = false;
            $('a').each((_, a) => {
                const text = $(a).text().toLowerCase();
                if (text.includes('my activities') || text.includes('attendance')) {
                    console.log(`Found link in ${url}! Text: ${text}, Href: ${$(a).attr('href')}`);
                    found = true;
                }
            });
            if(found) break;
        }
        
    } catch(e) {
        console.error(e);
    } finally {
        if(result.browser) await result.browser.close().catch(()=>{});
        console.timeEnd("FastScrape");
    }
}
testFast().catch(console.error);
