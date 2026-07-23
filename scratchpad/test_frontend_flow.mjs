// Simulate frontend localStorage and data flow
const localStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
};

// Simulate api.js functions
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

// Simulate login response
const loginResult = {
    success: true,
    sessionId: 'test-session-123',
    rollNumber: '2024UME4113',
    data: {
        home: {
            profile: { name: 'AMAN GULIANI', program: 'B.Tech', cgpa: '8.14', semester: 'N/A' },
            summary: []
        },
        attendance: [],
        detailedAttendance: null,
        resources: [],
        connect: []
    },
    history: {
        cgpa: '8.14',
        universityRank: '#333',
        deptRank: '--',
        credits: '--',
        major: 'MECHANICAL ENGINEERING',
        name: 'AMAN GULIANI'
    }
};

// Step 1: Login saves session
console.log('=== STEP 1: Login saves session ===');
saveSession(loginResult.sessionId, loginResult.rollNumber, loginResult.data, loginResult.history);
console.log('bb_session:', localStorage.getItem('bb_session'));
console.log('bb_academic_history_v2:', localStorage.getItem('bb_academic_history_v2'));

// Step 2: Page loads, getSession called
console.log('\n=== STEP 2: Page loads ===');
const session = getSession();
console.log('session.history exists:', !!session.history);
console.log('session.history.cgpa:', session.history?.cgpa);
console.log('session.history.universityRank:', session.history?.universityRank);
console.log('session.history.name:', session.history?.name);

// Step 3: app.js initializes
const data = session.data;
window.data = data; // simulate window.data

// Step 4: loadAcademics reads history
console.log('\n=== STEP 3: loadAcademics ===');
let historyObj = null;

if (window.data && window.data.history) {
    historyObj = window.data.history;
    console.log('Found history in window.data');
} else if (session && session.history) {
    historyObj = session.history;
    console.log('Found history in session.history');
} else {
    const cached = localStorage.getItem('bb_academic_history_v2');
    if (cached) {
        historyObj = JSON.parse(cached);
        console.log('Found history in localStorage');
    }
}

console.log('historyObj:', JSON.stringify(historyObj));

// Step 5: Simulate refresh
console.log('\n=== STEP 4: Background refresh ===');
const refreshResult = {
    success: true,
    sessionId: 'test-session-123',
    rollNumber: '2024UME4113',
    data: { attendance: [{ subject: 'Test', attended: '10', total: '10' }] },
    history: {
        cgpa: '8.20',
        universityRank: '#300',
        deptRank: '#10',
        credits: '86',
        major: 'MECHANICAL ENGINEERING',
        name: 'AMAN GULIANI'
    }
};

saveSession(refreshResult.sessionId, refreshResult.rollNumber, refreshResult.data, refreshResult.history);
const refreshedSession = getSession();
console.log('After refresh session.history.cgpa:', refreshedSession.history?.cgpa);
console.log('After refresh session.history.deptRank:', refreshedSession.history?.deptRank);
console.log('After refresh session.history.credits:', refreshedSession.history?.credits);
