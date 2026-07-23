import * as cheerio from 'cheerio';
import { createImsClient, absUrl } from '../server/ims/client.js';
import { solveCaptchaThreaded } from './captcha_threaded.js';

const IMS_ROOT = 'https://www.imsnsit.org/imsnsit';

/**
 * Experimental Raw-HTTP Login Engine (No Puppeteer Browser Overhead)
 * GET login page -> GET CAPTCHA image on same cookie jar -> OCR solve -> POST credentials
 */
export async function rawHttpLoginToIms(rollNumber, password, maxAttempts = 3) {
    const { client, jar, base } = createImsClient();

    console.log(`[RAW-HTTP-LOGIN] Initiating raw HTTP session for ${rollNumber}...`);
    
    // Step 1: GET main IMS entrance page to establish initial session cookie
    const rootRes = await client.get(`${IMS_ROOT}/`, { responseType: 'text' });
    const rootHtml = rootRes.data;

    // Locate student login frame URL or form target from HTML
    const $root = cheerio.load(rootHtml);
    let loginUrl = `${IMS_ROOT}/student_login.asp`; // Standard default target path
    
    $root('frame, iframe, a').each((_, el) => {
        const src = $root(el).attr('src') || $root(el).attr('href');
        if (src && (src.toLowerCase().includes('login') || src.toLowerCase().includes('student'))) {
            loginUrl = absUrl(IMS_ROOT, src);
        }
    });

    console.log(`[RAW-HTTP-LOGIN] Located login frame URL: ${loginUrl}`);

    // Step 2: GET login frame page on the established cookie jar
    const loginPageRes = await client.get(loginUrl, {
        headers: { Referer: `${IMS_ROOT}/` },
        responseType: 'text'
    });
    const loginHtml = loginPageRes.data;
    const $login = cheerio.load(loginHtml);

    // Identify CAPTCHA image source URL
    let captchaImgSrc = $login('#captchaimg, img[src*="captcha"]').attr('src');
    if (!captchaImgSrc) {
        captchaImgSrc = 'captchaimg.asp'; // Fallback default path
    }
    const captchaUrl = absUrl(loginUrl, captchaImgSrc);
    console.log(`[RAW-HTTP-LOGIN] CAPTCHA Image URL: ${captchaUrl}`);

    // Identify Form Action
    let formAction = $login('form').attr('action') || loginUrl;
    const targetPostUrl = absUrl(loginUrl, formAction);

    // Attempt Login Loop with CAPTCHA re-fetches
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`[RAW-HTTP-LOGIN] Attempt ${attempt}/${maxAttempts}...`);

        // Step 3: Fetch CAPTCHA image arraybuffer on identical Cookie Jar session
        const captchaBufferRes = await client.get(captchaUrl, {
            headers: { Referer: loginUrl },
            responseType: 'arraybuffer'
        });
        const captchaBuffer = Buffer.from(captchaBufferRes.data);

        // Step 4: Solve CAPTCHA via threaded ddddocr service
        const captchaText = await solveCaptchaThreaded(captchaBuffer);
        console.log(`[RAW-HTTP-LOGIN] Solved CAPTCHA: ${captchaText}`);

        // Step 5: Form POST credentials
        const formData = new URLSearchParams();
        formData.append('uid', rollNumber);
        formData.append('pwd', password);
        formData.append('cap', captchaText);
        formData.append('login', 'Submit');

        const postRes = await client.post(targetPostUrl, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': loginUrl,
                'Origin': 'https://www.imsnsit.org'
            },
            responseType: 'text'
        });

        const postHtml = postRes.data;

        // Check if authentication succeeded
        const $post = cheerio.load(postHtml);
        const hasUidInput = $post('input[name="uid"]').length > 0;
        const isSuccess = !hasUidInput && (postHtml.toLowerCase().includes('welcome') || postHtml.toLowerCase().includes('activities') || postHtml.includes('PHPSESSID'));

        if (isSuccess || postRes.status === 302 || postRes.status === 200) {
            // Check session cookie existence
            const cookies = await jar.getCookies('https://www.imsnsit.org');
            const phpSessionId = cookies.find(c => c.key === 'PHPSESSID')?.value;

            console.log(`[RAW-HTTP-LOGIN] ✅ Successful raw HTTP login! SessionId: ${phpSessionId || 'Active'}`);
            return {
                success: true,
                client,
                jar,
                sessionId: phpSessionId,
                html: postHtml,
                rollNumber
            };
        }

        if (postHtml.toLowerCase().includes('invalid roll number or password')) {
            throw new Error('Invalid roll number or password.');
        }

        console.log(`[RAW-HTTP-LOGIN] Attempt ${attempt} failed. Retrying...`);
    }

    throw new Error('Raw HTTP Login failed after max attempts.');
}
