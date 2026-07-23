import { fetchStudentDetailedProfile } from './ims/scraper.js';

(async () => {
    console.log("Fetching profile...");
    const result = await fetchStudentDetailedProfile('2024UME4113');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
})();
