const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'js/app.js');
let code = fs.readFileSync(file, 'utf8');

// Replace top sync btn logic
code = code.replace(
    /const btn = document\.getElementById\('refreshAttendanceBtn'\);\s*if \(btn\) btn\.innerHTML = '<i class="ph ph-spinner ph-spin"><\/i> Syncing...';/,
    `const btn = document.getElementById('refreshAttendanceBtn');
    const syncProg = document.getElementById('homeSyncProgressContainer');
    const syncBar = document.getElementById('homeSyncProgressBar');
    if (btn) btn.innerHTML = '<i class="ph ph-spinner ph-spin" style="animation: spin 1s linear infinite;"></i> Syncing...';
    if (syncProg) {
        syncProg.style.display = 'block';
        void syncProg.offsetWidth;
        if (syncBar) {
            syncBar.style.width = '70%';
            syncBar.style.background = '#10b981';
        }
    }`
);

// Replace Auth Failed block
code = code.replace(
    /console\.error\("Auto refresh failed", result\.message\);\s*if\(btn\) btn\.innerHTML = '<i class="ph ph-warning"><\/i> Auth Failed!';/,
    `console.error("Auto refresh failed", result.message);
            if(btn) btn.innerHTML = '<i class="ph ph-warning" style="color: #ef4444;"></i> Auth Failed!';
            if(syncBar) { syncBar.style.width = '100%'; syncBar.style.background = '#ef4444'; }`
);

// Replace Network Error block
code = code.replace(
    /console\.error\("Refresh error", e\);\s*if\(btn\) btn\.innerHTML = '<i class="ph ph-warning"><\/i> Network Error';/,
    `console.error("Refresh error", e);
        if(btn) btn.innerHTML = '<i class="ph ph-warning" style="color: #ef4444;"></i> Network Error';
        if(syncBar) { syncBar.style.width = '100%'; syncBar.style.background = '#ef4444'; }`
);

// Replace finally setTimeout block
code = code.replace(
    /setTimeout\(\(\) => \{\s*if \(btn && \(btn\.innerHTML\.includes\('Failed'\) \|\| btn\.innerHTML\.includes\('Error'\)\)\) \{\s*btn\.innerHTML = '<i class="ph ph-arrows-clockwise"><\/i> Refresh Data';\s*\}\s*\}, 3000\);/,
    `setTimeout(() => {
            if (btn) btn.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Refresh Data';
            if (typeof syncProg !== 'undefined' && syncProg) syncProg.style.display = 'none';
            if (typeof syncBar !== 'undefined' && syncBar) syncBar.style.width = '0%';
        }, 5000);`
);

fs.writeFileSync(file, code);
console.log('Patched app.js successfully');
