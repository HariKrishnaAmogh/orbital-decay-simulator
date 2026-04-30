from __future__ import annotations

from datetime import datetime, timedelta, timezone

import httpx

from api.models import SpaceWeatherResponse

_cache: SpaceWeatherResponse | None = None
_cache_expires = datetime.min.replace(tzinfo=timezone.utc)


async def get_space_weather() -> SpaceWeatherResponse:
    global _cache, _cache_expires
    now = datetime.now(timezone.utc)
    if _cache and now < _cache_expires:
        return _cache

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            kp_resp = await client.get("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json")
            kp_resp.raise_for_status()
            kp_rows = kp_resp.json()
        latest = kp_rows[-1]
        kp = float(latest[-1])
        result = SpaceWeatherResponse(f107=150.0, kp=kp, source="NOAA SWPC Kp + default F10.7", fetched_at=now)
    except Exception:
        result = SpaceWeatherResponse(f107=150.0, kp=3.0, source="Deterministic fallback", fetched_at=now)

    _cache = result
    _cache_expires = now + timedelta(hours=1)
    return result

