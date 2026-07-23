// test_dump.js
import fs from 'fs';
import { loginToIms } from './ims/client.js';

(async () => {
    try {
        console.log("Logging in...");
        const { page, browser } = await loginToIms('2024UME4113', 'Bhanu@2006');
        console.log("Logged in!");
        let out = '';
        for (const frame of page.frames()) {
            try {
                const text = await frame.evaluate(() => document.documentElement.innerText);
                out += '\n---FRAME---\n' + text;
            } catch(e) {}
        }
        fs.writeFileSync('frames.txt', out);
        console.log("Dumped to frames.txt");
        await browser.close();
    } catch(e) {
        console.error(e);
    }
})();
