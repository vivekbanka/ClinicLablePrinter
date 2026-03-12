const winston = require('winston');
const path = require('path');

// HIPAA-safe logger: strips PII from log messages
const sanitizePII = (message) => {
  if (typeof message !== 'string') return message;
  return message
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN-REDACTED]')
    .replace(/\b(DOB|dob|DateOfBirth):\s*[\d\/\-]+/gi, '$1: [REDACTED]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD-REDACTED]');
};

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    const safe = sanitizePII(message);
    return `[${timestamp}] ${level.toUpperCase()}: ${safe}${stack ? `\n${stack}` : ''}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = { logger, sanitizePII };
