import fs from 'fs';
import puppeteer from 'puppeteer';
import { solveCaptcha } from './captcha.js';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('https://www.imsnsit.org/imsnsit/student.htm');
  
  const cUrl = await page.evaluate(() => document.querySelector('img#captchaimg')?.src);
  const cData = await page.goto(cUrl).then(r => r.buffer()).catch(e => {
        // use canvas bypass
  });
  
  // Actually since we know we have cookie problems with cData sometimes, let's just reuse loginToIms!
})();
