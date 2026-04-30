from __future__ import annotations

from math import exp

from api.models import ReentryPoint, TimelinePoint
from physics.constants import G0
from physics.thermal import material_for, stagnation_temperature_k, sutton_graves_heating_w_cm2


def simulate_reentry(entry: TimelinePoint, tps_material: str) -> dict:
    material = material_for(tps_material)
    points: list[ReentryPoint] = []
    entry_velocity = max(entry.velocity_ms, 7600.0)
    downrange = 0.0
    previous_alt = 120.0

    for altitude in [120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0]:
        velocity = max(180.0, entry_velocity * exp(-(120 - altitude) / 88.0))
        heating = sutton_graves_heating_w_cm2(altitude, velocity)
        temperature = stagnation_temperature_k(heating, material.emissivity)
        g_load = max(0.0, min(16.0, (entry_velocity - velocity) / max(1.0, (120 - altitude + 1) * 18.0)))
        downrange += max(0.0, previous_alt - altitude) * max(1.0, velocity / 1700.0)
        previous_alt = altitude
        points.append(
            ReentryPoint(
                altitude_km=altitude,
                downrange_km=downrange,
                velocity_ms=velocity,
                g_load=g_load,
                heating_w_cm2=heating,
                temperature_k=temperature,
            )
        )

    peak = max(points, key=lambda item: item.heating_w_cm2)
    return {
        "entry_interface": entry.model_dump(),
        "trajectory": [point.model_dump() for point in points],
        "peak_heating_w_cm2": peak.heating_w_cm2,
        "peak_temperature_k": peak.temperature_k,
        "peak_g_load": max(point.g_load for point in points),
        "footprint": {
            "center_lat_deg": entry.latitude_deg,
            "center_lon_deg": entry.longitude_deg,
            "major_axis_km": 1700,
            "minor_axis_km": 240,
            "confidence": 0.9,
        },
        "tps_material": material.name,
        "material_limit_k": material.melt_k,
    }

