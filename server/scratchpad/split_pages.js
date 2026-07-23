const fs = require('fs');
const html = fs.readFileSync('app.html', 'utf8');

const pages = ['page-home', 'page-academics', 'page-resources', 'page-attendance', 'page-connect', 'page-resultHub', 'page-pro'];

let modifiedHtml = html;

if (!fs.existsSync('pages')) {
    fs.mkdirSync('pages');
}

pages.forEach(page => {
    // Basic regex to find the section block (assumes well-formed sections without nested sections of same tag)
    const regex = new RegExp(`(<section class="page-panel(?: active)?" id="${page}"[^>]*>)([\\s\\S]*?)(</section>)`, 'i');
    
    const match = modifiedHtml.match(regex);
    if (match) {
        const outName = page.replace('page-', '') + '.html';
        fs.writeFileSync(`pages/${outName}`, match[2].trim());
        modifiedHtml = modifiedHtml.replace(regex, `$1\n        <!-- Loaded dynamically from pages/${outName} -->\n      $3`);
        console.log(`Extracted ${outName}`);
    }
});

// Update app.html and add the loader script before closing body
if (!modifiedHtml.includes('<!-- Dynamic Page Loader -->')) {
    const loaderCode = `\n  <!-- Dynamic Page Loader -->\n  <script>\n    async function loadPages() {\n      const pages = ['home', 'academics', 'resources', 'attendance', 'connect', 'resultHub', 'pro'];\n      for (const page of pages) {\n        try {\n          const res = await fetch(\`pages/\${page}.html\`);\n          const text = await res.text();\n          document.getElementById(\`page-\${page}\`).innerHTML = text;\n        } catch(e) { console.error('Failed to load ' + page, e); }\n      }\n      // Dispatch event to app.js so it knows DOM is ready for initial rendering\n      document.dispatchEvent(new Event('pagesLoaded'));\n    }\n    loadPages();\n  </script>\n`;
    modifiedHtml = modifiedHtml.replace('</body>', loaderCode + '</body>');
}

fs.writeFileSync('app.html', modifiedHtml);
console.log('Successfully refactored app.html!');
