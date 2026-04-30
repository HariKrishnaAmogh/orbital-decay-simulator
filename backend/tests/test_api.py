from __future__ import annotations

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_simulate_validation_error():
    response = client.post("/api/simulate", json={"tle": "bad"})
    assert response.status_code == 422

