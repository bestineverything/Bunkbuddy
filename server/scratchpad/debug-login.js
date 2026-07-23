import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import fs from 'fs';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true, headers: { 'User-Agent': 'Mozilla/5.0' } }));

const urls = [
  'https://www.imsnsit.org/imsnsit/student.htm',
  'https://www.imsnsit.org/imsnsit/student_login110.php',
  'https://www.imsnsit.org/imsnsit/student_login.php',
  'https://www.imsnsit.org/imsnsit/student_login100.php',
  'https://www.imsnsit.org/imsnsit/student_login120.php',
];

for (const url of urls) {
  try {
    const res = await client.get(url, { headers: { Referer: 'https://www.imsnsit.org/imsnsit/student.htm' } });
    const html = res.data;
    const $ = cheerio.load(html);
    const forms = $('form').length;
    const cap = html.includes('captcha') || html.includes('cap');
    console.log(url, 'len', html.length, 'forms', forms, 'captcha', cap);
    if (forms || cap) {
      fs.writeFileSync('debug-' + url.split('/').pop(), html);
    }
  } catch (e) {
    console.log(url, 'ERR', e.message);
  }
}
