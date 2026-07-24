const API_BASE = window.location.port === '3000' || window.location.hostname === 'localhost'
  ? ''
  : '';

export async function login(rollNumber, password, year, semester) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNumber, password, year, semester }),
      signal: controller.signal,
    });

    const data = await res.json();
    if (!res.ok && !data.needsCaptcha) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function refreshData(sessionId, year, semester) {
  const res = await fetch(`${API_BASE}/api/data/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, year, semester }),
  });

  const data = await res.json();
  return { ...data, ok: res.ok, status: res.status };
}

export async function refreshCaptcha(pendingId) {
  const res = await fetch(`${API_BASE}/api/auth/refresh-captcha/${pendingId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.captchaImage;
}

export function saveSession(sessionId, rollNumber, data, history = null) {
  try {
    localStorage.setItem('bb_session', sessionId);
    localStorage.setItem('bb_roll', rollNumber);
    const serialized = JSON.stringify(data);
    localStorage.setItem('bb_data', serialized);
    if (history) {
      localStorage.setItem('bb_academic_history_v2', JSON.stringify(history));
    }
  } catch (e) {
    console.error('Failed to save session to localStorage:', e);
  }
}

export function getSession() {
  const sessionId = localStorage.getItem('bb_session');
  const rollNumber = localStorage.getItem('bb_roll');
  const raw = localStorage.getItem('bb_data');
  const historyRaw = localStorage.getItem('bb_academic_history_v2');
  if (!sessionId || !raw) return null;
  let data = null;
  let history = null;
  try { data = JSON.parse(raw); } catch (e) { 
    console.warn('Failed to parse session data, clearing corrupted data', e);
    localStorage.removeItem('bb_data');
    localStorage.removeItem('bb_academic_history_v2');
    return null;
  }
  try { history = historyRaw ? JSON.parse(historyRaw) : null; } catch (e) {}
  return { sessionId, rollNumber, data, history };
}

export function clearSession() {
  localStorage.removeItem('bb_session');
  localStorage.removeItem('bb_roll');
  localStorage.removeItem('bb_data');
  localStorage.removeItem('bb_academic_history_v2');
}
