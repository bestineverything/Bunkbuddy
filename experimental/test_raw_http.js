import * as cheerio from 'cheerio';
import { createImsClient } from '../server/ims/client.js';
import { solveCaptchaThreaded } from './captcha_threaded.js';
import { parseDetailedAttendance } from '../server/ims/scraper.js';

const IMS_ROOT = 'https://www.imsnsit.org/imsnsit';

export async function testRawHttpScrape(rollNumber, password, year = '2025-26', semester = '4') {
    const t0 = Date.now();
    const el = () => `${((Date.now() - t0) / 1000).toFixed(2)}s`;
    const { client, jar } = createImsClient();

    console.log(`[RAW-HTTP] [${el()}] Starting raw HTTP scrape for ${rollNumber}...`);

    // Step 1: GET main login frame page directly
    const loginFrameUrl = `${IMS_ROOT}/student_login.php`;
    const loginRes = await client.get(loginFrameUrl, {
        headers: { Referer: `${IMS_ROOT}/student.htm` },
        responseType: 'text'
    });
    const $login = cheerio.load(loginRes.data);
    console.log(`[RAW-HTTP] [${el()}] Loaded student_login.php`);

    let captchaImgSrc = $login('#captchaimg, img[src*="captcha"]').attr('src') || 'captchaimg.asp';
    const captchaUrl = `${IMS_ROOT}/${captchaImgSrc.replace(/^\.\//, '')}`;
    let formAction = $login('form').attr('action') || 'student_login.php';
    const postUrl = `${IMS_ROOT}/${formAction.replace(/^\.\//, '')}`;

    console.log(`[RAW-HTTP] CAPTCHA URL: ${captchaUrl} | POST URL: ${postUrl}`);

    // Step 2: GET CAPTCHA image
    const captchaRes = await client.get(captchaUrl, { headers: { Referer: loginFrameUrl }, responseType: 'arraybuffer' });
    const captchaText = await solveCaptchaThreaded(Buffer.from(captchaRes.data));
    console.log(`[RAW-HTTP] [${el()}] Solved CAPTCHA: ${captchaText}`);

    // Step 3: POST credentials
    const params = new URLSearchParams();
    params.append('uid', rollNumber);
    params.append('pwd', password);
    params.append('cap', captchaText);
    params.append('login', 'Submit');

    const loginPostRes = await client.post(postUrl, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: loginFrameUrl,
            Origin: 'https://www.imsnsit.org'
        },
        responseType: 'text'
    });

    console.log(`[RAW-HTTP] [${el()}] Login POST completed. Status: ${loginPostRes.status}`);

    // Step 4: GET student_attendance.asp directly on authenticated session cookie jar
    const attPageRes = await client.get(`${IMS_ROOT}/student_attendance.asp`, {
        headers: { Referer: `${IMS_ROOT}/student_activities.asp` },
        responseType: 'text'
    });
    const $attPage = cheerio.load(attPageRes.data);
    console.log(`[RAW-HTTP] [${el()}] Loaded student_attendance.asp`);

    const encYear = $attPage('input[name="enc_year"]').val();
    const encSem = $attPage('input[name="enc_sem"]').val();
    const formTarget = $attPage('form[name="frm"]').attr('action') || 'student_attendance_view.asp';
    const postAttUrl = `${IMS_ROOT}/${formTarget.replace(/^\.\//, '')}`;

    console.log(`[RAW-HTTP] [${el()}] enc_year: ${encYear}, enc_sem: ${encSem}, postAttUrl: ${postAttUrl}`);

    if (!encYear || !encSem) {
        console.log('[RAW-HTTP] Form enc_year/enc_sem not found! Login may have failed.');
        const hasUid = $attPage('input[name="uid"]').length > 0;
        console.log('Still on login page?:', hasUid);
        return { success: false };
    }

    // Step 5: POST attendance form
    const attParams = new URLSearchParams();
    attParams.append('year', year);
    attParams.append('sem', semester);
    attParams.append('enc_year', encYear);
    attParams.append('enc_sem', encSem);
    attParams.append('submit', 'Submit');

    const viewRes = await client.post(postAttUrl, attParams.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: `${IMS_ROOT}/student_attendance.asp`,
            Origin: 'https://www.imsnsit.org'
        },
        responseType: 'text'
    });

    console.log(`[RAW-HTTP] [${el()}] Attendance view POST completed`);

    // Step 6: Parse detailed attendance HTML
    const detailedData = parseDetailedAttendance(viewRes.data);
    if (detailedData) {
        console.log(`[RAW-HTTP] [${el()}] 🚀 SUCCESS! Scraped ${detailedData.subjects.length} subjects in ${el()}!`);
        return { success: true, subjects: detailedData.subjects, data: detailedData };
    } else {
        console.log('[RAW-HTTP] Could not parse detailed attendance.');
        return { success: false };
    }
}

testRawHttpScrape('2024UME4113', 'Aman@2005');
