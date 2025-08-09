const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const RANKINGS_FILE = path.join(DATA_DIR, 'rankings.json');
const MAX_RANKS_PER_DIFFICULTY = 200; // 저장 상한
const DISPLAY_RANKS = 50; // 조회 상한

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // 정적 파일: html, 이미지, 폰트 등

// 데이터 디렉토리 및 파일 보장
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(RANKINGS_FILE)) {
  fs.writeFileSync(RANKINGS_FILE, JSON.stringify({}, null, 2), 'utf8');
}

// 랭킹 로드
let rankings = {};
try {
  rankings = JSON.parse(fs.readFileSync(RANKINGS_FILE, 'utf8')) || {};
} catch (e) {
  console.error('랭킹 파일 읽기 오류:', e);
  rankings = {};
}

function saveRankings() {
  try {
    fs.writeFileSync(RANKINGS_FILE, JSON.stringify(rankings, null, 2), 'utf8');
  } catch (e) {
    console.error('랭킹 파일 저장 오류:', e);
  }
}

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Server is healthy' });
});

// 랭킹 조회
app.get('/api/rank', (req, res) => {
  const handSize = req.query.hand;
  if (!handSize) {
    return res.status(400).json({ error: 'hand parameter is required' });
  }
  const current = (rankings[handSize] || [])
    .slice()
    .sort((a, b) => a.ms - b.ms)
    .slice(0, DISPLAY_RANKS);
  res.json({ hand: handSize, ranks: current });
});

// 점수 제출
app.post('/api/submit', (req, res) => {
  const { hand, nickname, ms } = req.body || {};
  if (!hand || !nickname || typeof ms !== 'number' || !(ms > 0)) {
    return res.status(400).json({ error: 'Invalid submission data' });
  }
  const cleanNickname = String(nickname).trim().slice(0, 20);
  if (!cleanNickname) {
    return res.status(400).json({ error: 'Nickname cannot be empty' });
  }
  if (!rankings[hand]) rankings[hand] = [];
  rankings[hand].push({ nickname: cleanNickname, ms, at: new Date().toISOString() });
  rankings[hand].sort((a, b) => a.ms - b.ms);
  rankings[hand] = rankings[hand].slice(0, MAX_RANKS_PER_DIFFICULTY);
  saveRankings();
  res.json({ ok: true, message: 'Score submitted successfully' });
});

// 루트에서 게임 페이지 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'card-rush.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Simple ranking server for CARD RUSH
// Run: npm i express cors && node server.js

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Data storage
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'rankings.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ '3': [], '5': [], '10': [] }, null, 2),
      'utf-8'
    );
  }
}

function readStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { '3': parsed['3'] || [], '5': parsed['5'] || [], '10': parsed['10'] || [] };
  } catch (e) {
    return { '3': [], '5': [], '10': [] };
  }
}

function writeStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helpers
const MAX_NICK_LEN = 20;
const SAFE_NICK_REGEX = /[\p{L}0-9 _.-]+/u; // letters, digits, space, _, ., -

function sanitizeNickname(nick) {
  if (typeof nick !== 'string') return 'Player';
  const trimmed = nick.trim().slice(0, MAX_NICK_LEN);
  const match = trimmed.match(SAFE_NICK_REGEX);
  return match ? match[0] : 'Player';
}

function normalizeHand(hand) {
  const n = Number(hand);
  return n === 3 || n === 5 || n === 10 ? String(n) : '5';
}

// Routes
// Serve the SPA HTML at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'card-rush.html'));
});
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Get rankings for a hand size
app.get('/api/rank', (req, res) => {
  const handKey = normalizeHand(req.query.hand);
  const store = readStore();
  const ranks = (store[handKey] || [])
    .slice()
    .sort((a, b) => a.ms - b.ms)
    .slice(0, 50);
  res.json({ hand: Number(handKey), ranks });
});

// Submit a score
app.post('/api/submit', (req, res) => {
  const { hand, nickname, ms } = req.body || {};
  const handKey = normalizeHand(hand);
  const timeMs = Number(ms);
  if (!Number.isFinite(timeMs) || timeMs <= 0 || timeMs > 10 * 60 * 1000) {
    return res.status(400).json({ ok: false, error: 'Invalid time' });
  }
  const nick = sanitizeNickname(nickname);

  const store = readStore();
  const entry = { nickname: nick, ms: timeMs, at: Date.now() };
  store[handKey] = store[handKey] || [];
  store[handKey].push(entry);
  // keep only top 200 for this hand
  store[handKey] = store[handKey]
    .slice()
    .sort((a, b) => a.ms - b.ms)
    .slice(0, 200);
  writeStore(store);

  res.json({ ok: true });
});

// Serve static assets (images, css, js)
app.use(express.static(__dirname));

app.listen(PORT, () => {
  ensureStore();
  console.log(`CARD RUSH ranking server running on http://localhost:${PORT}`);
});


