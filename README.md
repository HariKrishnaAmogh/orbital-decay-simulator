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

Open the project in VSCode from the repository root:

```powershell
code .
```

### Backend

```powershell
cd backend
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
cd frontend
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
cd backend
.\.venv\Scripts\python.exe -m pytest
```

Expected:

```text
7 passed
```

Frontend:

```powershell
cd frontend
npm.cmd run build
```

Expected:

```text
✓ built
```

## Notes And Limitations

- Celestrak and NOAA calls use live data when available.
- If live fetches fail, the app uses demo/fallback values.
- WorldPop-scale population rasters are not bundled; Ec uses a documented local
  latitude-based population fallback.
- Re-entry and debris calculations are credible approximations for demo use,
  not certified regulatory tools.
