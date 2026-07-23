import { fetchStudentDetailedProfile } from '../server/ims/scraper.js';
import { scrapedDataCache } from './scraped_data_cache.js';

/**
 * ConcurrentScrapeRunner
 * Executes ResultHub profile/history fetch concurrently alongside IMS attendance scraping
 * using Promise.allSettled() to prevent serial bottlenecking.
 */
export async function executeConcurrentScrape(imsScrapeFn, rollNumber, year, semester) {
    const cachedData = scrapedDataCache.get(rollNumber, year, semester);
    if (cachedData) {
        return {
            fromCache: true,
            data: cachedData
        };
    }

    console.log(`[CONCURRENT-RUNNER] Launching concurrent IMS scrape + ResultHub fetch for ${rollNumber}...`);
    console.time("ConcurrentScrape_Total");

    // Initiate both asynchronous tasks concurrently
    const imsPromise = imsScrapeFn();
    const resultHubPromise = fetchStudentDetailedProfile(rollNumber).catch(err => {
        console.error(`[CONCURRENT-RUNNER] ResultHub fetch failed gracefully: ${err.message}`);
        return { success: false, history: null };
    });

    // Await both promises in parallel
    const [imsResult, resultHubResult] = await Promise.allSettled([imsPromise, resultHubPromise]);

    console.timeEnd("ConcurrentScrape_Total");

    const imsData = imsResult.status === 'fulfilled' ? imsResult.value : null;
    const historyData = resultHubResult.status === 'fulfilled' && resultHubResult.value.success ? resultHubResult.value.history : null;

    if (!imsData) {
        throw new Error(imsResult.reason?.message || 'IMS Attendance Scrape failed.');
    }

    const payload = {
        success: true,
        rollNumber,
        data: imsData,
        history: historyData
    };

    // Store in short-TTL cache
    scrapedDataCache.set(rollNumber, payload, year, semester);

    return {
        fromCache: false,
        data: payload
    };
}
