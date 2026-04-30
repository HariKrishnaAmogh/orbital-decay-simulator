import React, { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "";
}

export default function AnalysisPanel({ result }) {
  const [tab, setTab] = useState("decay");
  const chartData = useMemo(() => {
    return (result?.decay_timeline || []).map((point, index) => ({
      index,
      date: formatDate(point.timestamp),
      altitude: Math.round(point.altitude_km),
      velocity: Math.round(point.velocity_ms),
    }));
  }, [result]);
  const heatingData = result?.thermal?.heating_curve || [];
  const ec = result?.casualty_expectation;
  const fragments = result?.debris?.fragments || [];

  return (
    <aside className="right-panel">
      <div className="tabs">
        {["decay", "reentry", "debris", "ec"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {!result && <div className="empty">Run a simulation to populate analysis output.</div>}
      {result && tab === "decay" && (
        <section>
          <div className="metric">
            <span>Predicted entry</span>
            <strong>{formatDate(result.decay_timeline.at(-1)?.timestamp)}</strong>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="altitude" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#59d6ff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#59d6ff" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#213047" />
              <XAxis dataKey="date" minTickGap={32} />
              <YAxis />
              <Tooltip />
              <Area dataKey="altitude" stroke="#59d6ff" fill="url(#altitude)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      )}
      {result && tab === "reentry" && (
        <section>
          <div className="metric-row">
            <div className="metric"><span>Peak heat</span><strong>{result.thermal.peak_heating_w_cm2.toFixed(1)} W/cm2</strong></div>
            <div className="metric"><span>Peak temp</span><strong>{result.thermal.peak_temperature_k.toFixed(0)} K</strong></div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={heatingData}>
              <CartesianGrid stroke="#213047" />
              <XAxis dataKey="altitude_km" reversed />
              <YAxis />
              <Tooltip />
              <Line dataKey="heating_w_cm2" stroke="#ffb454" dot={false} strokeWidth={2} />
              <Line dataKey="temperature_k" stroke="#ff5d73" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div className="footprint">
            <div />
            <span>{result.reentry.footprint.major_axis_km} x {result.reentry.footprint.minor_axis_km} km footprint</span>
          </div>
        </section>
      )}
      {result && tab === "debris" && (
        <section>
          <div className="metric"><span>Surviving mass</span><strong>{result.debris.surviving_mass_kg.toFixed(1)} kg</strong></div>
          <table>
            <thead><tr><th>Fragment</th><th>Mass</th><th>Impact</th></tr></thead>
            <tbody>
              {fragments.map((fragment) => (
                <tr key={fragment.id}>
                  <td>{fragment.material}</td>
                  <td>{fragment.surviving_mass_kg.toFixed(1)} kg</td>
                  <td>{fragment.impact_velocity_ms.toFixed(0)} m/s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {result && tab === "ec" && (
        <section>
          <div className={`ec-gauge ${ec.status}`}>
            <strong>{Number(ec.ec).toExponential(3)}</strong>
            <span>{ec.status.toUpperCase()}</span>
          </div>
          <div className="metric-row">
            <div className="metric"><span>Threshold</span><strong>{ec.threshold}</strong></div>
            <div className="metric"><span>Population</span><strong>{ec.population_density_km2}/km2</strong></div>
          </div>
        </section>
      )}
    </aside>
  );
}
