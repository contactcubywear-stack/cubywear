import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", start: "Commencer", replay: "Rejouer",
    hint: "Glisse ou utilise les boutons pour te déplacer (tir automatique)",
    destroyed: "💥 Vaisseau détruit !", finalScore: "Score final", best: "Meilleur score"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", start: "Start", replay: "Replay",
    hint: "Swipe or use the buttons to move (auto-fire)",
    destroyed: "💥 Ship destroyed!", finalScore: "Final score", best: "Best score"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTY_SETTINGS = {
  facile:     { lives: 3, w: 340, h: 500, bigFast: false, enemyHp: 1, bonus: false },
  moyen:      { lives: 3, w: 340, h: 500, bigFast: true,  enemyHp: 1, bonus: false },
  difficile:  { lives: 1, w: 380, h: 560, bigFast: true,  enemyHp: 2, bonus: false },
  impossible: { lives: 1, w: 380, h: 560, bigFast: true,  enemyHp: 3, bonus: true }
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const area = document.getElementById("area");

const theme = getComputedStyle(document.documentElement);
const COLOR_BG = theme.getPropertyValue("--bg-main").trim() || "#130D33";
const COLOR_SHIP = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
const COLOR_BULLET = theme.getPropertyValue("--text-white").trim() || "#ffffff";
const COLOR_ENEMY = "#e74c3c";
const COLOR_BONUS = "#2ecc71";

let W, H, PLAYER_Y;
let difficulty, settings;

const PLAYER_SPEED = 260;

let player;
let movingLeft = false;
let movingRight = false;

let bullets = [];
let enemies = [];
let skyBonuses = [];
let particles = [];
let score = 0;
let lives = 3;
let best = 0;
let over = true;
let shootTimer = 0;
let spawnTimer = 0;
let bonusTimer = 0;
let invincibleTimer = 0;

function updateHud() {
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("livesVal").textContent = lives;
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 90;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
  }
}

function shakeCanvas() {
  canvas.classList.add("shake");
  setTimeout(() => canvas.classList.remove("shake"), 300);
}

function speedForScore() {
  return Math.min(70 + score * 1.2, 200);
}

function spawnEnemy() {
  const isBig = settings.bigFast && Math.random() < 0.25;
  enemies.push({
    x: 20 + Math.random() * (W - 40),
    y: -20,
    w: isBig ? 34 : 24,
    h: isBig ? 28 : 20,
    hp: isBig ? settings.enemyHp : 1,
    maxHp: isBig ? settings.enemyHp : 1,
    speedMult: isBig ? 1.6 : 1,
    alive: true
  });
}

function spawnSkyBonus() {
  skyBonuses.push({ x: 20 + Math.random() * (W - 40), y: -15, vy: 90 });
}

function loseLife() {
  lives--;
  invincibleTimer = 1.2;
  updateHud();
  shakeCanvas();
  if (window.CubySfx) CubySfx.hit();
  if (lives <= 0) endGame();
}

function update(delta) {
  if (over) return;

  if (movingLeft) player.x -= PLAYER_SPEED * delta;
  if (movingRight) player.x += PLAYER_SPEED * delta;
  player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));

  particles.forEach(p => {
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.life -= delta * 2;
  });
  particles = particles.filter(p => p.life > 0);

  shootTimer += delta;
  if (shootTimer > 0.35) {
    shootTimer = 0;
    bullets.push({ x: player.x, y: PLAYER_Y - 12 });
    if (window.CubySfx) CubySfx.tap();
  }
  bullets.forEach(b => (b.y -= 320 * delta));
  bullets = bullets.filter(b => b.y > -10);

  spawnTimer += delta;
  const spawnInterval = Math.max(1.1 - score * 0.01, 0.4);
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnEnemy();
  }

  if (settings.bonus) {
    bonusTimer += delta;
    if (bonusTimer > 4) {
      bonusTimer = 0;
      spawnSkyBonus();
    }
  }

  const speed = speedForScore();
  enemies.forEach(e => (e.y += speed * e.speedMult * delta));
  skyBonuses.forEach(b => (b.y += b.vy * delta));

  enemies.forEach(e => {
    if (!e.alive) return;
    bullets.forEach(b => {
      if (b.hit) return;
      if (Math.abs(b.x - e.x) < e.w / 2 + 3 && Math.abs(b.y - e.y) < e.h / 2 + 3) {
        b.hit = true;
        e.hp--;
        if (e.hp <= 0) {
          e.alive = false;
          score += e.maxHp > 1 ? 15 : 5;
          spawnParticles(e.x, e.y, COLOR_ENEMY);
          if (window.CubySfx) CubySfx.match();
        } else {
          score += 2;
        }
        updateHud();
      }
    });
  });

  bullets = bullets.filter(b => !b.hit);

  enemies = enemies.filter(e => {
    if (!e.alive) return false;
    if (e.y > H + e.h) {
      if (over) return false;
      loseLife();
      return false;
    }
    return true;
  });

  skyBonuses = skyBonuses.filter(b => {
    if (b.y > PLAYER_Y - 14 && b.y < PLAYER_Y + 14 && Math.abs(b.x - player.x) < 20) {
      lives++;
      if (window.CubySfx) CubySfx.coin();
      updateHud();
      return false;
    }
    return b.y < H + 20;
  });

  if (over) return;

  if (invincibleTimer > 0) invincibleTimer -= delta;

  if (invincibleTimer <= 0) {
    const hitEnemy = enemies.find(
      e => Math.abs(e.x - player.x) < (e.w + player.w) / 2 - 4 && Math.abs(e.y - PLAYER_Y) < (e.h + player.h) / 2 - 4
    );
    if (hitEnemy) {
      hitEnemy.alive = false;
      loseLife();
    }
  }

  enemies = enemies.filter(e => e.alive);
}

function draw() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, W, H);

  enemies.forEach(e => {
    ctx.fillStyle = COLOR_ENEMY;
    ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
    if (e.maxHp > 1) {
      ctx.fillStyle = "#130D33";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(e.hp, e.x, e.y + 4);
    }
  });

  ctx.fillStyle = COLOR_BONUS;
  skyBonuses.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = COLOR_BULLET;
  bullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 6, 4, 10));

  particles.forEach(p => {
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  if (invincibleTimer <= 0 || Math.floor(invincibleTimer * 10) % 2 === 0) {
    ctx.fillStyle = COLOR_SHIP;
    ctx.beginPath();
    ctx.moveTo(player.x, PLAYER_Y - player.h / 2);
    ctx.lineTo(player.x - player.w / 2, PLAYER_Y + player.h / 2);
    ctx.lineTo(player.x + player.w / 2, PLAYER_Y + player.h / 2);
    ctx.closePath();
    ctx.fill();
  }
}

let lastTime = null;
function loop(now) {
  if (lastTime === null) lastTime = now;
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(delta);
  draw();
  if (!over) requestAnimationFrame(loop);
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.lose();

  best = Math.max(score, best);
  localStorage.setItem("bestSpaceShooter", best);

  document.getElementById("statScore").textContent = score;
  document.getElementById("statBest").textContent = best;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "space-shooter", score);
}

const DISPLAY_MAX_W = 300;

function applyAreaSize() {
  canvas.width = W;
  canvas.height = H;
  area.style.width = `min(calc(100vw - 40px), ${Math.min(W, DISPLAY_MAX_W)}px)`;
  area.style.aspectRatio = `${W} / ${H}`;
  area.style.height = "auto";
}

function startGame(level) {
  difficulty = level;
  settings = DIFFICULTY_SETTINGS[difficulty];
  W = settings.w;
  H = settings.h;
  PLAYER_Y = H - 40;

  applyAreaSize();
  player = { x: W / 2, w: 26, h: 20 };
  bullets = [];
  enemies = [];
  skyBonuses = [];
  particles = [];
  score = 0;
  best = Number(localStorage.getItem("bestSpaceShooter") || 0);
  lives = settings.lives;
  shootTimer = 0;
  spawnTimer = 0;
  bonusTimer = 0;
  invincibleTimer = 0;
  over = false;
  updateHud();

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;
  document.getElementById("startOverlay").hidden = true;

  lastTime = null;
  requestAnimationFrame(loop);
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("replayBtn").onclick = () => location.reload();

function setMove(dir, active) {
  if (dir === "left") movingLeft = active;
  if (dir === "right") movingRight = active;
}

const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

["mousedown", "touchstart"].forEach(evt => {
  btnLeft.addEventListener(evt, e => { e.preventDefault(); setMove("left", true); });
  btnRight.addEventListener(evt, e => { e.preventDefault(); setMove("right", true); });
});
["mouseup", "mouseleave", "touchend"].forEach(evt => {
  btnLeft.addEventListener(evt, () => setMove("left", false));
  btnRight.addEventListener(evt, () => setMove("right", false));
});

window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") setMove("left", true);
  if (e.key === "ArrowRight") setMove("right", true);
});
window.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") setMove("left", false);
  if (e.key === "ArrowRight") setMove("right", false);
});

area.addEventListener("touchmove", e => {
  const rect = area.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, (touchX / rect.width) * W));
}, { passive: true });

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
window.__spaceShooterDebug = {
  update, draw,
  getState: () => ({ score, lives, over }),
  getEnemies: () => enemies, getBullets: () => bullets, getPlayer: () => player,
  getSkyBonuses: () => skyBonuses, spawnEnemy, spawnSkyBonus
};

applyLang();
