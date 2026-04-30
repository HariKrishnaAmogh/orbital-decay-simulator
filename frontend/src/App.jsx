import React, { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import Dashboard from "./components/Dashboard.jsx";
import AnalysisPanel from "./components/AnalysisPanel.jsx";
import OrbitalScene from "./components/OrbitalScene.jsx";
import LandingPage from "./components/LandingPage.jsx";
import { decodeShareState, encodeShareState, fetchSpaceWeather, fetchTle, HISTORICAL_PRESETS, runSimulation } from "./api.js";
import { exportSimulationPdf } from "./report.js";

const initialForm = {
  tle: HISTORICAL_PRESETS.ISS.tle,
  satellite_name: "ISS current-style demo",
  norad: "25544",
  cd: 2.2,
  area_mass_ratio: 0.02,
  mass_kg: 420000,
  f107: 150,
  kp: 3,
  duration_days: 365,
  time_step_minutes: 180,
  tps_material: "aluminum",
};

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [constellation, setConstellation] = useState([]);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("sim");
    if (shared) {
      try {
        setForm((current) => ({ ...current, ...decodeShareState(shared) }));
        setShowLanding(false);
      } catch {
        setError("Share URL could not be decoded.");
      }
    }
  }, []);

  useEffect(() => {
    if (!playing || !result?.decay_timeline?.length) return undefined;
    const timer = window.setInterval(() => {
      setTimelineIndex((index) => (index + 1) % result.decay_timeline.length);
    }, 260);
    return () => window.clearInterval(timer);
  }, [playing, result]);

  const currentPoint = result?.decay_timeline?.[timelineIndex];
  const conjunctions = useMemo(() => {
    if (!result || constellation.length === 0) return [];
    return constellation.map((item) => ({
      name: item.metadata.satellite_name,
      missDistanceKm: Math.abs((item.decay_timeline[0]?.altitude_km || 0) - (result.decay_timeline[0]?.altitude_km || 0)).toFixed(1),
    }));
  }, [result, constellation]);

  async function handleRun() {
    setLoading(true);
    setError("");
    try {
      const data = await runSimulation(form);
      setResult(data);
      setTimelineIndex(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchTle() {
    setError("");
    try {
      const data = await fetchTle(form.norad);
      setForm((current) => ({ ...current, tle: data.tle, satellite_name: `NORAD ${data.norad_id}` }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSpaceWeather() {
    try {
      const data = await fetchSpaceWeather();
      setForm((current) => ({ ...current, f107: data.f107, kp: data.kp }));
    } catch {
      setError("Space weather fallback remains active.");
    }
  }

  function handleShare() {
    const encoded = encodeShareState(form);
    const url = `${window.location.origin}${window.location.pathname}?sim=${encoded}`;
    navigator.clipboard?.writeText(url);
    window.history.replaceState(null, "", url);
  }

  async function addConstellationMember() {
    const data = await runSimulation({ ...form, satellite_name: `${form.satellite_name || "Object"} comparison` });
    setConstellation((items) => [...items.slice(-2), data]);
  }

  if (showLanding) {
    return <LandingPage onLaunch={() => setShowLanding(false)} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Orbital Decay Simulator</h1>
          <span>{result?.metadata?.satellite_name || form.satellite_name}</span>
        </div>
        <div className="readouts">
          <span>{currentPoint ? `${currentPoint.altitude_km.toFixed(0)} km` : "Altitude"}</span>
          <span>{currentPoint ? `${currentPoint.velocity_ms.toFixed(0)} m/s` : "Velocity"}</span>
          <span className={error ? "badge error" : "badge"}>{error || (loading ? "Running" : "Ready")}</span>
        </div>
      </header>
      <div className="workbench">
        <Dashboard
          form={form}
          setForm={setForm}
          onRun={handleRun}
          onFetchTle={handleFetchTle}
          onSpaceWeather={handleSpaceWeather}
          onShare={handleShare}
          onExport={() => exportSimulationPdf(result)}
          loading={loading}
          result={result}
        />
        <section className="viewport">
          <OrbitalScene result={result} timelineIndex={timelineIndex} />
          <div className="timeline">
            <button onClick={() => setPlaying((value) => !value)}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <input
              type="range"
              min="0"
              max={Math.max(0, (result?.decay_timeline?.length || 1) - 1)}
              value={timelineIndex}
              onChange={(event) => setTimelineIndex(Number(event.target.value))}
            />
            <span>{currentPoint ? new Date(currentPoint.timestamp).toLocaleString() : "No timeline"}</span>
          </div>
          <div className="constellation">
            <button onClick={addConstellationMember} disabled={!form.tle || loading}>Add comparison object</button>
            {conjunctions.map((item) => (
              <span key={item.name}>{item.name}: {item.missDistanceKm} km altitude separation</span>
            ))}
          </div>
        </section>
        <AnalysisPanel result={result} />
      </div>
    </main>
  );
}
