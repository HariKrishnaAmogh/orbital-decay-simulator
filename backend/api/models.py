from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class FragmentInput(BaseModel):
    name: str = "Bus fragment"
    material: str = "aluminum"
    mass_kg: float = Field(default=12.0, gt=0)
    area_m2: float = Field(default=0.8, gt=0)
    characteristic_radius_m: float = Field(default=0.1, gt=0)


class SimulationRequest(BaseModel):
    tle: str = Field(..., min_length=1)
    satellite_name: str | None = None
    cd: float = Field(default=2.2, gt=0, le=5)
    area_mass_ratio: float = Field(default=0.02, gt=0, le=1)
    mass_kg: float | None = Field(default=420_000, gt=0)
    f107: float = Field(default=150, ge=50, le=350)
    kp: float = Field(default=3, ge=0, le=9)
    duration_days: int = Field(default=365, ge=1, le=3650)
    time_step_minutes: int = Field(default=180, ge=5, le=1440)
    tps_material: str = "aluminum"
    fragments: list[FragmentInput] = Field(default_factory=list)

    @field_validator("tle")
    @classmethod
    def validate_tle_text(cls, value: str) -> str:
        lines = [line.strip() for line in value.splitlines() if line.strip()]
        tle_lines = [line for line in lines if line.startswith(("1 ", "2 "))]
        if len(tle_lines) != 2:
            raise ValueError("TLE must contain one line starting with '1 ' and one line starting with '2 '.")
        if len(tle_lines[0]) < 60 or len(tle_lines[1]) < 60:
            raise ValueError("TLE lines appear too short.")
        return "\n".join(lines)


class TimelinePoint(BaseModel):
    timestamp: datetime
    altitude_km: float
    velocity_ms: float
    latitude_deg: float
    longitude_deg: float
    period_minutes: float


class OrbitPoint(BaseModel):
    x_km: float
    y_km: float
    z_km: float
    altitude_km: float
    timestamp: datetime


class ReentryPoint(BaseModel):
    altitude_km: float
    downrange_km: float
    velocity_ms: float
    g_load: float
    heating_w_cm2: float
    temperature_k: float


class DebrisFragment(BaseModel):
    id: str
    material: str
    initial_mass_kg: float
    surviving_mass_kg: float
    survival_probability: float
    impact_velocity_ms: float
    kinetic_energy_j: float


class CasualtyExpectation(BaseModel):
    ec: float
    threshold: float = 0.0001
    status: Literal["pass", "review", "fail"]
    population_density_km2: float
    footprint_area_km2: float


class SimulationResponse(BaseModel):
    metadata: dict
    decay_timeline: list[TimelinePoint]
    orbit_path: list[OrbitPoint]
    reentry: dict
    thermal: dict
    debris: dict
    casualty_expectation: CasualtyExpectation
    warnings: list[str]
    assumptions_used: list[str]


class TleResponse(BaseModel):
    norad_id: str
    source: str
    tle: str
    fetched_at: datetime


class SpaceWeatherResponse(BaseModel):
    f107: float
    kp: float
    source: str
    fetched_at: datetime
