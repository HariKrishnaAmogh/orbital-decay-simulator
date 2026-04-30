import React from "react";
import { Activity, ArrowRight, FileDown, Gauge, Globe2, RadioTower, Satellite, ShieldCheck } from "lucide-react";

const features = [
  { icon: Satellite, title: "TLE-driven orbit propagation", text: "Paste a real TLE or fetch by NORAD ID, then simulate orbital decay from that state." },
  { icon: Globe2, title: "Interactive 3D scene", text: "Scrub a timeline across Earth, orbit trails, re-entry corridor, and footprint visualization." },
  { icon: Gauge, title: "Re-entry and debris analysis", text: "Estimate heating, TPS behavior, fragment survival, impact energy, and Ec threshold status." },
  { icon: FileDown, title: "Share and export", text: "Encode simulation inputs in the URL and download a concise PDF report after each run." },
];

const steps = [
  "Launch the simulator and keep the ISS preset, or choose GOCE/Tiangong-1.",
  "Paste a TLE or fetch NORAD 25544 from the public Celestrak endpoint.",
  "Adjust drag, mass, solar flux, Kp, and TPS material assumptions.",
  "Run the model, scrub the timeline, then inspect decay, re-entry, debris, and Ec tabs.",
];

export default function LandingPage({ onLaunch }) {
  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="hero-media" aria-hidden="true">
          <div className="hero-earth" />
          <div className="hero-orbit orbit-a" />
          <div className="hero-orbit orbit-b" />
          <div className="hero-satellite" />
          <div className="hero-plasma" />
        </div>
        <div className="hero-copy">
          <div className="eyebrow"><RadioTower size={16} /> Orbital decay and re-entry planner</div>
          <h1>Orbital Decay Simulator</h1>
          <p>
            Model a satellite from live TLE input through orbital decay, re-entry heating,
            debris survival, casualty expectation, and an interactive 3D Earth visualization.
          </p>
          <div className="hero-actions">
            <button className="primary large" onClick={onLaunch}>
              Launch Simulator <ArrowRight size={18} />
            </button>
            <a className="secondary-link" href="#how-it-works">How it works</a>
          </div>
          <div className="hero-stats">
            <span><strong>SGP4</strong> propagation</span>
            <span><strong>TPS</strong> comparison</span>
            <span><strong>Ec</strong> thresholding</span>
          </div>
        </div>
      </section>

      <section className="landing-band" id="how-it-works">
        <div className="section-heading">
          <span><Activity size={16} /> Demo flow</span>
          <h2>From TLE to debris report in one run</h2>
        </div>
        <div className="step-grid">
          {steps.map((step, index) => (
            <div className="step-item" key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="feature-grid">
        {features.map(({ icon: Icon, title, text }) => (
          <article key={title}>
            <Icon size={22} />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="landing-band compact">
        <ShieldCheck size={22} />
        <div>
          <h2>Built for credible demos</h2>
          <p>
            Live Celestrak and NOAA data are used when available. Local deterministic fallbacks keep
            the simulator running for presentations, judging, and offline review.
          </p>
        </div>
        <button className="primary" onClick={onLaunch}>Open Simulator</button>
      </section>
    </main>
  );
}

