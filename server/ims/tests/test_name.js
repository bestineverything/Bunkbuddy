import puppeteer from 'puppeteer';
import { solveCaptcha } from './captcha.js';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('https://www.imsnsit.org/imsnsit/student.htm');
  
  // login logic...
  const roll = '2024UME4113';
  const pass = 'Bhanu@2006';
  
  const cUrl = await page.evaluate(() => document.querySelector('img#captchaimg')?.src);
  const cData = await page.goto(cUrl).then(r => r.buffer());
  await page.goBack();
  const captchaText = await solveCaptcha(cData);
  
  await page.type('#uid', roll);
  await page.type('#pwd', pass);
  await page.type('#cap', captchaText);
  await Promise.all([page.waitForNavigation(), page.click('input[type="submit"]')]);
  
  await new Promise(r => setTimeout(r, 2000));
  for (const frame of page.frames()) {
      console.log('FRAME:', frame.url());
      if (frame.url().includes('student_login110') || frame.url().includes('student_msg')) {
          console.log(await frame.evaluate(() => document.body.innerText));
      }
  }
  
  await browser.close();
  console.log("Done");
})();
