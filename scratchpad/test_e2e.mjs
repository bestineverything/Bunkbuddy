// Complete end-to-end frontend simulation
const localStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
};

// api.js functions
function saveSession(sessionId, rollNumber, data, history = null) {
  localStorage.setItem('bb_session', sessionId);
  localStorage.setItem('bb_roll', rollNumber);
  localStorage.setItem('bb_data', JSON.stringify(data));
  if (history) {
    localStorage.setItem('bb_academic_history_v2', JSON.stringify(history));
  }
}

function getSession() {
  const sessionId = localStorage.getItem('bb_session');
  const rollNumber = localStorage.getItem('bb_roll');
  const raw = localStorage.getItem('bb_data');
  const historyRaw = localStorage.getItem('bb_academic_history_v2');
  if (!sessionId || !raw) return null;
  let history = null;
  try { history = historyRaw ? JSON.parse(historyRaw) : null; } catch (e) {}
  return { sessionId, rollNumber, data: JSON.parse(raw), history };
}

// Simulate server login response
const serverHistory = {
    cgpa: '8.14',
    universityRank: '#333',
    deptRank: '--',
    credits: '--',
    major: 'MECHANICAL ENGINEERING',
    name: 'AMAN GULIANI'
};

const serverData = {
    home: {
        profile: { name: 'AMAN GULIANI', program: 'B.Tech', cgpa: '8.14' }
    },
    attendance: [{ subject: 'Test', attended: '10', total: '10' }],
    detailedAttendance: null,
    resources: [],
    connect: []
};

// Login
console.log('=== LOGIN ===');
saveSession('session-123', '2024UME4113', serverData, serverHistory);

// Page load
console.log('\n=== PAGE LOAD ===');
const session = getSession();
console.log('session exists:', !!session);
console.log('session.history exists:', !!session.history);
console.log('session.history.cgpa:', session.history?.cgpa);
console.log('session.history.name:', session.history?.name);
console.log('session.history.major:', session.history?.major);

// app.js initialization
const data = session.data;
window.data = data;
const rollNumber = session.rollNumber.toUpperCase();

// loadAcademics logic
console.log('\n=== LOAD ACADEMICS ===');
let historyObj = null;

if (window.data && window.data.history) {
    historyObj = window.data.history;
    console.log('Source: window.data.history');
} else if (session && session.history) {
    historyObj = session.history;
    console.log('Source: session.history');
} else {
    const cached = localStorage.getItem('bb_academic_history_v2');
    if (cached) {
        historyObj = JSON.parse(cached);
        console.log('Source: localStorage bb_academic_history_v2');
    }
}

console.log('Final historyObj:', JSON.stringify(historyObj));

// Verify UI elements would get correct values
console.log('\n=== UI VALUES ===');
console.log('academicCgpa:', historyObj?.cgpa || '--');
console.log('academicUniRank:', historyObj?.universityRank || '--');
console.log('academicDeptRank:', historyObj?.deptRank || '--');
console.log('academicCredits:', historyObj?.credits || '--');
console.log('academicName:', historyObj?.name || '--');
console.log('academicBranch:', historyObj?.major || '--');
