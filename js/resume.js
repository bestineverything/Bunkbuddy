/* ============================================================
   Resume Builder v5 – LaTeX to HTML Renderer
   ============================================================ */
(function () {
  'use strict';

  /* =====================
     LaTeX to HTML Converter
     ===================== */
  function latexToHtml(latex) {
    if (!latex || !latex.trim()) return '<p class="res-error">No LaTeX source provided.</p>';

    let html = latex;

    // Extract custom command definitions
    const commands = {};
    html = html.replace(/\\newcommand\{\\(\w+)\}(?:\[(\d+)\])?\{(.+?)\}/g, (_, name, opt, def) => {
      commands[name] = def;
      return '';
    });
    html = html.replace(/\\renewcommand\{\\(\w+)\}\{(.+?)\}/g, (_, name, def) => {
      commands[name] = def;
      return '';
    });

    // Remove preamble (everything before \begin{document})
    html = html.replace(/^[\s\S]*?\\begin\{document\}/, '');
    // Remove \end{document} and everything after
    html = html.replace(/\\end\{document\}[\s\S]*$/, '');
    html = html.trim();

    // Expand known custom commands in body
    if (commands.resheading) {
      html = html.replace(/\\resheading\{([^}]*)\}/g, (_, text) => {
        const expanded = expandMacros(text, commands);
        return `<div class="res-heading">${expanded}</div>`;
      });
    }
    if (commands.ressubheading) {
      html = html.replace(/\\ressubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g,
        (_, title, period, location) => {
          const t = expandMacros(title, commands);
          const p = expandMacros(period, commands);
          return `<div class="res-subheading"><span>${t}</span><span>${p}</span></div>`;
        });
    }
    if (commands.resitem) {
      html = html.replace(/\\resitem\{([^}]*)\}/g, (_, text) => {
        return `<li>${expandMacros(text, commands)}</li>`;
      });
    }

    // Handle \begin{table}...\end{table}
    html = html.replace(/\\begin\{table\}[\s\S]*?\\end\{table\}/g, (block) => {
      return processTable(block, commands);
    });

    // Handle \begin{tabular}{...}...\end{tabular}
    html = html.replace(/\\begin\{tabular\}\{[^}]*\}[\s\S]*?\\end\{tabular\}/g, (block) => {
      return processTabular(block, commands);
    });

    // Handle \begin{tabular*}{...}{...}...\end{tabular*}
    html = html.replace(/\\begin\{tabular\}\*\{[^}]*\}\{[^}]*\}[\s\S]*?\\end\{tabular\}\*/g, (block) => {
      return processTabular(block, commands);
    });

    // Handle \begin{itemize}[...]...\end{itemize}
    html = html.replace(/\\begin\{itemize\}(?:\[[^\]]*\])?[\s\S]*?\\end\{itemize\}/g, (block) => {
      return processItemize(block, commands);
    });

    // Handle remaining minipage environments
    html = html.replace(/\\begin\{minipage\}\{[^}]*\}[\s\S]*?\\end\{minipage\}/g, (block) => {
      const widthMatch = block.match(/\\begin\{minipage\}\{([^}]*)\}/);
      const width = widthMatch ? widthMatch[1] : '1\\linewidth';
      let content = block.replace(/\\begin\{minipage\}\{[^}]*\}/, '').replace(/\\end\{minipage\}/, '');
      content = processInlineCommands(content, commands);
      content = replaceLineBreaks(content);
      content = replaceSpecialChars(content);
      return `<div class="res-minipage" style="width:${escapeHtml(width)}">${content}</div>`;
    });

    // Expand remaining commands
    html = expandMacros(html, commands);

    // Process inline commands
    html = processInlineCommands(html, commands);

    // Replace line breaks
    html = replaceLineBreaks(html);

    // Replace special characters (must be last)
    html = replaceSpecialChars(html);

    // Clean up excessive whitespace
    html = html.replace(/\n\s*\n/g, '\n');

    return html;
  }

  function expandMacros(text, commands) {
    let result = text;
    for (const [name, def] of Object.entries(commands)) {
      if (name === 'resheading' || name === 'ressubheading' || name === 'resitem') continue;
      const regex = new RegExp(`\\\\${name}(?:\\[(\\d+)\\])?\\{([^}]*)\\}`, 'g');
      result = result.replace(regex, (_, opt, args) => {
        let expanded = def;
        if (args) {
          const argList = args.split('&');
          argList.forEach((arg, i) => {
            expanded = expanded.replace(new RegExp(`#${i + 1}`, 'g'), arg);
          });
        }
        return expanded;
      });
    }
    return result;
  }

  function processTable(block, commands) {
    let content = block;
    // Remove \begin{table} and \end{table}
    content = content.replace(/\\begin\{table\}/, '').replace(/\\end\{table\}/, '');
    content = content.replace(/\\centering/, ' class="res-table-center"');
    content = content.replace(/\\hfill/g, '');
    content = content.replace(/\\setlength\{\\tabcolsep\}\{([^}]*)\}/g, '');
    content = content.replace(/\\def\\arraystretch\{([^}]*)\}/g, '');
    content = content.replace(/\\vspace\{([^}]*)\}/g, (_, v) => ` style="margin:${v} 0;"`);
    // Process minipages
    content = content.replace(/\\begin\{minipage\}\{([^}]*)\}/g, (_, w) => `<div class="res-minipage" style="width:${w}">`);
    content = content.replace(/\\end\{minipage\}/g, '</div>');
    // Handle includegraphics
    content = content.replace(/\\includegraphics(?:\[[^\]]*\])?\{([^}]*)\}/g, (_, src) => {
      return `<img src="${escapeHtml(src)}" class="res-logo" alt="logo">`;
    });
    content = processInlineCommands(content, commands);
    content = replaceLineBreaks(content);
    content = replaceSpecialChars(content);
    return `<div class="res-table-wrapper">${content}</div>`;
  }

  function processTabular(block, commands) {
    let content = block;
    
    const colSpecMatch = content.match(/\\begin\{tabular\}\*?\{([^}]*)\}/);
    
    content = content.replace(/\\begin\{tabular\}\*?\{[^}]*\}/, '').replace(/\\end\{tabular\}\*?/, '');
    content = content.replace(/\\toprule/g, '\n<RULE:top>\n');
    content = content.replace(/\\midrule/g, '\n<RULE:mid>\n');
    content = content.replace(/\\bottomrule/g, '\n<RULE:bottom>\n');
    content = content.replace(/\\setlength\{\\tabcolsep\}\{([^}]*)\}/g, '');
    content = content.replace(/\\vspace\{([^}]*)\}/g, (_, v) => ` style="margin:${v} 0;"`);
    content = content.replace(/\\vspace\{-([^}]*)\}/g, (_, v) => ` style="margin:-${v} 0;"`);
    content = content.replace(/\\arrayrulewidth\{([^}]*)\}/g, '');

    let rows = [];
    let currentRow = '';
    let i = 0;
    while (i < content.length) {
      if (content.substring(i, i + 2) === '\\\\') {
        rows.push(currentRow.trim());
        currentRow = '';
        i += 2;
      } else {
        currentRow += content[i];
        i++;
      }
    }
    if (currentRow.trim()) rows.push(currentRow.trim());

    let tableHtml = '<table class="res-edu-table">';
    let inHeader = false;
    let inBody = false;

    rows.forEach((row, ri) => {
      if (row === '<RULE:top>' || row === '<RULE:mid>' || row === '<RULE:bottom>') {
        if (row === '<RULE:top>' && inHeader) {
          tableHtml += '</tr></thead><tbody>';
          inHeader = false;
          inBody = true;
        } else if (row === '<RULE:mid>' && inHeader) {
          tableHtml += '</tr></thead><tbody>';
          inHeader = false;
          inBody = true;
        } else if (row === '<RULE:bottom>' && inBody) {
          tableHtml += '</tbody>';
          inBody = false;
        } else if (row === '<RULE:top>' && !inHeader && !inBody && ri > 0) {
          tableHtml += '</tr></thead><tbody>';
          inHeader = false;
          inBody = true;
        }
        return;
      }

      if (!row) return;

      const cells = row.split('&').map(cell => {
        cell = processInlineCommands(cell.trim(), commands);
        return replaceSpecialChars(cell);
      });

      if (ri === 0 && !inHeader && !inBody) {
        inHeader = true;
        tableHtml += '<thead><tr>';
        cells.forEach(cell => {
          tableHtml += `<th>${cell || ''}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
      } else {
        tableHtml += '<tr>';
        cells.forEach(cell => {
          tableHtml += `<td>${cell || ''}</td>`;
        });
        tableHtml += '</tr>';
      }
    });

    if (inHeader || inBody) tableHtml += '</tbody>';
    tableHtml += '</table>';
    return tableHtml;
  }

  function processItemize(block, commands) {
    let content = block;
    // Extract options
    const optionsMatch = content.match(/\\begin\{itemize\}\[([^\]]*)\]/);
    const options = optionsMatch ? optionsMatch[1] : '';

    // Remove \begin{itemize}[...]
    content = content.replace(/\\begin\{itemize\}\[[^\]]*\]/, '');
    content = content.replace(/\\begin\{itemize\}/, '');
    content = content.replace(/\\end\{itemize\}/, '');

    // Process \setlength\itemsep{...}
    let itemsep = '0';
    content = content.replace(/\\setlength\\itemsep\{([^}]*)\}/g, (_, v) => {
      itemsep = v;
      return '';
    });

    // Process vspace
    content = content.replace(/\\vspace\{([^}]*)\}/g, (_, v) => {
      return `<div class="res-vspace" data-vspace="${v}"></div>`;
    });
    content = content.replace(/\\vspace\{-([^}]*)\}/g, (_, v) => {
      return `<div class="res-vspace" data-vspace="-${v}"></div>`;
    });

    // Process \item[...]
    content = content.replace(/\\item(?:\[[^\]]*\])?/g, '<li>');

    // Process nested itemize
    content = content.replace(/\\begin\{itemize\}/g, '<ul class="res-sub-ul">');
    content = content.replace(/\\end\{itemize\}/g, '</ul>');

    // Process inline commands
    content = processInlineCommands(content, commands);
    content = replaceLineBreaks(content);
    content = replaceSpecialChars(content);

    // Wrap in ul with options
    const opts = [];
    if (options.includes('noitemsep') || options.includes('noitemsep=')) opts.push('noitemsep');
    if (options.includes('topsep=0pt')) opts.push('topsep-0pt');
    if (options.includes('itemsep=1pt')) opts.push('itemsep-1pt');
    const className = opts.length > 0 ? ` class="${opts.join(' ')}"` : '';
    const style = itemsep && itemsep !== '0' ? ` style="item-sep:${itemsep};"` : '';

    return `<ul class="res-ul ${opts.join(' ')}"${style}>${content}</ul>`;
  }

  function processInlineCommands(text, commands) {
    let result = text;
    // Order matters: longest matches first
    result = result.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
    result = result.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
    result = result.replace(/\\textsc\{([^}]*)\}/g, '<span class="res-smallcaps">$1</span>');
    result = result.replace(/\\Large\{([^}]*)\}/g, '<span class="res-large">$1</span>');
    result = result.replace(/\\large\{([^}]*)\}/g, '<span class="res-large">$1</span>');
    result = result.replace(/\\small\{([^}]*)\}/g, '<span class="res-small">$1</span>');
    result = result.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, '<a href="$1">$2</a>');
    result = result.replace(/\\textbackslash\{\}/g, '\\');
    result = result.replace(/\\textasciitilde\{\}/g, '~');
    result = result.replace(/\\textasciicircum\{\}/g, '^');
    result = result.replace(/\\circ/g, '&#9702;');
    result = result.replace(/\\vphantom\{[^}]*\}/g, '');
    result = result.replace(/\\hfill/g, '<span class="res-hfill"></span>');
    result = result.replace(/\\noindent/g, '');
    result = result.replace(/\\centering/g, '');
    result = result.replace(/\\pagenumbering\{[^}]*\}/g, '');

    // \includegraphics
    result = result.replace(/\\includegraphics(?:\[[^\]]*\])?\{([^}]*)\}/g, (_, src) => {
      return `<img src="${escapeHtml(src)}" class="res-logo-inline" alt="">`;
    });

    // Handle \\[...] before bare \\
    result = result.replace(/\\\\\[([-\d.]+)([a-z]*)\]/g, '<br style="margin-top:$1$2;">');

    // Handle \\ for line breaks
    result = result.replace(/\\\\/g, '<br>');

    // Remaining braces
    result = result.replace(/\\{/g, '{');
    result = result.replace(/\\}/g, '}');

    return result;
  }

  function replaceLineBreaks(text) {
    return text.replace(/\\\\/g, '<br>');
  }

  function replaceSpecialChars(text) {
    let result = text;
    result = result.replace(/&/g, '&amp;');
    result = result.replace(/</g, '&lt;');
    result = result.replace(/>/g, '&gt;');
    result = result.replace(/\\%/g, '%');
    result = result.replace(/\\\$/g, '$');
    result = result.replace(/\\#/g, '#');
    result = result.replace(/\\_/g, '_');
    result = result.replace(/\\&/g, '&');
    result = result.replace(/\\\{/g, '{');
    result = result.replace(/\\\}/g, '}');
    return result;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeTex(s) {
    if (!s) return '';
    return s.replace(/\\/g, '\\textbackslash{}')
            .replace(/&/g, '\\&')
            .replace(/%/g, '\\%')
            .replace(/\$/g, '\\$')
            .replace(/#/g, '\\#')
            .replace(/_/g, '\\_')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/~/g, '\\textasciitilde{}')
            .replace(/\^/g, '\\textasciicircum{}');
  }

  /* =====================
     Preview Rendering
     ===================== */
  function renderPreview(latex) {
    const container = document.getElementById('resumePreviewContent');
    if (!container) return;

    const html = latexToHtml(latex);

    container.innerHTML = `
      <div class="resume-document">
        <div class="resume-content">
          ${html}
        </div>
      </div>
    `;

    // Post-process spacing
    postProcessSpacing(container);
  }

  function postProcessSpacing(container) {
    // Apply vspace values
    const vspaceElements = container.querySelectorAll('.res-vspace');
    vspaceElements.forEach(el => {
      const v = el.getAttribute('data-vspace') || '0';
      const isNegative = v.startsWith('-');
      const val = isNegative ? v.substring(1) : v;
      el.style.marginTop = isNegative ? `-${val}` : val;
      el.style.marginBottom = val;
      el.style.height = '0';
      el.style.lineHeight = '0';
      el.style.fontSize = '0';
    });

    // Apply item-sep from style attributes
    const uls = container.querySelectorAll('.res-ul[style]');
    uls.forEach(ul => {
      const style = ul.getAttribute('style') || '';
      const match = style.match(/item-sep:([^;]+)/);
      if (match) {
        const items = ul.querySelectorAll('li');
        items.forEach(li => {
          li.style.marginBottom = match[1];
        });
      }
      ul.removeAttribute('style');
    });
  }

  /* =====================
     Source Editor
     ===================== */
  const DEFAULT_LATEX = `\\documentclass[11pt,article]{article}
\\usepackage[letterpaper,margin=0.5in]{geometry}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{url}
\\usepackage{enumitem}
\\usepackage{palatino}
\\usepackage{tabularx}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{color}
\\definecolor{mygrey}{gray}{0.82}
\\usepackage{hyperref}
\\hypersetup{
    hidelinks,
    colorlinks=true,
    urlcolor=blue
}

\\setlength{\\tabcolsep}{0in}
\\newcommand{\\isep}{-2pt}
\\newcommand{\\lsep}{-0.5cm}
\\newcommand{\\psep}{-0.6cm}
\\renewcommand{\\labelitemii}{$\\circ$}

\\pagestyle{empty}

\\newcommand{\\resheading}[1]{{\\small \\colorbox{mygrey} { \\begin{minipage}{0.99\\textwidth}{\\textbf{#1 \\vphantom{p\\^{E}}}}\\end{minipage}}}}
\\newcommand{\\ressubheading}[3]{
\\begin{tabular*}{6.62in}{l @{\\extracolsep{\\fill}} r}
    \\textsc{{\\textbf{#1}}} & \\rightline\\textsc{\\textit{[#2]}} \\\\
\\end{tabular*}\\vspace{-8pt}}

\\begin{document}
\\begin{table}
    \\begin{minipage}{0\\linewidth}
        \\centering
        \\includegraphics[height=0.8in]{NSUT_logo.png}
    \\end{minipage}
    \\begin{minipage}{1\\linewidth}
        \\centering
        \\def\\arraystretch{1}
        \\textbf{\\Large{Your Name}}\\ \\vspace{0.4em}
        +91-9999999999 |
        \\href{mailto:your.email@example.com}{Email} |
        \\href{https://www.linkedin.com/in/}{LinkedIn}
    \\end{minipage}\\hfill
\\end{table}
\\setlength{\\tabcolsep}{18pt}

\\begin{table}
\\centering
\\resheading{\\textbf{EDUCATION} }\\
\\vspace{0.4em}
\\begin{tabular}{lllll}
\\textbf{Course}    & \\textbf{College / University}     & \\textbf{Year}     & \\textbf{CGPA / \\%} \\ 
\\toprule
B.Tech (Your Branch)   & Netaji Subhas University of Technology  & 20XX   & 8.00 \\  
Board (Class XII)      & Your School Name & 20XX & 90  \\ 
Board (Class X)        & Your School Name & 20XX & 90
\\end{tabular}
\\end{table}

\\noindent
\\resheading{\\textbf{INTERNSHIP} }\\\\[-0.35cm]
\\vspace{-0.4em}
\\begin{itemize}
\\setlength\\itemsep{-0.3em}
\\item \\textbf{Your Internship Title | Company Name | Location}\\hfill \\textbf{Month Year - Month Year} 
\\vspace{-0.5em}
\\begin{itemize}[noitemsep]
    \\item Mention your key responsibilities and achievements in bullet points.
    \\item Mention your key responsibilities and achievements in bullet points.
    \\item Mention your key responsibilities and achievements in bullet points.
\\end{itemize}
\\item \\textbf{Your Internship Title | Company Name | Location}\\hfill \\textbf{Month Year - Month Year} 
\\vspace{-0.5em}
\\begin{itemize}[noitemsep]
    \\item Mention your key responsibilities and achievements in bullet points.
    \\item Mention your key responsibilities and achievements in bullet points.
    \\item Mention your key responsibilities and achievements in bullet points.
\\end{itemize}
\\end{itemize}

\\noindent
\\resheading{\\textbf{PROJECT} }\\\\[-0.35cm]
\\vspace{-0.4em}
\\begin{itemize} [noitemsep]
\\item \\textbf{Your Project Title}
\\vspace{-0.25em}
\\begin{itemize} [noitemsep]
    \\item Mention the tech stack used and describe the project in bullet points.
    \\item Mention the tech stack used and describe the project in bullet points.
\\end{itemize}
\\item \\textbf{Your Project Title}
\\vspace{-0.25em}
\\begin{itemize} [noitemsep]
    \\item Mention the tech stack used and describe the project in bullet points.
    \\item Mention the tech stack used and describe the project in bullet points.
\\end{itemize}
\\end{itemize}

\\noindent
\\resheading{\\textbf{POSITIONS OF RESPONSIBILITY} }\\\\[-0.35cm]
\\vspace{-0.4em}
\\begin{itemize}
\\setlength\\itemsep{-0.28em}
\\item \\textbf{Your Position | Organization/Event Name}\\hfill \\textbf{Month Year - Month Year}
\\vspace{-0.25em}
\\begin{itemize} [noitemsep,topsep=0pt]
    \\item Mention your responsibilities and achievements in bullet points.
    \\item Mention your responsibilities and achievements in bullet points.
    \\item Mention your responsibilities and achievements in bullet points.
    \\item Mention your responsibilities and achievements in bullet points.
\\end{itemize}
\\vspace{0.5em}
\\item \\textbf{Your Position | Organization/Event Name}\\hfill \\textbf{Month Year - Month Year}
\\vspace{-0.25em}
\\begin{itemize} [noitemsep,topsep=0pt]
    \\item Mention your responsibilities and achievements in bullet points.
    \\item Mention your responsibilities and achievements in bullet points.
    \\item Mention your responsibilities and achievements in bullet points.
    \\item Mention your responsibilities and achievements in bullet points.
\\end{itemize}
\\vspace{0.5em}
\\end{itemize}

\\noindent
\\resheading{\\textbf{ACADEMIC ACHIEVEMENTS}}\\\\[-0.35cm]
\\vspace{-0.4em}
\\begin{itemize}[itemsep=1pt]
\\item Mention any notable academic achievements, such as exam scores or rankings.
\\end{itemize}

\\noindent
\\resheading{\\textbf{OTHER INFORMATION}}\\\\[-0.35cm]
 \\begin{itemize}
  \\item \\textbf{Technical Skills \\& Tools}: List any relevant technical skills you possess. \\\\[-0.6cm]
\\end{itemize}

\\end{document}`;

  let sourceEditor = null;
  let lineNumbers = null;
  let updateTimer = null;

  function updateLineNumbers() {
    if (!sourceEditor || !lineNumbers) return;
    const lines = sourceEditor.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += `<div>${i}</div>`;
    }
    lineNumbers.innerHTML = html;
  }

  function updatePreview() {
    const latex = sourceEditor.value;
    renderPreview(latex);
  }

  function debouncedUpdate() {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(updatePreview, 300);
  }

  function initResumeBuilder() {
    sourceEditor = document.getElementById('sourceEditor');
    lineNumbers = document.getElementById('sourceLineNumbers');

    if (!sourceEditor) {
      console.error('[RESUME] Missing source editor');
      return;
    }

    sourceEditor.value = DEFAULT_LATEX;
    updateLineNumbers();

    // Event listeners
    sourceEditor.addEventListener('input', () => {
      updateLineNumbers();
      debouncedUpdate();
    });

    sourceEditor.addEventListener('scroll', () => {
      if (lineNumbers) lineNumbers.scrollTop = sourceEditor.scrollTop;
    });

    sourceEditor.addEventListener('keyup', updateLineNumbers);
    sourceEditor.addEventListener('click', updateLineNumbers);

    // Tab switching
    const editorTab = document.getElementById('editorTab');
    const sourceTab = document.getElementById('sourceTab');
    const formPane = document.getElementById('formEditorPane');
    const sourcePane = document.getElementById('sourceEditorPane');

    function showSource() {
      if (formPane) formPane.style.display = 'none';
      if (sourcePane) sourcePane.style.display = 'flex';
      if (editorTab) { editorTab.classList.remove('active'); }
      if (sourceTab) { sourceTab.classList.add('active'); }
    }

    function showEditor() {
      if (sourcePane) sourcePane.style.display = 'none';
      if (formPane) formPane.style.display = 'block';
      if (sourceTab) { sourceTab.classList.remove('active'); }
      if (editorTab) { editorTab.classList.add('active'); }
    }

    if (sourceTab) {
      sourceTab.addEventListener('click', showSource);
    }
    if (editorTab) {
      editorTab.addEventListener('click', showEditor);
    }

    showSource();

    // Initial render
    updatePreview();

    // Zoom controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomLabelEl = document.getElementById('zoomLabel');
    const paper = document.getElementById('resumePaper');
    let zoom = 100;

    function applyZoom(z) {
      zoom = z;
      if (paper) paper.style.transform = `scale(${zoom / 100})`;
      if (zoomLabelEl) zoomLabelEl.textContent = zoom + '%';
    }

    function calculateFitZoom() {
      const scrollArea = document.getElementById('previewScrollArea');
      if (!scrollArea || !paper) return 80;
      const availableWidth = scrollArea.clientWidth - 60;
      const paperWidth = 8.27 * 96;
      return Math.max(40, Math.min(Math.round((availableWidth / paperWidth) * 100), 100));
    }

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => applyZoom(Math.min(200, zoom + 10)));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => applyZoom(Math.max(30, zoom - 10)));

    setTimeout(() => applyZoom(calculateFitZoom()), 300);

    // Reset button
    const resetBtn = document.getElementById('resumeResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset to the default resume template?')) {
          sourceEditor.value = DEFAULT_LATEX;
          updateLineNumbers();
          updatePreview();
        }
      });
    }

    // Download PDF
    const downloadBtn = document.getElementById('resumeDownloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', downloadPDF);
    }

    // Download LaTeX
    const downloadTexBtn = document.getElementById('downloadTexBtn');
    if (downloadTexBtn) {
      downloadTexBtn.addEventListener('click', downloadLatex);
    }
  }

  function downloadPDF() {
    const paper = document.getElementById('resumePreviewContent');
    if (!paper) return;
    const printWin = window.open('', '_blank');
    printWin.document.write(`<!DOCTYPE html>
<html><head>
<title>Resume</title>
<style>
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #fff; font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.25; color: #000; }
  .resume-document { max-width: 8.5in; margin: 0 auto; padding: 0.5in; }
  .resume-content { width: 100%; min-height: 11.69in; }
  .res-heading { background: #D1D1D1; color: #000; font-weight: bold; font-size: 10pt; padding: 2px 6px; display: block; width: 100%; box-sizing: border-box; margin: 0 0 3px 0; line-height: 1.2; }
  .res-ul { margin: 1px 0; padding-left: 1.1em; list-style-type: disc; }
  .res-ul.noitemsep { list-style-type: disc; padding-left: 1.1em; }
  .res-ul.topsep-0pt { list-style-type: disc; padding-left: 1.1em; }
  .res-ul li { margin-bottom: 0; line-height: 1.2; }
  .res-sub-ul { list-style-type: circle; padding-left: 1.1em; }
  .res-sub-ul li { margin-bottom: 0; line-height: 1.2; }
  .res-hfill { flex: 1; display: inline-block; }
  .res-edu-table { width: 100%; border-collapse: collapse; margin: 4px 0 2px 0; font-size: 10.5pt; table-layout: auto; }
  .res-edu-table th { font-weight: bold; vertical-align: top; line-height: 1.25; }
  .res-edu-table th:nth-child(1), .res-edu-table td:nth-child(1) { width: 28%; }
  .res-edu-table th:nth-child(2), .res-edu-table td:nth-child(2) { width: 38%; white-space: nowrap; }
  .res-edu-table th:nth-child(3), .res-edu-table td:nth-child(3) { width: 17%; text-align: right; padding-right: 6px; }
  .res-edu-table th:nth-child(4), .res-edu-table td:nth-child(4) { width: 17%; text-align: right; padding-right: 6px; }
  .res-edu-table thead tr { border-top: 1.5px solid #000; border-bottom: 1px solid #000; }
  .res-edu-table tbody tr { border-bottom: 1px solid #000; }
  .res-edu-table tbody tr:last-child { border-bottom: none; }
  .res-edu-table td { padding: 2px 3px; vertical-align: top; line-height: 1.25; }
  .res-subheading { display: flex; justify-content: space-between; }
  .res-smallcaps { font-variant: small-caps; }
  .res-large { font-size: 1.4em; }
  .res-small { font-size: 0.9em; }
  .res-table-wrapper { margin-bottom: 8px; }
  .res-minipage { display: inline-block; vertical-align: top; }
  .res-logo { max-height: 0.8in; height: auto; max-width: 1.2in; }
  .res-logo-inline { max-height: 0.8in; }
</style>
</head><body>
<div class="resume-document">
${paper.innerHTML}
</div>
<script>
  window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };
</script>
</body></html>`);
    printWin.document.close();
  }

  function downloadLatex() {
    const source = document.getElementById('sourceEditor');
    if (!source) return;
    const blob = new Blob([source.value], { type: 'text/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* =====================
     Initialization
     ===================== */
  function tryInit() {
    const source = document.getElementById('sourceEditor');
    const preview = document.getElementById('resumePreviewContent');
    if (source && preview) {
      initResumeBuilder();
    } else {
      setTimeout(tryInit, 100);
    }
  }

  function tryInitOnReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(tryInit, 0));
    } else {
      setTimeout(tryInit, 0);
    }
  }

  tryInitOnReady();
})();
