from __future__ import annotations

from math import pi

from api.models import CasualtyExpectation, DebrisFragment, FragmentInput
from physics.constants import EARTH_SURFACE_AREA_KM2
from physics.thermal import material_for


def survival_for_fragment(fragment: FragmentInput, peak_temperature_k: float, impact_velocity_ms: float) -> DebrisFragment:
    material = material_for(fragment.material)
    thermal_margin = material.melt_k / max(peak_temperature_k, 1)
    survival_probability = max(0.02, min(0.98, thermal_margin * 0.55))
    surviving_mass = fragment.mass_kg * survival_probability
    kinetic = 0.5 * surviving_mass * impact_velocity_ms**2
    return DebrisFragment(
        id=fragment.name.lower().replace(" ", "-"),
        material=material.name,
        initial_mass_kg=fragment.mass_kg,
        surviving_mass_kg=surviving_mass,
        survival_probability=survival_probability,
        impact_velocity_ms=impact_velocity_ms,
        kinetic_energy_j=kinetic,
    )


def casualty_expectation(fragments: list[FragmentInput], survived: list[DebrisFragment], latitude_deg: float) -> CasualtyExpectation:
    density = 18.0 if abs(latitude_deg) < 55 else 4.0
    footprint_area = 3.14159 * 850 * 120
    casualty_radius_m = 1.2
    casualty_area_km2 = 0.0
    for source, result in zip(fragments, survived):
        projected = source.area_m2 / 1_000_000.0
        casualty = pi * casualty_radius_m**2 / 1_000_000.0
        casualty_area_km2 += (projected + casualty) * result.survival_probability
    ec = casualty_area_km2 / EARTH_SURFACE_AREA_KM2 * density * footprint_area
    status = "pass" if ec < 0.0001 else "review" if ec < 0.001 else "fail"
    return CasualtyExpectation(
        ec=ec,
        status=status,
        population_density_km2=density,
        footprint_area_km2=footprint_area,
    )

