// GAMES / GAMES_BY_ID / entryFor viennent de js/games-data.js (chargé avant ce fichier).

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
