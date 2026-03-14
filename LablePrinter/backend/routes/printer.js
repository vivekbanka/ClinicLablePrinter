const express = require('express');
const router = express.Router();
const {
  discoverPrinters,
  getPrinterInfo,
  printPDF,
  printZPL,
  testPrinterConnection
} = require('../services/printerService');
const { generateLabel, generateSmallLabel, generateZPL } = require('../services/labelGenerator');
const { logger } = require('../middleware/logger');

/**
 * GET /api/printers/discover
 * Returns guidance for finding WiFi printers on the network
 */
router.get('/printers/discover', async (req, res) => {
  try {
    const result = await discoverPrinters();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/printers/info
 * Get info/capabilities for a specific printer
 * Body: { printerUrl: string }
 */
router.post('/printers/info', async (req, res) => {
  const { printerUrl } = req.body;
  if (!printerUrl) {
    return res.status(400).json({ success: false, error: 'printerUrl is required' });
  }
  try {
    const info = await getPrinterInfo(printerUrl);
    res.json({ success: true, printer: info });
  } catch (err) {
    res.status(502).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/printers/test
 * Test connectivity to a printer
 * Body: { printerUrl: string }
 */
router.post('/printers/test', async (req, res) => {
  const { printerUrl } = req.body;
  if (!printerUrl) {
    return res.status(400).json({ success: false, error: 'printerUrl is required' });
  }
  try {
    const result = await testPrinterConnection(printerUrl);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(502).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/print
 * Send a label directly to a WiFi/IPP printer
 * Body: { printerUrl, labelData: { patientName, dob, sampleId, collectionTime, licenseNumber }, format?, copies? }
 * format options: 'pdf' (2x1"), 'small' (0.66x3.4"), 'zpl'
 */
router.post('/print', async (req, res) => {
  const { printerUrl, labelData, format = 'pdf', copies = 1 } = req.body;

  if (!printerUrl) {
    return res.status(400).json({ success: false, error: 'printerUrl is required' });
  }
  if (!labelData) {
    return res.status(400).json({ success: false, error: 'labelData is required' });
  }

  logger.info(`Print job requested - printer: ${printerUrl}, format: ${format}`);

  try {
    if (format === 'zpl') {
      // Extract IP from URL for ZPL raw socket
      const ipMatch = printerUrl.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
      if (!ipMatch) {
        return res.status(400).json({ success: false, error: 'Invalid printer IP in URL for ZPL printing' });
      }
      const zplData = generateZPL(labelData);
      const result = await printZPL(ipMatch[0], 9100, zplData);
      return res.json({ success: true, ...result });
    }

    let pdfBuffer;
    let mediaSize;

    if (format === 'small') {
      // Small label for Brother QL-810W (0.66" x 3.4")
      pdfBuffer = await generateSmallLabel(labelData);
      mediaSize = 'custom_3.4x0.66in_3.4x0.66in';
    } else {
      // Regular PDF (2" x 1")
      pdfBuffer = await generateLabel(labelData);
      mediaSize = 'custom_2x1in_2x1in';
    }

    const result = await printPDF(printerUrl, pdfBuffer, {
      copies,
      jobName: `Lab Label - ${labelData.sampleId}`,
      mediaSize
    });

    res.json({ success: true, ...result });

  } catch (err) {
    logger.error(`Print job error: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message,
      hint: 'Check that the printer is online and the URL is correct'
    });
  }
});

/**
 * POST /api/print/pdf-stream
 * Generate label PDF and return as download for browser printing
 * This allows the browser to open the print dialog with the generated PDF
 * Body: { labelData, format? }
 * format options: 'pdf' (2x1"), 'small' (0.66x3.4")
 */
router.post('/print/pdf-stream', async (req, res) => {
  const { labelData, format = 'pdf' } = req.body;

  if (!labelData) {
    return res.status(400).json({ success: false, error: 'labelData is required' });
  }

  try {
    let pdfBuffer;
    let filename;

    if (format === 'small') {
      pdfBuffer = await generateSmallLabel(labelData);
      filename = `small-label-${labelData.sampleId || 'sample'}.pdf`;
    } else {
      pdfBuffer = await generateLabel(labelData);
      filename = `label-${labelData.sampleId || 'sample'}.pdf`;
    }

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${filename}"`);
    res.set('Content-Length', pdfBuffer.length);
    res.set('Cache-Control', 'no-cache');
    res.set('X-Label-Format', format);
    res.send(pdfBuffer);
  } catch (err) {
    logger.error(`PDF stream error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
