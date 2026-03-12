import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' }
});

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.error || error.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

// ─── License API ──────────────────────────────────────────────────────────────

/**
 * Parse AAMVA barcode text into structured patient data
 * @param {string} barcodeRawText
 */
export async function parseLicense(barcodeRawText) {
  const { data } = await api.post('/parse-license', { barcodeRawText });
  return data;
}

// ─── Label API ────────────────────────────────────────────────────────────────

/**
 * Generate a new unique sample ID
 */
export async function generateSampleId() {
  const { data } = await api.post('/generate-sample-id');
  return data.sampleId;
}

/**
 * Generate a PDF label and return as Blob for browser printing
 * @param {object} labelData
 */
export async function generateLabelPDF(labelData) {
  const response = await api.post('/generate-label', labelData, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' }
  });
  return response.data; // Blob
}

/**
 * Get label as base64 for preview
 */
export async function generateLabelBase64(labelData) {
  const blob = await generateLabelPDF(labelData);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// ─── Printer API ──────────────────────────────────────────────────────────────

/**
 * Get printer discovery info
 */
export async function discoverPrinters() {
  const { data } = await api.get('/printers/discover');
  return data;
}

/**
 * Get printer info/status
 */
export async function getPrinterInfo(printerUrl) {
  const { data } = await api.post('/printers/info', { printerUrl });
  return data;
}

/**
 * Test printer connectivity
 */
export async function testPrinter(printerUrl) {
  const { data } = await api.post('/printers/test', { printerUrl });
  return data;
}

/**
 * Send print job directly to IPP printer
 */
export async function sendPrintJob(printerUrl, labelData, options = {}) {
  const { data } = await api.post('/print', {
    printerUrl,
    labelData,
    format: options.format || 'pdf',
    copies: options.copies || 1
  });
  return data;
}

/**
 * Get printable PDF stream URL for browser print dialog
 */
export function getPrintStreamUrl() {
  return '/api/print/pdf-stream';
}

export default api;
