const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

async function ensureDir() {
  try { await fs.promises.mkdir(LOG_DIR, { recursive: true }); }
  catch (e) { /* ignore */ }
}

async function log(entry) {
  try {
    await ensureDir();
    const line = JSON.stringify({ ...entry, ts: new Date().toISOString() }) + '\n';
    await fs.promises.appendFile(LOG_FILE, line, 'utf8');
  } catch (e) {
    // Logging must never fail the request
    console.error('Audit log error:', e.message);
  }
}

module.exports = { log };