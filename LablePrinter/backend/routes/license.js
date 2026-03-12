const express = require('express');
const router = express.Router();
const { parseLicense } = require('../services/licenseParser');
const { validateLicense } = require('../middleware/validation');
const { logger } = require('../middleware/logger');

/**
 * POST /api/parse-license
 * Parse AAMVA PDF417 barcode data from a US driver's license
 *
 * Body: { barcodeRawText: string }
 * Returns: { firstName, lastName, dob, licenseNumber, address, expirationDate, ... }
 */
router.post('/parse-license', validateLicense, (req, res) => {
  try {
    const { barcodeRawText } = req.body;

    const parsed = parseLicense(barcodeRawText);

    // HIPAA: Log only non-PII info
    logger.info(`License parsed successfully - state: ${parsed.addressComponents?.state}, version: ${parsed.aamvaVersion}`);

    res.json({
      success: true,
      data: parsed
    });
  } catch (err) {
    logger.error(`Parse license error: ${err.message}`);
    res.status(422).json({
      success: false,
      error: err.message || 'Failed to parse barcode data',
      hint: 'Ensure the barcode is a valid AAMVA PDF417 driver\'s license barcode'
    });
  }
});

module.exports = router;
