from __future__ import annotations

from dataclasses import dataclass
from math import sqrt

from physics.atmosphere import density_kg_m3


@dataclass(frozen=True)
class Material:
    name: str
    melt_k: float
    heat_of_ablation_j_kg: float
    emissivity: float


MATERIALS = {
    "aluminum": Material("Aluminum", 933, 1.05e7, 0.25),
    "steel": Material("Steel", 1800, 6.8e6, 0.35),
    "titanium": Material("Titanium", 1941, 9.7e6, 0.3),
    "carbon phenolic": Material("Carbon phenolic", 3900, 3.0e7, 0.85),
    "pica": Material("PICA", 3600, 2.6e7, 0.9),
}


def material_for(name: str) -> Material:
    return MATERIALS.get(name.lower(), MATERIALS["aluminum"])


def sutton_graves_heating_w_cm2(altitude_km: float, velocity_ms: float, nose_radius_m: float = 0.1) -> float:
    rho = density_kg_m3(altitude_km)
    q_w_m2 = 1.83e-4 * sqrt(max(rho, 1e-15) / max(nose_radius_m, 1e-3)) * velocity_ms**3
    return q_w_m2 / 10_000.0


def stagnation_temperature_k(heating_w_cm2: float, emissivity: float = 0.8) -> float:
    sigma = 5.670374419e-8
    q_w_m2 = heating_w_cm2 * 10_000.0
    return (max(q_w_m2, 1.0) / (max(emissivity, 0.1) * sigma)) ** 0.25

