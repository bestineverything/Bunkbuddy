import fs from 'fs';
import { loginToIms } from './ims/login.js';
import { scrapeStudentData } from './ims/scraper.js';

async function run() {
  const result = await loginToIms('2024UME4113', 'Amanguliani@12345');
  if (!result.success) return;

  fs.writeFileSync('debug.txt', `Success!`);

  let out = '';
  for (const frame of result.page.frames()) {
      try {
          const text = await frame.evaluate(() => document.documentElement.innerText);
          out += '\n---FRAME---\n' + text;
      } catch(e) {}
  }
  fs.writeFileSync('frames.txt', out);
  
  const data = await scrapeStudentData(result.page, result.browser, '2025-26', '4');
  fs.writeFileSync('full_data.json', JSON.stringify(data, null, 2));
  console.log('Done!');
}

run().catch(console.error);
