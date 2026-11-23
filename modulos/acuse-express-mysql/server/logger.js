'use strict';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const configuredLevel = LEVELS[String(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? 2;

let requestCounter = 0;

function write(level, message, data) {
  if (LEVELS[level] > configuredLevel) return;
  const entry = Object.assign(
    { ts: new Date().toISOString(), level, message },
    data || {}
  );
  const line = JSON.stringify(entry) + '\n';
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

function requestLogger() {
  return function logRequest(req, res, next) {
    requestCounter = requestCounter >= Number.MAX_SAFE_INTEGER ? 1 : requestCounter + 1;
    const reqId = requestCounter;
    const start = Date.now();
    req._logId = reqId;

    res.on('finish', () => {
      const ms = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      write(level, 'http', {
        reqId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms
      });
    });

    next();
  };
}

module.exports = {
  error: (message, data) => write('error', message, data),
  warn: (message, data) => write('warn', message, data),
  info: (message, data) => write('info', message, data),
  debug: (message, data) => write('debug', message, data),
  requestLogger
};
