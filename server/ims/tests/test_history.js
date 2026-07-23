import { fetchStudentDetailedProfile } from './scraper.js';

(async () => {
    console.log("Testing with 2024UME4113...");
    const profile = await fetchStudentDetailedProfile('2024UME4113');
    console.log(JSON.stringify(profile, null, 2));
    process.exit();
})();
