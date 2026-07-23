import puppeteer from 'puppeteer';
import { solveCaptchaThreaded } from './captcha_threaded.js';

async function testFastScrape() {
    const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    console.time('Total');
    console.time('Step1_GotoLogin');
    await page.goto('https://www.imsnsit.org/imsnsit/student.htm', { waitUntil: 'domcontentloaded' });
    console.timeEnd('Step1_GotoLogin');

    // Wait for login frame
    let loginFrame = null;
    for (let i = 0; i < 50; i++) {
        for (const frame of page.frames()) {
            if (frame.url().includes('student_login') || frame.url().includes('student')) {
                const hasUid = await frame.evaluate(() => !!document.querySelector('input[name="uid"]')).catch(() => false);
                if (hasUid) { loginFrame = frame; break; }
            }
        }
        if (loginFrame) break;
        await new Promise(r => setTimeout(r, 20));
    }
    
    if (!loginFrame) {
        console.log('No loginFrame found');
        await browser.close();
        return;
    }
    console.log('Found login frame:', loginFrame.url());

    console.time('Captcha');
    const captchaBase64 = await loginFrame.evaluate(() => {
        const img = document.querySelector('#captchaimg') || document.querySelector('img[src*="captcha"]');
        if (!img || !img.naturalWidth) return null;
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        return c.toDataURL('image/jpeg', 1.0).split(',')[1];
    });
    const captchaText = await solveCaptchaThreaded(Buffer.from(captchaBase64, 'base64'));
    console.timeEnd('Captcha');
    console.log('Captcha:', captchaText);

    console.time('SubmitLogin');
    await loginFrame.evaluate((u, p, c) => {
        const uid = document.querySelector('input[name="uid"]');
        const pwd = document.querySelector('input[name="pwd"]');
        const cap = document.querySelector('input[name="cap"]');
        if (uid) uid.value = u;
        if (pwd) pwd.value = p;
        if (cap) cap.value = c;
    }, '2024UME4113', 'Aman@2005', captchaText);

    const navPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => null);
    await loginFrame.click('input[name="login"]');
    await Promise.race([navPromise, new Promise(r => setTimeout(r, 400))]);
    console.timeEnd('SubmitLogin');

    console.log('\n--- FRAMES AFTER LOGIN ---');
    for (const f of page.frames()) {
        console.log('Frame Name:', f.name(), '| URL:', f.url());
    }

    // Now test navigating main frame directly to attendance form!
    console.time('DirectFormNavigate');
    let mainFrame = page.frames().find(f => f.name() === 'main' || f.url().includes('student'));
    if (!mainFrame) mainFrame = page.mainFrame();

    // Navigate frame directly to student_attendance.asp or print_student_attendance.asp or student_activities.asp
    try {
        await mainFrame.goto('https://www.imsnsit.org/imsnsit/student_attendance.asp', { waitUntil: 'domcontentloaded', timeout: 5000 });
    } catch(e) {
        console.log('Direct goto err:', e.message);
    }
    console.timeEnd('DirectFormNavigate');

    console.log('\n--- FRAMES AFTER DIRECT NAV ---');
    for (const f of page.frames()) {
        console.log('Frame Name:', f.name(), '| URL:', f.url());
        const hasForm = await f.evaluate(() => !!document.forms['frm']).catch(() => false);
        console.log('  -> Has frm form:', hasForm);
    }

    await browser.close();
    console.timeEnd('Total');
}

testFastScrape();
