/**
 * ScrapedDataCache
 * In-memory short-TTL (5 mins) cache for scraped attendance payloads keyed by roll number.
 */
class ScrapedDataCache {
    constructor(ttlMs = 5 * 60 * 1000) { // 5 minute default TTL
        this.cache = new Map();
        this.ttlMs = ttlMs;
    }

    _makeKey(rollNumber, year = '', semester = '') {
        return `${rollNumber.trim().toUpperCase()}:${year}:${semester}`;
    }

    get(rollNumber, year = '', semester = '') {
        const key = this._makeKey(rollNumber, year, semester);
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp >= this.ttlMs) {
            console.log(`[DATA-CACHE] Cache expired for ${rollNumber}`);
            this.cache.delete(key);
            return null;
        }

        console.log(`[DATA-CACHE] Cache HIT for ${rollNumber} attendance data!`);
        return item.data;
    }

    set(rollNumber, data, year = '', semester = '') {
        const key = this._makeKey(rollNumber, year, semester);
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        console.log(`[DATA-CACHE] Cached scraped data for ${rollNumber}`);
    }

    clear() {
        this.cache.clear();
    }
}

export const scrapedDataCache = new ScrapedDataCache();
export default ScrapedDataCache;
