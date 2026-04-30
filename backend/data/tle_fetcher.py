from __future__ import annotations

from datetime import datetime, timezone

import httpx

from api.models import TleResponse

_cache: dict[str, TleResponse] = {}

DEMO_TLES = {
    "25544": """ISS (ZARYA)
1 25544U 98067A   24001.54791667  .00016717  00000+0  30609-3 0  9993
2 25544  51.6416  84.5238 0006703  73.8715  43.4560 15.50000000430000""",
    "43013": """TIANGONG 1
1 37820U 11053A   18090.89712346  .01234567  00000+0  12345-2 0  9991
2 37820  42.7600 145.1000 0012000  82.0000 278.0000 16.05000000360000""",
}


async def fetch_celestrak_tle(norad_id: str) -> TleResponse:
    if norad_id in _cache:
        return _cache[norad_id]

    url = f"https://celestrak.org/NORAD/elements/gp.php?CATNR={norad_id}&FORMAT=TLE"
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(url)
            response.raise_for_status()
            text = response.text.strip()
        if "No GP data found" in text or len(text.splitlines()) < 2:
            raise RuntimeError(f"No Celestrak TLE found for NORAD ID {norad_id}.")
        source = "Celestrak"
    except Exception:
        if norad_id not in DEMO_TLES:
            raise RuntimeError(f"Unable to fetch Celestrak TLE for NORAD ID {norad_id}.")
        text = DEMO_TLES[norad_id]
        source = "Demo fallback"

    result = TleResponse(
        norad_id=norad_id,
        source=source,
        tle=text,
        fetched_at=datetime.now(timezone.utc),
    )
    _cache[norad_id] = result
    return result

