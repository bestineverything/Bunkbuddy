import puppeteer from 'puppeteer';
import { solveCaptcha } from './captcha.js';
import fs from 'fs';

async function run() {
  console.log('Launching visible browser...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  console.log('Navigating to IMS...');
  await page.goto('https://www.imsnsit.org/imsnsit/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  console.log('Clicking "Student Login"...');
  let clicked = false;
  for (const frame of page.frames()) {
    const found = await frame.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const link = links.find(el => el.textContent.trim().toLowerCase().includes('student login'));
      if (link) { link.click(); return true; }
      return false;
    }).catch(() => false);
    if (found) { clicked = true; break; }
  }
  
  if(!clicked) {
      console.log('Could not find student login link');
      return;
  }
  await new Promise(r => setTimeout(r, 3000));

  let loginFrame = null;
  for (const frame of page.frames()) {
    const hasUid = await frame.evaluate(() => !!document.querySelector('input[name="uid"]')).catch(() => false);
    if (hasUid) { loginFrame = frame; break; }
  }

  if (!loginFrame) {
    console.log('Failed to find login frame');
    return;
  }

  console.log('Extracting captcha...');
  const captchaBase64 = await loginFrame.evaluate(() => {
    const img = document.querySelector('#captchaimg');
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 1.0).split(',')[1];
  });

  const capText = await solveCaptcha(Buffer.from(captchaBase64, 'base64'));
  console.log('Captcha solved:', capText);

  await loginFrame.type('input[name="uid"]', '2024UME4113');
  await loginFrame.type('input[name="pwd"]', 'Amanguliani@12345');
  await loginFrame.type('input[name="cap"]', capText);

  console.log('Clicking login...');
  await loginFrame.click('input[name="login"]');
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n--- OBSERVING POST-LOGIN STATE ---');
  console.log('Current main URL:', page.url());
  
  for (const frame of page.frames()) {
    const url = frame.url();
    const title = await frame.evaluate(() => document.title || 'No Title').catch(() => '');
    console.log(`Frame URL: ${url} (Title: ${title})`);
    
    // Find attendance link
    const links = await frame.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.innerText.trim(),
            href: a.getAttribute('href')
        }));
    }).catch(() => []);
    
    const attLink = links.find(l => l.text.toLowerCase().includes('attendance'));
    if (attLink) {
        console.log(`-> FOUND ATTENDANCE LINK in this frame: [${attLink.text}] => ${attLink.href}`);
        
        console.log('Clicking attendance link in 3 seconds. Watch the browser!');
        await new Promise(r => setTimeout(r, 3000));
        
        await frame.evaluate((href) => {
            const a = Array.from(document.querySelectorAll('a')).find(el => el.getAttribute('href') === href);
            if(a) a.click();
        }, attLink.href).catch(e => console.log('Failed to click', e));
        
        break;
    }
  }
  
  console.log('Waiting 15 seconds so you can visually inspect the page routing.');
  await new Promise(r => setTimeout(r, 15000));
  
  console.log('Extracting the final frames to see what form fields exist in the attendance page...');
  const framesData = [];
  for (const frame of page.frames()) {
      const html = await frame.content().catch(() => '');
      if(html.includes('enc_year')) {
          console.log(`\nFrame ${frame.url()} contains the attendance form!`);
          fs.writeFileSync('final_attendance_page.html', html);
      }
  }

  console.log('Closing browser.');
  await browser.close();
}

run().catch(console.error);
