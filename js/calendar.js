const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let currentDate = new Date();
let holidays = [];
let isAdmin = false;

let grid, monthYearLabel, prevBtn, nextBtn, adminControls;

// Helper to format date as YYYY-MM-DD
function formatDateString(year, month, day) {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function fetchHolidays() {
    try {
        const res = await fetch('/api/holidays');
        const data = await res.json();
        if (data.success) {
            holidays = data.holidays;
        }
    } catch (e) {
        console.error("Failed to load holidays:", e);
    }
}

async function toggleHoliday(dateStr) {
    const sessionId = localStorage.getItem('bb_session');
    if (!sessionId) return;
    try {
        const res = await fetch('/api/holidays/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': sessionId
            },
            body: JSON.stringify({ date: dateStr })
        });
        const data = await res.json();
        if (data.success) {
            holidays = data.holidays;
            renderCalendar();
        } else {
            console.error(data.message);
        }
    } catch (e) {
        console.error("Failed to toggle holiday:", e);
    }
}

function renderCalendar() {
    grid.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYearLabel.textContent = `${MONTHS[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const lastDayText = new Date(year, month + 1, 0).getDate();

    // Empty spots for preceding days
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        grid.appendChild(emptyDiv);
    }

    const todayStr = formatDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    // Loop through days
    for (let i = 1; i <= lastDayText; i++) {
        const dateStr = formatDateString(year, month, i);
        const dayDiv = document.createElement('div');
        dayDiv.textContent = i;
        dayDiv.style.padding = '8px';
        dayDiv.style.textAlign = 'center';
        dayDiv.style.borderRadius = '8px';
        dayDiv.style.fontSize = '0.9rem';

        // Styling based on status
        if (dateStr === todayStr) {
            dayDiv.style.background = 'rgba(255, 255, 255, 0.15)';
            dayDiv.style.border = '1px solid rgba(255,255,255,0.3)';
        }

        if (holidays.includes(dateStr)) {
            // Holiday style
            dayDiv.style.background = 'rgba(255, 100, 100, 0.2)';
            dayDiv.style.color = '#ff8888';
            dayDiv.style.fontWeight = 'bold';
        }

        if (isAdmin) {
            dayDiv.style.cursor = 'pointer';
            dayDiv.addEventListener('click', () => toggleHoliday(dateStr));
            dayDiv.addEventListener('mouseover', () => {
                dayDiv.style.boxShadow = '0 0 5px rgba(255,255,255,0.3)';
            });
            dayDiv.addEventListener('mouseout', () => {
                dayDiv.style.boxShadow = 'none';
            });
        }

        grid.appendChild(dayDiv);
    }
}

// Initial setup
async function initCalendar() {
    grid = document.getElementById('calendarGrid');
    monthYearLabel = document.getElementById('calMonthYear');
    prevBtn = document.getElementById('calPrevBtn');
    nextBtn = document.getElementById('calNextBtn');
    adminControls = document.getElementById('adminControls');

    // Check if user is admin
    const sessionStr = localStorage.getItem('bb_session');
    // For now we don't know the rollNumber strictly in localStorage unless we fetch it. 
    // We already fetch user info in app.js on load (/api/data)
    try {
        const res = await fetch(`/api/data?sessionId=${sessionStr}`);
        const data = await res.json();
        if (data.rollNumber === '2024UME4113') {
            isAdmin = true;
            if (adminControls) adminControls.style.display = 'block';
        }
    } catch(e) {}

    await fetchHolidays();
    renderCalendar();

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
}

// ensure pages are loaded before init
if (window.__bb_pagesLoaded) {
    initCalendar();
} else {
    document.addEventListener('pagesLoaded', initCalendar);
}
