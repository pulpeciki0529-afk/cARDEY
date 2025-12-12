const fs = require('fs');
const path = require('path');

function readJSON(relPath, defaultValue) {
  const p = path.join(__dirname, '..', relPath);
  try {
    if (!fs.existsSync(p)) return defaultValue;
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw || 'null') || defaultValue;
  } catch (e) {
    console.error('readJSON error', p, e);
    return defaultValue;
  }
}

function writeJSON(relPath, data) {
  const p = path.join(__dirname, '..', relPath);
  try {
    const tmp = p + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, p);
  } catch (e) {
    console.error('writeJSON error', p, e);
  }
}

module.exports = { readJSON, writeJSON };
