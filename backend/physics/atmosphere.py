from __future__ import annotations

from datetime import datetime
from math import exp

try:
    from nrlmsise00 import msise_model
except Exception:  # pragma: no cover - optional dependency
    msise_model = None


def density_kg_m3(altitude_km: float, when: datetime | None = None, f107: float = 150, kp: float = 3) -> float:
    altitude_km = max(0.0, float(altitude_km))
    if msise_model and when:
        try:
            output = msise_model(when, altitude_km, 0, 0, f107, f107, kp)
            density = float(output[0][5])
            if density > 0:
                return density
        except Exception:
            pass

    if altitude_km < 25:
        return 1.225 * exp(-altitude_km / 7.2)
    if altitude_km < 120:
        return 3.0e-4 * exp(-(altitude_km - 25) / 8.5)
    solar_factor = 1.0 + (f107 - 150.0) / 500.0 + kp / 60.0
    return max(1e-15, 2.5e-10 * solar_factor * exp(-(altitude_km - 200.0) / 55.0))

