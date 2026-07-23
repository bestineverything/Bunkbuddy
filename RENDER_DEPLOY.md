# Render Deployment Steps

## 1. Deploy Backend on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository `bunkbuddy.in`
4. Render will auto-detect `render.yaml` and use these settings:
   - **Runtime:** Docker
   - **Dockerfile Path:** `./server/Dockerfile`
   - **Plan:** Free
   - **Region:** Oregon (or closest to you)

5. Click **"Create Web Service"**
6. Wait for build to complete (~5-10 min first time)
7. Copy your backend URL, e.g. `https://bunkbuddy-server.onrender.com`

## 2. Deploy Frontend on Netlify

1. Go to https://app.netlify.com/drop
2. Drag and drop `bunkbuddy-deploy.zip`
3. After deploy, go to **Site settings** → **Environment variables**
4. Add variable:
   - **Key:** `BB_API_BASE`
   - **Value:** `https://bunkbuddy-server.onrender.com` (your Render URL)
5. Trigger a new deploy

## 3. Verify

- Frontend: https://your-site.netlify.app
- Backend health: https://your-render-url.onrender.com/api/health
- Login flow should now work end-to-end

## Architecture

```
[Browser] → [Netlify Static Site] → [Render Web Service]
                                        ├── Node.js/Express API
                                        ├── Puppeteer (Chromium)
                                        ├── Python OCR (ddddocr)
                                        └── IMS NSUT Scraping
```
