/**
 * Label Generator Service
 * Generates 2" x 1" blood vial labels as PDF
 * Uses PDFKit for PDF generation and bwip-js for barcodes
 */

const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');
const { logger } = require('../middleware/logger');

// Label dimensions: 2" x 1" at 72 DPI (PDF points)
const LABEL = {
  WIDTH: 144,    // 2 inches * 72 points/inch
  HEIGHT: 72,    // 1 inch * 72 points/inch
  MARGIN: 4,     // 4pt margin
  PADDING: 3,
};

// Small label dimensions for 29mm × 90.3mm paper (Brother DK-1201)
const SMALL_LABEL = {
  WIDTH: 256,     // 90.3mm * 2.835 points/mm (PDF points)
  HEIGHT: 82,    // 29mm * 2.835 points/mm (PDF points)
  MARGIN: 3,     // 3pt margin
  PADDING: 3,
};

/**
 * Generate a Code128 barcode as PNG buffer
 * @param {string} text - Text to encode
 * @param {object} options - bwip-js options
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateBarcode(text, options = {}) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
      bcid: 'code128',
      text: text,
      scale: 2,
      height: 8,
      includetext: false,
      textxalign: 'center',
      ...options
    }, (err, png) => {
      if (err) reject(err);
      else resolve(png);
    });
  });
}

/**
 * Generate a QR code as PNG buffer
 */
async function generateQRCode(text, options = {}) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
      bcid: 'qrcode',
      text: text,
      scale: 2,
      ...options
    }, (err, png) => {
      if (err) reject(err);
      else resolve(png);
    });
  });
}

/**
 * Generate 2x1 inch vial label as PDF buffer
 * @param {object} data - Label data
 * @param {string} data.patientName - Full patient name
 * @param {string} data.dob - Date of birth
 * @param {string} data.sampleId - Unique sample ID
 * @param {string} data.collectionTime - Collection date/time
 * @param {string} [data.licenseNumber] - License number (optional)
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateLabel(data) {
  const { patientName, dob, sampleId, collectionTime, licenseNumber } = data;

  logger.info(`Generating label for sample: ${sampleId}`);

  // Generate barcode image
  let barcodeBuffer;
  try {
    barcodeBuffer = await generateBarcode(sampleId, {
      bcid: 'code128',
      text: sampleId,
      scale: 2,
      height: 10,
      includetext: false,
    });
  } catch (err) {
    logger.warn(`Barcode generation failed: ${err.message}, continuing without barcode`);
    barcodeBuffer = null;
  }

  return new Promise((resolve, reject) => {
    const buffers = [];

    const doc = new PDFDocument({
      size: [LABEL.WIDTH, LABEL.HEIGHT],
      margins: { top: LABEL.MARGIN, bottom: LABEL.MARGIN, left: LABEL.MARGIN, right: LABEL.MARGIN },
      autoFirstPage: true,
      compress: false,
    });

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = LABEL.WIDTH;
    const H = LABEL.HEIGHT;
    const M = LABEL.MARGIN;
    const contentWidth = W - M * 2;

    // ── Background ────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill('#FFFFFF');

    // ── Border ────────────────────────────────────────────────────────────
    doc.rect(1, 1, W - 2, H - 2).lineWidth(0.5).stroke('#000000');

    // ── Layout: left column (text) and right column (barcode) ─────────────
    const barcodeWidth = 50;
    const textWidth = contentWidth - barcodeWidth - 2;

    // ── Patient Name (largest text) ───────────────────────────────────────
    doc.font('Helvetica-Bold')
       .fontSize(7.5)
       .fillColor('#000000')
       .text(
         truncate(patientName.toUpperCase(), 22),
         M,
         M + 1,
         { width: textWidth, lineBreak: false }
       );

    // ── DOB ───────────────────────────────────────────────────────────────
    doc.font('Helvetica')
       .fontSize(5.5)
       .text(
         `DOB: ${dob}`,
         M,
         M + 11,
         { width: textWidth, lineBreak: false }
       );

    // ── Sample ID ─────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold')
       .fontSize(5.5)
       .text(
         `ID: ${sampleId}`,
         M,
         M + 19,
         { width: textWidth, lineBreak: false }
       );

    // ── Collection Time ───────────────────────────────────────────────────
    doc.font('Helvetica')
       .fontSize(5)
       .fillColor('#333333')
       .text(
         `Collected: ${formatCollectionTime(collectionTime)}`,
         M,
         M + 27,
         { width: textWidth, lineBreak: false }
       );

    // ── License Number ────────────────────────────────────────────────────
    if (licenseNumber) {
      doc.font('Helvetica')
         .fontSize(4.5)
         .fillColor('#555555')
         .text(
           `Lic: ${licenseNumber}`,
           M,
           M + 34,
           { width: textWidth, lineBreak: false }
         );
    }

    // ── Divider line ──────────────────────────────────────────────────────
    const dividerX = M + textWidth + 1;
    doc.moveTo(dividerX, M).lineTo(dividerX, H - M).lineWidth(0.3).stroke('#CCCCCC');

    // ── Barcode (right side, vertical) ────────────────────────────────────
    if (barcodeBuffer) {
      const barcodeX = dividerX + 1;
      const barcodeH = H - M * 2 - 8;
      const barcodeW = barcodeWidth - 2;

      try {
        doc.image(barcodeBuffer, barcodeX, M, {
          width: barcodeW,
          height: barcodeH,
          fit: [barcodeW, barcodeH],
          align: 'center',
          valign: 'top'
        });

        // Sample ID text under barcode
        doc.font('Helvetica')
           .fontSize(3.5)
           .fillColor('#000000')
           .text(
             sampleId,
             barcodeX,
             H - M - 7,
             { width: barcodeW, align: 'center', lineBreak: false }
           );
      } catch (imgErr) {
        logger.warn(`Could not embed barcode image: ${imgErr.message}`);
        // Fallback: just text
        doc.font('Helvetica-Bold')
           .fontSize(4)
           .text(sampleId, barcodeX, M + 20, { width: barcodeW, align: 'center' });
      }
    }

    // ── Footer bar ────────────────────────────────────────────────────────
    doc.rect(0, H - 8, W, 8).fill('#1a237e');
    doc.font('Helvetica')
       .fontSize(4)
       .fillColor('#FFFFFF')
       .text(
         'BLOOD SAMPLE  •  HANDLE WITH CARE',
         M,
         H - 6.5,
         { width: W - M * 2, align: 'center', lineBreak: false }
       );

    doc.end();
  });
}

/**
 * Generate small compact label for blood draw tubes with only name and DOB
 * @param {object} data - Label data
 * @param {string} data.patientName - Full patient name
 * @param {string} data.dob - Date of birth
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateSmallLabel(data) {
  const { patientName, dob } = data;

  logger.info(`Generating small blood draw tube label for: ${patientName}`);

  return new Promise((resolve, reject) => {
    const buffers = [];

    const doc = new PDFDocument({
      size: [SMALL_LABEL.WIDTH, SMALL_LABEL.HEIGHT],
      margins: { top: SMALL_LABEL.MARGIN, bottom: SMALL_LABEL.MARGIN, left: SMALL_LABEL.MARGIN, right: SMALL_LABEL.MARGIN },
      autoFirstPage: true,
      compress: false,
    });

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = SMALL_LABEL.WIDTH;
    const H = SMALL_LABEL.HEIGHT;
    const M = SMALL_LABEL.MARGIN;

    // ── Background ────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill('#FFFFFF');

    // ── Border ────────────────────────────────────────────────────────────
    doc.rect(1, 1, W - 2, H - 2).lineWidth(0.5).stroke('#000000');

    // ── Patient Name (text for 29mm × 90.3mm paper) ───────────────────────────────
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor('#000000')
       .text(
         truncate(patientName.toUpperCase(), 30),
         M,
         M + 8,
         { width: W - M * 2, align: 'center', lineBreak: false }
       );

    // ── DOB ───────────────────────────────────────────────────────────────
    doc.font('Helvetica')
       .fontSize(8)
       .fillColor('#333333')
       .text(
         `DOB: ${dob}`,
         M,
         M + 28,
         { width: W - M * 2, align: 'center', lineBreak: false }
       );

    doc.end();
  });
}

/**
 * Generate ZPL label for Zebra printers
 * ZPL for 2" x 1" label at 203 DPI = 406 x 203 dots
 */
function generateZPL(data) {
  const { patientName, dob, sampleId, collectionTime, licenseNumber } = data;
  const name = patientName.toUpperCase().substring(0, 25);
  const collTime = formatCollectionTime(collectionTime);

  const zpl = `
^XA
^PW406
^LL203
^CI28

^FO10,8^A0N,22,22^FD${name}^FS
^FO10,34^A0N,14,14^FDDate of Birth: ${dob}^FS
^FO10,52^A0N,14,14^FDSample ID: ${sampleId}^FS
^FO10,70^A0N,12,12^FDCollected: ${collTime}^FS
${licenseNumber ? `^FO10,87^A0N,10,10^FDLic#: ${licenseNumber}^FS` : ''}

^FO10,105^BY2,2,40
^BCN,40,N,N
^FD${sampleId}^FS

^FO10,152^A0N,10,10^FD${sampleId}^FS

^FO0,172^GB406,2,2^FS
^FO0,174^A0N,12,12^FDBLOOD SAMPLE - HANDLE WITH CARE^FS

^XZ`.trim();

  return zpl;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen - 1) + '…' : str;
}

function formatCollectionTime(timeStr) {
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    return d.toLocaleString('en-US', {
      month: '2-digit', day: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch {
    return timeStr;
  }
}

module.exports = { generateLabel, generateSmallLabel, generateZPL, generateBarcode, generateQRCode };
