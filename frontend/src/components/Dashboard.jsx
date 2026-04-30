import { Activity, CloudSun, Download, Play, RadioTower, Share2 } from "lucide-react";
import React from "react";
import { HISTORICAL_PRESETS } from "../api.js";

export default function Dashboard({
  form,
  setForm,
  onRun,
  onFetchTle,
  onSpaceWeather,
  onShare,
  onExport,
  loading,
  result,
}) {
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const applyPreset = (key) => {
    const preset = HISTORICAL_PRESETS[key];
    setForm((current) => ({
      ...current,
      tle: preset.tle,
      satellite_name: preset.label,
      norad: preset.norad,
      area_mass_ratio: preset.area_mass_ratio,
      mass_kg: preset.mass_kg,
    }));
  };

  return (
    <aside className="left-panel">
      <div className="panel-section">
        <label>Preset</label>
        <select onChange={(event) => applyPreset(event.target.value)} defaultValue="ISS">
          {Object.entries(HISTORICAL_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>{preset.label}</option>
          ))}
        </select>
      </div>
      <div className="panel-section">
        <label>TLE</label>
        <textarea value={form.tle} onChange={(event) => setValue("tle", event.target.value)} spellCheck="false" />
      </div>
      <div className="inline-fields">
        <label>
          NORAD
          <input value={form.norad} onChange={(event) => setValue("norad", event.target.value)} />
        </label>
        <button title="Fetch TLE" onClick={onFetchTle}><RadioTower size={17} /></button>
      </div>
      <div className="grid-fields">
        <label>Cd<input type="number" step="0.1" value={form.cd} onChange={(e) => setValue("cd", Number(e.target.value))} /></label>
        <label>A/m<input type="number" step="0.005" value={form.area_mass_ratio} onChange={(e) => setValue("area_mass_ratio", Number(e.target.value))} /></label>
        <label>Mass kg<input type="number" value={form.mass_kg} onChange={(e) => setValue("mass_kg", Number(e.target.value))} /></label>
        <label>Days<input type="number" value={form.duration_days} onChange={(e) => setValue("duration_days", Number(e.target.value))} /></label>
        <label>F10.7<input type="number" value={form.f107} onChange={(e) => setValue("f107", Number(e.target.value))} /></label>
        <label>Kp<input type="number" step="0.5" value={form.kp} onChange={(e) => setValue("kp", Number(e.target.value))} /></label>
      </div>
      <div className="panel-section">
        <label>TPS material</label>
        <select value={form.tps_material} onChange={(e) => setValue("tps_material", e.target.value)}>
          <option value="aluminum">Aluminum</option>
          <option value="steel">Steel</option>
          <option value="titanium">Titanium</option>
          <option value="carbon phenolic">Carbon phenolic</option>
          <option value="pica">PICA</option>
        </select>
      </div>
      <div className="actions">
        <button className="primary" onClick={onRun} disabled={loading}><Play size={17} />{loading ? "Running" : "Run"}</button>
        <button onClick={onSpaceWeather}><CloudSun size={17} /></button>
        <button onClick={onShare}><Share2 size={17} /></button>
        <button onClick={onExport} disabled={!result}><Download size={17} /></button>
      </div>
      <div className="status-card">
        <Activity size={18} />
        <div>
          <strong>{result ? "Simulation loaded" : "Ready"}</strong>
          <span>{result?.warnings?.[0] || "Awaiting run parameters"}</span>
        </div>
      </div>
    </aside>
  );
}
