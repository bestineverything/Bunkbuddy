import puppeteer from 'puppeteer';
import { solveCaptcha } from './captcha.js';
import fs from 'fs';

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--start-maximized'] });
  const page = await browser.newPage();
  
  await page.goto('https://www.imsnsit.org/imsnsit/', { waitUntil: 'networkidle0' });

  // 1. Click "Student Login"
  console.log('Clicking "Student Login"...');
  for (const frame of page.frames()) {
    const found = await frame.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(el => el.textContent.trim().toLowerCase().includes('student login'));
      if (link) { link.click(); return true; }
      return false;
    }).catch(() => false);
    if (found) break;
  }
  await new Promise(r => setTimeout(r, 2000));

  // 2. Login
  let loginFrame = null;
  for (const frame of page.frames()) {
    const hasUid = await frame.evaluate(() => !!document.querySelector('input[name="uid"]')).catch(() => false);
    if (hasUid) { loginFrame = frame; break; }
  }
  
  const captchaBase64 = await loginFrame.evaluate(() => {
    const img = document.querySelector('#captchaimg');
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 1.0).split(',')[1];
  });

  const capText = await solveCaptcha(Buffer.from(captchaBase64, 'base64'));
  await loginFrame.type('input[name="uid"]', '2024UME4113');
  await loginFrame.type('input[name="pwd"]', 'Amanguliani@12345');
  await loginFrame.type('input[name="cap"]', capText);
  await loginFrame.click('input[name="login"]');
  console.log('Login submitted...');
  
  await page.screenshot({ path: 'step1_login.png' });

  // 3. Find "My activities"
  console.log('Looking for "My activities"...');
  let clickedActivities = false;
  for (const frame of page.frames()) {
    clickedActivities = await frame.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(el => el.textContent.toLowerCase().includes('my activities') || el.textContent.toLowerCase().includes('activities'));
      if (link) { link.click(); return true; }
      return false;
    }).catch(() => false);
    if (clickedActivities) break;
  }
  
  if (clickedActivities) console.log('Clicked My activities!');
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'step2_activities.png' });

  // 4. Find "Attendance" then "My attendance"
  console.log('Looking for "Attendance" / "My attendance"...');
  let clickedAttendance = false;
  for (const frame of page.frames()) {
    clickedAttendance = await frame.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const att = links.find(el => el.textContent.trim().toLowerCase() === 'my attendance');
      if (att) { att.click(); return true; }
      return false;
    }).catch(() => false);
    if (clickedAttendance) break;
  }

  if (clickedAttendance) console.log('Clicked Attendance!');
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'step3_attendance.png' });

  // 5. Look for the attendance form
  console.log('Checking frames for attendance form...');
  let formFrame = null;
  for (const frame of page.frames()) {
    const hasForm = await frame.evaluate(() => !!document.forms['frm']).catch(() => false);
    if (hasForm) { 
        formFrame = frame; 
        console.log(`FOUND FORM 'frm' IN FRAME! URL is: ${frame.url()}`);
        break; 
    }
  }

      if (formFrame) {
          console.log('Filling form: Semester 4, Year 2025-26');
          
          try {
              // We do EVERYTHING inside evaluate to prevent Puppeteer detachment errors 
              // if the site triggers stray navigations or events
              await formFrame.evaluate(async () => {
                  const delay = (ms) => new Promise(r => setTimeout(r, ms));
                  
                  // Delete PDF form
                  let pdfForm = document.forms['pdff1'];
                  if (pdfForm) pdfForm.remove();

                  let frm = document.forms['frm'];
                  if (!frm) return;

                  // 1. Visually Highlight and Set Year
                  let yearSelect = frm.year;
                  if (yearSelect) {
                      yearSelect.style.border = '5px solid red'; // Flashy visual cue!
                      yearSelect.style.backgroundColor = 'yellow';
                      await delay(1500); // Wait so user sees the red box!
                      yearSelect.value = '2025-26';
                      // Dispatch change to trigger any site listeners
                      yearSelect.dispatchEvent(new Event('change', { bubbles: true }));
                      await delay(1500); // Wait again so they see it updated
                  }

                  // 2. Visually Highlight and Set Semester
                  let semSelect = frm.sem;
                  if (semSelect) {
                      semSelect.style.border = '5px solid red'; // Flashy visual cue!
                      semSelect.style.backgroundColor = 'yellow';
                      await delay(1500); // Wait so user sees the red box!
                      semSelect.value = '4';
                      semSelect.dispatchEvent(new Event('change', { bubbles: true }));
                      await delay(1500); // Wait again so they see it updated
                  }

                  // 3. Highlight and Click Submit
                  let submitBtn = frm.querySelector('input[type="submit"]');
                  if (submitBtn) {
                      submitBtn.style.border = '5px solid red';
                      submitBtn.style.backgroundColor = 'lime';
                      await delay(1500); // Wait so user sees the active button!
                      submitBtn.click();
                  }
              });
              
              console.log('Set year, sem, and clicked Submit on frm perfectly via robust evaluate!');
          } catch(e) {
              console.log('Ignore evaluate error after submit', e.message);
          }
          
          await new Promise(r => setTimeout(r, 8000));
          try { await page.screenshot({ path: 'step4_result.png' }); } catch(e){}

          console.log('Finding the new frame that loaded the table...');
          let finalFrameContext = null;
          for (const frame of page.frames()) {
              const hasTable = await frame.evaluate(() => document.body.innerHTML.includes('Overall Class')).catch(() => false);
              if (hasTable) {
                  finalFrameContext = frame;
                  console.log('Found frame with Overall Class table!');
                  break;
              }
          }

          if (finalFrameContext) {
              console.log('Dumping final result HTML from that frame.');
              fs.writeFileSync('final_table.html', await finalFrameContext.content());
              fs.writeFileSync('form_url.txt', finalFrameContext.url());
              console.log('Done! Wrote final_table.html and form_url.txt');
          } else {
              console.log('Could not find the resulting table in any frame after waiting.');
          }
      } else {
          console.log('Could not find the form frame!');
      }

  // END of formFrame check
  console.log("Visual dump complete! Leaving window open for 120 seconds for you to verify...");
  await new Promise(r => setTimeout(r, 120000));
  await browser.close();
}

run().catch(console.error);
