import { createImsClient, fetchPage, fetchBinary, postPage } from './client.js';
import { solveCaptcha } from './captcha.js';
import fs from 'fs';

async function run() {
    const { client } = createImsClient();
    await fetchPage(client, 'https://www.imsnsit.org/imsnsit/student_login.php');
    let captchaBuffer = await fetchBinary(client, 'https://www.imsnsit.org/imsnsit/captchaimg.php?Math.random()');
    let cap = await solveCaptcha(captchaBuffer);
    
    let res = await postPage(client, 'https://www.imsnsit.org/imsnsit/student_login.php', {
        uid: '2024UME4113', pwd: 'Amanguliani@12345', cap: cap, login: 'Login'
    });
    
    fs.writeFileSync('login_dump.html', res || 'EMPTY_RESPONSE');
    console.log("Written, length:", res.length);
}
run().catch(console.error);
