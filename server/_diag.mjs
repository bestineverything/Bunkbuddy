// SAFE diagnostic: validates the experimental scraping flow's front-half
// (puppeteer launch, Student Login click, frame location, captcha extraction)
// WITHOUT submitting any credentials. Mirrors experimental/browser_pool.js logic.
import puppeteer from 'puppeteer';

const t0 = Date.now();
const el = () => `${((Date.now() - t0) / 1000).toFixed(2)}s`;

async function pollFor(fn, maxMs = 5000, intervalMs = 15) {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    const r = await fn();
    if (r) return r;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return null;
}

let browser;
try {
  console.log(`[DIAG] [${el()}] Launching puppeteer...`);
  browser = await puppeteer.launch({
    headless: 'shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-position=-32000,-32000']
  });
  console.log(`[DIAG] [${el()}] Launched. createBrowserContext type:`, typeof browser.createBrowserContext);

  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const type = req.resourceType();
    const url = req.url().toLowerCase();
    if (type === 'image' && (url.includes('captcha') || url.includes('captchaimg'))) req.continue();
    else if (['image', 'stylesheet', 'font', 'media'].includes(type) || url.includes('analytics') || url.includes('google')) req.abort();
    else req.continue();
  });

  console.log(`[DIAG] [${el()}] goto IMS root...`);
  await page.goto('https://www.imsnsit.org/imsnsit/', { waitUntil: 'domcontentloaded', timeout: 12000 });
  console.log(`[DIAG] [${el()}] root loaded. frames=${page.frames().length}`);

  const clicked = await pollFor(async () => {
    for (const frame of page.frames()) {
      try {
        const found = await frame.evaluate(() => {
          const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase().includes('student login'));
          if (link) { link.click(); return true; }
          return false;
        });
        if (found) return true;
      } catch (e) {}
    }
    return false;
  }, 4000, 15);
  console.log(`[DIAG] [${el()}] clicked Student Login: ${!!clicked}`);

  const loginFrame = await pollFor(async () => {
    for (const frame of page.frames()) {
      try {
        const hasUid = await frame.evaluate(() => !!document.querySelector('input[name="uid"]'));
        if (hasUid) return frame;
      } catch (e) {}
    }
    return null;
  }, 5000, 15);
  console.log(`[DIAG] [${el()}] loginFrame found: ${!!loginFrame}`);
  if (loginFrame) {
    console.log(`[DIAG] loginFrame url: ${loginFrame.url()}`);
    const captcha = await pollFor(async () => loginFrame.evaluate(() => {
      const img = document.querySelector('#captchaimg') || document.querySelector('img[src*="captcha"]');
      if (!img || !img.naturalWidth) return null;
      return 'present:' + img.naturalWidth + 'x' + img.naturalHeight;
    }), 3000, 20);
    console.log(`[DIAG] captcha image: ${captcha}`);
    const formInfo = await loginFrame.evaluate(() => ({
      uid: !!document.querySelector('input[name="uid"]'),
      pwd: !!document.querySelector('input[name="pwd"]'),
      cap: !!document.querySelector('input[name="cap"]'),
      loginBtn: !!document.querySelector('input[name="login"]'),
      refreshFn: typeof refreshcaptcha1
    }));
    console.log(`[DIAG] form fields:`, JSON.stringify(formInfo));
  }
  console.log(`[DIAG] [${el()}] DONE (no credentials submitted)`);
} catch (e) {
  console.error(`[DIAG] ERROR: ${e.message}`);
} finally {
  if (browser) await browser.close().catch(() => {});
}
