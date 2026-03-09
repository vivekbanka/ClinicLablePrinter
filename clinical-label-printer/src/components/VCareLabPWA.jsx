import { useState, useRef, useCallback, useEffect } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const theme = {
  navy:    "#0a1628",
  navyMid: "#0d2444",
  blue:    "#0072ff",
  cyan:    "#00c6ff",
  text:    "#1a2a3a",
  muted:   "#5a7a9a",
  green:   "#00c48c",
  red:     "#ff4b6e",
  amber:   "#ffb300",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #f0f5fb;
    color: ${theme.text};
    min-height: 100vh;
  }

  .app-shell { min-height: 100vh; display: flex; flex-direction: column; }

  .header {
    background: linear-gradient(135deg, ${theme.navy} 0%, ${theme.navyMid} 100%);
    padding: 0 24px; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 2px 20px rgba(0,114,255,0.25);
    position: sticky; top: 0; z-index: 100;
  }
  .logo-area { display: flex; align-items: center; gap: 12px; }
  .logo-icon {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, ${theme.cyan}, ${theme.blue});
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-size: 18px; box-shadow: 0 0 12px rgba(0,198,255,0.4);
  }
  .logo-text { font-family: 'DM Serif Display', serif; font-size: 20px; color: white; letter-spacing: 0.5px; }
  .logo-text span {
    background: linear-gradient(135deg, ${theme.cyan}, ${theme.blue});
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .header-badge {
    background: rgba(0,198,255,0.15); border: 1px solid rgba(0,198,255,0.3);
    color: ${theme.cyan}; padding: 4px 12px; border-radius: 20px;
    font-size: 11px; letter-spacing: 2px; font-weight: 600;
  }

  .main-content { flex: 1; padding: 28px 24px; max-width: 900px; margin: 0 auto; width: 100%; }

  .card {
    background: white; border-radius: 18px; padding: 28px; margin-bottom: 20px;
    box-shadow: 0 2px 16px rgba(10,22,40,0.07); border: 1px solid rgba(0,114,255,0.07);
    transition: box-shadow 0.2s;
  }
  .card:hover { box-shadow: 0 4px 28px rgba(10,22,40,0.11); }
  .card-title {
    font-size: 13px; letter-spacing: 3px; color: ${theme.muted};
    font-weight: 600; text-transform: uppercase; margin-bottom: 20px;
    display: flex; align-items: center; gap: 8px;
  }
  .card-title::before {
    content: ''; display: inline-block; width: 3px; height: 16px;
    background: linear-gradient(${theme.cyan}, ${theme.blue}); border-radius: 2px;
  }

  .scanner-zone {
    border: 2px dashed rgba(0,114,255,0.25); border-radius: 14px;
    padding: 40px 24px; text-align: center; cursor: pointer;
    transition: all 0.25s;
    background: linear-gradient(135deg, rgba(0,198,255,0.03), rgba(0,114,255,0.03));
  }
  .scanner-zone:hover, .scanner-zone.drag-over {
    border-color: ${theme.blue};
    background: linear-gradient(135deg, rgba(0,198,255,0.08), rgba(0,114,255,0.08));
  }
  .scanner-zone.active { border-color: ${theme.cyan}; box-shadow: 0 0 0 4px rgba(0,198,255,0.12); }
  .scan-icon { font-size: 48px; margin-bottom: 12px; display: block; }
  .scan-label { font-size: 16px; font-weight: 600; color: ${theme.text}; margin-bottom: 6px; }
  .scan-sub { font-size: 13px; color: ${theme.muted}; }
  .scan-preview { max-width: 100%; max-height: 200px; border-radius: 10px; margin-top: 16px; object-fit: contain; }

  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 10px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px;
  }
  .btn-primary {
    background: linear-gradient(135deg, ${theme.cyan}, ${theme.blue});
    color: white; box-shadow: 0 4px 14px rgba(0,114,255,0.3);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,114,255,0.4); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn-outline { background: transparent; color: ${theme.blue}; border: 1.5px solid ${theme.blue}; }
  .btn-outline:hover { background: rgba(0,114,255,0.06); }
  .btn-print {
    background: linear-gradient(135deg, #00e0a8, ${theme.green});
    color: white; box-shadow: 0 4px 14px rgba(0,196,140,0.3);
    font-size: 16px; padding: 14px 36px; border-radius: 12px;
  }
  .btn-print:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,196,140,0.45); }
  .btn-print:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-field.full { grid-column: 1 / -1; }
  .field-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: ${theme.muted}; }
  .field-value {
    font-size: 15px; font-weight: 500; color: ${theme.text};
    background: #f5f8ff; border: 1.5px solid rgba(0,114,255,0.12);
    border-radius: 9px; padding: 10px 14px; min-height: 42px;
  }
  .field-input {
    font-size: 15px; font-weight: 500; color: ${theme.text};
    background: #f5f8ff; border: 1.5px solid rgba(0,114,255,0.18);
    border-radius: 9px; padding: 10px 14px; min-height: 42px;
    font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; width: 100%;
  }
  .field-input:focus { border-color: ${theme.blue}; box-shadow: 0 0 0 3px rgba(0,114,255,0.1); }

  .copies-row { display: flex; align-items: center; gap: 16px; margin-top: 8px; }
  .copies-label { font-size: 14px; font-weight: 600; color: ${theme.text}; }
  .counter { display: flex; align-items: center; border: 1.5px solid rgba(0,114,255,0.2); border-radius: 10px; overflow: hidden; }
  .counter-btn {
    width: 44px; height: 44px; border: none; background: white;
    font-size: 22px; color: ${theme.blue}; cursor: pointer;
    transition: background 0.15s; display: flex; align-items: center; justify-content: center; font-weight: 700;
  }
  .counter-btn:hover { background: rgba(0,114,255,0.07); }
  .counter-value {
    width: 56px; text-align: center; font-size: 20px; font-weight: 700; color: ${theme.text};
    border-left: 1.5px solid rgba(0,114,255,0.12); border-right: 1.5px solid rgba(0,114,255,0.12);
    background: #f5f8ff; height: 44px; display: flex; align-items: center; justify-content: center;
  }

  .status-banner {
    padding: 14px 20px; border-radius: 12px; display: flex; align-items: center; gap: 12px;
    font-size: 14px; font-weight: 500; margin-bottom: 16px; animation: slideIn 0.3s ease;
  }
  @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  .status-success { background:#e6fbf4; color:#00875a; border:1px solid #b3f0d9; }
  .status-error   { background:#fff0f3; color:#cc0033; border:1px solid #ffc2cc; }
  .status-info    { background:#e8f2ff; color:#0052cc; border:1px solid #b3d0ff; }

  /* Screen label preview */
  .label-card-wrap { display: flex; justify-content: center; margin: 8px 0; }
  .label-card-screen {
    width: 100%; max-width: 480px;
    background: white; border: 2px solid #dde8f5; border-radius: 12px;
    padding: 18px 22px; box-shadow: 0 4px 20px rgba(0,114,255,0.1);
    font-family: Arial, sans-serif;
  }
  .lc-header {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2.5px solid ${theme.blue}; padding-bottom: 10px; margin-bottom: 12px;
  }
  .lc-facility { font-size: 12px; font-weight: 900; color: ${theme.blue}; letter-spacing: 0.8px; }
  .lc-specimen { font-family: monospace; font-size: 10px; color: ${theme.muted}; text-align: right; line-height: 1.4; }
  .lc-patient { font-size: 20px; font-weight: 900; color: ${theme.navy}; margin-bottom: 3px; }
  .lc-sub { font-size: 12px; color: ${theme.muted}; margin-bottom: 12px; }
  .lc-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 12px; }
  .lc-item-key { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: ${theme.muted}; }
  .lc-item-val { font-size: 12px; font-weight: 700; color: ${theme.text}; margin-top: 2px; }
  .lc-address { font-size: 11px; color: ${theme.muted}; margin-bottom: 12px; }
  .lc-footer { border-top: 1px solid #eef2f8; padding-top: 10px; display: flex; align-items: center; justify-content: space-between; }
  .lc-barcode-bars { display: flex; gap: 1.5px; align-items: flex-end; height: 32px; }
  .lc-bar { background: ${theme.navy}; border-radius: 1px; }
  .lc-barcode-text { font-family: monospace; font-size: 9px; letter-spacing: 2px; color: ${theme.navy}; font-weight: 700; margin-top: 3px; }
  .lc-collected { font-size: 10px; color: ${theme.muted}; text-align: right; line-height: 1.5; }

  .print-tip {
    background: linear-gradient(135deg, #e8f2ff, #f0f8ff);
    border: 1px solid rgba(0,114,255,0.2);
    border-radius: 12px; padding: 16px 20px; margin-top: 16px;
    font-size: 13px; color: #2a4a7a; line-height: 1.7;
  }
  .print-tip strong { color: ${theme.blue}; }

  .tab-bar {
    display: flex; gap: 4px; background: rgba(0,114,255,0.06);
    border-radius: 12px; padding: 4px; margin-bottom: 24px;
  }
  .tab {
    flex: 1; padding: 10px 8px; border: none; background: transparent;
    border-radius: 9px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600; color: ${theme.muted};
    cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .tab.active { background: white; color: ${theme.blue}; box-shadow: 0 2px 10px rgba(0,114,255,0.12); }
  .tab:disabled { opacity: 0.4; cursor: not-allowed; }

  .history-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .history-table th {
    text-align: left; padding: 10px 14px; background: #f0f5fb;
    color: ${theme.muted}; font-weight: 700; font-size: 11px; text-transform: uppercase;
  }
  .history-table td { padding: 10px 14px; border-bottom: 1px solid #f0f5fb; }
  .history-table tr:last-child td { border-bottom: none; }
  .history-table tr:hover td { background: #f8faff; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .badge-success { background: #e6fbf4; color: #00875a; }

  .spinner {
    width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 480px) {
    .main-content { padding: 16px 14px; }
    .card { padding: 20px 18px; }
    .header { padding: 0 16px; }
    .tab { font-size: 11px; padding: 9px 4px; }
    .lc-grid { grid-template-columns: repeat(2,1fr); }
  }

  /* ══════════════════════════════════════════════════
     PRINT STYLES
     Brother QL-710W — 62mm × 29mm die-cut label
     At 300dpi → 732px × 342px usable area
  ══════════════════════════════════════════════════ */
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: white !important; margin: 0 !important; padding: 0 !important; }

    /* Hide entire app UI */
    .app-shell { display: none !important; }

    /* Show only print sheet */
    #print-sheet { display: block !important; }

    @page {
      size: 62mm 29mm;
      margin: 0;
    }

    .print-label {
      width: 62mm;
      height: 29mm;
      padding: 2mm 3mm 1.5mm;
      background: white;
      page-break-after: always;
      page-break-inside: avoid;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .pl-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 0.5pt solid #000;
      padding-bottom: 0.7mm;
      margin-bottom: 0.7mm;
    }
    .pl-facility {
      font-family: Arial, sans-serif;
      font-size: 6pt; font-weight: 900;
      letter-spacing: 0.5pt; color: #000;
    }
    .pl-copy-num {
      font-family: Arial, sans-serif;
      font-size: 5pt; color: #555; text-align: right;
    }
    .pl-patient {
      font-family: Arial, sans-serif;
      font-size: 9pt; font-weight: 900;
      color: #000; letter-spacing: 0.2pt; line-height: 1.15;
    }
    .pl-dob-row {
      font-family: Arial, sans-serif;
      font-size: 6pt; color: #333;
      display: flex; gap: 6mm; margin: 0.5mm 0;
    }
    .pl-dob-item { display: flex; gap: 1mm; }
    .pl-dob-key { font-weight: 700; text-transform: uppercase; letter-spacing: 0.3pt; }
    .pl-bottom {
      border-top: 0.4pt solid #aaa;
      padding-top: 0.6mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pl-specimen-id {
      font-family: 'Courier New', monospace;
      font-size: 5.5pt; font-weight: 700;
      letter-spacing: 1.5pt; color: #000;
    }
    .pl-collected {
      font-family: Arial, sans-serif;
      font-size: 4.5pt; color: #555; text-align: right; line-height: 1.4;
    }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseMockDL() {
  return new Promise((resolve) =>
    setTimeout(() => resolve({
      firstName: "JOHN", lastName: "DOE", middleName: "WILLIAM",
      dob: "1985-06-14", dlNumber: "TX12345678",
      address: "1234 MAIN STREET", city: "HOUSTON", state: "TX", zip: "77001",
      sex: "M", height: "5'11\"", eyeColor: "BRO", expires: "2028-06-14",
    }), 1800)
  );
}

function generateSpecimenId() {
  return `VC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
}

// ─── Fake barcode bars (screen only) ─────────────────────────────────────────
const BAR_PATTERN = [1,2,1,3,2,1,2,1,3,1,2,3,1,2,1,2,3,2,1,3,1,2,1,1,3,2,1,2,3,1,2,1,2,3,1,1,2,3,2,1,1,2,3,1,2,1,2,3];
function BarcodeBars() {
  return (
    <div className="lc-barcode-bars">
      {BAR_PATTERN.map((w, i) => (
        <div key={i} className="lc-bar" style={{ width: w * 2.2, height: i % 5 === 0 ? "100%" : "75%" }} />
      ))}
    </div>
  );
}

// ─── Hidden print sheet ───────────────────────────────────────────────────────
function PrintSheet({ patient, copies, specimenId }) {
  if (!patient) return null;
  const dob       = patient.dob     ? new Date(patient.dob).toLocaleDateString("en-US")     : "";
  const expires   = patient.expires ? new Date(patient.expires).toLocaleDateString("en-US") : "";
  const collected = `${new Date().toLocaleDateString("en-US")} ${new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}`;
  const name      = `${patient.lastName}, ${patient.firstName}${patient.middleName ? " " + patient.middleName[0] + "." : ""}`;

  return (
    <div id="print-sheet" style={{ display: "none" }}>
      {Array.from({ length: copies }).map((_, i) => (
        <div key={i} className="print-label">
          <div className="pl-top">
            <div className="pl-facility">vCARE SERVICES · BLOOD DRAW SPECIMEN</div>
            <div className="pl-copy-num">Label {i + 1}/{copies}</div>
          </div>

          <div className="pl-patient">{name}</div>

          <div className="pl-dob-row">
            <div className="pl-dob-item"><span className="pl-dob-key">DOB:</span><span>{dob}</span></div>
            <div className="pl-dob-item"><span className="pl-dob-key">SEX:</span><span>{patient.sex}</span></div>
            <div className="pl-dob-item"><span className="pl-dob-key">DL:</span><span>{patient.dlNumber} {patient.state}</span></div>
            <div className="pl-dob-item"><span className="pl-dob-key">EXP:</span><span>{expires}</span></div>
          </div>

          <div className="pl-bottom">
            <div className="pl-specimen-id">||| {specimenId} |||</div>
            <div className="pl-collected">Collected<br />{collected}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Screen preview ───────────────────────────────────────────────────────────
function LabelPreview({ patient, copies, specimenId }) {
  const dob       = patient.dob     ? new Date(patient.dob).toLocaleDateString("en-US")     : "";
  const expires   = patient.expires ? new Date(patient.expires).toLocaleDateString("en-US") : "";
  const collected = `${new Date().toLocaleDateString("en-US")} ${new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}`;
  const name      = `${patient.lastName}, ${patient.firstName}${patient.middleName ? " " + patient.middleName[0] + "." : ""}`;

  return (
    <div className="label-card-wrap">
      <div className="label-card-screen">
        <div className="lc-header">
          <span className="lc-facility">🩸 vCARE SERVICES · BLOOD DRAW</span>
          <div className="lc-specimen">{specimenId}<br />{copies} label{copies !== 1 ? "s" : ""}</div>
        </div>

        <div className="lc-patient">{name}</div>
        <div className="lc-sub">DOB: {dob} &nbsp;·&nbsp; {patient.sex} &nbsp;·&nbsp; {patient.height}</div>

        <div className="lc-grid">
          {[["DL#",patient.dlNumber],["State",patient.state],["Eye",patient.eyeColor],["Expires",expires]].map(([k,v])=>(
            <div key={k}>
              <div className="lc-item-key">{k}</div>
              <div className="lc-item-val">{v}</div>
            </div>
          ))}
        </div>

        <div className="lc-address">📍 {patient.address}, {patient.city}, {patient.state} {patient.zip}</div>

        <div className="lc-footer">
          <div>
            <BarcodeBars />
            <div className="lc-barcode-text">{specimenId}</div>
          </div>
          <div className="lc-collected">Collected<br />{collected}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VCareLabApp() {
  const [tab,          setTab]          = useState("scan");
  const [dragOver,     setDragOver]     = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [parsing,      setParsing]      = useState(false);
  const [patient,      setPatient]      = useState(null);
  const [copies,       setCopies]       = useState(2);
  const [status,       setStatus]       = useState(null);
  const [printing,     setPrinting]     = useState(false);
  const [history,      setHistory]      = useState([]);
  const [specimenId,   setSpecimenId]   = useState(generateSpecimenId);
  const fileRef = useRef();

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 6000);
    return () => clearTimeout(t);
  }, [status]);

  const handleFile = useCallback(async (file) => {
    if (!file?.type.startsWith("image/")) {
      setStatus({ type:"error", msg:"Please upload a photo of a driver's license." });
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setPatient(null);
    setParsing(true);
    setStatus({ type:"info", msg:"Scanning license…" });
    try {
      const data = await parseMockDL(file);
      setPatient(data);
      setSpecimenId(generateSpecimenId());
      setStatus({ type:"success", msg:"✓ License parsed — review the info then tap Print." });
    } catch {
      setStatus({ type:"error", msg:"Could not parse license. Try a clearer photo of the back barcode." });
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // ── Print: inject sheet → window.print() → hide sheet ──────────────────────
  const handlePrint = () => {
    if (!patient || printing) return;
    setPrinting(true);

    const sheet = document.getElementById("print-sheet");
    if (sheet) sheet.style.display = "block";

    // Let React flush, then open native print dialog
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        if (sheet) sheet.style.display = "none";
        setPrinting(false);
        setHistory(prev => [{
          id:     specimenId,
          name:   `${patient.lastName}, ${patient.firstName}`,
          dob:    patient.dob,
          copies,
          time:   new Date().toLocaleString(),
        }, ...prev]);
        setStatus({ type:"success", msg:`✓ Print dialog opened — select Brother QL-710W and print ${copies} label${copies!==1?"s":""}.` });
        setSpecimenId(generateSpecimenId());
      }, 80);
    });
  };

  const edit = (k, v) => setPatient(p => ({ ...p, [k]: v }));

  return (
    <>
      <style>{css}</style>

      {/* Hidden labels — only rendered during print */}
      <PrintSheet patient={patient} copies={copies} specimenId={specimenId} />

      <div className="app-shell">
        <header className="header">
          <div className="logo-area">
            <div className="logo-icon">🩸</div>
            <div className="logo-text">vcare<span>services</span></div>
          </div>
          <div className="header-badge">LAB · SPECIMEN</div>
        </header>

        <main className="main-content">

          {status && (
            <div className={`status-banner status-${status.type}`}>
              <span>{status.type==="success"?"✓":status.type==="error"?"✕":"ℹ"}</span>
              {status.msg}
            </div>
          )}

          <div className="tab-bar">
            <button className={`tab ${tab==="scan"?"active":""}`}    onClick={()=>setTab("scan")}>📷 Scan</button>
            <button className={`tab ${tab==="print"?"active":""}`}   onClick={()=>setTab("print")} disabled={!patient}>🖨 Print</button>
            <button className={`tab ${tab==="history"?"active":""}`} onClick={()=>setTab("history")}>📋 History{history.length>0?` (${history.length})`:""}</button>
          </div>

          {/* ══ SCAN ══ */}
          {tab === "scan" && (
            <>
              <div className="card">
                <div className="card-title">Scan Driver's License</div>
                <div
                  className={`scanner-zone${dragOver?" drag-over":""}${parsing?" active":""}`}
                  onClick={() => !parsing && fileRef.current.click()}
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {parsing ? (
                    <><span className="scan-icon">🔍</span><div className="scan-label">Parsing license…</div><div className="scan-sub">Please wait</div></>
                  ) : imagePreview ? (
                    <><img src={imagePreview} alt="License" className="scan-preview" /><div className="scan-sub" style={{marginTop:10}}>Tap to replace</div></>
                  ) : (
                    <><span className="scan-icon">🪪</span><div className="scan-label">Tap to photograph or drop license image</div><div className="scan-sub">Back camera · PDF417 barcode on rear of license</div></>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} />
                </div>
              </div>

              {patient && (
                <div className="card">
                  <div className="card-title">Patient Info — Review &amp; Edit</div>
                  <div className="form-grid">
                    {[["First Name","firstName"],["Last Name","lastName"],["Middle Name","middleName"],
                      ["Date of Birth","dob"],["DL Number","dlNumber"],["State","state"],
                      ["Sex","sex"],["Height","height"],["Eye Color","eyeColor"],["Expires","expires"]
                    ].map(([label,key])=>(
                      <div className="form-field" key={key}>
                        <div className="field-label">{label}</div>
                        <input className="field-input" value={patient[key]||""} onChange={e=>edit(key,e.target.value)} />
                      </div>
                    ))}
                    <div className="form-field full">
                      <div className="field-label">Address</div>
                      <input className="field-input" value={patient.address||""} onChange={e=>edit("address",e.target.value)} />
                    </div>
                    <div className="form-field">
                      <div className="field-label">City</div>
                      <input className="field-input" value={patient.city||""} onChange={e=>edit("city",e.target.value)} />
                    </div>
                    <div className="form-field">
                      <div className="field-label">Zip</div>
                      <input className="field-input" value={patient.zip||""} onChange={e=>edit("zip",e.target.value)} />
                    </div>
                    <div className="form-field full">
                      <div className="field-label">Specimen ID</div>
                      <div className="field-value" style={{fontFamily:"monospace",fontSize:13}}>{specimenId}</div>
                    </div>
                  </div>
                  <div className="btn-row">
                    <button className="btn btn-primary" onClick={()=>setTab("print")}>Continue to Print →</button>
                    <button className="btn btn-outline" onClick={()=>{setPatient(null);setImagePreview(null);}}>Clear</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ PRINT ══ */}
          {tab === "print" && patient && (
            <>
              <div className="card">
                <div className="card-title">Label Preview — 62mm × 29mm Brother QL</div>
                <LabelPreview patient={patient} copies={copies} specimenId={specimenId} />
              </div>

              <div className="card">
                <div className="card-title">Copies</div>
                <div className="copies-row">
                  <span className="copies-label">Labels to print:</span>
                  <div className="counter">
                    <button className="counter-btn" onClick={()=>setCopies(c=>Math.max(1,c-1))}>−</button>
                    <div className="counter-value">{copies}</div>
                    <button className="counter-btn" onClick={()=>setCopies(c=>Math.min(20,c+1))}>+</button>
                  </div>
                </div>

                <div className="btn-row" style={{marginTop:28,alignItems:"center"}}>
                  <button className="btn btn-print" onClick={handlePrint} disabled={printing}>
                    {printing
                      ? <><span className="spinner" />Opening Print Dialog…</>
                      : <>🖨&nbsp; Print {copies} Label{copies!==1?"s":""}</>}
                  </button>
                  <button className="btn btn-outline" onClick={()=>setTab("scan")}>← Back to Scan</button>
                </div>

                <div className="print-tip">
                  <strong>📱 iPhone / iPad:</strong> Tap <strong>Print</strong> → Share sheet opens → tap <strong>Print</strong> → select <strong>Brother QL-710W</strong> (AirPrint) → Print.<br /><br />
                  <strong>🤖 Android:</strong> Tap <strong>Print</strong> → Print dialog opens → select <strong>Brother QL-710W</strong> (Mopria) → tap the print button.<br /><br />
                  <strong>💻 Desktop:</strong> Select <strong>Brother QL-710W</strong> → set paper size to <strong>62 × 29 mm</strong> → Print.
                </div>
              </div>
            </>
          )}

          {tab === "print" && !patient && (
            <div className="card" style={{textAlign:"center",padding:"60px 24px"}}>
              <div style={{fontSize:48,marginBottom:12}}>🪪</div>
              <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>No patient scanned yet</div>
              <div style={{color:theme.muted,marginBottom:20}}>Scan a driver's license first.</div>
              <button className="btn btn-primary" onClick={()=>setTab("scan")}>Go to Scanner</button>
            </div>
          )}

          {/* ══ HISTORY ══ */}
          {tab === "history" && (
            <div className="card">
              <div className="card-title">Print History</div>
              {history.length === 0 ? (
                <div style={{textAlign:"center",padding:"40px 0",color:theme.muted}}>No labels printed in this session.</div>
              ) : (
                <div style={{overflowX:"auto"}}>
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Specimen ID</th>
                        <th>Patient</th>
                        <th>DOB</th>
                        <th>Copies</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h,i)=>(
                        <tr key={i}>
                          <td style={{fontFamily:"monospace",fontSize:12}}>{h.id}</td>
                          <td style={{fontWeight:600}}>{h.name}</td>
                          <td>{h.dob?new Date(h.dob).toLocaleDateString():""}</td>
                          <td>{h.copies}</td>
                          <td style={{fontSize:12,color:theme.muted}}>{h.time}</td>
                          <td><span className="badge badge-success">✓ Sent to Printer</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </>
  );
}
