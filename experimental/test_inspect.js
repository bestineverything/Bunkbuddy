import * as cheerio from 'cheerio';
import { createImsClient } from '../server/ims/client.js';
import { solveCaptchaThreaded } from './captcha_threaded.js';

const IMS_ROOT = 'https://www.imsnsit.org/imsnsit';

async function testInspectPostLogin() {
    const { client, jar } = createImsClient();
    const t0 = Date.now();
    const el = () => `${((Date.now() - t0) / 1000).toFixed(2)}s`;

    const loginRes = await client.get(`${IMS_ROOT}/student_login.php`, { headers: { Referer: `${IMS_ROOT}/student.htm` }, responseType: 'text' });
    const $login = cheerio.load(loginRes.data);

    const captchaRes = await client.get(`${IMS_ROOT}/captchaimg.asp`, { headers: { Referer: `${IMS_ROOT}/student_login.php` }, responseType: 'arraybuffer' });
    const captchaText = await solveCaptchaThreaded(Buffer.from(captchaRes.data));
    console.log(`[${el()}] CAPTCHA: ${captchaText}`);

    const params = new URLSearchParams();
    params.append('uid', '2024UME4113');
    params.append('pwd', 'Aman@2005');
    params.append('cap', captchaText);
    params.append('login', 'Submit');

    const postRes = await client.post(`${IMS_ROOT}/student_login.php`, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: `${IMS_ROOT}/student_login.php` },
        responseType: 'text'
    });

    console.log(`[${el()}] Post Login HTML Title/Links:`);
    const $post = cheerio.load(postRes.data);
    console.log('Title:', $post('title').text());
    console.log('Body text snippet:', $post('body').text().replace(/\s+/g, ' ').substring(0, 300));
    
    // Check frames / links in postRes
    $post('frame, iframe, a').each((_, el) => {
        console.log('Element:', el.tagName, 'src/href:', $post(el).attr('src') || $post(el).attr('href'), 'text:', $post(el).text().trim());
    });

    // Check student_activities.asp
    const actRes = await client.get(`${IMS_ROOT}/student_activities.asp`, { headers: { Referer: `${IMS_ROOT}/student.htm` }, responseType: 'text' });
    const $act = cheerio.load(actRes.data);
    console.log(`\n[${el()}] Loaded student_activities.asp. Links:`);
    $act('a').each((_, el) => {
        console.log('  -> Link:', $act(el).text().trim(), '| href:', $act(el).attr('href'));
    });
}

testInspectPostLogin();
