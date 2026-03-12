/**
 * WiFi Printer Service
 * Supports IPP (Internet Printing Protocol) for WiFi network printers
 * Works with most modern WiFi printers (HP, Canon, Epson, Brother, Zebra)
 */

const ipp = require('@sealsystems/ipp');
const { logger } = require('../middleware/logger');

/**
 * Discover printers via common IPP endpoints
 * Returns a list of printer candidates from common network addresses
 */
async function discoverPrinters(networkRange = null) {
  // Return common mDNS/Bonjour IPP printer paths
  // In a real deployment, this would use mDNS discovery
  // For now, provide commonly used IPP paths
  const commonPaths = [
    '/ipp/print',     // Most HP, Canon, Epson
    '/ipp',           // Some HP printers
    '/IPP',           // Zebra printers
    '/ipp/printer',   // Zebra, CUPS
    '/printers/ipp',  // Some printers
  ];

  const suggestions = commonPaths.map(path => ({
    path,
    description: `IPP endpoint: ${path}`
  }));

  return {
    message: 'Enter your printer IP address and select a path below',
    commonPaths: suggestions,
    examples: [
      'http://192.168.1.100:631/ipp/print',
      'http://192.168.1.100:631/ipp',
      'ipp://192.168.1.100/ipp/print',
    ]
  };
}

/**
 * Get printer capabilities / status
 * @param {string} printerUrl - Full IPP URL of the printer
 */
async function getPrinterInfo(printerUrl) {
  return new Promise((resolve, reject) => {
    const normalizedUrl = normalizeIppUrl(printerUrl);

    const printer = new ipp.Printer(normalizedUrl);
    const msg = {
      'operation-attributes-tag': {
        'attributes-charset': 'utf-8',
        'attributes-natural-language': 'en',
        'printer-uri': normalizedUrl,
        'requesting-user-name': 'LabSystem',
        'requested-attributes': [
          'printer-name',
          'printer-state',
          'printer-state-reasons',
          'printer-make-and-model',
          'printer-info',
          'media-supported',
          'printer-resolution-supported',
        ]
      }
    };

    printer.execute('Get-Printer-Attributes', msg, (err, res) => {
      if (err) {
        logger.warn(`Could not get printer info from ${printerUrl}: ${err.message}`);
        return reject(new Error(`Cannot reach printer at ${printerUrl}: ${err.message}`));
      }

      const attrs = res['printer-attributes-tag'] || {};
      resolve({
        url: printerUrl,
        name: attrs['printer-name'] || 'Unknown Printer',
        state: attrs['printer-state'] || 'unknown',
        stateReasons: attrs['printer-state-reasons'] || [],
        model: attrs['printer-make-and-model'] || '',
        info: attrs['printer-info'] || '',
        media: attrs['media-supported'] || [],
      });
    });
  });
}

/**
 * Send a PDF print job to an IPP printer
 * @param {string} printerUrl - Full IPP URL (e.g., http://192.168.1.10:631/ipp/print)
 * @param {Buffer} pdfBuffer - PDF file as Buffer
 * @param {object} [options] - Print job options
 * @returns {Promise<object>} Print job result
 */
async function printPDF(printerUrl, pdfBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const normalizedUrl = normalizeIppUrl(printerUrl);
    logger.info(`Sending print job to: ${normalizedUrl}`);

    const printer = new ipp.Printer(normalizedUrl);

    const jobOptions = {
      'operation-attributes-tag': {
        'attributes-charset': 'utf-8',
        'attributes-natural-language': 'en',
        'printer-uri': normalizedUrl,
        'requesting-user-name': 'LabSystem',
        'job-name': options.jobName || `Blood Vial Label - ${new Date().toISOString()}`,
        'document-format': 'application/pdf',
      },
      'job-attributes-tag': {
        'copies': options.copies || 1,
        'print-quality': 4, // normal
        ...(options.mediaSize && { 'media': options.mediaSize }),
      },
      data: pdfBuffer
    };

    printer.execute('Print-Job', jobOptions, (err, res) => {
      if (err) {
        logger.error(`Print job failed: ${err.message}`);
        return reject(new Error(`Print job failed: ${err.message}`));
      }

      const statusCode = res['status-code'];
      logger.info(`Print job response status: ${statusCode}`);

      if (statusCode === 'successful-ok' || statusCode === 'successful-ok-ignored-or-substituted-attributes') {
        const jobAttrs = res['job-attributes-tag'] || {};
        resolve({
          success: true,
          jobId: jobAttrs['job-id'],
          jobState: jobAttrs['job-state'],
          jobUri: jobAttrs['job-uri'],
          message: 'Print job sent successfully'
        });
      } else {
        logger.warn(`Print job returned status: ${statusCode}`);
        resolve({
          success: false,
          statusCode,
          message: `Printer returned status: ${statusCode}`,
          rawResponse: res
        });
      }
    });
  });
}

/**
 * Send ZPL data to a Zebra printer via raw TCP socket
 * @param {string} printerIp - Printer IP address
 * @param {number} port - TCP port (default 9100 for raw Zebra)
 * @param {string} zplData - ZPL label data
 */
async function printZPL(printerIp, port = 9100, zplData) {
  const net = require('net');

  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let connected = false;

    client.setTimeout(5000);

    client.connect(port, printerIp, () => {
      connected = true;
      logger.info(`Connected to Zebra printer at ${printerIp}:${port}`);
      client.write(zplData, 'utf8', () => {
        client.end();
      });
    });

    client.on('close', () => {
      if (connected) {
        resolve({ success: true, message: `ZPL sent to ${printerIp}:${port}` });
      }
    });

    client.on('timeout', () => {
      client.destroy();
      reject(new Error(`Connection timeout to ${printerIp}:${port}`));
    });

    client.on('error', (err) => {
      reject(new Error(`ZPL print error: ${err.message}`));
    });
  });
}

/**
 * Test printer connectivity
 */
async function testPrinterConnection(printerUrl) {
  try {
    const info = await getPrinterInfo(printerUrl);
    return { connected: true, printer: info };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

/**
 * Normalize printer URL to valid IPP format
 * Accepts: IP address, http URL, ipp URL
 */
function normalizeIppUrl(url) {
  if (!url) throw new Error('Printer URL is required');

  // Already a full URL
  if (url.startsWith('ipp://') || url.startsWith('ipps://')) {
    return url;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Bare IP address - use default IPP path
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url)) {
    return `http://${url}:631/ipp/print`;
  }

  // IP with port
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(url)) {
    return `http://${url}/ipp/print`;
  }

  return url;
}

module.exports = {
  discoverPrinters,
  getPrinterInfo,
  printPDF,
  printZPL,
  testPrinterConnection,
  normalizeIppUrl
};
