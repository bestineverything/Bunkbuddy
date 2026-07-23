import { createImsClient, fetchPage, fetchBinary, postPage } from './client.js';
import { solveCaptcha } from './captcha.js';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function crackIms() {
    console.time('FullScrape');
    const { client, jar } = createImsClient();
    
    // 1. Initial login page load (sets PHPSESSID and captcha tracking)
    let loginPageHtml = await fetchPage(client, 'https://www.imsnsit.org/imsnsit/student_login.php');
    
    // 2. OCR the captcha
    let captchaBuffer = await fetchBinary(client, 'https://www.imsnsit.org/imsnsit/captchaimg.php?Math.random()');
    let captchaText = await solveCaptcha(captchaBuffer);
    console.log("Captcha Solved:", captchaText);
    
    // 3. POST Login
    let loginDataHtml = await postPage(client, 'https://www.imsnsit.org/imsnsit/student_login.php', {
        uid: '2024UME4113',
        pwd: 'Amanguliani@12345',
        cap: captchaText,
        login: 'Login'
    }, 'https://www.imsnsit.org/imsnsit/student_login.php');
    
    fs.writeFileSync('axios_login_out.html', loginDataHtml);
    
    if(loginDataHtml.includes('input type="text" name="uid"')) {
        console.log("Login failed");
        return;
    }
    console.log("Login successful! Time:", console.timeLog('FullScrape'));
    
    // 4. Following Login, IMS natively responds with a Frameset!
    // We need to fetch 'student_main.php' (the right frame)
    let mainHtml = await fetchPage(client, 'https://www.imsnsit.org/imsnsit/student_main.php');
    fs.writeFileSync('axios_main_out.html', mainHtml);
    
    let $ = cheerio.load(mainHtml);
    let activitiesUrl;
    $('a').each((_, el) => {
        let text = $(el).text().toLowerCase();
        if (text.includes('my activities') || (text.includes('activities') && !text.includes('student'))) {
            activitiesUrl = $(el).attr('href');
        }
    });
    
    if(!activitiesUrl) {
        console.log("Failed to find My activities!", mainHtml.substring(0, 500));
        return;
    }
    
    activitiesUrl = 'https://www.imsnsit.org/imsnsit/' + activitiesUrl;
    console.log("Found Activities URL:", activitiesUrl);
    
    // 5. Fetch Activities page
    let actHtml = await fetchPage(client, activitiesUrl);
    $ = cheerio.load(actHtml);
    
    let attendanceUrl;
    $('a').each((_, el) => {
        let text = $(el).text().toLowerCase();
        if (text === 'my attendance') {
            attendanceUrl = $(el).attr('href');
        }
    });
    
    if(!attendanceUrl) {
        console.log("Failed to find My attendance!");
        return;
    }
    
    attendanceUrl = 'https://www.imsnsit.org/imsnsit/' + attendanceUrl;
    console.log("Found Attendance URL:", attendanceUrl);
    
    // 6. Fetch Attendance page parameters!
    let attHtml = await fetchPage(client, attendanceUrl);
    $ = cheerio.load(attHtml);
    
    let encYear = $('input[name="enc_year"]').val() || '';
    console.log("enc_year1:", encYear);
    
    // Step A: Set Year to '2025-26'
    let post1 = await postPage(client, attendanceUrl, {
        year: '2025-26',
        enc_year: encYear
    });
    
    $ = cheerio.load(post1);
    encYear = $('input[name="enc_year"]').val() || '';
    let encSem = $('input[name="enc_sem"]').val() || '';
    console.log("enc_year2:", encYear, "enc_sem:", encSem);
    
    // Step B: Set Semester to '4' and Submit!
    let post2 = await postPage(client, attendanceUrl, {
        year: '2025-26',
        enc_year: encYear,
        sem: '4',
        enc_sem: encSem,
        submit: 'Submit'
    });
    
    fs.writeFileSync('axios_final_att.html', post2);
    console.log("Attendance Extracted! Time elapsed:", console.timeLog('FullScrape'));
    console.timeEnd('FullScrape');
}

crackIms().catch(console.error);
