# Orbital Decay Simulator & Re-Entry Planner

The Orbital Decay Simulator is a full-stack aerospace engineering demo for
modeling satellite orbital decay, re-entry heating, debris survival, casualty
expectation, and 3D trajectory visualization.

It includes:

- A Python/FastAPI backend for TLE propagation, atmospheric drag, thermal
  analysis, debris modeling, and Ec calculation.
- A React/Vite/Three.js frontend with a landing page, simulator dashboard,
  interactive globe, charts, reports, and shareable simulation URLs.
- Local fallbacks for live services so the demo remains usable without paid
  accounts or large external datasets.

This is an educational and challenge-demo project, not certified mission
analysis software.

## Project Structure

```text
backend/
  api/                 FastAPI app, routes, and Pydantic schemas
  data/                Celestrak and NOAA space-weather clients
  physics/             Propagation, atmosphere, decay, re-entry, debris, Ec
  tests/               Backend pytest suite

frontend/
  src/                 React app, landing page, simulator UI, Three.js scene
  index.html           Vite entrypoint
  vite.config.js       React/Vite config

notebooks/
  validate_vs_iss.ipynb
```

## What The App Does

1. Accepts pasted TLE text or fetches a public TLE by NORAD catalog ID.
2. Propagates the orbit using SGP4.
3. Applies drag-driven altitude decay using atmosphere density estimates.
4. Builds a decay timeline and 3D orbit path.
5. Estimates re-entry heating with Sutton-Graves-style calculations.
6. Compares TPS materials.
7. Estimates debris survival and impact kinetic energy.
8. Computes casualty expectation against the `1e-4` regulatory threshold.
9. Visualizes the scenario with a Three.js Earth scene, charts, tabs, timeline
   scrubber, footprint display, and PDF export.

## Requirements

Local development:

- Python 3.11+
- Node.js 18+; Node 22 is fine
- npm

Optional:

- Space-Track credentials for future authenticated extensions
- Live internet access for Celestrak and NOAA data

The app works without optional services by using deterministic fallbacks.

## Local Setup

Open the project in VSCode:

```powershell
code "C:\Personal Projects\Codex Challenge"
```

### Backend

```powershell
cd "C:\Personal Projects\Codex Challenge\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```text
http://127.0.0.1:8000/api/health
```

Expected:

```json
{"status":"ok"}
```

### Frontend

Open a second terminal:

```powershell
cd "C:\Personal Projects\Codex Challenge\frontend"
npm install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

If PowerShell blocks `npm`, use `npm.cmd` instead.

## How To Use The Website

When the site first opens, it shows a landing page with a short explanation of
the simulator and the recommended demo flow.

1. Click `Launch Simulator`.
2. Keep the default ISS preset or choose GOCE/Tiangong-1.
3. Paste a TLE or fetch one by NORAD ID.
4. Adjust parameters:
   - `Cd`: drag coefficient
   - `A/m`: area-to-mass ratio
   - `Mass kg`: object mass
   - `Days`: simulation horizon
   - `F10.7`: solar flux
   - `Kp`: geomagnetic index
   - `TPS material`: re-entry material assumption
5. Click `Run`.
6. Use the timeline slider or play button to scrub through the orbit.
7. Inspect the right-panel tabs:
   - `decay`: altitude decay chart
   - `reentry`: heating and footprint details
   - `debris`: fragment survival table
   - `ec`: casualty expectation gauge
8. Click the cloud/sun icon to fetch live/fallback space-weather values.
9. Click the share icon to encode the current inputs in the URL.
10. Click the download icon after a run to export a PDF report.

## Useful Demo Inputs

ISS:

```text
NORAD ID: 25544
```

GOCE and Tiangong-1 are included as historical validation presets in the
frontend.

## Test Commands

Backend:

```powershell
cd "C:\Personal Projects\Codex Challenge\backend"
.\.venv\Scripts\python.exe -m pytest
```

Expected:

```text
7 passed
```

Frontend:

```powershell
cd "C:\Personal Projects\Codex Challenge\frontend"
npm.cmd run build
```

Expected:

```text
✓ built
```

## Manual Test Checklist

- Landing page loads on first visit.
- `Launch Simulator` opens the simulator interface.
- ISS preset appears by default.
- `Run` produces charts, timeline data, debris output, and Ec gauge.
- The 3D scene shows Earth, atmosphere, orbit trail, and satellite marker.
- Timeline slider updates date, altitude, velocity, and marker position.
- Re-entry tab shows heating and footprint data.
- Debris tab lists surviving fragment estimates.
- Ec tab shows pass/review/fail threshold status.
- NORAD fetch works for `25544`, or falls back cleanly.
- Space-weather button updates F10.7/Kp or keeps fallback values.
- Share button updates the URL.
- Reloading a shared URL restores the form state.
- PDF export downloads a readable report.
- Mobile/narrow layout stacks panels cleanly.

## Push To GitHub

Create an empty GitHub repository first, then run:

```powershell
cd "C:\Personal Projects\Codex Challenge"
git init
git add .
git commit -m "Initial orbital decay simulator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/orbital-decay-simulator.git
git push -u origin main
```

Replace `YOUR_USERNAME` and repo name as needed.

## Deploy Backend On Render

Create a new Render Web Service from the GitHub repo.

Settings:

```text
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

After deploy, test:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

Expected:

```json
{"status":"ok"}
```

## Deploy Frontend On Vercel

Create a new Vercel project from the same GitHub repo.

Settings:

```text
Framework Preset: Vite
Root Directory: frontend
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Add this Vercel environment variable:

```text
VITE_API_BASE=https://YOUR-RENDER-SERVICE.onrender.com
```

Deploy.

## CORS For Production

The backend must allow your Vercel frontend origin.

In `backend/api/main.py`, update `allow_origins`:

```python
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://YOUR-VERCEL-APP.vercel.app",
]
```

Commit and push:

```powershell
git add backend/api/main.py
git commit -m "Allow deployed frontend origin"
git push
```

Render should redeploy automatically.

## Deployment Smoke Test

After Render and Vercel are both deployed:

1. Open the Vercel URL.
2. Click `Launch Simulator`.
3. Click `Run`.
4. Open browser DevTools.
5. Confirm requests go to the Render backend URL.
6. Confirm there are no CORS errors.
7. Verify charts, globe, timeline, debris report, Ec gauge, share URL, and PDF
   export.

## Notes And Limitations

- Celestrak and NOAA calls use live data when available.
- If live fetches fail, the app uses demo/fallback values.
- WorldPop-scale population rasters are not bundled; Ec uses a documented local
  latitude-based population fallback.
- Re-entry and debris calculations are credible approximations for demo use,
  not certified regulatory tools.

