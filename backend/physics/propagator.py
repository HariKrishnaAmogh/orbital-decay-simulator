from __future__ import annotations

from datetime import datetime, timedelta, timezone
from math import atan2, asin, degrees, pi, sqrt

import numpy as np
from sgp4.api import Satrec, jday

from physics.constants import EARTH_MU_KM3_S2, EARTH_RADIUS_KM


def split_tle(tle: str) -> tuple[str | None, str, str]:
    lines = [line.strip() for line in tle.splitlines() if line.strip()]
    tle_lines = [line for line in lines if line.startswith(("1 ", "2 "))]
    if len(tle_lines) != 2:
        raise ValueError("Expected exactly two TLE element lines.")
    name = next((line for line in lines if not line.startswith(("1 ", "2 "))), None)
    return name, tle_lines[0], tle_lines[1]


def satellite_from_tle(tle: str) -> tuple[str | None, Satrec]:
    name, line1, line2 = split_tle(tle)
    satellite = Satrec.twoline2rv(line1, line2)
    return name, satellite


def epoch_datetime(satellite: Satrec) -> datetime:
    year = satellite.epochyr + (2000 if satellite.epochyr < 57 else 1900)
    start = datetime(year, 1, 1, tzinfo=timezone.utc)
    return start + timedelta(days=float(satellite.epochdays) - 1)


def propagate_state(satellite: Satrec, when: datetime) -> tuple[np.ndarray, np.ndarray]:
    when = when.astimezone(timezone.utc)
    jd, fr = jday(when.year, when.month, when.day, when.hour, when.minute, when.second + when.microsecond / 1e6)
    error, position_km, velocity_km_s = satellite.sgp4(jd, fr)
    if error != 0:
        raise ValueError(f"SGP4 propagation failed with error code {error}.")
    return np.array(position_km, dtype=float), np.array(velocity_km_s, dtype=float)


def state_to_point(position_km: np.ndarray, velocity_km_s: np.ndarray, when: datetime) -> dict:
    radius = float(np.linalg.norm(position_km))
    altitude = radius - EARTH_RADIUS_KM
    velocity = float(np.linalg.norm(velocity_km_s) * 1000.0)
    lat = degrees(asin(float(position_km[2]) / radius))
    lon = degrees(atan2(float(position_km[1]), float(position_km[0])))
    period = 2 * pi * sqrt(max(radius, EARTH_RADIUS_KM) ** 3 / EARTH_MU_KM3_S2) / 60
    return {
        "timestamp": when,
        "altitude_km": altitude,
        "velocity_ms": velocity,
        "latitude_deg": lat,
        "longitude_deg": lon,
        "period_minutes": period,
    }

