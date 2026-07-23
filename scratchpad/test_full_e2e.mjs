import http from 'http';

const localStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
};

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

async function test() {
    // Step 1: Call real login API
    const loginBody = JSON.stringify({
        rollNumber: '2024UME4113',
        password: 'Amanguliani@12345',
        year: '2025-26',
        semester: '4'
    });

    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: loginBody
    });

    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status);
    console.log('Login success:', loginData.success);
    console.log('SessionId:', loginData.sessionId);
    console.log('History CGPA:', loginData.history?.cgpa);
    console.log('History Rank:', loginData.history?.universityRank);
    console.log('History Major:', loginData.history?.major);
    console.log('History Name:', loginData.history?.name);

    if (!loginData.success) {
        console.error('Login failed:', loginData.message);
        return;
    }

    // Step 2: Simulate frontend saving session
    saveSession(loginData.sessionId, loginData.rollNumber, loginData.data, loginData.history);
    
    // Step 3: Simulate page reload
    const session = getSession();
    console.log('\nAfter page reload:');
    console.log('Session exists:', !!session);
    console.log('Session history exists:', !!session.history);
    console.log('Session history CGPA:', session.history?.cgpa);
    console.log('Session history name:', session.history?.name);

    // Step 4: Simulate loadAcademics
    const data = session.data;
    window.data = data;
    const rollNumber = session.rollNumber.toUpperCase();

    let historyObj = null;
    if (window.data && window.data.history) {
        historyObj = window.data.history;
        console.log('\nHistory source: window.data.history');
    } else if (session && session.history) {
        historyObj = session.history;
        console.log('\nHistory source: session.history');
    } else {
        const cached = localStorage.getItem('bb_academic_history_v2');
        if (cached) {
            historyObj = JSON.parse(cached);
            console.log('\nHistory source: localStorage');
        }
    }

    console.log('\nFinal history object:', JSON.stringify(historyObj, null, 2));
    console.log('\nAcademic page would show:');
    console.log('  Name:', historyObj?.name || '--');
    console.log('  CGPA:', historyObj?.cgpa || '--');
    console.log('  University Rank:', historyObj?.universityRank || '--');
    console.log('  Dept Rank:', historyObj?.deptRank || '--');
    console.log('  Credits:', historyObj?.credits || '--');
    console.log('  Major:', historyObj?.major || '--');

    // Step 5: Test refresh
    console.log('\n=== Testing refresh ===');
    const refreshBody = JSON.stringify({
        sessionId: loginData.sessionId,
        year: '2025-26',
        semester: '4'
    });

    const refreshRes = await fetch('http://localhost:3001/api/data/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: refreshBody
    });

    const refreshData = await refreshRes.json();
    console.log('Refresh status:', refreshRes.status);
    console.log('Refresh success:', refreshData.success);
    console.log('Refresh mode:', refreshData.mode);
    console.log('Refresh history CGPA:', refreshData.history?.cgpa);
    console.log('Refresh history name:', refreshData.history?.name);
    console.log('Refresh subjects:', refreshData.data?.attendance?.length);
}

test().catch(console.error);
