import jsPDF from "jspdf";

export function exportSimulationPdf(result) {
  if (!result) return;
  const doc = new jsPDF();
  const meta = result.metadata || {};
  const ec = result.casualty_expectation || {};
  doc.setFontSize(18);
  doc.text("Orbital Decay Simulator Report", 14, 20);
  doc.setFontSize(11);
  doc.text(`Satellite: ${meta.satellite_name || "Unknown"}`, 14, 34);
  doc.text(`Generated: ${new Date(meta.generated_at).toLocaleString()}`, 14, 42);
  doc.text(`Timeline samples: ${result.decay_timeline?.length || 0}`, 14, 50);
  doc.text(`Predicted entry reached: ${meta.entry_reached ? "Yes" : "No"}`, 14, 58);
  doc.text(`Ec: ${Number(ec.ec || 0).toExponential(3)} (${ec.status || "unknown"})`, 14, 66);
  doc.text(`Peak heating: ${Number(result.thermal?.peak_heating_w_cm2 || 0).toFixed(1)} W/cm2`, 14, 74);
  doc.text(`Peak temperature: ${Number(result.thermal?.peak_temperature_k || 0).toFixed(0)} K`, 14, 82);
  doc.text("Assumptions", 14, 98);
  (result.assumptions_used || []).slice(0, 5).forEach((line, index) => {
    doc.text(`- ${line}`, 16, 108 + index * 8, { maxWidth: 180 });
  });
  doc.save("orbital-decay-report.pdf");
}

