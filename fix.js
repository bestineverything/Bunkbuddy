const fs = require('fs');
let text = fs.readFileSync('js/app.js', 'utf8');

const targetStr = `        <span style="background: rgba(239,68,68,0.1); padding: 4px 10px; border-radius: 4px;"><strong style="color: #ef4444;">A</strong> = Absent (0)</span>\r\n    container.innerHTML = "";`;

const targetStr2 = `        <span style="background: rgba(239,68,68,0.1); padding: 4px 10px; border-radius: 4px;"><strong style="color: #ef4444;">A</strong> = Absent (0)</span>\n    container.innerHTML = "";`;

const replacement = `        <span style="background: rgba(239,68,68,0.1); padding: 4px 10px; border-radius: 4px;"><strong style="color: #ef4444;">A</strong> = Absent (0)</span>
        <span style="background: rgba(245,158,11,0.1); padding: 4px 10px; border-radius: 4px;"><strong style="color: #f59e0b;">GH / TL / MS</strong> = Holidays / Leaves</span>
      </div>\`;
    }

    // Appendix: Removed broken tables based on user request.
    document.getElementById('attendanceTable').innerHTML = html;
}

function renderLinks(containerId, items, emptyMsg) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!items?.length) {
        el.innerHTML = \`<div class="empty-state">\${emptyMsg}</div>\`;
        return;
    }

    el.innerHTML = items.map((item) => \`
    <a class="link-item" href="\${item.href}" target="_blank" rel="noopener">
      \${item.label}
      <span>↗ IMS</span>
    </a>\`).join('');
}

function setupNav() {
    const pills = document.querySelectorAll('.nav-pill[data-page]');
    const panels = document.querySelectorAll('.page-panel');

    pills.forEach((pill) => {
        pill.addEventListener('click', () => {
            const page = pill.dataset.page;
            pills.forEach((p) => p.classList.toggle('active', p === pill));
            panels.forEach((panel) => panel.classList.toggle('active', panel.id === \`page-\${page}\`));
            localStorage.setItem('bb_active_tab', page);
            
            if (page === 'home' || page === 'academics') {
                setTimeout(() => {
                    loadAcademics();
                }, 100);
            }
        });
    });

    const savedTab = localStorage.getItem('bb_active_tab');
    if (savedTab) {
        const targetPill = Array.from(pills).find(p => p.dataset.page === savedTab);
        if (targetPill) targetPill.click();
    }
}

function setupTheme() {
    const html = document.documentElement;
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        btn.textContent = next === 'dark' ? 'DARK' : 'LIGHT';
        localStorage.setItem('bb_theme', next);
    });

    const saved = localStorage.getItem('bb_theme');
    if (saved) {
        html.setAttribute('data-theme', saved);
        btn.textContent = saved === 'dark' ? 'DARK' : 'LIGHT';
    }
}

function setupEtherealShadows() {
    const container = document.getElementById('proWebGL');
    if (!container) return;

    if (!window.THREE) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/89/three.min.js";
        script.onload = () => initThreeJS(container);
        document.head.appendChild(script);
    } else {
        initThreeJS(container);
    }
}

function initThreeJS(container) {
    if (!window.THREE) return;
    const THREE = window.THREE;

    container.innerHTML = "";`;

if(text.includes(targetStr)) {
    console.log('Using CRLF');
    text = text.replace(targetStr, replacement);
    fs.writeFileSync('js/app.js', text);
} else if (text.includes(targetStr2)) {
    console.log('Using LF');
    text = text.replace(targetStr2, replacement);
    fs.writeFileSync('js/app.js', text);
} else {
    // If it's already partly mangled in a slightly different way, let's just do a regex replace
    text = text.replace(/<span style="background: rgba\(239,68,68,0\.1(.*?)container\.innerHTML = "";/s, replacement);
    fs.writeFileSync('js/app.js', text);
    console.log('Used regex fallback');
}
