import { loginToIms } from './login.js';
import { createImsClient, fetchPage, postPage } from './client.js';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function testHttpScraping() {
  let result;
  try {
      result = await loginToIms('2024UME4113', '7706');
  } catch(e) {
      console.log("Login failed with error:", e.message);
      return;
  }
  if(!result || !result.success) return console.log("Login failed");

  let menuHtml = await fetchPage(result.client, 'https://www.imsnsit.org/imsnsit/student_main.php', 'https://www.imsnsit.org/imsnsit');
  
  // Extract attendance URL
  const $ = cheerio.load(menuHtml);
  let attendanceUrl;
  $('a').each((_, a) => {
    if($(a).text().toLowerCase().includes('my attendance')) attendanceUrl = $(a).attr('href');
  });
  
  if(!attendanceUrl) return console.log("No attendance URL found!");
  console.log("Found Attendance URL:", attendanceUrl);
  
  let html = await fetchPage(result.client, attendanceUrl, 'https://www.imsnsit.org/imsnsit');
  
  let $f = cheerio.load(html);
  let encYear = $f('input[name="enc_year"]').val();
  
  console.log("Step 1 POST (Set Year)... encYear:", encYear);
  html = await postPage(result.client, attendanceUrl, { year: '2025-26', enc_year: encYear }, attendanceUrl);
  
  $f = cheerio.load(html);
  encYear = $f('input[name="enc_year"]').val();
  let encSem = $f('input[name="enc_sem"]').val();
  
  console.log("Step 2 POST (Set Sem)... new encYear:", encYear);
  html = await postPage(result.client, attendanceUrl, { year: '2025-26', enc_year: encYear, sem: '4', enc_sem: encSem, submit: 'Submit' }, attendanceUrl);
  
  fs.writeFileSync('pure_http_result.html', html);
  console.log("Done! pure_http_result.html created.");
}

testHttpScraping().catch(console.error);
