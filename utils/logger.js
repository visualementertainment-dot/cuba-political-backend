const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logFile = path.join(logsDir, 'app.log');
const errorFile = path.join(logsDir, 'error.log');

class Logger {
  log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;

    console.log(logMessage);

    // Escribir en archivo
    if (level === 'ERROR') {
      fs.appendFileSync(errorFile, logMessage + '\n');
    }
    fs.appendFileSync(logFile, logMessage + '\n');
  }

  info(message) {
    this.log('INFO', message);
  }

  error(message) {
    this.log('ERROR', message);
  }

  warn(message) {
    this.log('WARN', message);
  }

  debug(message) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('DEBUG', message);
    }
  }
}

module.exports = new Logger();