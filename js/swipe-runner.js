import { saveScore } from "../api.js";

const LANES = 3;
const LANE_WIDTH = 2.4;
const LANE_X = [-LANE_WIDTH, 0, LANE_WIDTH];
const WORLD_LENGTH = 200;

const area = document.getElementById("area");
const canvas = document.getElementById("gameCanvas");
const scoreEl = document.getElementById("score");

const scene = new THREE.Scene();

// --- Ciel en dégradé (texture canvas, pas de couleur plate) ---
function makeSkyTexture() {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 128;
  const ctx = c.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#050615");
  grad.addColorStop(0.55, "#141b45");
  grad.addColorStop(1, "#2a3570");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 8, 128);
  return new THREE.CanvasTexture(c);
}
scene.background = makeSkyTexture();
scene.fog = new THREE.Fog(0x141b45, 18, 58);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
camera.position.set(0, 3.4, 7);
camera.lookAt(0, 1.4, -10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

function resize() {
  const rect = area.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

// --- Éclairage ---
scene.add(new THREE.HemisphereLight(0x8fa7ff, 0x14172c, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(4, 12, 6);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 40;
dirLight.shadow.camera.left = -12;
dirLight.shadow.camera.right = 12;
dirLight.shadow.camera.top = 12;
dirLight.shadow.camera.bottom = -12;
scene.add(dirLight);

// --- Textures procédurales (canvas) : pas d'assets externes disponibles ---
function makeAsphaltTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1c2450";
  ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let i = 0; i < 260; i++) {
    ctx.fillRect(Math.random() * 128, Math.random() * 256, 2, 2);
  }
  ctx.strokeStyle = "#e8aa42";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  [128 / 3, (128 / 3) * 2].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  });
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 26);
  return tex;
}

function makeBuildingTexture(baseColor) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 64, 64);
  for (let y = 4; y < 64; y += 9) {
    for (let x = 4; x < 64; x += 9) {
      ctx.fillStyle = Math.random() > 0.35 ? "rgba(255,225,140,0.65)" : "rgba(0,0,0,0.25)";
      ctx.fillRect(x, y, 5, 6);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeCubeLogoTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1f4690";
  ctx.fillRect(0, 0, 64, 64);
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🧊", 32, 34);
  return new THREE.CanvasTexture(c);
}

// --- Décor : route + immeubles qui défilent ---
const track = new THREE.Mesh(
  new THREE.PlaneGeometry(LANE_WIDTH * 3 + 2, WORLD_LENGTH),
  new THREE.MeshStandardMaterial({ map: makeAsphaltTexture(), roughness: 0.9 })
);
track.rotation.x = -Math.PI / 2;
track.position.z = -WORLD_LENGTH / 2 + 10;
track.receiveShadow = true;
scene.add(track);

const dividerMat = new THREE.MeshStandardMaterial({ color: 0xe8aa42, emissive: 0x4a2f00 });
const dividers = [];
[-LANE_WIDTH / 2, LANE_WIDTH / 2].forEach(x => {
  for (let z = 5; z > -WORLD_LENGTH; z -= 6) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 2), dividerMat);
    seg.position.set(x, 0.03, z);
    scene.add(seg);
    dividers.push(seg);
  }
});

const buildingPalette = ["#231955", "#1a1240", "#2c2470"];
const buildings = [];
for (let i = 0; i < 24; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  const height = 4 + Math.random() * 9;
  const tex = makeBuildingTexture(buildingPalette[i % buildingPalette.length]);
  tex.repeat.set(2, Math.max(1, Math.round(height / 2)));
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, height, 4), mat);
  mesh.position.set(side * (LANE_WIDTH * 2.6), height / 2, 5 - i * 8);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  buildings.push(mesh);
}

// --- Personnage : petit bonhomme low-poly articulé, avec logo texturé ---
function createCharacter() {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xe8aa42 });
  const suit = new THREE.MeshStandardMaterial({ map: makeCubeLogoTexture() });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), suit);
  torso.position.y = 1.1;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skin);
  head.position.y = 1.75;
  head.castShadow = true;
  group.add(head);

  function limb(material, w, h, d, pivotY) {
    const geo = new THREE.BoxGeometry(w, h, d);
    geo.translate(0, -h / 2, 0);
    const pivot = new THREE.Group();
    pivot.position.y = pivotY;
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    pivot.add(mesh);
    return pivot;
  }

  const armL = limb(skin, 0.18, 0.6, 0.18, 1.45);
  armL.position.x = -0.42;
  group.add(armL);

  const armR = limb(skin, 0.18, 0.6, 0.18, 1.45);
  armR.position.x = 0.42;
  group.add(armR);

  const legL = limb(suit, 0.22, 0.7, 0.22, 0.85);
  legL.position.x = -0.16;
  group.add(legL);

  const legR = limb(suit, 0.22, 0.7, 0.22, 0.85);
  legR.position.x = 0.16;
  group.add(legR);

  return { group, armL, armR, legL, legR };
}

const character = createCharacter();
scene.add(character.group);

let playerLane = 1;
let targetX = LANE_X[1];

// --- Obstacles ---
const obstacleMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.6 });
let obstacles = [];

function spawnObstacle() {
  const lane = Math.floor(Math.random() * LANES);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), obstacleMat);
  mesh.position.set(LANE_X[lane], 0.5, -55);
  mesh.castShadow = true;
  scene.add(mesh);
  obstacles.push({ lane, mesh });
}

// --- Pièces à ramasser (élément emblématique façon Subway Surfers) ---
const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 20);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.7, roughness: 0.25, emissive: 0x553d00 });
let coins = [];
let coinsCollected = 0;

function spawnCoin() {
  const lane = Math.floor(Math.random() * LANES);
  const mesh = new THREE.Mesh(coinGeo, coinMat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(LANE_X[lane], 0.7, -55);
  mesh.castShadow = true;
  scene.add(mesh);
  coins.push({ lane, mesh });
}

let score = 0;
let over = true;
let runTime = 0;
let spawnTimer = 0;
let coinTimer = 0;
const clock = new THREE.Clock();

function updateHud() {
  scoreEl.textContent = `Score : ${score} · 🪙 ${coinsCollected}`;
}

function speedForScore() {
  return Math.min(14 + score * 0.05, 30);
}

function update(delta) {
  if (over) return;

  runTime += delta;
  const newScore = Math.floor(runTime * 10) + coinsCollected * 5;
  if (newScore !== score) {
    score = newScore;
    updateHud();
  }

  character.group.position.x += (targetX - character.group.position.x) * Math.min(delta * 10, 1);

  const swing = Math.sin(runTime * 10) * 0.7;
  character.armL.rotation.x = swing;
  character.armR.rotation.x = -swing;
  character.legL.rotation.x = -swing;
  character.legR.rotation.x = swing;
  character.group.position.y = Math.abs(Math.sin(runTime * 10)) * 0.08;

  const speed = speedForScore();

  spawnTimer += delta;
  const spawnInterval = Math.max(1.4 - score * 0.003, 0.6);
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle();
  }

  coinTimer += delta;
  if (coinTimer > 1.1) {
    coinTimer = 0;
    if (Math.random() < 0.7) spawnCoin();
  }

  obstacles.forEach(o => (o.mesh.position.z += speed * delta));
  coins.forEach(c => {
    c.mesh.position.z += speed * delta;
    c.mesh.rotation.z += delta * 6;
  });

  const collided = obstacles.some(
    o => o.lane === playerLane && o.mesh.position.z > -1.2 && o.mesh.position.z < 0.6
  );
  if (collided) {
    endGame();
    return;
  }

  const collectedIndex = coins.findIndex(
    c => c.lane === playerLane && c.mesh.position.z > -1.1 && c.mesh.position.z < 0.8
  );
  if (collectedIndex !== -1) {
    scene.remove(coins[collectedIndex].mesh);
    coins.splice(collectedIndex, 1);
    coinsCollected++;
    score += 5;
    updateHud();
  }

  obstacles = obstacles.filter(o => {
    if (o.mesh.position.z > 2) {
      scene.remove(o.mesh);
      return false;
    }
    return true;
  });

  coins = coins.filter(c => {
    if (c.mesh.position.z > 2) {
      scene.remove(c.mesh);
      return false;
    }
    return true;
  });

  buildings.forEach(b => {
    b.position.z += speed * delta;
    if (b.position.z > 10) b.position.z -= WORLD_LENGTH;
  });

  dividers.forEach(d => {
    d.position.z += speed * delta;
    if (d.position.z > 5) d.position.z -= WORLD_LENGTH;
  });
}

function render() {
  renderer.render(scene, camera);
}

function loop() {
  const delta = Math.min(clock.getDelta(), 0.1);
  update(delta);
  render();
  if (!over) requestAnimationFrame(loop);
}

function moveLane(dir) {
  if (over) return;
  if (dir === "left" && playerLane > 0) playerLane--;
  if (dir === "right" && playerLane < LANES - 1) playerLane++;
  targetX = LANE_X[playerLane];
}

async function endGame() {
  over = true;
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "swipe-runner", score);
}

function startGame() {
  obstacles.forEach(o => scene.remove(o.mesh));
  obstacles = [];
  coins.forEach(c => scene.remove(c.mesh));
  coins = [];
  playerLane = 1;
  targetX = LANE_X[1];
  character.group.position.set(0, 0, 0);
  score = 0;
  coinsCollected = 0;
  runTime = 0;
  spawnTimer = 0;
  coinTimer = 0;
  over = false;
  updateHud();
  document.getElementById("startOverlay").hidden = true;

  clock.start();
  requestAnimationFrame(loop);
}

document.getElementById("startBtn").onclick = startGame;
document.getElementById("replayBtn").onclick = () => location.reload();
document.getElementById("btnLeft").onclick = () => moveLane("left");
document.getElementById("btnRight").onclick = () => moveLane("right");

let touchStartX = 0;
area.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

area.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 30) return;
  moveLane(dx > 0 ? "right" : "left");
}, { passive: true });

// Hooks de test/debug (aucun impact en jeu normal).
window.__swipeRunnerDebug = {
  scene, camera, character, update, render, spawnObstacle, spawnCoin,
  obstacles: () => obstacles, coins: () => coins
};

resize();
render();
