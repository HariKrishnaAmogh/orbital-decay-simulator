from __future__ import annotations

from datetime import datetime, timezone

from api.models import FragmentInput, SimulationRequest, SimulationResponse
from physics.casualty import casualty_expectation, survival_for_fragment
from physics.decay import generate_decay
from physics.reentry import simulate_reentry


DEFAULT_FRAGMENTS = [
    FragmentInput(name="Avionics box", material="aluminum", mass_kg=18, area_m2=0.6, characteristic_radius_m=0.12),
    FragmentInput(name="Tank shell", material="titanium", mass_kg=42, area_m2=1.2, characteristic_radius_m=0.18),
    FragmentInput(name="Reaction wheel", material="steel", mass_kg=9, area_m2=0.25, characteristic_radius_m=0.08),
]


def run_full_simulation(request: SimulationRequest) -> SimulationResponse:
    detected_name, timeline, orbit_path, warnings = generate_decay(request)
    satellite_name = request.satellite_name or detected_name or "Unknown satellite"
    entry = next((point for point in timeline if point.altitude_km <= 120), timeline[-1])
    reentry = simulate_reentry(entry, request.tps_material)
    fragments = request.fragments or DEFAULT_FRAGMENTS
    impact_velocity = float(reentry["trajectory"][-1]["velocity_ms"])
    survived = [
        survival_for_fragment(fragment, float(reentry["peak_temperature_k"]), impact_velocity)
        for fragment in fragments
    ]
    ec = casualty_expectation(fragments, survived, entry.latitude_deg)
    assumptions = [
        "NRLMSISE-00 is used when import and runtime calls succeed; otherwise an exponential atmosphere fallback is used.",
        "Decay applies an SGP4 state vector plus a deterministic drag-driven altitude correction for demo responsiveness.",
        "Population density uses a local latitude-based fallback instead of large WorldPop rasters.",
        "Re-entry is an engineering approximation, not certified 6-DOF mission analysis.",
    ]
    thermal = {
        "tps_material": reentry["tps_material"],
        "material_limit_k": reentry["material_limit_k"],
        "peak_heating_w_cm2": reentry["peak_heating_w_cm2"],
        "peak_temperature_k": reentry["peak_temperature_k"],
        "heating_curve": reentry["trajectory"],
    }
    debris = {
        "fragments": [fragment.model_dump() for fragment in survived],
        "surviving_mass_kg": sum(fragment.surviving_mass_kg for fragment in survived),
        "initial_mass_kg": sum(fragment.initial_mass_kg for fragment in survived),
    }
    return SimulationResponse(
        metadata={
            "satellite_name": satellite_name,
            "generated_at": datetime.now(timezone.utc),
            "input": request.model_dump(exclude={"tle"}),
            "entry_reached": entry.altitude_km <= 120,
        },
        decay_timeline=timeline,
        orbit_path=orbit_path,
        reentry=reentry,
        thermal=thermal,
        debris=debris,
        casualty_expectation=ec,
        warnings=warnings,
        assumptions_used=assumptions,
    )

