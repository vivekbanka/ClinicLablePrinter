/**
 * AAMVA Driver's License Parser
 * Parses PDF417 barcode data from US Driver's Licenses
 * Standard: AAMVA DL/ID Card Design Standard (2020)
 *
 * Field code reference:
 * https://www.aamva.org/identity/
 */

const { logger } = require('../middleware/logger');

// ─── AAMVA Field Definitions ──────────────────────────────────────────────────
const AAMVA_FIELDS = {
  // Name fields
  DCS: 'familyName',       // Customer Family Name
  DAC: 'givenName',        // Customer Given Name (first)
  DAD: 'middleName',       // Customer Middle Name
  DCT: 'fullName',         // Customer Full Name (alt)
  DAA: 'fullNameAlt',      // Customer Full Name (old format)

  // Document info
  DAQ: 'licenseNumber',    // Customer ID Number
  DBA: 'expirationDate',   // Document Expiration Date
  DBD: 'issueDate',        // Document Issue Date
  DBC: 'sex',              // Physical Description – Sex
  DAU: 'height',           // Physical Description – Height
  DAY: 'eyeColor',         // Physical Description – Eye Color
  DCG: 'country',          // Country Identification

  // DOB
  DBB: 'dateOfBirth',      // Date of Birth

  // Address
  DAG: 'addressStreet1',   // Address – Street 1
  DAH: 'addressStreet2',   // Address – Street 2
  DAI: 'addressCity',      // Address – City
  DAJ: 'addressState',     // Address – State/Province
  DAK: 'addressPostal',    // Address – Postal Code

  // Compliance
  DDA: 'complianceType',   // Compliance Type
  DDB: 'cardRevisionDate', // Card Revision Date
  DDC: 'hazmatExpiration', // HAZMAT Endorsement Expiration Date
  DDD: 'limitedDurationDoc', // Limited Duration Document Indicator
  DCF: 'documentDiscriminator', // Document Discriminator
  DCK: 'inventoryControlNumber', // Inventory Control Number
};

/**
 * Parse AAMVA date strings to a readable format
 * AAMVA dates can be MMDDYYYY or YYYYMMDD depending on version
 */
function parseAamvaDate(dateStr) {
  if (!dateStr || dateStr.length < 8) return dateStr;

  let month, day, year;

  if (dateStr.length === 8) {
    if (parseInt(dateStr.substring(0, 4)) > 1900) {
      // YYYYMMDD format
      year = dateStr.substring(0, 4);
      month = dateStr.substring(4, 6);
      day = dateStr.substring(6, 8);
    } else {
      // MMDDYYYY format
      month = dateStr.substring(0, 2);
      day = dateStr.substring(2, 4);
      year = dateStr.substring(4, 8);
    }
    return `${month}/${day}/${year}`;
  }

  return dateStr;
}

/**
 * Parse the subfile header to extract AAMVA version info
 */
function parseHeader(rawData) {
  const headerMatch = rawData.match(/ANSI\s+(\d{6})(\d{2})(\d{2})/);
  if (!headerMatch) return { version: 'unknown', aamvaVersion: 0 };

  const issuerCode = headerMatch[1];
  const aamvaVersion = parseInt(headerMatch[2]);
  const numberOfEntries = parseInt(headerMatch[3]);

  return { issuerCode, aamvaVersion, numberOfEntries };
}

/**
 * Extract subfiles from AAMVA barcode data
 */
function extractSubfiles(rawData) {
  const subfiles = {};

  // Find DL or ID subfile designators
  const subfileMatches = rawData.matchAll(/D[LI]([A-Z]{3}[^\r\n]*[\r\n]?)+/g);

  for (const match of subfileMatches) {
    const content = match[0];
    const lines = content.split(/[\r\n]+/);
    const designator = lines[0].substring(0, 2); // DL or ID
    subfiles[designator] = lines.slice(1).join('\n');
  }

  return subfiles;
}

/**
 * Parse individual field codes from subfile content
 */
function parseFieldCodes(content) {
  const fields = {};

  // Split by newlines and extract 3-char codes
  const lines = content.split(/[\r\n]+/);

  for (const line of lines) {
    if (line.length < 3) continue;

    const code = line.substring(0, 3);
    const value = line.substring(3).trim();

    if (AAMVA_FIELDS[code] && value) {
      fields[AAMVA_FIELDS[code]] = value;
      // Also keep raw code for debugging
      fields[`_raw_${code}`] = value;
    }
  }

  return fields;
}

/**
 * Extract name parts - handles various AAMVA name formats
 */
function extractName(fields) {
  let firstName = '';
  let lastName = '';
  let middleName = '';

  if (fields.familyName) {
    lastName = fields.familyName.trim();
  }
  if (fields.givenName) {
    firstName = fields.givenName.trim();
  }
  if (fields.middleName) {
    middleName = fields.middleName.trim();
  }

  // Some licenses use fullName in "LAST,FIRST MIDDLE" format
  if ((!firstName || !lastName) && fields.fullName) {
    const parts = fields.fullName.split(',');
    if (parts.length >= 2) {
      lastName = parts[0].trim();
      const firstMiddle = parts[1].trim().split(' ');
      firstName = firstMiddle[0] || '';
      middleName = firstMiddle.slice(1).join(' ') || middleName;
    }
  }

  // Old format: DAA with comma-separated
  if ((!firstName || !lastName) && fields.fullNameAlt) {
    const parts = fields.fullNameAlt.split(',');
    if (parts.length >= 2) {
      lastName = parts[0].trim();
      const firstMiddle = parts[1].trim().split(' ');
      firstName = firstMiddle[0] || '';
      middleName = firstMiddle.slice(1).join(' ') || middleName;
    }
  }

  return { firstName, lastName, middleName };
}

/**
 * Main parser function
 * @param {string} barcodeRawText - Raw PDF417 barcode data
 * @returns {object} Parsed patient data
 */
function parseLicense(barcodeRawText) {
  if (!barcodeRawText) {
    throw new Error('Barcode data is empty');
  }

  logger.info(`Parsing license barcode, length: ${barcodeRawText.length}`);

  try {
    // Normalize line endings
    const normalized = barcodeRawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    // Parse header
    const header = parseHeader(normalized);
    logger.info(`AAMVA version: ${header.aamvaVersion}, Issuer: ${header.issuerCode}`);

    // Parse all field codes directly from the full barcode
    const allFields = parseFieldCodes(normalized);

    // Extract subfile-specific data
    const subfiles = extractSubfiles(normalized);
    let subfileFields = {};
    for (const [designator, content] of Object.entries(subfiles)) {
      const parsed = parseFieldCodes(content);
      subfileFields = { ...subfileFields, ...parsed };
    }

    const mergedFields = { ...allFields, ...subfileFields };

    // Extract structured data
    const { firstName, lastName, middleName } = extractName(mergedFields);

    const dob = parseAamvaDate(mergedFields.dateOfBirth || '');
    const expirationDate = parseAamvaDate(mergedFields.expirationDate || '');
    const issueDate = parseAamvaDate(mergedFields.issueDate || '');

    // Build address
    const addressParts = [
      mergedFields.addressStreet1,
      mergedFields.addressStreet2,
    ].filter(Boolean);

    const address = {
      street: addressParts.join(', '),
      city: mergedFields.addressCity || '',
      state: mergedFields.addressState || '',
      postal: (mergedFields.addressPostal || '').replace(/\s+/g, '').substring(0, 10)
    };

    const fullAddress = [
      address.street,
      address.city,
      address.state,
      address.postal
    ].filter(Boolean).join(', ');

    const result = {
      firstName: toTitleCase(firstName),
      lastName: toTitleCase(lastName),
      middleName: toTitleCase(middleName),
      fullName: [firstName, middleName, lastName].filter(Boolean).map(toTitleCase).join(' '),
      dateOfBirth: dob,
      licenseNumber: mergedFields.licenseNumber || '',
      expirationDate,
      issueDate,
      address: fullAddress,
      addressComponents: address,
      sex: parseSex(mergedFields.sex),
      height: mergedFields.height || '',
      eyeColor: mergedFields.eyeColor || '',
      country: mergedFields.country || 'USA',
      issuerCode: header.issuerCode || '',
      aamvaVersion: header.aamvaVersion,
      // Metadata
      _parsedAt: new Date().toISOString(),
    };

    logger.info(`License parsed successfully for: ${result.lastName}`);
    return result;

  } catch (err) {
    logger.error(`License parse error: ${err.message}`);
    throw new Error(`Failed to parse license barcode: ${err.message}`);
  }
}

function parseSex(code) {
  const sexMap = { '1': 'Male', '2': 'Female', '9': 'Not specified' };
  return sexMap[code] || code || '';
}

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = { parseLicense, parseAamvaDate, toTitleCase };
