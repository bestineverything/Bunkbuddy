import puppeteer from 'puppeteer';

/**
 * Diagnostic copy of login.js with verbose network & frame traversal logging.
 * NEVER modifies original server/ims/login.js.
 */
export async function diagnosticLogin(rollNumber, password) {
    let browser;
    const log = [];
    try {
        browser = await puppeteer.launch({
            headless: "shell",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        page.on('request', req => {
            log.push({ type: 'REQUEST', method: req.method(), url: req.url(), headers: req.headers() });
        });

        page.on('response', res => {
            log.push({ type: 'RESPONSE', status: res.status(), url: res.url(), headers: res.headers() });
        });

        console.log('[DIAGNOSTIC] Navigating to homepage...');
        await page.goto('https://www.imsnsit.org/imsnsit/', { waitUntil: 'domcontentloaded' });

        return { success: true, log };
    } catch (e) {
        return { success: false, error: e.message, log };
    } finally {
        if (browser) await browser.close().catch(() => {});
    }
}
