import fs from 'fs';

let content = fs.readFileSync('scraper.js', 'utf8');

// Patch 1: Activities evaluation
content = content.replace(
  /clickedActivities\s*=\s*await\s*frame\.evaluate\(\(\)\s*=>\s*\{[\s\S]*?\}\)\.catch\(\(\)\s*=>\s*false\);/m,
  `try {
              clickedActivities = await frame.evaluate(() => {
                 const links = Array.from(document.querySelectorAll('a'));
                 const act = links.find(el => el.textContent.toLowerCase().includes('my activities') || (el.textContent.toLowerCase().includes('activities') && !el.textContent.toLowerCase().includes('student')));
                 if (act) { act.click(); return true; }
                 return false;
              });
           } catch(e) { clickedActivities = false; }`
);

// Patch 2: Attendance evaluation
content = content.replace(
  /clickedAttendance\s*=\s*await\s*frame\.evaluate\(\(\)\s*=>\s*\{[\s\S]*?\}\)\.catch\(\(\)\s*=>\s*false\);/m,
  `try {
                  clickedAttendance = await frame.evaluate(() => {
                     const links = Array.from(document.querySelectorAll('a'));
                     const att = links.find(el => el.textContent.trim().toLowerCase() === 'my attendance');
                     if (att) { att.click(); return true; }
                     return false;
                  });
              } catch(e) { clickedAttendance = false; }`
);

// Patch 3: Form framing evaluation
content = content.replace(
  /const\s*hasFormAndYear\s*=\s*await\s*frame\.evaluate\(\(\)\s*=>\s*\{[\s\S]*?\}\)\.catch\(\(\)\s*=>\s*false\);/m,
  `let hasFormAndYear = false;
               try {
                   hasFormAndYear = await frame.evaluate(() => {
                      return !!document.forms['frm'] && !!document.querySelector('select[name="year"]');
                   });
               } catch(e) {}`
);

fs.writeFileSync('scraper.js', content, 'utf8');
console.log('Patched scraper.js');
