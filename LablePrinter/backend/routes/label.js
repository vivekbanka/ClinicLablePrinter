const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { generateLabel, generateZPL } = require('../services/labelGenerator');
const { validateLabel } = require('../middleware/validation');
const { logger } = require('../middleware/logger');

/**
 * POST /api/generate-label
 * Generate a 2x1 inch vial label as PDF
 *
 * Body: { patientName, dob, sampleId, collectionTime, licenseNumber?, format? }
 * Returns: PDF binary stream or ZPL string
 */
router.post('/generate-label', validateLabel, async (req, res) => {
  try {
    const {
      patientName,
      dob,
      sampleId,
      collectionTime,
      licenseNumber,
      format = 'pdf'   // 'pdf' | 'zpl'
    } = req.body;

    const labelData = {
      patientName,
      dob,
      sampleId: sampleId || generateSampleId(),
      collectionTime: collectionTime || new Date().toISOString(),
      licenseNumber
    };

    logger.info(`Generating ${format.toUpperCase()} label - Sample: ${labelData.sampleId}`);

    if (format === 'zpl') {
      const zplData = generateZPL(labelData);
      res.set('Content-Type', 'application/vnd.zebra-zpl');
      res.set('X-Sample-Id', labelData.sampleId);
      return res.send(zplData);
    }

    // Default: PDF
    const pdfBuffer = await generateLabel(labelData);

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="label-${labelData.sampleId}.pdf"`);
    res.set('Content-Length', pdfBuffer.length);
    res.set('X-Sample-Id', labelData.sampleId);
    res.send(pdfBuffer);

  } catch (err) {
    logger.error(`Generate label error: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate label'
    });
  }
});

/**
 * POST /api/generate-sample-id
 * Generate a unique sample ID for a new collection
 */
router.post('/generate-sample-id', (req, res) => {
  const sampleId = generateSampleId();
  res.json({ success: true, sampleId });
});

function generateSampleId() {
  const now = new Date();
  const datePart = [
    now.getFullYear().toString().slice(-2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const uniquePart = uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `LAB-${datePart}-${uniquePart}`;
}

module.exports = router;
