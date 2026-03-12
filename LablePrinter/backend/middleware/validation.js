const { body, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Validate parse-license input
const validateLicense = [
  body('barcodeRawText')
    .notEmpty()
    .withMessage('barcodeRawText is required')
    .isString()
    .withMessage('barcodeRawText must be a string')
    .isLength({ min: 10, max: 5000 })
    .withMessage('barcodeRawText length is invalid'),
  handleValidationErrors
];

// Validate generate-label input
const validateLabel = [
  body('patientName')
    .notEmpty().withMessage('patientName is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 }),
  body('dob')
    .notEmpty().withMessage('dob is required')
    .isString(),
  body('sampleId')
    .notEmpty().withMessage('sampleId is required')
    .isString()
    .isLength({ min: 4, max: 50 }),
  body('collectionTime')
    .notEmpty().withMessage('collectionTime is required')
    .isString(),
  handleValidationErrors
];

// Validate print input
const validatePrint = [
  body('printerUrl')
    .notEmpty().withMessage('printerUrl is required')
    .isString(),
  body('labelData')
    .notEmpty().withMessage('labelData is required'),
  handleValidationErrors
];

module.exports = { validateLicense, validateLabel, validatePrint, handleValidationErrors };
