import fs from 'fs';
(async () => {
    try {
        const res = await fetch("https://www.resulthubdtu.com/NSUT/Results/2028");
        const body = await res.text();
        fs.writeFileSync('resulthub.html', body);
        console.log("Dumped resulthub.html");
    } catch(e) {
        console.error(e);
    }
})();
