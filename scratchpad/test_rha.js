import fetch from 'node-fetch';

async function test() {
  const roll = '2024UME4113';
  const year = 2028;
  const url = `https://www.resulthubdtu.com/NSUT/StudentProfile/${year}/${roll}`;
  
  console.log('Fetching:', url);
  const res = await fetch(url, { 
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 10000 
  });
  
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  
  const html = await res.text();
  console.log('HTML length:', html.length);
  
  const $ = await import('cheerio').then(m => m.default || m);
  const text = $.load(html).text();
  console.log('Text length:', text.length);
  
  console.log('Contains CGPA:', text.includes('CGPA'));
  console.log('Contains 8.14:', text.includes('8.14'));
  console.log('Contains AMAN:', text.includes('AMAN'));
  
  if (text.includes('CGPA')) {
    const idx = text.indexOf('CGPA');
    console.log('CGPA context:', text.substring(idx - 50, idx + 100));
  }
  
  const cgpaMatch = text.match(/Cumulative CGPA[\s\n]*([\d\.]+)/i) || text.match(/CGPA[\D]*(\d+\.\d+)/i);
  console.log('CGPA match:', cgpaMatch ? cgpaMatch[1] : 'NO MATCH');
}

test().catch(e => console.error(e));
