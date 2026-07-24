const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const ZIP = path.join(ROOT, 'bunkbuddy-deploy.zip');
const TMP = path.join(ROOT, '.deploy-tmp');

// Clean up
if (fs.existsSync(ZIP)) fs.unlinkSync(ZIP);
if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

// Files/folders to copy
const include = [
  'index.html',
  'app.html',
  'contact.html',
  'terms.html',
  'privacy.html',
  '404.html',
  '_redirects',
  'netlify.toml',
  'favicon.svg',
  'css',
  'js',
  'pages',
  'assets'
];

console.log('Preparing deployment package...');

// Copy files to temp directory
for (const item of include) {
  const src = path.join(ROOT, item);
  const dst = path.join(TMP, item);
  
  if (!fs.existsSync(src)) {
    console.warn(`Skipping missing: ${item}`);
    continue;
  }
  
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    const files = fs.readdirSync(src);
    for (const file of files) {
      const srcFile = path.join(src, file);
      const dstFile = path.join(dst, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, dstFile);
      }
    }
  } else {
    fs.copyFileSync(src, dst);
  }
}

// Copy server directory but exclude node_modules
const serverSrc = path.join(ROOT, 'server');
const serverDst = path.join(TMP, 'server');
if (fs.existsSync(serverSrc)) {
  fs.mkdirSync(serverDst, { recursive: true });
  const serverFiles = fs.readdirSync(serverSrc);
  for (const file of serverFiles) {
    if (file === 'node_modules') continue;
    const srcFile = path.join(serverSrc, file);
    const dstFile = path.join(serverDst, file);
    if (fs.statSync(srcFile).isDirectory()) {
      fs.mkdirSync(dstFile, { recursive: true });
      const subFiles = fs.readdirSync(srcFile);
      for (const sub of subFiles) {
        const srcSub = path.join(srcFile, sub);
        const dstSub = path.join(dstFile, sub);
        if (fs.statSync(srcSub).isFile()) {
          fs.copyFileSync(srcSub, dstSub);
        }
      }
    } else {
      fs.copyFileSync(srcFile, dstFile);
    }
  }
}

// Create zip from temp directory
console.log('Creating zip file...');
try {
  if (process.platform === 'win32') {
    execSync(`powershell -Command "Compress-Archive -Path '${TMP}\\*' -DestinationPath '${ZIP}' -Force"`, {
      cwd: ROOT,
      stdio: 'pipe'
    });
  } else {
    execSync(`cd "${TMP}" && zip -r "${ZIP}" .`, { cwd: ROOT, stdio: 'pipe' });
  }
  
  const stats = fs.statSync(ZIP);
  console.log('Deployment zip created successfully!');
  console.log(`Location: ${ZIP}`);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Go to https://app.netlify.com/drop');
  console.log('  2. Drag and drop bunkbuddy-deploy.zip');
  console.log('');
  console.log('Note: The zip has files at root level (required by Netlify)');
} catch (err) {
  console.error('Failed to create zip:', err.message);
  process.exit(1);
} finally {
  // Cleanup temp directory
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true });
}
