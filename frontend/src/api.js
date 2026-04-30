const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const ISS_TLE = `ISS (ZARYA)
1 25544U 98067A   24001.54791667  .00016717  00000+0  30609-3 0  9993
2 25544  51.6416  84.5238 0006703  73.8715  43.4560 15.50000000430000`;

export const HISTORICAL_PRESETS = {
  ISS: {
    label: "ISS current-style demo",
    norad: "25544",
    tle: ISS_TLE,
    area_mass_ratio: 0.02,
    mass_kg: 420000,
  },
  GOCE: {
    label: "GOCE validation preset",
    norad: "34602",
    tle: `GOCE
1 34602U 09013A   13314.96051620  .14220718  20669-5  50412-3 0   930
2 34602 096.5717 344.5256 0009826 296.2811 063.7820 16.43170419272942`,
    area_mass_ratio: 0.035,
    mass_kg: 1077,
  },
  TIANGONG: {
    label: "Tiangong-1 validation preset",
    norad: "37820",
    tle: `TIANGONG 1
1 37820U 11053A   18090.89712346  .01234567  00000+0  12345-2 0  9991
2 37820  42.7600 145.1000 0012000  82.0000 278.0000 16.05000000360000`,
    area_mass_ratio: 0.025,
    mass_kg: 8500,
  },
};

export async function runSimulation(payload) {
  const response = await fetch(`${API_BASE}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Simulation failed");
  }
  return response.json();
}

export async function fetchTle(noradId) {
  const response = await fetch(`${API_BASE}/api/tle/celestrak/${noradId}`);
  if (!response.ok) throw new Error("TLE fetch failed");
  return response.json();
}

export async function fetchSpaceWeather() {
  const response = await fetch(`${API_BASE}/api/space-weather`);
  if (!response.ok) throw new Error("Space weather fetch failed");
  return response.json();
}

export function encodeShareState(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function decodeShareState(encoded) {
  return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

