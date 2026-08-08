import { saveScore } from "../api.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const area = document.getElementById("area");
const hudEl = document.getElementById("hud");

const W = 340;
const H = 500;
canvas.width = W;
canvas.height = H;

const theme = getComputedStyle(document.documentElement);
const COLOR_BG = theme.getPropertyValue("--bg-main").trim() || "#130D33";
const COLOR_SHIP = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
const COLOR_BULLET = theme.getPropertyValue("--text-white").trim() || "#ffffff";
const COLOR_ENEMY = "#e74c3c";

const PLAYER_SPEED = 260;
const PLAYER_Y = H - 40;

let player = { x: W / 2, w: 26, h: 20 };
let movingLeft = false;
let movingRight = false;

let bullets = [];
let enemies = [];
let score = 0;
let lives = 3;
let over = true;
let shootTimer = 0;
let spawnTimer = 0;
let invincibleTimer = 0;

function updateHud() {
  hudEl.textContent = `Score : ${score} · Vies : ${lives}`;
}

function speedForScore() {
  return Math.min(70 + score * 1.2, 200);
}

function spawnEnemy() {
  enemies.push({ x: 20 + Math.random() * (W - 40), y: -20, w: 24, h: 20, alive: true });
}

function update(delta) {
  if (over) return;

  if (movingLeft) player.x -= PLAYER_SPEED * delta;
  if (movingRight) player.x += PLAYER_SPEED * delta;
  player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));

  shootTimer += delta;
  if (shootTimer > 0.35) {
    shootTimer = 0;
    bullets.push({ x: player.x, y: PLAYER_Y - 12 });
  }
  bullets.forEach(b => (b.y -= 320 * delta));
  bullets = bullets.filter(b => b.y > -10);

  spawnTimer += delta;
  const spawnInterval = Math.max(1.1 - score * 0.01, 0.4);
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnEnemy();
  }

  const speed = speedForScore();
  enemies.forEach(e => (e.y += speed * delta));

  enemies.forEach(e => {
    if (!e.alive) return;
    bullets.forEach(b => {
      if (b.hit) return;
      if (Math.abs(b.x - e.x) < e.w / 2 + 3 && Math.abs(b.y - e.y) < e.h / 2 + 3) {
        e.alive = false;
        b.hit = true;
        score += 5;
        updateHud();
      }
    });
  });

  bullets = bullets.filter(b => !b.hit);
  enemies = enemies.filter(e => e.alive && e.y < H + 20);

  if (invincibleTimer > 0) invincibleTimer -= delta;

  if (invincibleTimer <= 0) {
    const hitEnemy = enemies.find(
      e => Math.abs(e.x - player.x) < (e.w + player.w) / 2 - 4 && Math.abs(e.y - PLAYER_Y) < (e.h + player.h) / 2 - 4
    );
    if (hitEnemy) {
      hitEnemy.alive = false;
      lives--;
      invincibleTimer = 1.2;
      updateHud();
      if (lives <= 0) {
        endGame();
        return;
      }
    }
  }

  enemies = enemies.filter(e => e.alive);
}

function draw() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLOR_ENEMY;
  enemies.forEach(e => ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h));

  ctx.fillStyle = COLOR_BULLET;
  bullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 6, 4, 10));

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
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "space-shooter", score);
}

function startGame() {
  player.x = W / 2;
  bullets = [];
  enemies = [];
  score = 0;
  lives = 3;
  shootTimer = 0;
  spawnTimer = 0;
  invincibleTimer = 0;
  over = false;
  updateHud();
  document.getElementById("startOverlay").hidden = true;

  lastTime = null;
  requestAnimationFrame(loop);
}

document.getElementById("startBtn").onclick = startGame;
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

// Hook de test/debug (aucun impact en jeu normal).
window.__spaceShooterDebug = { update, draw, getState: () => ({ score, lives, over }), getEnemies: () => enemies, getBullets: () => bullets, getPlayer: () => player, spawnEnemy };

draw();
