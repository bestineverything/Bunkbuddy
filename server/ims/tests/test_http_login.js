import { createImsClient, fetchPage, fetchBinary, postPage } from './client.js';
import { solveCaptcha } from './captcha.js';
import * as cheerio from 'cheerio';

async function pureHttpLogin(uid, pwd) {
    const { client, jar } = createImsClient();
    console.log("Fetching login page...");
    
    // 1. Get login page to establish session cookie
    let loginPageHtml = await fetchPage(client, 'https://www.imsnsit.org/imsnsit/student_login.php');

    // 2. Fetch Captcha using the same client/jar
    console.log("Fetching Captcha...");
    let captchaBuffer = await fetchBinary(client, 'https://www.imsnsit.org/imsnsit/captchaimg.php?Math.random()');
    
    let captchaText = await solveCaptcha(captchaBuffer);
    console.log("Captcha Solved:", captchaText);
    
    // 3. POST Login form
    console.log("POSTing Login...");
    let resultHtml = await postPage(client, 'https://www.imsnsit.org/imsnsit/student_login.php', {
        uid: uid,
        pwd: pwd,
        cap: captchaText,
        login: 'Login'
    }, 'https://www.imsnsit.org/imsnsit/student_login.php');
    
    // 4. Verify login state
    let loggedIn = !resultHtml.includes('input type="text" name="uid"');
    console.log("Logged In?:", loggedIn);
    
    if (loggedIn) {
        console.log("SUCCESS!");
        
        // Ensure student_main is loaded
        let mainPage = await fetchPage(client, 'https://www.imsnsit.org/imsnsit/student_main.php');
        const $ = cheerio.load(mainPage);
        let activitiesUrl;
        $('a').each((_, el) => {
            if ($(el).text().toLowerCase().includes('my activities') || $(el).text().toLowerCase().includes('activities')) {
                activitiesUrl = $(el).attr('href');
            }
        });
        
        console.log("Activities URL found:", activitiesUrl);
    } else {
        console.log("Login failed or Captcha incorrect!");
    }
}

pureHttpLogin('2024UME4113', 'Amanguliani@12345').catch(console.error);
