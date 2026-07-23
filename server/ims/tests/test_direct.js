import puppeteer from 'puppeteer';
import { solveCaptcha } from './captcha.js';

async function testDirect() {
  console.time('directLogin');
  const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', req => {
    if(['image', 'stylesheet', 'font'].includes(req.resourceType()) && !req.url().includes('captcha')) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto('https://www.imsnsit.org/imsnsit/student_login.php', { waitUntil: 'domcontentloaded' });
  const captchaBase64 = await page.evaluate(() => {
    const img = document.querySelector('#captchaimg');
    if (!img) return null;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/jpeg', 1.0).split(',')[1];
  });
  
  console.log("Captcha grabbed directly!", !!captchaBase64);
  const text = await solveCaptcha(Buffer.from(captchaBase64, 'base64'));
  console.log("Solved:", text);
  
  await page.type('input[name="uid"]', '2024UME4113');
  await page.type('input[name="pwd"]', 'Amanguliani@12345');
  await page.type('input[name="cap"]', text);
  
  page.on('dialog', d => d.accept());
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('input[name="login"]')
  ]);
  
  const content = await page.content();
  console.log("Success?", content.includes('Welcome') || content.includes('student_main'));
  console.timeEnd('directLogin');
  await browser.close();
}
testDirect().catch(console.error);
