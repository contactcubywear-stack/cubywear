const GAMES = [
  { id: "memory", name: "Memory", icon: "🧠", desc: "Trouve toutes les paires", entry: "./games/memory-select.html" },
  { id: "tictactoe", name: "Tic Tac Toe", icon: "❌⭕", desc: "Bats l'IA ou ton ami" },
  { id: "flappy", name: "Flappy Bird", icon: "🐤", desc: "Évite les obstacles" },
  { id: "sudoku", name: "Sudoku", icon: "🔢", desc: "Résous la grille" },
  { id: "pendu", name: "Pendu", icon: "🪢", desc: "Découvre le mot lettre par lettre" },
  { id: "mastermind", name: "Mastermind", icon: "🎯", desc: "Devine la combinaison de couleurs" },
  { id: "2048", name: "2048 Lite", icon: "🔢", desc: "Fusionne les tuiles jusqu'à 2048" },
  { id: "labyrinthe", name: "Labyrinthe", icon: "🌀", desc: "Trouve la sortie avant la fin du temps" },
  { id: "puzzle-glissant", name: "Puzzle glissant", icon: "🧩", desc: "Reconstitue l'image en glissant les pièces" },
  { id: "reaction-tap", name: "Reaction Tap", icon: "⚡", desc: "Clique dès que ça devient vert" },
  { id: "aim-trainer", name: "Aim Trainer", icon: "🎯", desc: "Clique les cibles le plus vite possible" },
  { id: "swipe-runner", name: "Swipe Runner", icon: "🏃", desc: "Esquive les obstacles gauche/droite" },
  { id: "speed-math", name: "Speed Math", icon: "🧮", desc: "Résous des calculs contre le chrono" },
  { id: "catch-the-cube", name: "Catch the Cube", icon: "🧊", desc: "Attrape la mascotte avant qu'elle ne se téléporte" },
  { id: "snake", name: "Snake", icon: "🐍", desc: "Mange les pommes sans te mordre" },
  { id: "breakout", name: "Breakout", icon: "🧱", desc: "Détruis toutes les briques avec la balle" },
  { id: "space-shooter", name: "Space Shooter", icon: "🚀", desc: "Esquive et tire sur les ennemis" },
  { id: "runner-2d", name: "Runner 2D", icon: "🦘", desc: "Saute par-dessus les obstacles" },
  { id: "mini-tetris", name: "Mini-Tetris", icon: "🧱", desc: "Empile les pièces et complète des lignes" },
  { id: "trouve-objet", name: "Trouve l'objet", icon: "🔍", desc: "Repère l'objet différent dans la grille" },
  { id: "color-match", name: "Color Match", icon: "🎨", desc: "Choisis la nuance exacte" },
  { id: "symetrie", name: "Symétrie", icon: "🦋", desc: "Dis si la forme est symétrique" },
  { id: "memory-duo", name: "Memory Duo+", icon: "🧠", desc: "Un memory dont les cartes bougent" },
  { id: "bon-pixel", name: "Bon pixel", icon: "🖼️", desc: "Devine l'image pixelisée" },
  { id: "anagrammes", name: "Anagrammes", icon: "🔤", desc: "Remets les lettres dans le bon ordre" },
  { id: "mot-flash", name: "Mot Flash", icon: "⚡", desc: "Trouve le mot à partir d'un indice" },
  { id: "lettre-manquante", name: "Lettre manquante", icon: "🔡", desc: "Complète le mot" },
  { id: "mini-wordle", name: "Mini-Wordle", icon: "🟩", desc: "Devine le mot de 4 lettres en 5 essais" },
  { id: "mini-othello", name: "Mini-Othello", icon: "⚫", desc: "Retourne les pions de ton adversaire" },
  { id: "connect4-lite", name: "Connect 4 Lite", icon: "🔴", desc: "Aligne 4 pions avant le bot" },
  { id: "hexa-path", name: "Hexa-Path", icon: "🔷", desc: "Relie les deux côtés du plateau hexagonal" }
];

const GAMES_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

function entryFor(game) {
  return game.entry || `./games/${game.id}.html`;
}

const DEFAULT_DAILY = ["memory", "tictactoe", "flappy"];

function loadDailyGames() {
  try {
    const saved = JSON.parse(localStorage.getItem("cubywearDailyGames"));
    if (Array.isArray(saved) && saved.length === 3 && saved.every(id => GAMES_BY_ID[id])) {
      return saved;
    }
  } catch (e) {}
  return DEFAULT_DAILY;
}

let dailyGames = loadDailyGames();

document.getElementById("currentDate").textContent =
  new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

// --- Thème clair / sombre ---
const themeToggleEl = document.getElementById("themeToggle");
const logoImgEl = document.getElementById("logoImg");

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    themeToggleEl.textContent = "☀️";
    if (logoImgEl) logoImgEl.src = "assets/logo_light.png";
  } else {
    document.documentElement.removeAttribute("data-theme");
    themeToggleEl.textContent = "🌙";
    if (logoImgEl) logoImgEl.src = "assets/logo_dark.png";
  }
}

let currentTheme = localStorage.getItem("cubywearTheme") === "light" ? "light" : "dark";
applyTheme(currentTheme);

themeToggleEl.addEventListener("click", () => {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  localStorage.setItem("cubywearTheme", currentTheme);
  applyTheme(currentTheme);
});

// --- Musique de fond (ambiance lo-fi générée en direct, aucun fichier audio requis) ---
const musicToggleEl = document.getElementById("musicToggle");
let audioCtx = null;
let masterGain = null;
let musicTimer = null;
let musicPlaying = false;

const CHORDS = [
  [110.00, 130.81, 164.81, 196.00],   // Am7
  [87.31, 110.00, 130.81, 164.81],    // Fmaj7
  [130.81, 164.81, 196.00, 246.94],   // Cmaj7
  [98.00, 123.47, 146.83, 196.00]     // G
];
const CHORD_DURATION = 4;
let chordIndex = 0;

function scheduleChord(startTime) {
  const freqs = CHORDS[chordIndex % CHORDS.length];
  chordIndex++;

  freqs.forEach(freq => {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const noteGain = audioCtx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.05, startTime + 1.2);
    noteGain.gain.linearRampToValueAtTime(0, startTime + CHORD_DURATION);

    osc.connect(noteGain);
    noteGain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + CHORD_DURATION + 0.1);
  });
}

function startMusic() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.6;

    masterGain.connect(filter);
    filter.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();

  let nextTime = audioCtx.currentTime + 0.1;
  scheduleChord(nextTime);
  nextTime += CHORD_DURATION;
  scheduleChord(nextTime);

  musicTimer = setInterval(() => {
    nextTime += CHORD_DURATION;
    scheduleChord(nextTime);
  }, CHORD_DURATION * 1000);

  musicPlaying = true;
  musicToggleEl.textContent = "🔊";
  musicToggleEl.classList.add("playing");
}

function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (audioCtx) audioCtx.suspend();
  musicPlaying = false;
  musicToggleEl.textContent = "🔇";
  musicToggleEl.classList.remove("playing");
}

musicToggleEl.addEventListener("click", () => {
  if (musicPlaying) {
    stopMusic();
    localStorage.setItem("cubywearMusic", "off");
  } else {
    startMusic();
    localStorage.setItem("cubywearMusic", "on");
  }
});

// --- Jeux du jour (3 jeux, choisis par l'admin) ---
const dailyGridEl = document.getElementById("dailyGamesGrid");

function renderDailyGames() {
  dailyGridEl.innerHTML = "";
  dailyGames.forEach(id => {
    const game = GAMES_BY_ID[id];
    if (!game) return;
    const card = document.createElement("a");
    card.className = "daily-mini-card";
    card.href = entryFor(game);
    card.innerHTML = `
      <div class="daily-mini-icon">${game.icon}</div>
      <div class="daily-mini-name">${game.name}</div>
      <div class="daily-mini-desc">${game.desc}</div>
      <span class="daily-mini-play">JOUER</span>
    `;
    dailyGridEl.appendChild(card);
  });
}

renderDailyGames();

function setDailyGames() {
  const ids = [
    document.getElementById("gameSelector1").value,
    document.getElementById("gameSelector2").value,
    document.getElementById("gameSelector3").value
  ];
  dailyGames = ids;
  localStorage.setItem("cubywearDailyGames", JSON.stringify(ids));
  renderDailyGames();
}

// Sélecteurs admin, générés depuis la même liste (plus de doublon à maintenir).
["gameSelector1", "gameSelector2", "gameSelector3"].forEach((selId, i) => {
  const selectorEl = document.getElementById(selId);
  GAMES.forEach(game => {
    const option = document.createElement("option");
    option.value = game.id;
    option.textContent = game.name;
    selectorEl.appendChild(option);
  });
  selectorEl.value = dailyGames[i];
});

// --- Décompte avant les 3 prochains jeux du jour (minuit) ---
const countdownEl = document.getElementById("dailyCountdown");

function updateCountdown() {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diff = nextMidnight - now;

  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");

  countdownEl.textContent = `Prochains jeux dans ${h}:${m}:${s}`;
}

updateCountdown();
setInterval(updateCountdown, 1000);
