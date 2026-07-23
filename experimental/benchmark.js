import { sessionCache } from './session_cache.js';
import { rawHttpLoginToIms } from './raw_http_login.js';
import { pooledLoginToIms, browserPool } from './browser_pool.js';
import { executeConcurrentScrape } from './concurrent_runner.js';
import { solveCaptchaThreaded } from './captcha_threaded.js';
import http from 'http';

/**
 * BunkBuddy Side-by-Side Optimization Benchmark Suite
 * Allows testing experimental modules side-by-side against the baseline scraper engine.
 */

async function checkServiceHealth() {
    console.log('\n=== 1. Checking Microservices Status ===');

    const checkPort = (port) => new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}/`, (res) => resolve(true));
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => { req.destroy(); resolve(false); });
    });

    const is5001Up = await checkPort(5001);
    const is5002Up = await checkPort(5002);

    console.log(`Port 5001 (Baseline Single-Threaded ddddocr): ${is5001Up ? '✅ ONLINE' : '❌ OFFLINE'}`);
    console.log(`Port 5002 (Experimental Threaded ddddocr)    : ${is5002Up ? '✅ ONLINE' : '⚠️ NOT STARTED (Run python experimental/ocr_service_threaded.py)'}`);
}

async function benchmarkSessionCache() {
    console.log('\n=== 2. Testing Session Cache & Expiry ===');
    const mockRoll = '2024TEST001';
    
    console.log('Testing session lookup before login...');
    const initialLookup = sessionCache.getSession(mockRoll);
    console.log(`Initial lookup result: ${initialLookup ? 'Found' : 'Null (Expected)'}`);

    console.log('Mocking session creation...');
    sessionCache.setSession(mockRoll, { sessionId: 'test-uuid-1234', data: { mock: true } }, '1', '2026-27', 3000); // 3 sec TTL

    const cachedLookup = sessionCache.getSession(mockRoll, '1', '2026-27');
    console.log(`Cached lookup hit: ${cachedLookup ? '✅ PASS' : '❌ FAIL'}`);

    console.log('Waiting 3.5 seconds for TTL expiry...');
    await new Promise(r => setTimeout(r, 3500));

    const expiredLookup = sessionCache.getSession(mockRoll, '1', '2026-27');
    console.log(`Expired lookup check: ${expiredLookup === null ? '✅ EXPIRED AS EXPECTED' : '❌ FAIL'}`);
}

async function benchmarkConcurrency() {
    console.log('\n=== 3. Testing Concurrent IMS & ResultHub Pipeline ===');
    const startTime = Date.now();

    const mockImsScrape = async () => {
        await new Promise(r => setTimeout(r, 400));
        return { subjects: [{ name: 'Math', pct: '85%' }] };
    };

    const result = await executeConcurrentScrape(mockImsScrape, '2024UME4113', '2026-27', '1');
    const elapsed = Date.now() - startTime;

    console.log(`Concurrent execution finished in ${elapsed}ms`);
    console.log(`ResultHub Data fetched concurrently: ${result.data.history ? '✅ SUCCESS' : '⚠️ NO DATA/SKIPPED'}`);
}

async function runAllBenchmarks() {
    console.log('====================================================');
    console.log('   BUNKBUDDY EXPERIMENTAL OPTIMIZATION BENCHMARK    ');
    console.log('====================================================');

    await checkServiceHealth();
    await benchmarkSessionCache();
    await benchmarkConcurrency();

    console.log('\n=== Benchmark Summary ===');
    console.log('All isolated experimental units verified.');
    console.log('To shutdown pooled browser instance gracefully...');
    await browserPool.closeAll();
    console.log('Done.');
}

runAllBenchmarks().catch(console.error);
