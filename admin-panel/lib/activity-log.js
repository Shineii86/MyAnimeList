const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'data', 'activity-log.json');
const MAX_ENTRIES = 500; // Keep last 500 entries

function readLog() {
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLog(entries) {
  // Keep only the latest MAX_ENTRIES
  const trimmed = entries.slice(-MAX_ENTRIES);
  fs.writeFileSync(LOG_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}

function addEntry({ action, target, details, user }) {
  const entries = readLog();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    action,      // 'add', 'edit', 'delete', 'push', 'import', 'generate', 'login', 'settings'
    target,      // anime title, 'README.md', 'GitHub', etc.
    details,     // extra info (old score → new score, etc.)
    user: user || 'admin'
  };
  entries.push(entry);
  writeLog(entries);
  return entry;
}

function getLog({ limit = 50, offset = 0, action, search } = {}) {
  let entries = readLog().reverse(); // Newest first

  if (action) {
    entries = entries.filter(e => e.action === action);
  }
  if (search) {
    const q = search.toLowerCase();
    entries = entries.filter(e =>
      (e.target && e.target.toLowerCase().includes(q)) ||
      (e.details && e.details.toLowerCase().includes(q))
    );
  }

  return {
    total: entries.length,
    entries: entries.slice(offset, offset + limit)
  };
}

function clearLog() {
  writeLog([]);
}

module.exports = { addEntry, getLog, clearLog, readLog };
