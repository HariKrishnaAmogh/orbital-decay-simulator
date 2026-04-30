from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.models import SimulationRequest, SimulationResponse, SpaceWeatherResponse, TleResponse
from data.space_weather import get_space_weather
from data.tle_fetcher import fetch_celestrak_tle
from physics.simulation import run_full_simulation

app = FastAPI(
    title="Orbital Decay Simulator API",
    version="1.0.0",
    description="Orbital decay, re-entry, debris survival, and casualty expectation API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/simulate", response_model=SimulationResponse)
def simulate(request: SimulationRequest) -> SimulationResponse:
    try:
        return run_full_simulation(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/api/tle/celestrak/{norad_id}", response_model=TleResponse)
async def celestrak_tle(norad_id: str) -> TleResponse:
    try:
        return await fetch_celestrak_tle(norad_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/api/space-weather", response_model=SpaceWeatherResponse)
async def space_weather() -> SpaceWeatherResponse:
    return await get_space_weather()

