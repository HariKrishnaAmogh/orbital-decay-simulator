from __future__ import annotations

from datetime import timedelta
from math import exp

from api.models import OrbitPoint, SimulationRequest, TimelinePoint
from physics.atmosphere import density_kg_m3
from physics.constants import EARTH_RADIUS_KM
from physics.propagator import epoch_datetime, propagate_state, satellite_from_tle, state_to_point


def estimate_decay_delta_km(altitude_km: float, velocity_ms: float, dt_seconds: float, request: SimulationRequest) -> float:
    rho = density_kg_m3(altitude_km, f107=request.f107, kp=request.kp)
    drag_accel = 0.5 * request.cd * request.area_mass_ratio * rho * velocity_ms**2
    solar_multiplier = 1.0 + (request.f107 - 150.0) / 350.0 + request.kp / 20.0
    altitude_multiplier = exp(max(0.0, 400.0 - altitude_km) / 95.0)
    return max(0.0, drag_accel * dt_seconds / 1000.0 * 0.035 * solar_multiplier * altitude_multiplier)


def generate_decay(request: SimulationRequest) -> tuple[str | None, list[TimelinePoint], list[OrbitPoint], list[str]]:
    name, satellite = satellite_from_tle(request.tle)
    start = epoch_datetime(satellite)
    warnings: list[str] = []
    timeline: list[TimelinePoint] = []
    orbit_path: list[OrbitPoint] = []
    accumulated_decay = 0.0
    step = timedelta(minutes=request.time_step_minutes)
    steps = int((request.duration_days * 24 * 60) / request.time_step_minutes)

    for index in range(max(2, steps + 1)):
        when = start + step * index
        position, velocity = propagate_state(satellite, when)
        point = state_to_point(position, velocity, when)
        if index > 0:
            accumulated_decay += estimate_decay_delta_km(
                point["altitude_km"] - accumulated_decay,
                point["velocity_ms"],
                request.time_step_minutes * 60,
                request,
            )
        point["altitude_km"] = max(0.0, point["altitude_km"] - accumulated_decay)
        if timeline:
            min_visible_drop = max(0.005, accumulated_decay * 0.002)
            point["altitude_km"] = max(0.0, min(point["altitude_km"], timeline[-1].altitude_km - min_visible_drop))
        scale = (EARTH_RADIUS_KM + point["altitude_km"]) / max(EARTH_RADIUS_KM, (position @ position) ** 0.5)
        adjusted_position = position * scale
        timeline.append(TimelinePoint(**point))
        orbit_path.append(
            OrbitPoint(
                x_km=float(adjusted_position[0]),
                y_km=float(adjusted_position[1]),
                z_km=float(adjusted_position[2]),
                altitude_km=point["altitude_km"],
                timestamp=when,
            )
        )
        if point["altitude_km"] <= 80:
            warnings.append("Simulation terminated after reaching 80 km re-entry stop altitude.")
            break

    if timeline[-1].altitude_km > 120:
        warnings.append("Object did not reach the 120 km entry interface within the requested duration.")
    return name, timeline, orbit_path, warnings
