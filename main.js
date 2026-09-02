const GAMES = [
  { id: "memory", icon: "🧠", entry: "./games/memory-select.html",
    fr: { name: "Memory", desc: "Trouve toutes les paires" }, en: { name: "Memory", desc: "Find all the pairs" } },
  { id: "tictactoe", icon: "❌⭕",
    fr: { name: "Tic Tac Toe", desc: "Bats l'IA ou ton ami" }, en: { name: "Tic Tac Toe", desc: "Beat the AI or a friend" } },
  { id: "flappy", icon: "🐤",
    fr: { name: "Flappy Bird", desc: "Évite les obstacles" }, en: { name: "Flappy Bird", desc: "Avoid the obstacles" } },
  { id: "sudoku", icon: "🔢",
    fr: { name: "Sudoku", desc: "Résous la grille" }, en: { name: "Sudoku", desc: "Solve the grid" } },
  { id: "pendu", icon: "🪢",
    fr: { name: "Pendu", desc: "Découvre le mot lettre par lettre" }, en: { name: "Hangman", desc: "Guess the word letter by letter" } },
  { id: "mastermind", icon: "🎯",
    fr: { name: "Mastermind", desc: "Devine la combinaison de couleurs" }, en: { name: "Mastermind", desc: "Guess the color combination" } },
  { id: "2048", icon: "🔢",
    fr: { name: "2048 Lite", desc: "Fusionne les tuiles jusqu'à 2048" }, en: { name: "2048 Lite", desc: "Merge tiles up to 2048" } },
  { id: "labyrinthe", icon: "🌀",
    fr: { name: "Labyrinthe", desc: "Trouve la sortie avant la fin du temps" }, en: { name: "Maze", desc: "Find the exit before time runs out" } },
  { id: "puzzle-glissant", icon: "🧩",
    fr: { name: "Puzzle glissant", desc: "Reconstitue l'image en glissant les pièces" }, en: { name: "Sliding Puzzle", desc: "Rebuild the picture by sliding pieces" } },
  { id: "reaction-tap", icon: "⚡",
    fr: { name: "Reaction Tap", desc: "Clique dès que ça devient vert" }, en: { name: "Reaction Tap", desc: "Tap as soon as it turns green" } },
  { id: "aim-trainer", icon: "🎯",
    fr: { name: "Aim Trainer", desc: "Clique les cibles le plus vite possible" }, en: { name: "Aim Trainer", desc: "Click the targets as fast as possible" } },
  { id: "swipe-runner", icon: "🏃",
    fr: { name: "Swipe Runner", desc: "Esquive les obstacles gauche/droite" }, en: { name: "Swipe Runner", desc: "Dodge obstacles left/right" } },
  { id: "speed-math", icon: "🧮",
    fr: { name: "Speed Math", desc: "Résous des calculs contre le chrono" }, en: { name: "Speed Math", desc: "Solve calculations against the clock" } },
  { id: "catch-the-cube", icon: "🧊",
    fr: { name: "Catch the Cube", desc: "Attrape la mascotte avant qu'elle ne se téléporte" }, en: { name: "Catch the Cube", desc: "Catch the mascot before it teleports" } },
  { id: "snake", icon: "🐍",
    fr: { name: "Snake", desc: "Mange les pommes sans te mordre" }, en: { name: "Snake", desc: "Eat apples without biting yourself" } },
  { id: "breakout", icon: "🧱",
    fr: { name: "Breakout", desc: "Détruis toutes les briques avec la balle" }, en: { name: "Breakout", desc: "Destroy all the bricks with the ball" } },
  { id: "space-shooter", icon: "🚀",
    fr: { name: "Space Shooter", desc: "Esquive et tire sur les ennemis" }, en: { name: "Space Shooter", desc: "Dodge and shoot the enemies" } },
  { id: "runner-2d", icon: "🦘",
    fr: { name: "Runner 2D", desc: "Saute par-dessus les obstacles" }, en: { name: "Runner 2D", desc: "Jump over the obstacles" } },
  { id: "mini-tetris", icon: "🧱",
    fr: { name: "Mini-Tetris", desc: "Empile les pièces et complète des lignes" }, en: { name: "Mini-Tetris", desc: "Stack pieces and clear lines" } },
  { id: "trouve-objet", icon: "🔍",
    fr: { name: "Trouve l'objet", desc: "Repère l'objet différent dans la grille" }, en: { name: "Spot It", desc: "Spot the different object in the grid" } },
  { id: "color-match", icon: "🎨",
    fr: { name: "Color Match", desc: "Choisis la nuance exacte" }, en: { name: "Color Match", desc: "Pick the exact shade" } },
  { id: "symetrie", icon: "🦋",
    fr: { name: "Symétrie", desc: "Dis si la forme est symétrique" }, en: { name: "Symmetry", desc: "Say if the shape is symmetrical" } },
  { id: "memory-duo", icon: "🧠",
    fr: { name: "Memory Duo+", desc: "Un memory dont les cartes bougent" }, en: { name: "Memory Duo+", desc: "A memory game where cards move" } },
  { id: "bon-pixel", icon: "🖼️",
    fr: { name: "Bon pixel", desc: "Devine l'image pixelisée" }, en: { name: "Pixel Guess", desc: "Guess the pixelated picture" } },
  { id: "anagrammes", icon: "🔤",
    fr: { name: "Anagrammes", desc: "Remets les lettres dans le bon ordre" }, en: { name: "Anagrams", desc: "Put the letters back in order" } },
  { id: "mot-flash", icon: "⚡",
    fr: { name: "Mot Flash", desc: "Trouve le mot à partir d'un indice" }, en: { name: "Word Flash", desc: "Find the word from a clue" } },
  { id: "lettre-manquante", icon: "🔡",
    fr: { name: "Lettre manquante", desc: "Complète le mot" }, en: { name: "Missing Letter", desc: "Complete the word" } },
  { id: "mini-wordle", icon: "🟩",
    fr: { name: "Mini-Wordle", desc: "Devine le mot de 4 lettres en 5 essais" }, en: { name: "Mini-Wordle", desc: "Guess the 4-letter word in 5 tries" } },
  { id: "mini-othello", icon: "⚫",
    fr: { name: "Mini-Othello", desc: "Retourne les pions de ton adversaire" }, en: { name: "Mini-Othello", desc: "Flip your opponent's pieces" } },
  { id: "connect4-lite", icon: "🔴",
    fr: { name: "Connect 4 Lite", desc: "Aligne 4 pions avant le bot" }, en: { name: "Connect 4 Lite", desc: "Line up 4 pieces before the bot" } },
  { id: "hexa-path", icon: "🔷",
    fr: { name: "Hexa-Path", desc: "Relie les deux côtés du plateau hexagonal" }, en: { name: "Hexa-Path", desc: "Connect both sides of the hex board" } },
  { id: "drapeaux", icon: "🚩",
    fr: { name: "Drapeaux du Monde", desc: "Devine le pays à partir de son drapeau" }, en: { name: "World Flags", desc: "Guess the country from its flag" } },
  { id: "autour-du-monde", icon: "🌍",
    fr: { name: "Autour du Monde", desc: "Devine le pays à partir d'une carte postale" }, en: { name: "Around the World", desc: "Guess the country from a postcard" } },
  { id: "zoom-animal", icon: "🔍",
    fr: { name: "Zoom Animal", desc: "Devine l'animal avant le dézoom complet" }, en: { name: "Zoom Animal", desc: "Guess the animal before it fully zooms out" } },
  { id: "cri-animal", icon: "🔊",
    fr: { name: "Cri d'Animal", desc: "Devine l'animal à partir de son cri" }, en: { name: "Animal Sounds", desc: "Guess the animal from its sound" } },
  { id: "color-switch", icon: "🎡",
    fr: { name: "Color Switch", desc: "Passe par la bonne couleur en sautant" }, en: { name: "Color Switch", desc: "Jump through the matching color" } },
  { id: "water-sort", icon: "💧",
    fr: { name: "Tri de l'Eau", desc: "Trie les couleurs dans les bons tubes" }, en: { name: "Water Sort", desc: "Sort the colors into the right tubes" } },
  { id: "flow-free", icon: "🌈",
    fr: { name: "Flow Libre", desc: "Relie les ronds de même couleur sans croiser les tuyaux" }, en: { name: "Flow Free", desc: "Connect matching dots without crossing pipes" } },
  { id: "stack-tower", icon: "🧱",
    fr: { name: "Stack Tower", desc: "Empile les blocs le plus haut possible" }, en: { name: "Stack Tower", desc: "Stack the blocks as high as possible" } },
  { id: "piano-tiles", icon: "🎹",
    fr: { name: "Piano Tiles", desc: "Touche les tuiles noires sans en rater une" }, en: { name: "Piano Tiles", desc: "Tap the black tiles without missing one" } },
  { id: "air-hockey", icon: "🏒",
    fr: { name: "Air Hockey", desc: "Marque plus de buts que le bot" }, en: { name: "Air Hockey", desc: "Score more goals than the bot" } }
];

const GAMES_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

const UI_TEXT = {
  fr: {
    "settings.theme": "Thème",
    "settings.sound": "Son",
    "settings.language": "Langue",
    "daily.badge": "🔥 JEUX DU JOUR",
    "daily.play": "JOUER",
    "daily.countdownPrefix": "Prochains jeux dans",
    "shop.title": "🛍️ BOUTIQUE",
    "shop.desc": "Découvre les hoodies CubyWear",
    "admin.summary": "⚙️ Admin — choisir les 3 jeux du jour",
    "admin.apply": "Appliquer",
    dateLocale: "fr-FR"
  },
  en: {
    "settings.theme": "Theme",
    "settings.sound": "Sound",
    "settings.language": "Language",
    "daily.badge": "🔥 GAMES OF THE DAY",
    "daily.play": "PLAY",
    "daily.countdownPrefix": "Next games in",
    "shop.title": "🛍️ SHOP",
    "shop.desc": "Discover CubyWear hoodies",
    "admin.summary": "⚙️ Admin — pick the 3 daily games",
    "admin.apply": "Apply",
    dateLocale: "en-US"
  }
};

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

// --- Réglages : panneau ---
const settingsBtnEl = document.getElementById("settingsBtn");
const settingsPanelEl = document.getElementById("settingsPanel");

settingsBtnEl.addEventListener("click", (e) => {
  e.stopPropagation();
  settingsPanelEl.hidden = !settingsPanelEl.hidden;
});

document.addEventListener("click", (e) => {
  if (!settingsPanelEl.hidden && !settingsPanelEl.contains(e.target) && e.target !== settingsBtnEl) {
    settingsPanelEl.hidden = true;
  }
});

// --- Langue (FR / EN) ---
const langToggleEl = document.getElementById("langToggle");
let currentLang = localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";

function applyLanguage(lang) {
  const dict = UI_TEXT[lang];
  document.documentElement.setAttribute("lang", lang);

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString(dict.dateLocale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  langToggleEl.textContent = lang === "en" ? "EN" : "FR";

  renderDailyGames();
  populateAdminSelectors();
  updateCountdown();
}

langToggleEl.addEventListener("click", () => {
  currentLang = currentLang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", currentLang);
  applyLanguage(currentLang);
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
    const label = game[currentLang];
    const card = document.createElement("a");
    card.className = "daily-mini-card";
    card.href = entryFor(game);
    card.innerHTML = `
      <div class="daily-mini-icon">${game.icon}</div>
      <div class="daily-mini-name">${label.name}</div>
      <div class="daily-mini-desc">${label.desc}</div>
      <span class="daily-mini-play">${UI_TEXT[currentLang]["daily.play"]}</span>
    `;
    dailyGridEl.appendChild(card);
  });
}

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
function populateAdminSelectors() {
  ["gameSelector1", "gameSelector2", "gameSelector3"].forEach((selId, i) => {
    const selectorEl = document.getElementById(selId);
    selectorEl.innerHTML = "";
    GAMES.forEach(game => {
      const option = document.createElement("option");
      option.value = game.id;
      option.textContent = game[currentLang].name;
      selectorEl.appendChild(option);
    });
    selectorEl.value = dailyGames[i];
  });
}

// --- Décompte avant les 3 prochains jeux du jour (minuit) ---
const countdownEl = document.getElementById("dailyCountdown");

function updateCountdown() {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diff = nextMidnight - now;

  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");

  countdownEl.textContent = `${UI_TEXT[currentLang]["daily.countdownPrefix"]} ${h}:${m}:${s}`;
}

applyLanguage(currentLang);
setInterval(updateCountdown, 1000);
