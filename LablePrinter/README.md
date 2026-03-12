# Lab Label Printer — Medical Lab PWA

A full-stack Progressive Web App for medical lab workflow:
scan a US driver's license → confirm patient data → print a blood vial label to your WiFi printer.

---

## Features

- **PDF417 Barcode Scanning** — decodes AAMVA driver's license barcodes via device camera (ZXing)
- **AAMVA Parser** — extracts name, DOB, license number, address from all US state licenses
- **2" × 1" Label Generation** — PDF labels with Code 128 barcode, sized for standard blood vials
- **WiFi Printing** — browser print dialog (all WiFi printers), direct IPP, or Zebra ZPL
- **PWA** — installable on tablet/phone, offline-capable, fast startup
- **PrimeReact UI** — clean, mobile-optimized lab interface

---

## Project Structure

```
LablePrinter/
├── backend/                  ← Node.js + Express API
│   ├── server.js             ← Main server
│   ├── routes/
│   │   ├── license.js        ← POST /api/parse-license
│   │   ├── label.js          ← POST /api/generate-label
│   │   └── printer.js        ← POST /api/print, GET /api/printers/discover
│   ├── services/
│   │   ├── licenseParser.js  ← AAMVA PDF417 parser
│   │   ├── labelGenerator.js ← PDFKit + bwip-js label generator
│   │   └── printerService.js ← IPP WiFi + Zebra ZPL printing
│   └── middleware/
│       ├── logger.js         ← Winston (HIPAA-safe, PII-redacted)
│       └── validation.js     ← express-validator
│
└── frontend/                 ← React + Vite + PrimeReact PWA
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx        ← Home + recent scans
    │   │   ├── ScanPage.jsx         ← Camera scanner
    │   │   ├── ConfirmPatient.jsx   ← Edit patient fields
    │   │   ├── LabelPreview.jsx     ← Preview + print
    │   │   └── PrinterSettings.jsx  ← Printer configuration
    │   ├── components/
    │   │   ├── BarcodeScanner.jsx   ← ZXing PDF417 scanner
    │   │   ├── LabelTemplate.jsx    ← 2"x1" label preview
    │   │   └── PrinterSelectDialog.jsx ← Print dialog
    │   ├── services/api.js          ← Axios API calls
    │   └── hooks/useRecentScans.js  ← LocalStorage recent scans
    ├── vite.config.js               ← Vite + PWA plugin config
    └── index.html
```

---

## Quick Start

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org))
- **npm** v9+

---

### 1. Start the Backend

```bash
cd backend
npm install
cp .env.example .env    # Edit if needed
npm run dev
```

Backend runs at: **http://localhost:3001**

---

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

### 3. Open on Tablet / Phone

The Vite dev server is accessible on your local network.

1. Find your computer's local IP:
   - macOS/Linux: `ifconfig | grep inet`
   - Windows: `ipconfig`

2. Open on phone/tablet: `http://YOUR_IP:5173`

3. For **PWA install**: tap "Add to Home Screen" in your browser

---

## Printer Setup

### Option A: Browser Print Dialog (Easiest)
- Press **Print Label** → select "Browser Print Dialog"
- Your OS print dialog opens with all available WiFi printers
- Set paper size to **2" × 1" (Custom)** in the dialog

### Option B: Direct WiFi / IPP
1. Go to **Settings** (gear icon)
2. Select "Direct WiFi / IPP"
3. Enter your printer's URL, e.g.:
   ```
   http://192.168.1.100:631/ipp/print
   ```
4. Press **Test Connection** to verify
5. Common IPP paths: `/ipp/print`, `/ipp`, `/IPP`

### Option C: Zebra Thermal (ZPL)
1. Go to **Settings** → select "Zebra Thermal (ZPL)"
2. Enter printer IP: `192.168.1.100`
3. Uses TCP port 9100 (raw ZPL socket)

---

## API Reference

### `POST /api/parse-license`
Parse AAMVA PDF417 barcode from a US driver's license.

**Request:**
```json
{ "barcodeRawText": "@\n\x1e\rANSI ..." }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "01/15/1985",
    "licenseNumber": "D1234567",
    "address": "123 Main St, Springfield, IL 62701",
    "expirationDate": "01/15/2026",
    "aamvaVersion": 10
  }
}
```

---

### `POST /api/generate-label`
Generate a 2"×1" label PDF.

**Request:**
```json
{
  "patientName": "John Doe",
  "dob": "01/15/1985",
  "sampleId": "LAB-260311-A1B2C3",
  "collectionTime": "2026-03-11T14:30:00Z",
  "licenseNumber": "D1234567",
  "format": "pdf"
}
```

**Response:** Binary PDF or ZPL string

---

### `POST /api/print`
Send label directly to IPP/ZPL printer.

**Request:**
```json
{
  "printerUrl": "http://192.168.1.100:631/ipp/print",
  "labelData": { "patientName": "...", ... },
  "format": "pdf",
  "copies": 1
}
```

---

### `POST /api/printers/test`
Test connectivity to a printer.

---

## Environment Variables (backend/.env)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | API server port |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |
| `LOG_LEVEL` | `info` | Winston log level |
| `DEFAULT_PRINTER_URL` | — | Optional default printer |

---

## Build for Production

```bash
# Frontend
cd frontend
npm run build           # Output: frontend/dist/

# Backend
cd backend
NODE_ENV=production npm start
```

Serve the `frontend/dist/` folder with any static file server (Nginx, Caddy, etc.) pointed at the same domain as the backend (or set the proxy).

---

## PWA Installation

On tablet/phone:
- **Chrome/Edge (Android):** Tap ⋮ menu → "Add to Home Screen"
- **Safari (iOS):** Tap Share → "Add to Home Screen"
- **Chrome (desktop):** Click the install icon in the address bar

---

## Security Notes

- All inputs are validated with `express-validator`
- Logs are PII-sanitized (HIPAA-conscious)
- Rate limiting: 200 req/15min per IP
- No patient data is persisted on the server
- Recent scans stored only in browser `localStorage` (display names only, no full PII)

---

## Tested Printer Compatibility

| Printer Type | Protocol | Notes |
|---|---|---|
| HP LaserJet/OfficeJet | IPP | `/ipp/print` path |
| Canon PIXMA | IPP | `/ipp` path |
| Epson WorkForce | IPP | `/ipp/print` path |
| Brother QL/PT | IPP | `/ipp` path |
| Zebra GK420d | ZPL | TCP port 9100 |
| Zebra ZD410/ZD420 | ZPL | TCP port 9100 |
| Any CUPS printer | IPP | `/printers/{name}` path |

---

## License

MIT — for internal lab use. Not FDA approved for clinical decision-making.
