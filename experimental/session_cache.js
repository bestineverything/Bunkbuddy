import { randomUUID } from 'crypto';

/**
 * SessionCache
 * Manages authenticated IMS sessions so login & CAPTCHA solving happen once
 * per session lifetime instead of on every request.
 */
class SessionCache {
    constructor(defaultTtlMs = 20 * 60 * 1000) { // 20 minutes default TTL
        this.cache = new Map();
        this.defaultTtlMs = defaultTtlMs;
    }

    _makeKey(rollNumber, semester = '', year = '') {
        return `${rollNumber.trim().toUpperCase()}:${semester}:${year}`;
    }

    /**
     * Get an active, non-expired session for the specified student.
     */
    getSession(rollNumber, semester = '', year = '') {
        const key = this._makeKey(rollNumber, semester, year);
        const session = this.cache.get(key);
        if (!session) return null;

        if (this.isExpired(session)) {
            console.log(`[SESSION-CACHE] Session expired for ${rollNumber}. Invalidating.`);
            this.clearSession(rollNumber, semester, year);
            return null;
        }

        console.log(`[SESSION-CACHE] Cache HIT for ${rollNumber} (Age: ${Math.round((Date.now() - session.loginTime) / 1000)}s)`);
        return session;
    }

    /**
     * Store a newly authenticated session in the cache.
     */
    setSession(rollNumber, sessionPayload, semester = '', year = '', ttlMs = null) {
        const key = this._makeKey(rollNumber, semester, year);
        const session = {
            sessionId: sessionPayload.sessionId || randomUUID(),
            rollNumber: rollNumber.toUpperCase(),
            semester,
            year,
            client: sessionPayload.client || null,
            cookieJar: sessionPayload.jar || null,
            cookies: sessionPayload.cookies || [],
            data: sessionPayload.data || null,
            history: sessionPayload.history || null,
            loginTime: Date.now(),
            ttlMs: ttlMs || this.defaultTtlMs
        };

        this.cache.set(key, session);
        console.log(`[SESSION-CACHE] Session cached for ${rollNumber} (TTL: ${session.ttlMs / 1000}s)`);
        return session;
    }

    /**
     * Check if a session has exceeded its TTL.
     */
    isExpired(session) {
        if (!session || !session.loginTime) return true;
        return (Date.now() - session.loginTime) >= session.ttlMs;
    }

    /**
     * Clear session for a student.
     */
    clearSession(rollNumber, semester = '', year = '') {
        const key = this._makeKey(rollNumber, semester, year);
        this.cache.delete(key);
    }

    /**
     * High-level wrapper: Returns cached session if valid, otherwise invokes loginFn
     * to solve CAPTCHA and authenticate, then saves session.
     */
    async getOrLogin(rollNumber, password, year, semester, loginFn) {
        const cached = this.getSession(rollNumber, semester, year);
        if (cached) {
            return {
                fromCache: true,
                session: cached
            };
        }

        console.log(`[SESSION-CACHE] Cache MISS for ${rollNumber}. Executing login flow...`);
        const loginResult = await loginFn(rollNumber, password, year, semester);
        
        if (loginResult && loginResult.success) {
            const cachedSession = this.setSession(rollNumber, loginResult, semester, year);
            return {
                fromCache: false,
                session: cachedSession,
                rawResult: loginResult
            };
        }

        throw new Error(loginResult?.message || 'Login failed during getOrLogin execution.');
    }

    /**
     * Clear all cached sessions.
     */
    clearAll() {
        this.cache.clear();
    }
}

export const sessionCache = new SessionCache();
export default SessionCache;
