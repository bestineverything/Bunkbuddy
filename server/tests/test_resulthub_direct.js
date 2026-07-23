import { fetchStudentDetailedProfile } from './ims/scraper.js';

(async () => {
    console.log("Fetching profile...");
    const res = await fetchStudentDetailedProfile("2024UME4113");
    console.log("Result:");
    console.dir(res, { depth: null });
})();
