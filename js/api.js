const API_BASE = window.BB_API_BASE || '';

console.log('[API] BB_API_BASE =', window.BB_API_BASE);
console.log('[API] API_BASE =', API_BASE);
console.log('[API] hostname =', window.location.hostname);
console.log('[API] origin =', window.location.origin);

export async function login(rollNumber, password, year, semester) {
  const url = `${API_BASE}/api/auth/login`;
  console.log('[API] POST', url, { rollNumber, year, semester });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rollNumber, password, year, semester }),
  });

  const data = await res.json();
  console.log('[API] login response', res.status, data);
  if (!res.ok && !data.needsCaptcha) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
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
  localStorage.setItem('bb_session', sessionId);
  localStorage.setItem('bb_roll', rollNumber);
  localStorage.setItem('bb_data', JSON.stringify(data));
  if (history) {
    localStorage.setItem('bb_academic_history_v2', JSON.stringify(history));
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
