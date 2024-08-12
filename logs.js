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
    date TEXT,
    serverName TEXT NULL 
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS duplicate_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userName TEXT,
    message TEXT,
    timestamp INTEGER,
    date TEXT,
    serverName TEXT NULL
  )`);
});

const logMsg = (level, message, serverName, userName = null) => {
  const timestamp = getTimestamp();
  const date = getDate(timestamp);
  const logMessage = `${message}`;

  if (level === 'duplicate') {
    db.run(`INSERT INTO duplicate_logs (userName, message, timestamp, date, serverName) VALUES (?, ?, ?, ?, ?)`, [userName, logMessage, timestamp, date, serverName], (err) => {
      if (err) {
        console.error(err);
      }
    });
  } else {
    db.run(`INSERT INTO logs (level, message, timestamp, date, serverName) VALUES (?, ?, ?, ?, ?)`, [level, logMessage, timestamp, date, serverName], (err) => {
      if (err) {
        console.error(err);
      }
    });
  }
};

const info = (message, serverName) => logMsg('info', message, serverName);
const error = (message, serverName) => logMsg('error', message, serverName);
const warn = (message, serverName) => logMsg('warn', message, serverName);
const duplicate = (userName, message, serverName) => logMsg('duplicate', message, serverName, userName);

const logs = {
  logMsg,
  info,
  error,
  warn,
  duplicate
};

module.exports = logs;

// Example usage
logs.info('Server started', 'Server1');
logs.error('An error occurred', 'Server1');
logs.warn('This is a warning', 'Server1');
logs.duplicate('User1', 'Duplicate message', 'Server1');