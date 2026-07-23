# BunkBuddy Scraper & OCR Architecture 

This document serves as a detailed technical blueprint of Bunk Buddy's scraping engine and CAPTCHA bypass mechanism. It provides an in-depth look at how the NSUT IMS portal and ResultHub data extractors operate so that future developers (or AIs) can optimize, refactor, or maintain the system without reinventing the wheel.

## 1. System Overview

Bunk Buddy is designed to extract student attendance and academic records from two primary external sources:
1. **NSUT IMS Portal** (`https://imsnsit.org/imsnsit/`): Requires a complex frame-based navigation, authentication with dynamic CAPTCHAs, and heavily fragmented DOM structures.
2. **ResultHub** (`https://resulthubdtu.com/NSUT/...`): A secondary data source for student GPAs, University Ranks, and historic academic progression. 

To overcome speed and reliability bottlenecks inherent to browser automation, the system splits authentication and scraping into three parts:
- **Python-based `ddddocr` Microservice**: A persisting local HTTP API for lightning-fast CAPTCHA solving.
- **Puppeteer Headless Browser**: Used *only* for the initial DOM traversal, CAPTCHA rendering, and solving the NSUT `frameset` labyrinth.
- **Axios / Node Fetch**: Once session cookies are obtained, raw HTTP clients take over for faster data chunking, skipping browser overhead.

---

## 2. CAPTCHA Solving Ecosystem

The most critical bottleneck for automated login is solving the image-based alphanumeric CAPTCHA required by `imsnsit`. Bunk Buddy optimizes this by passing images to a dedicated Python daemon rather than spawning a new process on each attempt.

### 2.1 The Python Microservice (`server/ims/ocr_service.py`)
- **Technology**: Built using Python's native `http.server.HTTPServer` and the `ddddocr` package.
- **Port Allocation**: Listens locally on `http://127.0.0.1:5001`.
- **Initialization advantage**: The script loads the machine learning neural network weights into RAM **once** when the server starts (`ocr = ddddocr.DdddOcr(show_ad=False)`). If a new python script was spawned on every login request, the library would take >2 seconds just to load the model. With this microservice, solves happen in `< 50ms`.
- **Request Format**: Accepts POST requests with a JSON body containing `{"image": "base64_encoded_image_string"}`.
- **Response Format**: Sends back `{"result": "parsed_text"}` (e.g., `{"result": "8B3d2"}`).

### 2.2 Node.js Client Wrapper (`server/ims/captcha.js`)
- Interfaces with the Python service over native `http` module calls to avoid dependency bloat.
- Provides a strict `5000ms` timeout to prevent hanging the login flow if the Python daemon crashes.
- Employs strict string normalization: Extracts numeric values `raw.replace(/[^0-9]/g, '')` and forces the result to be exactly 5 digits (`padEnd` or `slice`) as NSUT IMS captchas are strictly 5 digits long. 

---

## 3. The Login Pipeline (`server/ims/login.js`)

NSUT IMS utilizes legacy HTML `frameset` structures which complicates traversal. We use `puppeteer` to break through the labyrinth.

### 3.1 Aggressive Request Interception
Extremely aggressive resource blocking is applied to the Puppeteer instance to maximize loading speed.
- **Whitelisted**: `text/html`, and specific images containing `captcha` or `captchaimg` in the URL.
- **Blocked**: All stylesheets (`css`), fonts, media, generic images, Google Analytics, and ad-trackers.

### 3.2 Frame Traversal Strategy
Because IMS doesn't load a single flat DOM tree, the scraper must constantly iterate over `page.frames()` and `evaluate` DOM trees individually.
1. **Navigating to Homepage URL**: The browser hits the IMS root directory.
2. **Finding the Login Entry**: We scan all internal frames to locate an `<a>` tag whose `textContent` matches "student login" and execute a synthetic click.
3. **Locating the Login Frame**: The script polls (`setInterval/promise loops`) across all frames, searching for `input[name="uid"]`.

### 3.3 Canvas Base64 CAPTCHA Extraction
Rather than downloading the CAPTCHA image via its URL (which would trigger a new session and invalidate the CAPTCHA shown on screen), Puppeteer isolates the image directly from the **rendered DOM** using HTML5 Canvas.
```javascript
const canvas = document.createElement('canvas');
canvas.getContext('2d').drawImage(img, 0, 0);
return canvas.toDataURL('image/jpeg', 1.0).split(',')[1];
```
This base64 string is passed securely to `captcha.js` for evaluation.

### 3.4 Active Retry Loop
Because `ddddocr` isn't 100% accurate, the scraper features a `MAX_ATTEMPTS = 3` retry mechanism.
- Handlers attach to `page.on('dialog', ...)` because NSUT throws an alert dialog if the CAPTCHA is invalid.
- If the browser transitions away from the page hosting `input[name="uid"]`, we assume login was a success.
- Once authenticated, cookies (specifically `PHPSESSID`) are exported from the browser and injected into Axios `touginc-cookie` jars (`client.js`) so the backend can issue raw, parallel HTTP requests efficiently for subsequent scraping.

---

## 4. DOM Parsing & Attendance Extraction (`server/ims/scraper.js`)

Once Puppeteer handles the navigation to the "Student Subject Wise Attendance", the raw HTML content is passed to `cheerio` (a lean jQuery implementation for Node) for rapid DOM parsing.

### 4.1 Frame Navigation (Puppeteer continuation)
To fetch attendance:
1. Searches for "Welcome: [Name]" to cache the student's name.
2. Clicks the "My Activities" link by scanning all frames. 
3. Clicks "My Attendance".
4. Finds the dropdown form (`frm`) inside a specific frame.
5. Injects synthetic `year` and `sem` values, creates a mirrored hidden HTML form, and executes a synthetic `<form>.submit()`.
6. Waits for the DOM to render "Student Subject Wise Attendance" before capturing the final `HTML`.

### 4.2 Data Mapping (Cheerio)
The HTML is heavily nested with archaic `<table class="plum_fieldbig">` structures.
1. Extract the column headers ("Days", "Overall Class", "Overall Absent", "Overall Present").
2. Extract abbreviation legends (e.g., `<br> MAC-123 - Mathematics`).
3. Calculate real-time absence metrics using the algorithm:
   - Calculate classes needed: `Let Y = Math.ceil(3*T - 4*A)` to achieve 75%. 
   - Calculate classes bunkable: `Let X = Math.floor((4/3) * A - T)`. 

### 4.3 Parallel Data Aggregation (ResultHub Integration)
While the Puppeteer scraper tackles IMS, an asynchronous Fetch request fires to ResultHub:
- Predicts the user's batch and admission year automatically from their `rollNumber` (`2024` -> `2024+4=2028` graduating class).
- It parses `https://www.resulthubdtu.com/NSUT/Results/{year}` finding the target student by Name/Roll.
- Extracts current CGPA and completed Semesters.
- This data is merged into the final BunkBuddy JSON object ensuring a rich Profile response.

## Optimization Recommendations for Future LLMs

If you are modifying this in the future to improve speed or reliability:
- **Skip Puppeteer Entirely (If Possible)**: If you can accurately map the exact HTTP headers and reverse-engineer the session creation logic of `imsnsit` framesets, you could eliminate the 3-5 second Puppeteer overhead and just use raw Axios.
- **Improve `ddddocr` Accuracy**: Sometimes `ddddocr` mistakes `I` for `1` or `O` for `0`. Ensure you add specific regex preprocessing/postprocessing logic based on the frequency of NSUT CAPTCHA char-types.
- **Parallelize Scrapers**: Move ResultHub into a completely decoupled worker thread.
- **Caching**: Implement a temporary Redis/In-Memory cache storing student UUID profiles. Do not rescrape everything if the user pulls-to-refresh quickly.
