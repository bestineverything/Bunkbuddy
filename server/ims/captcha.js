import http from 'http';

const OCR_SERVICE_URL = 'http://127.0.0.1:5001';

function callOcrService(buffer) {
    return new Promise((resolve, reject) => {
        const b64 = buffer.toString('base64');
        const body = JSON.stringify({ image: b64 });

        const req = http.request({
            hostname: '127.0.0.1',
            port: 5001,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.result || '11111');
                } catch {
                    resolve('11111');
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('OCR timeout')); });
        req.write(body);
        req.end();
    });
}

export async function solveCaptcha(buffer) {
    try {
        const raw = await callOcrService(buffer);
        // Clean to digits only, exactly 5
        let cleaned = raw.replace(/[^0-9]/g, '').trim();
        if (cleaned.length > 5) cleaned = cleaned.slice(0, 5);
        if (cleaned.length < 5) cleaned = cleaned.padEnd(5, '0');
        console.log(`[CAPTCHA] ddddocr → ${cleaned}`);
        return cleaned;
    } catch (e) {
        console.error(`[CAPTCHA] OCR service error: ${e.message}`);
        return '11111';
    }
}
