// js/resulthub.js

let fetchBtn, yearSelect, branchSelect, loadingDiv, resultsGrid;

async function fetchResults() {
    const year = yearSelect.value;
    const branch = branchSelect.value;
    
    // Clear previous results
    resultsGrid.innerHTML = '';
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch(`/api/results/${year}?branch=${branch}`);
        const data = await response.json();
        
        loadingDiv.style.display = 'none';
        
        if (data.success && data.candidates) {
            if (data.candidates.length === 0) {
                resultsGrid.innerHTML = '<div style="color: var(--text-muted);">No results found for this selection.</div>';
                return;
            }
            
            // Find max semesters across all candidates
            let maxSgpaCount = 0;
            data.candidates.forEach(stu => {
                if (stu.sgpas && stu.sgpas.length > maxSgpaCount) {
                    maxSgpaCount = stu.sgpas.length;
                }
            });

            // Build Header
            let tableHeader = `
                <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Branch</th>
            `;
            for (let i = 0; i < maxSgpaCount; i++) {
                tableHeader += `<th>Sem ${i + 1}</th>`;
            }
            tableHeader += `<th>CGPA</th></tr>`;

            // Build Rows
            const tbodyContent = data.candidates.map(student => {
                const nameStr = student.name ? student.name.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : 'Unknown';
                
                let rowHtml = `
                    <tr>
                        <td><div class="rank-badge">${student.rank || '-'}</div></td>
                        <td style="font-weight: 500;">${nameStr}</td>
                        <td style="font-family: var(--font-mono); color: var(--text-secondary); font-size: 0.85rem;">${student.roll}</td>
                        <td><span class="badge primary">${student.branch}</span></td>
                `;
                
                for(let i=0; i < maxSgpaCount; i++) {
                    const sgpa = student.sgpas && student.sgpas[i] ? student.sgpas[i] : '—';
                    rowHtml += `<td>${sgpa}</td>`;
                }

                rowHtml += `
                        <td><span class="badge accent" style="font-size: 0.9rem;">${student.cgpa}</span></td>
                    </tr>
                `;
                return rowHtml;
            }).join('');

            const tableHtml = `
                <div class="modern-table-container">
                    <table class="modern-table">
                        <thead>
                            ${tableHeader}
                        </thead>
                        <tbody>
                            ${tbodyContent}
                        </tbody>
                    </table>
                </div>
            `;
            
            resultsGrid.innerHTML = tableHtml;

        } else {
            resultsGrid.innerHTML = `<div style="color: #ff5252;">Error: ${data.message || 'Failed to fetch results'}</div>`;
        }
    } catch (error) {
        console.error("Result fetch error:", error);
        loadingDiv.style.display = 'none';
        resultsGrid.innerHTML = `<div style="color: #ff5252;">Connection error. Server may be busy scraping.</div>`;
    }
}

function initResultHub() {
    fetchBtn = document.getElementById('rhFetchBtn');
    yearSelect = document.getElementById('rhYear');
    branchSelect = document.getElementById('rhBranch');
    loadingDiv = document.getElementById('rhLoading');
    resultsGrid = document.getElementById('rhResultsGrid');
    
    if (fetchBtn) {
        fetchBtn.addEventListener('click', fetchResults);
    }
}

if (window.__bb_pagesLoaded) {
    initResultHub();
} else {
    document.addEventListener('pagesLoaded', initResultHub);
}
