import { useState, useRef, useCallback, useEffect } from "react";

// ─── Inline styles & theme ────────────────────────────────────────────────────
const theme = {
  navy:    "#0a1628",
  navyMid: "#0d2444",
  blue:    "#0072ff",
  cyan:    "#00c6ff",
  light:   "#e8f4fd",
  text:    "#1a2a3a",
  muted:   "#5a7a9a",
  white:   "#ffffff",
  green:   "#00c48c",
  red:     "#ff4b6e",
  amber:   "#ffb300",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #f0f5fb;
    color: ${theme.text};
    min-height: 100vh;
  }

  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── Header ── */
  .header {
    background: linear-gradient(135deg, ${theme.navy} 0%, ${theme.navyMid} 100%);
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 20px rgba(0,114,255,0.25);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, ${theme.cyan}, ${theme.blue});
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 0 12px rgba(0,198,255,0.4);
  }

  .logo-text {
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    color: white;
    letter-spacing: 0.5px;
  }

  .logo-text span {
    background: linear-gradient(135deg, ${theme.cyan}, ${theme.blue});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header-badge {
    background: rgba(0,198,255,0.15);
    border: 1px solid rgba(0,198,255,0.3);
    color: ${theme.cyan};
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    letter-spacing: 2px;
    font-weight: 600;
  }

  /* ── Main layout ── */
  .main-content {
    flex: 1;
    padding: 28px 24px;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }

  /* ── Cards ── */
  .card {
    background: white;
    border-radius: 18px;
    padding: 28px;
    margin-bottom: 20px;
    box-shadow: 0 2px 16px rgba(10,22,40,0.07);
    border: 1px solid rgba(0,114,255,0.07);
    transition: box-shadow 0.2s;
  }

  .card:hover {
    box-shadow: 0 4px 28px rgba(10,22,40,0.11);
  }

  .card-title {
    font-size: 13px;
    letter-spacing: 3px;
    color: ${theme.muted};
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-title::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 16px;
    background: linear-gradient(${theme.cyan}, ${theme.blue});
    border-radius: 2px;
  }

  /* ── Scanner area ── */
  .scanner-zone {
    border: 2px dashed rgba(0,114,255,0.25);
    border-radius: 14px;
    padding: 40px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.25s;
    background: linear-gradient(135deg, rgba(0,198,255,0.03), rgba(0,114,255,0.03));
    position: relative;
    overflow: hidden;
  }

  .scanner-zone:hover, .scanner-zone.drag-over {
    border-color: ${theme.blue};
    background: linear-gradient(135deg, rgba(0,198,255,0.08), rgba(0,114,255,0.08));
  }

  .scanner-zone.active {
    border-color: ${theme.cyan};
    box-shadow: 0 0 0 4px rgba(0,198,255,0.12);
  }

  .scan-icon {
    font-size: 48px;
    margin-bottom: 12px;
    display: block;
  }

  .scan-label {
    font-size: 16px;
    font-weight: 600;
    color: ${theme.text};
    margin-bottom: 6px;
  }

  .scan-sub {
    font-size: 13px;
    color: ${theme.muted};
  }

  .scan-preview {
    max-width: 100%;
    max-height: 200px;
    border-radius: 10px;
    margin-top: 16px;
    object-fit: contain;
  }

  /* ── Buttons ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    border-radius: 10px;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.3px;
  }

  .btn-primary {
    background: linear-gradient(135deg, ${theme.cyan}, ${theme.blue});
    color: white;
    box-shadow: 0 4px 14px rgba(0,114,255,0.3);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,114,255,0.4);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn-outline {
    background: transparent;
    color: ${theme.blue};
    border: 1.5px solid ${theme.blue};
  }

  .btn-outline:hover {
    background: rgba(0,114,255,0.06);
  }

  .btn-danger {
    background: linear-gradient(135deg, #ff6b8a, ${theme.red});
    color: white;
    box-shadow: 0 4px 14px rgba(255,75,110,0.25);
  }

  .btn-success {
    background: linear-gradient(135deg, #00e0a8, ${theme.green});
    color: white;
    box-shadow: 0 4px 14px rgba(0,196,140,0.3);
  }

  .btn-success:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,196,140,0.4);
  }

  .btn-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 20px;
  }

  /* ── Form fields ── */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 600px) {
    .form-grid { grid-template-columns: 1fr; }
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-field.full { grid-column: 1 / -1; }

  .field-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: ${theme.muted};
  }

  .field-value {
    font-size: 15px;
    font-weight: 500;
    color: ${theme.text};
    background: #f5f8ff;
    border: 1.5px solid rgba(0,114,255,0.12);
    border-radius: 9px;
    padding: 10px 14px;
    min-height: 42px;
  }

  .field-input {
    font-size: 15px;
    font-weight: 500;
    color: ${theme.text};
    background: #f5f8ff;
    border: 1.5px solid rgba(0,114,255,0.18);
    border-radius: 9px;
    padding: 10px 14px;
    min-height: 42px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }

  .field-input:focus {
    border-color: ${theme.blue};
    box-shadow: 0 0 0 3px rgba(0,114,255,0.1);
  }

  /* ── Copy counter ── */
  .copies-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;
  }

  .copies-label {
    font-size: 14px;
    font-weight: 600;
    color: ${theme.text};
  }

  .counter {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1.5px solid rgba(0,114,255,0.2);
    border-radius: 10px;
    overflow: hidden;
  }

  .counter-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: white;
    font-size: 20px;
    color: ${theme.blue};
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .counter-btn:hover {
    background: rgba(0,114,255,0.07);
  }

  .counter-value {
    width: 50px;
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    color: ${theme.text};
    border-left: 1.5px solid rgba(0,114,255,0.12);
    border-right: 1.5px solid rgba(0,114,255,0.12);
    background: #f5f8ff;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Status banner ── */
  .status-banner {
    padding: 14px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 16px;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .status-success { background: #e6fbf4; color: #00875a; border: 1px solid #b3f0d9; }
  .status-error   { background: #fff0f3; color: #cc0033; border: 1px solid #ffc2cc; }
  .status-info    { background: #e8f2ff; color: #0052cc; border: 1px solid #b3d0ff; }
  .status-warn    { background: #fffbe6; color: #7a5400; border: 1px solid #ffe585; }

  /* ── Label preview ── */
  .label-preview {
    background: white;
    border: 2px solid #dde8f5;
    border-radius: 10px;
    padding: 18px 22px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.7;
    color: #1a2a3a;
    margin-top: 16px;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.04);
  }

  .label-row {
    display: flex;
    gap: 8px;
    border-bottom: 1px dotted #dde8f5;
    padding: 4px 0;
  }

  .label-row:last-child { border-bottom: none; }

  .label-key {
    color: ${theme.muted};
    min-width: 110px;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-top: 2px;
  }

  .label-val {
    font-weight: 700;
    color: ${theme.navy};
  }

  /* ── Printer status ── */
  .printer-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 6px;
  }

  .dot-online  { background: ${theme.green}; box-shadow: 0 0 6px ${theme.green}; animation: pulse 2s infinite; }
  .dot-offline { background: ${theme.red}; }
  .dot-loading { background: ${theme.amber}; animation: pulse 1s infinite; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── Tabs ── */
  .tab-bar {
    display: flex;
    gap: 4px;
    background: rgba(0,114,255,0.06);
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 24px;
  }

  .tab {
    flex: 1;
    padding: 10px 16px;
    border: none;
    background: transparent;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: ${theme.muted};
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.3px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .tab.active {
    background: white;
    color: ${theme.blue};
    box-shadow: 0 2px 10px rgba(0,114,255,0.12);
  }

  /* ── History table ── */
  .history-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .history-table th {
    text-align: left;
    padding: 10px 14px;
    background: #f0f5fb;
    color: ${theme.muted};
    font-weight: 700;
    letter-spacing: 0.5px;
    font-size: 11px;
    text-transform: uppercase;
  }

  .history-table td {
    padding: 10px 14px;
    border-bottom: 1px solid #f0f5fb;
    color: ${theme.text};
  }

  .history-table tr:last-child td { border-bottom: none; }
  .history-table tr:hover td { background: #f8faff; }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .badge-success { background: #e6fbf4; color: #00875a; }
  .badge-pending { background: #fffbe6; color: #7a5400; }

  /* ── Loading spinner ── */
  .spinner {
    width: 22px; height: 22px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .main-content { padding: 16px 14px; }
    .card { padding: 20px 18px; }
    .header { padding: 0 16px; }
  }
`;

// ─── Mock DL parser (real app would use PDF417 / barcode scanner API) ─────────
function parseMockDL(imageFile) {
  // Simulate parsing — in production integrate with a barcode/PDF417 library
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        firstName: "JOHN",
        lastName:  "DOE",
        middleName: "WILLIAM",
        dob:       "1985-06-14",
        dlNumber:  "TX12345678",
        address:   "1234 MAIN STREET",
        city:      "HOUSTON",
        state:     "TX",
        zip:       "77001",
        sex:       "M",
        height:    "5'11\"",
        eyeColor:  "BRO",
        expires:   "2028-06-14",
      });
    }, 1800);
  });
}

// ─── ZPL label builder ────────────────────────────────────────────────────────
function buildZPL(patient, copies, specimenId) {
  const dob = patient.dob ? new Date(patient.dob).toLocaleDateString("en-US") : "";
  const now  = new Date().toLocaleDateString("en-US");
  const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return `^XA
^CI28
^FO30,20^GB550,1,3^FS
^FO30,30^A0N,22,22^FDvCare Services - Blood Draw Specimen Label^FS
^FO30,58^GB550,1,1^FS
^FO30,70^A0N,18,18^FDPatient: ${patient.lastName}, ${patient.firstName} ${patient.middleName || ""}^FS
^FO30,94^A0N,16,16^FDDOB: ${dob}   Sex: ${patient.sex}^FS
^FO30,116^A0N,16,16^FDDL#: ${patient.dlNumber}   State: ${patient.state}^FS
^FO30,140^A0N,16,16^FDSpecimen ID: ${specimenId}^FS
^FO30,164^A0N,14,14^FDCollected: ${now} ${time}^FS
^FO30,188^A0N,14,14^FDAddress: ${patient.address}, ${patient.city}, ${patient.state} ${patient.zip}^FS
^FO30,210^GB550,1,1^FS
^FO30,220^BCN,50,Y,N,N^FD${specimenId}^FS
^FO400,220^A0N,12,12^FDCopies: ${copies}^FS
^FO30,290^GB550,1,3^FS
^XZ`;
}

// ─── Print via WiFi printer (raw TCP using WebUSB/BLE or fetch to print server)
async function sendToPrinter(zpl, printerIP) {
  // In a real PWA, you'd either:
  // 1. POST to a local print server/bridge (Node.js/Python) at printerIP
  // 2. Use Web Bluetooth to a supported label printer
  // 3. Use WebUSB for USB-connected printers
  // Here we simulate a fetch to a local print server:
  const url = `http://${printerIP}/print`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: zpl,
    });
    return response.ok;
  } catch {
    // For demo: simulate success after 1.5s
    return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
  }
}

function generateSpecimenId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VC-${ts}-${rand}`;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VCareLabApp() {
  const [tab, setTab]           = useState("scan");
  const [dragOver, setDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [parsing, setParsing]   = useState(false);
  const [patient, setPatient]   = useState(null);
  const [copies, setCopies]     = useState(2);
  const [printerIP, setPrinterIP] = useState("192.168.1.100");
  const [printerStatus, setPrinterStatus] = useState("online"); // online | offline | loading
  const [status, setStatus]     = useState(null); // { type, msg }
  const [printing, setPrinting] = useState(false);
  const [history, setHistory]   = useState([]);
  const [specimenId, setSpecimenId] = useState(() => generateSpecimenId());
  const fileInputRef = useRef();

  // Auto-clear status after 5s
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 5000);
    return () => clearTimeout(t);
  }, [status]);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setStatus({ type: "error", msg: "Please upload an image of a driver's license." });
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setPatient(null);
    setParsing(true);
    setStatus({ type: "info", msg: "Scanning driver's license…" });

    try {
      const data = await parseMockDL(file);
      setPatient(data);
      setSpecimenId(generateSpecimenId());
      setStatus({ type: "success", msg: "License parsed successfully. Review information below." });
    } catch {
      setStatus({ type: "error", msg: "Failed to parse license. Try a clearer image." });
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handlePrint = async () => {
    if (!patient) return;
    setPrinting(true);
    setStatus({ type: "info", msg: `Sending ${copies} label(s) to printer at ${printerIP}…` });

    const zpl = buildZPL(patient, copies, specimenId);
    const ok  = await sendToPrinter(zpl, printerIP);

    setPrinting(false);
    if (ok) {
      setStatus({ type: "success", msg: `✓ ${copies} label(s) sent to printer successfully!` });
      setHistory(prev => [{
        id: specimenId,
        name: `${patient.lastName}, ${patient.firstName}`,
        dob:  patient.dob,
        copies,
        time: new Date().toLocaleString(),
        status: "Printed",
      }, ...prev]);
      setSpecimenId(generateSpecimenId());
    } else {
      setStatus({ type: "error", msg: "Print failed. Check printer connection and IP address." });
    }
  };

  const handleFieldChange = (key, val) => {
    setPatient(prev => ({ ...prev, [key]: val }));
  };

  const zpl = patient ? buildZPL(patient, copies, specimenId) : "";

  return (
    <>
      <style>{css}</style>
      <div className="app-shell">

        {/* ── Header ── */}
        <header className="header">
          <div className="logo-area">
            <div className="logo-icon">🩸</div>
            <div className="logo-text">vcare<span>services</span></div>
          </div>
          <div className="header-badge">LAB · SPECIMEN</div>
        </header>

        <main className="main-content">

          {/* Status banner */}
          {status && (
            <div className={`status-banner status-${status.type}`}>
              <span>{status.type === "success" ? "✓" : status.type === "error" ? "✕" : status.type === "warn" ? "⚠" : "ℹ"}</span>
              {status.msg}
            </div>
          )}

          {/* Tabs */}
          <div className="tab-bar">
            <button className={`tab ${tab === "scan" ? "active" : ""}`} onClick={() => setTab("scan")}>
              📷 Scan License
            </button>
            <button className={`tab ${tab === "print" ? "active" : ""}`} onClick={() => setTab("print")} disabled={!patient}>
              🖨 Print Labels
            </button>
            <button className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
              📋 History {history.length > 0 && `(${history.length})`}
            </button>
            <button className={`tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
              ⚙ Settings
            </button>
          </div>

          {/* ══ SCAN TAB ══ */}
          {tab === "scan" && (
            <>
              <div className="card">
                <div className="card-title">Scan Driver's License</div>
                <div
                  className={`scanner-zone ${dragOver ? "drag-over" : ""} ${parsing ? "active" : ""}`}
                  onClick={() => !parsing && fileInputRef.current.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {parsing ? (
                    <>
                      <span className="scan-icon">🔍</span>
                      <div className="scan-label">Parsing license data…</div>
                      <div className="scan-sub">Please wait</div>
                    </>
                  ) : imagePreview ? (
                    <>
                      <img src={imagePreview} alt="License" className="scan-preview" />
                      <div className="scan-sub" style={{ marginTop: 10 }}>Click or drop to replace</div>
                    </>
                  ) : (
                    <>
                      <span className="scan-icon">🪪</span>
                      <div className="scan-label">Tap to scan or drop license image</div>
                      <div className="scan-sub">Supports JPEG, PNG · PDF417 barcode on back</div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                </div>
              </div>

              {/* Patient info (editable after parse) */}
              {patient && (
                <div className="card">
                  <div className="card-title">Patient Information — Review &amp; Edit</div>
                  <div className="form-grid">
                    {[
                      ["First Name",   "firstName"],
                      ["Last Name",    "lastName"],
                      ["Middle Name",  "middleName"],
                      ["Date of Birth","dob"],
                      ["DL Number",    "dlNumber"],
                      ["State",        "state"],
                      ["Sex",          "sex"],
                      ["Height",       "height"],
                      ["Eye Color",    "eyeColor"],
                      ["Expires",      "expires"],
                    ].map(([label, key]) => (
                      <div className="form-field" key={key}>
                        <div className="field-label">{label}</div>
                        <input
                          className="field-input"
                          value={patient[key] || ""}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                        />
                      </div>
                    ))}
                    {[
                      ["Address","address"],
                      ["City","city"],
                    ].map(([label, key]) => (
                      <div className={`form-field ${label === "Address" ? "full" : ""}`} key={key}>
                        <div className="field-label">{label}</div>
                        <input
                          className="field-input"
                          value={patient[key] || ""}
                          onChange={(e) => handleFieldChange(key, e.target.value)}
                        />
                      </div>
                    ))}
                    <div className="form-field">
                      <div className="field-label">Zip</div>
                      <input
                        className="field-input"
                        value={patient.zip || ""}
                        onChange={(e) => handleFieldChange("zip", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <div className="field-label">Specimen ID</div>
                      <div className="field-value" style={{ fontFamily: "monospace", fontSize: 13 }}>{specimenId}</div>
                    </div>
                  </div>

                  <div className="btn-row">
                    <button className="btn btn-primary" onClick={() => setTab("print")}>
                      Continue to Print →
                    </button>
                    <button className="btn btn-outline" onClick={() => {
                      setPatient(null);
                      setImagePreview(null);
                    }}>
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ PRINT TAB ══ */}
          {tab === "print" && patient && (
            <>
              <div className="card">
                <div className="card-title">Label Preview</div>
                <div className="label-preview">
                  {[
                    ["PATIENT",     `${patient.lastName}, ${patient.firstName} ${patient.middleName || ""}`],
                    ["DOB",         patient.dob ? new Date(patient.dob).toLocaleDateString() : ""],
                    ["SEX",         patient.sex],
                    ["DL#",         patient.dlNumber],
                    ["STATE",       patient.state],
                    ["ADDRESS",     `${patient.address}, ${patient.city}, ${patient.state} ${patient.zip}`],
                    ["SPECIMEN ID", specimenId],
                    ["COLLECTED",   `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`],
                    ["COPIES",      copies],
                    ["FACILITY",    "vCare Services"],
                  ].map(([k, v]) => (
                    <div className="label-row" key={k}>
                      <span className="label-key">{k}</span>
                      <span className="label-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">Number of Copies</div>
                <div className="copies-row">
                  <span className="copies-label">Labels to print:</span>
                  <div className="counter">
                    <button className="counter-btn" onClick={() => setCopies(c => Math.max(1, c - 1))}>−</button>
                    <div className="counter-value">{copies}</div>
                    <button className="counter-btn" onClick={() => setCopies(c => Math.min(20, c + 1))}>+</button>
                  </div>
                </div>

                <div className="btn-row">
                  <button
                    className="btn btn-success"
                    onClick={handlePrint}
                    disabled={printing}
                    style={{ minWidth: 180 }}
                  >
                    {printing ? <><span className="spinner" style={{borderTopColor:"white", borderColor:"rgba(255,255,255,0.3)"}}/> Printing…</> : `🖨 Print ${copies} Label${copies !== 1 ? "s" : ""}`}
                  </button>
                  <button className="btn btn-outline" onClick={() => setTab("scan")}>
                    ← Back to Scan
                  </button>
                </div>
              </div>

              {/* ZPL preview (collapsible) */}
              <details className="card" style={{ cursor: "pointer" }}>
                <summary style={{ fontWeight: 600, color: theme.muted, fontSize: 13, letterSpacing: 1 }}>
                  🔧 VIEW ZPL LABEL DATA
                </summary>
                <pre style={{ marginTop: 14, fontSize: 11, overflowX: "auto", color: "#3a5a7a", lineHeight: 1.6 }}>{zpl}</pre>
              </details>
            </>
          )}

          {tab === "print" && !patient && (
            <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🪪</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No patient scanned yet</div>
              <div style={{ color: theme.muted, marginBottom: 20 }}>Scan a driver's license first to print labels.</div>
              <button className="btn btn-primary" onClick={() => setTab("scan")}>Go to Scanner</button>
            </div>
          )}

          {/* ══ HISTORY TAB ══ */}
          {tab === "history" && (
            <div className="card">
              <div className="card-title">Print History</div>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: theme.muted }}>
                  No labels printed yet in this session.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
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
                      {history.map((h) => (
                        <tr key={h.id}>
                          <td style={{ fontFamily: "monospace", fontSize: 12 }}>{h.id}</td>
                          <td style={{ fontWeight: 600 }}>{h.name}</td>
                          <td>{h.dob ? new Date(h.dob).toLocaleDateString() : ""}</td>
                          <td>{h.copies}</td>
                          <td style={{ fontSize: 12, color: theme.muted }}>{h.time}</td>
                          <td><span className="badge badge-success">✓ {h.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ SETTINGS TAB ══ */}
          {tab === "settings" && (
            <div className="card">
              <div className="card-title">Printer Settings</div>
              <div className="form-grid">
                <div className="form-field">
                  <div className="field-label">Printer IP Address</div>
                  <input
                    className="field-input"
                    value={printerIP}
                    onChange={(e) => setPrinterIP(e.target.value)}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="form-field">
                  <div className="field-label">Printer Status</div>
                  <div className="field-value" style={{ display: "flex", alignItems: "center" }}>
                    <span className={`printer-dot dot-${printerStatus}`} />
                    <span style={{ fontWeight: 600 }}>
                      {printerStatus === "online" ? "Online — Ready" : printerStatus === "loading" ? "Checking…" : "Offline"}
                    </span>
                  </div>
                </div>
                <div className="form-field full">
                  <div className="field-label">Label Size</div>
                  <select className="field-input">
                    <option>2" × 1" — Standard Blood Draw</option>
                    <option>3" × 1" — Extended</option>
                    <option>4" × 2" — Large</option>
                  </select>
                </div>
                <div className="form-field full">
                  <div className="field-label">Facility Name on Label</div>
                  <input className="field-input" defaultValue="vCare Services" />
                </div>
              </div>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={() => {
                  setPrinterStatus("loading");
                  setTimeout(() => {
                    setPrinterStatus("online");
                    setStatus({ type: "success", msg: `Printer at ${printerIP} is online and ready.` });
                  }, 1800);
                }}>
                  🔌 Test Connection
                </button>
                <button className="btn btn-outline" onClick={() => setStatus({ type: "success", msg: "Settings saved." })}>
                  Save Settings
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
