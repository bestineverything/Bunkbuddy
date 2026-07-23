const fs = require('fs');
const html = fs.readFileSync('C:/Users/Theam/OneDrive/Desktop/bunkbuddy.in/server/ims/logs/resulthub_dump.html', 'utf8');

const nextIdx = html.indexOf('__NEXT_DATA__');
console.log('NEXT_DATA index:', nextIdx);
if (nextIdx > -1) {
  const scriptEnd = html.indexOf('</script>', nextIdx);
  const jsonRaw = html.substring(nextIdx + '__NEXT_DATA__'.length + 1, scriptEnd - 1);
  console.log('NEXT_DATA prefix:', jsonRaw.substring(0, 500));
  console.log('NEXT_DATA length:', jsonRaw.length);
}

const nextFIdx = html.indexOf('self.__next_f');
console.log('next_f index:', nextFIdx);
if (nextFIdx > -1) {
  console.log('context:', html.substring(nextFIdx, nextFIdx + 300));
}

// Look for JSON with CGPA
const cgpaIdx = html.indexOf('"cgpa"');
console.log('"cgpa" index:', cgpaIdx);
if (cgpaIdx > -1) {
  console.log('cgpa context:', html.substring(cgpaIdx - 100, cgpaIdx + 200));
}

// Look for JSON with name and roll
const rollIdx = html.indexOf('2024UME4113');
console.log('roll index:', rollIdx);
if (rollIdx > -1) {
  console.log('roll context:', html.substring(rollIdx - 100, rollIdx + 200));
}
