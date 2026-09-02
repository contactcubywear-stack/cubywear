import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    hint: "Glisse ton doigt pour déplacer ta raquette et marque des buts",
    you: "Toi", ai: "Bot",
    win: "🏆 Tu as gagné !", lose: "😢 Le bot a gagné !",
    finalScore: "Score final"
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    hint: "Drag your finger to move your paddle and score goals",
    you: "You", ai: "Bot",
    win: "🏆 You won!", lose: "😢 The bot won!",
    finalScore: "Final score"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile: { aiSpeed: 2.6, aiReact: 0.55, friction: 0.994, maxSpeed: 9 },
  moyen: { aiSpeed: 3.4, aiReact: 0.7, friction: 0.996, maxSpeed: 10.5 },
  difficile: { aiSpeed: 4.3, aiReact: 0.85, friction: 0.997, maxSpeed: 12 },
  impossible: { aiSpeed: 5.4, aiReact: 0.97, friction: 0.998, maxSpeed: 14 }
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const PADDLE_R = 24;
const PUCK_R = 11;
const GOAL_W = 120;
const WIN_SCORE = 7;

let cfg = DIFFICULTIES.moyen;
let player = { x: W / 2, y: H - 60 };
let playerPrev = { x: W / 2, y: H - 60 };
let ai = { x: W / 2, y: 60 };
let puck = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
let scorePlayer = 0;
let scoreAi = 0;
let over = true;
let pointerActive = false;

function resetPuck(dirTowardPlayer) {
  puck.x = W / 2;
  puck.y = H / 2;
  const angle = (Math.random() - 0.5) * 1.2;
  const speed = 3.5;
  puck.vx = Math.sin(angle) * speed;
  puck.vy = (dirTowardPlayer ? 1 : -1) * Math.cos(angle) * speed;
}

function clampPaddle(p, minY, maxY) {
  p.x = Math.max(PADDLE_R, Math.min(W - PADDLE_R, p.x));
  p.y = Math.max(minY, Math.min(maxY, p.y));
}

function updateAI() {
  const targetX = puck.vy < 0 ? puck.x : W / 2 + (puck.x - W / 2) * 0.3;
  const targetY = puck.vy < 0 ? Math.min(puck.y, H / 2 - PADDLE_R) : H * 0.22;
  ai.x += (targetX - ai.x) * cfg.aiReact * 0.12;
  ai.y += (targetY - ai.y) * cfg.aiReact * 0.1;

  const dx = ai.x - (ai.prevX ?? ai.x);
  const dy = ai.y - (ai.prevY ?? ai.y);
  const dist = Math.hypot(dx, dy);
  if (dist > cfg.aiSpeed) {
    ai.x = (ai.prevX ?? ai.x) + (dx / dist) * cfg.aiSpeed;
    ai.y = (ai.prevY ?? ai.y) + (dy / dist) * cfg.aiSpeed;
  }
  clampPaddle(ai, PADDLE_R, H / 2 - PADDLE_R);
  ai.prevX = ai.x;
  ai.prevY = ai.y;
}

function resolveCollision(paddle, prevPaddle) {
  const dx = puck.x - paddle.x;
  const dy = puck.y - paddle.y;
  const dist = Math.hypot(dx, dy);
  const minDist = PADDLE_R + PUCK_R;
  if (dist < minDist && dist > 0) {
    const nx = dx / dist, ny = dy / dist;
    puck.x = paddle.x + nx * minDist;
    puck.y = paddle.y + ny * minDist;

    const paddleVx = (paddle.x - prevPaddle.x) || 0;
    const paddleVy = (paddle.y - prevPaddle.y) || 0;
    const relVx = puck.vx - paddleVx;
    const relVy = puck.vy - paddleVy;
    const dot = relVx * nx + relVy * ny;

    puck.vx = relVx - 2 * dot * nx + paddleVx * 1.4;
    puck.vy = relVy - 2 * dot * ny + paddleVy * 1.4;

    const speed = Math.hypot(puck.vx, puck.vy);
    if (speed > cfg.maxSpeed) {
      puck.vx = (puck.vx / speed) * cfg.maxSpeed;
      puck.vy = (puck.vy / speed) * cfg.maxSpeed;
    }
    if (window.CubySfx) CubySfx.tap();
  }
}

function update() {
  if (over) return;

  const prevAi = { x: ai.prevX ?? ai.x, y: ai.prevY ?? ai.y };
  updateAI();

  puck.x += puck.vx;
  puck.y += puck.vy;
  puck.vx *= cfg.friction;
  puck.vy *= cfg.friction;

  if (puck.x - PUCK_R < 0) { puck.x = PUCK_R; puck.vx *= -1; }
  if (puck.x + PUCK_R > W) { puck.x = W - PUCK_R; puck.vx *= -1; }

  const inGoalX = puck.x > W / 2 - GOAL_W / 2 && puck.x < W / 2 + GOAL_W / 2;

  if (puck.y - PUCK_R < 0) {
    if (inGoalX) {
      scorePlayer++;
      if (window.CubySfx) CubySfx.coin();
      updateHud();
      if (scorePlayer >= WIN_SCORE) { endGame(true); return; }
      resetPuck(true);
    } else {
      puck.y = PUCK_R;
      puck.vy *= -1;
    }
  }
  if (puck.y + PUCK_R > H) {
    if (inGoalX) {
      scoreAi++;
      if (window.CubySfx) CubySfx.fail();
      updateHud();
      if (scoreAi >= WIN_SCORE) { endGame(false); return; }
      resetPuck(false);
    } else {
      puck.y = H - PUCK_R;
      puck.vy *= -1;
    }
  }

  resolveCollision(player, playerPrev);
  resolveCollision(ai, prevAi);
  playerPrev = { x: player.x, y: player.y };
}

function draw() {
  const theme = getComputedStyle(document.documentElement);
  const bg = theme.getPropertyValue("--bg-main").trim() || "#130D33";
  const line = theme.getPropertyValue("--accent-blue").trim() || "#1F4690";
  const gold = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
  const white = theme.getPropertyValue("--text-white").trim() || "#ffffff";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 5;
  ctx.strokeStyle = gold;
  ctx.beginPath();
  ctx.moveTo(W / 2 - GOAL_W / 2, 2);
  ctx.lineTo(W / 2 + GOAL_W / 2, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 - GOAL_W / 2, H - 2);
  ctx.lineTo(W / 2 + GOAL_W / 2, H - 2);
  ctx.stroke();

  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(ai.x, ai.y, PADDLE_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.arc(player.x, player.y, PADDLE_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = white;
  ctx.beginPath();
  ctx.arc(puck.x, puck.y, PUCK_R, 0, Math.PI * 2);
  ctx.fill();
}

function updateHud() {
  document.getElementById("scorePlayerVal").textContent = scorePlayer;
  document.getElementById("scoreAiVal").textContent = scoreAi;
}

let running = false;
function loop() {
  update();
  draw();
  if (!over) requestAnimationFrame(loop);
  else running = false;
}

async function endGame(won) {
  if (over) return;
  over = true;
  if (window.CubySfx) (won ? CubySfx.win() : CubySfx.lose());

  document.getElementById("resultTitle").textContent = won ? T[lang].win : T[lang].lose;
  document.getElementById("statScore").textContent = `${scorePlayer} - ${scoreAi}`;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "air-hockey", scorePlayer * 10);
}

function startGame(level) {
  cfg = DIFFICULTIES[level] || DIFFICULTIES.moyen;
  player = { x: W / 2, y: H - 60 };
  playerPrev = { x: W / 2, y: H - 60 };
  ai = { x: W / 2, y: 60, prevX: W / 2, prevY: 60 };
  scorePlayer = 0;
  scoreAi = 0;
  over = false;
  resetPuck(Math.random() < 0.5);
  updateHud();

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  if (!running) {
    running = true;
    requestAnimationFrame(loop);
  }
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("replayBtn").onclick = () => location.reload();

function pointerToCanvas(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

function movePlayer(clientX, clientY) {
  const p = pointerToCanvas(clientX, clientY);
  player.x = p.x;
  player.y = p.y;
  clampPaddle(player, H / 2 + PADDLE_R, H - PADDLE_R);
}

canvas.addEventListener("mousedown", e => { pointerActive = true; movePlayer(e.clientX, e.clientY); });
window.addEventListener("mousemove", e => { if (pointerActive) movePlayer(e.clientX, e.clientY); });
window.addEventListener("mouseup", () => (pointerActive = false));

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  const t = e.touches[0];
  movePlayer(t.clientX, t.clientY);
}, { passive: false });
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  const t = e.touches[0];
  movePlayer(t.clientX, t.clientY);
}, { passive: false });

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.getElementById("langToggle").textContent = lang.toUpperCase();
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

// Hook de test/debug (aucun impact en jeu normal).
window.__airHockeyDebug = {
  update, draw, startGame,
  getState: () => ({ scorePlayer, scoreAi, over, puck, player, ai })
};

applyLang();
draw();
