import { loginToIms } from './login.js';
import { scrapeStudentData } from './scraper.js';

async function run() {
  console.log("=== SPEED TEST START ===");
  console.time("1. Total Login Phase");
  const result = await loginToIms('2024UME4113', 'Amanguliani@12345');
  console.timeEnd("1. Total Login Phase");
  
  if (!result.success) return console.log("Login failed");

  console.time("2. Scrape Attendance Phase");
  const data = await scrapeStudentData(result.page, result.browser, '2025-26', '4', '2024UME4113');
  console.timeEnd("2. Scrape Attendance Phase");

  await result.browser.close();
  console.log("=== SPEED TEST COMPLETE ===");
}

run().catch(console.error);
