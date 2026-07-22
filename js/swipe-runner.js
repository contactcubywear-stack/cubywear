import { saveScore } from "../api.js";

const LANES = 3;
const LANE_WIDTH = 2.4;
const LANE_X = [-LANE_WIDTH, 0, LANE_WIDTH];
const WORLD_LENGTH = 200;

const area = document.getElementById("area");
const canvas = document.getElementById("gameCanvas");
const scoreEl = document.getElementById("score");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f2a);
scene.fog = new THREE.Fog(0x0a0f2a, 15, 55);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
camera.position.set(0, 3.4, 7);
camera.lookAt(0, 1.4, -10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

function resize() {
  const rect = area.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(4, 10, 6);
scene.add(dirLight);

// --- Décor : route + immeubles qui défilent ---
const track = new THREE.Mesh(
  new THREE.PlaneGeometry(LANE_WIDTH * 3 + 2, WORLD_LENGTH),
  new THREE.MeshStandardMaterial({ color: 0x1c2450 })
);
track.rotation.x = -Math.PI / 2;
track.position.z = -WORLD_LENGTH / 2 + 10;
scene.add(track);

const dividerMat = new THREE.MeshStandardMaterial({ color: 0xe8aa42 });
const dividers = [];
[-LANE_WIDTH / 2, LANE_WIDTH / 2].forEach(x => {
  for (let z = 5; z > -WORLD_LENGTH; z -= 6) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 2), dividerMat);
    seg.position.set(x, 0.03, z);
    scene.add(seg);
    dividers.push(seg);
  }
});

const buildingMat = new THREE.MeshStandardMaterial({ color: 0x231955 });
const buildingEdgeMat = new THREE.MeshStandardMaterial({ color: 0x5ac8fa });
const buildings = [];
for (let i = 0; i < 24; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  const height = 4 + Math.random() * 9;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, height, 4), i % 3 === 0 ? buildingEdgeMat : buildingMat);
  mesh.position.set(side * (LANE_WIDTH * 2.6), height / 2, 5 - i * 8);
  scene.add(mesh);
  buildings.push(mesh);
}

// --- Personnage : petit bonhomme low-poly articulé ---
function createCharacter() {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xe8aa42 });
  const suit = new THREE.MeshStandardMaterial({ color: 0x1f4690 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), suit);
  torso.position.y = 1.1;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skin);
  head.position.y = 1.75;
  group.add(head);

  function limb(material, w, h, d, pivotY) {
    const geo = new THREE.BoxGeometry(w, h, d);
    geo.translate(0, -h / 2, 0);
    const pivot = new THREE.Group();
    pivot.position.y = pivotY;
    const mesh = new THREE.Mesh(geo, material);
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
const obstacleMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
let obstacles = [];

function spawnObstacle() {
  const lane = Math.floor(Math.random() * LANES);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), obstacleMat);
  mesh.position.set(LANE_X[lane], 0.5, -55);
  scene.add(mesh);
  obstacles.push({ lane, mesh });
}

let score = 0;
let over = true;
let runTime = 0;
let spawnTimer = 0;
const clock = new THREE.Clock();

function speedForScore() {
  return Math.min(14 + score * 0.05, 30);
}

function update(delta) {
  if (over) return;

  runTime += delta;
  const newScore = Math.floor(runTime * 10);
  if (newScore !== score) {
    score = newScore;
    scoreEl.textContent = `Score : ${score}`;
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
  const spawnInterval = Math.max(1.4 - score * 0.005, 0.6);
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle();
  }

  obstacles.forEach(o => (o.mesh.position.z += speed * delta));

  const collided = obstacles.some(
    o => o.lane === playerLane && o.mesh.position.z > -1.2 && o.mesh.position.z < 0.6
  );
  if (collided) {
    endGame();
    return;
  }

  obstacles = obstacles.filter(o => {
    if (o.mesh.position.z > 2) {
      scene.remove(o.mesh);
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
  playerLane = 1;
  targetX = LANE_X[1];
  character.group.position.set(0, 0, 0);
  score = 0;
  runTime = 0;
  spawnTimer = 0;
  over = false;
  scoreEl.textContent = "Score : 0";
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
window.__swipeRunnerDebug = { scene, camera, character, obstacles: () => obstacles, update, render, spawnObstacle };

resize();
render();
