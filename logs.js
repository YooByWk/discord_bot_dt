const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const getTimestamp = () => Date.now();
const getDate = (timestamp) => new Date(timestamp).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

const dbPath = path.join(__dirname, './logs/bot_logs.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT,
    message TEXT,
    timestamp INTEGER,
    date TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS duplicate_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userName TEXT,
    message TEXT,
    timestamp INTEGER,
    date TEXT
  )`);
});

const logMsg = (level, message, userName = null) => {
  const timestamp = getTimestamp();
  const date = getDate(timestamp);
  const logMessage = `${message}`;

  if (level === 'duplicate') {
    db.run(`INSERT INTO duplicate_logs (userName, message, timestamp, date) VALUES (?, ?, ?, ?)`, [userName, logMessage, timestamp, date], (err) => {
      if (err) {
        console.error(err);
      }
    });
  } else {
    db.run(`INSERT INTO logs (level, message, timestamp, date) VALUES (?, ?, ?, ?)`, [level, logMessage, timestamp, date], (err) => {
      if (err) {
        console.error(err);
      }
    });
  }
};

const info = (message) => logMsg('info', message);
const error = (message) => logMsg('error', message);
const warn = (message) => logMsg('warn', message);
const duplicate = (userName, message) => logMsg('duplicate', message, userName);

const logs = {
  logMsg,
  info,
  error,
  warn,
  duplicate
};

module.exports = logs;