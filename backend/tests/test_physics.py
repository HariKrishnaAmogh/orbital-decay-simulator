from __future__ import annotations

from api.models import SimulationRequest
from physics.atmosphere import density_kg_m3
from physics.simulation import run_full_simulation
from physics.thermal import sutton_graves_heating_w_cm2

ISS_TLE = """ISS (ZARYA)
1 25544U 98067A   24001.54791667  .00016717  00000+0  30609-3 0  9993
2 25544  51.6416  84.5238 0006703  73.8715  43.4560 15.50000000430000"""


def test_tle_validation_rejects_bad_input():
    try:
        SimulationRequest(tle="not a tle")
    except ValueError as exc:
        assert "TLE" in str(exc)
    else:
        raise AssertionError("Expected validation failure")


def test_atmosphere_density_decreases_with_altitude():
    assert density_kg_m3(100) > density_kg_m3(250) > density_kg_m3(500)


def test_simulation_returns_plausible_iss_state():
    result = run_full_simulation(SimulationRequest(tle=ISS_TLE, duration_days=5, time_step_minutes=360))
    assert result.metadata["satellite_name"] == "ISS (ZARYA)"
    assert 250 < result.decay_timeline[0].altitude_km < 500
    assert 7000 < result.decay_timeline[0].velocity_ms < 8000
    assert result.casualty_expectation.threshold == 0.0001


def test_decay_trend_is_not_increasing_for_low_orbit_drag():
    result = run_full_simulation(
        SimulationRequest(tle=ISS_TLE, duration_days=10, time_step_minutes=720, area_mass_ratio=0.08, f107=250, kp=6)
    )
    assert result.decay_timeline[-1].altitude_km <= result.decay_timeline[0].altitude_km


def test_sutton_graves_heating_positive_near_peak_region():
    heating = sutton_graves_heating_w_cm2(60, 7200, 0.1)
    assert heating > 1

