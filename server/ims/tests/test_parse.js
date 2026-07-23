import fs from 'fs';
import * as cheerio from 'cheerio';

function parseDetailedAttendance(html) {
  const $ = cheerio.load(html);
  const data = {
    matrix: [],
    subjects: [],
    summary: {},
    legend: {}
  };

  const tables = $('table.plum_fieldbig').toArray();
  if (tables.length === 0) return null;

  tables.forEach(table => {
    $(table).find('tr').each((_, tr) => {
      // FIX logic: don't just text() immediately. text() collapses spaces.
      const cells = $(tr).find('td, th').toArray().map(c => $(c).text().replace(/\s+/g, ' ').trim());
      
      if (cells[0] === 'Days') {
         if (data.subjects.length === 0) data.subjects = cells.slice(1);
      }
      else if (/^[A-Za-z]{3}-\d{2}$/.test(cells[0])) {
         const rowData = { date: cells[0], marks: {} };
         let hasMark = false;
         cells.slice(1).forEach((mark, idx) => {
            if (data.subjects[idx]) {
               rowData.marks[data.subjects[idx]] = mark;
               if (mark !== '') hasMark = true;
            }
         });
         if (hasMark) data.matrix.push(rowData);
      }
      else if (cells[0] === 'Overall Class') {
         data.summary.totalClasses = cells.slice(1);
      }
      else if (cells[0] === 'Overall Absent' || cells[0] === 'Overall Absent') {
         data.summary.totalAbsent = cells.slice(1);
      }
      else if (cells[0] === 'Overall Present' || cells[0] === 'Overall Present') {
         data.summary.totalPresent = cells.slice(1);
      }
      else if (cells[0] === 'Overall (%)') {
         data.summary.percentages = cells.slice(1);
      }
    });

    $(table).find('td, th').each((_, el) => {
        const htmlContent = $(el).html() || '';
        if (htmlContent.includes('<br>')) {
           const lines = htmlContent.split('<br>');
           lines.forEach(line => {
              const text = cheerio.load(line).text().trim();
              if (text && text.includes('-') && !text.includes('---') && !text.includes('>')) {
                 const [code, ...rest] = text.split('-');
                 const name = rest.join('-').trim();
                 if (code && name && code.length < 15) {
                    data.legend[code.trim()] = name;
                 }
              }
           });
        }
    });
  });

  return data;
}

const html = fs.readFileSync('final_table.html', 'utf8');
const detailed = parseDetailedAttendance(html);
if (detailed) {
  const rebuiltAtt = detailed.subjects.map((sub, i) => ({
     subject: detailed.legend[sub] ? `${detailed.legend[sub]} (${sub})` : sub,
     attended: detailed.summary.totalPresent?.[i] || '0',
     absent: detailed.summary.totalAbsent?.[i] || '0',
     total: detailed.summary.totalClasses?.[i] || '0',
     percentage: detailed.summary.percentages?.[i] || '0%'
  }));
  
  fs.writeFileSync('test_out.json', JSON.stringify({
      subjects: detailed.subjects,
      legend: detailed.legend,
      summary: detailed.summary,
      rebuiltAtt: rebuiltAtt
  }, null, 2));
}
