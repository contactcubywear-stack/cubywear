import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "Écoute et devine l'animal !",
    done: "🔊 Terminé !", score: "Score", bestStreak: "Meilleure série",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Listen and guess the animal!",
    done: "🔊 Done!", score: "Score", bestStreak: "Best streak",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// --- Synthèse des cris (aucun fichier audio requis) ---
let audioCtx = null;
function ensureCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone({ freq, start = 0, dur = 0.3, type = "sine", vol = 0.16, bendTo = null, vibrato = 0 }) {
  const ctx = ensureCtx();
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (bendTo) osc.frequency.linearRampToValueAtTime(bendTo, t0 + dur);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.05, dur / 4));
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);

  if (vibrato) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = vibrato;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = freq * 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.1);
  }

  osc.start(t0);
  osc.stop(t0 + dur + 0.08);
}

function playNoise({ start = 0, dur = 0.8, filterFreq = 3500, vol = 0.14 }) {
  const ctx = ensureCtx();
  const t0 = ctx.currentTime + start;
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = filterFreq;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(t0);
  noise.stop(t0 + dur + 0.05);
}

const ANIMAL_SOUNDS = {
  dog: () => { playTone({ freq: 220, dur: 0.15, type: "square" }); playTone({ freq: 220, dur: 0.15, type: "square", start: 0.22 }); },
  cat: () => { playTone({ freq: 600, bendTo: 900, dur: 0.25, type: "sine" }); playTone({ freq: 900, bendTo: 500, dur: 0.35, type: "sine", start: 0.22 }); },
  cow: () => playTone({ freq: 110, dur: 1.1, type: "sawtooth", vol: 0.16, vibrato: 5 }),
  duck: () => [0, 0.16, 0.32].forEach(s => playTone({ freq: 300, bendTo: 260, dur: 0.13, type: "square", start: s, vol: 0.18 })),
  rooster: () => [400, 600, 850, 650, 950].forEach((f, i) => playTone({ freq: f, dur: 0.14, type: "sawtooth", start: i * 0.15, vol: 0.15 })),
  lion: () => playTone({ freq: 90, bendTo: 140, dur: 1.5, type: "sawtooth", vol: 0.2, vibrato: 6 }),
  owl: () => { playTone({ freq: 300, dur: 0.4, type: "sine", vol: 0.15 }); playTone({ freq: 250, dur: 0.5, type: "sine", start: 0.5, vol: 0.15 }); },
  sheep: () => playTone({ freq: 300, bendTo: 220, dur: 0.5, type: "sawtooth", vibrato: 8, vol: 0.16 }),
  pig: () => { playTone({ freq: 200, dur: 0.15, type: "square", vol: 0.15 }); playTone({ freq: 180, dur: 0.15, type: "square", start: 0.2, vol: 0.15 }); },
  horse: () => { playTone({ freq: 300, bendTo: 650, dur: 0.15, type: "sawtooth", vol: 0.15 }); playTone({ freq: 650, bendTo: 300, dur: 0.5, type: "sawtooth", start: 0.15, vibrato: 12, vol: 0.15 }); },
  frog: () => [0, 0.15, 0.3].forEach(s => playTone({ freq: 150, dur: 0.1, type: "square", start: s, vol: 0.17 })),
  wolf: () => playTone({ freq: 300, bendTo: 750, dur: 1.6, type: "sine", vol: 0.16 }),
  elephant: () => playTone({ freq: 200, bendTo: 550, dur: 0.9, type: "sawtooth", vibrato: 10, vol: 0.16 }),
  bird: () => [1200, 1500, 1300].forEach((f, i) => playTone({ freq: f, dur: 0.08, type: "sine", start: i * 0.12, vol: 0.14 })),
  bee: () => playTone({ freq: 250, dur: 1.0, type: "sawtooth", vibrato: 20, vol: 0.12 }),
  snake: () => playNoise({ dur: 1.0, filterFreq: 4000 })
};

const ANIMALS = [
  { key: "dog", emoji: "🐶", fr: "Chien", en: "Dog" },
  { key: "cat", emoji: "🐱", fr: "Chat", en: "Cat" },
  { key: "cow", emoji: "🐄", fr: "Vache", en: "Cow" },
  { key: "duck", emoji: "🦆", fr: "Canard", en: "Duck" },
  { key: "rooster", emoji: "🐓", fr: "Coq", en: "Rooster" },
  { key: "lion", emoji: "🦁", fr: "Lion", en: "Lion" },
  { key: "owl", emoji: "🦉", fr: "Hibou", en: "Owl" },
  { key: "sheep", emoji: "🐑", fr: "Mouton", en: "Sheep" },
  { key: "pig", emoji: "🐷", fr: "Cochon", en: "Pig" },
  { key: "horse", emoji: "🐴", fr: "Cheval", en: "Horse" },
  { key: "frog", emoji: "🐸", fr: "Grenouille", en: "Frog" },
  { key: "wolf", emoji: "🐺", fr: "Loup", en: "Wolf" },
  { key: "elephant", emoji: "🐘", fr: "Éléphant", en: "Elephant" },
  { key: "bird", emoji: "🐦", fr: "Oiseau", en: "Bird" },
  { key: "bee", emoji: "🐝", fr: "Abeille", en: "Bee" },
  { key: "snake", emoji: "🐍", fr: "Serpent", en: "Snake" }
];

const TOTAL_ROUNDS = 10;

const stimulusEl = document.getElementById("stimulus");
const choicesEl = document.getElementById("choices");
const playBtn = document.getElementById("playBtn");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let best = 0;
let over = false;
let current = null;

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, TOTAL_ROUNDS);
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("bestVal").textContent = best;
}

function playCurrentSound() {
  if (!current) return;
  ANIMAL_SOUNDS[current.key]();
  playBtn.classList.add("playing");
  setTimeout(() => playBtn.classList.remove("playing"), 1000);
}

function pickChoices(correct) {
  const others = ANIMALS.filter(a => a.key !== correct.key).sort(() => Math.random() - 0.5).slice(0, 3);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

function startRound() {
  if (round >= TOTAL_ROUNDS) {
    endGame();
    return;
  }
  stimulusEl.className = "quiz-stimulus";
  updateHud();

  current = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

  const choices = pickChoices(current);
  choicesEl.innerHTML = "";
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handlePick(choice.key === current.key, btn);
    choicesEl.appendChild(btn);
  });

  setTimeout(playCurrentSound, 300);
}

function handlePick(correct, btn) {
  if (over) return;
  document.querySelectorAll(".choice-btn").forEach(b => (b.onclick = null));

  if (correct) {
    score++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    stimulusEl.classList.add("correct");
    if (btn) btn.classList.add("correct");
    if (window.CubySfx) CubySfx.match();
  } else {
    streak = 0;
    stimulusEl.classList.add("wrong");
    if (btn) btn.classList.add("wrong");
    document.querySelectorAll(".choice-btn").forEach(b => {
      if (b.textContent === current[lang]) b.classList.add("correct");
    });
    if (window.CubySfx) CubySfx.fail();
  }

  round++;
  setTimeout(startRound, 900);
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.win();

  if (score > best) {
    best = score;
    localStorage.setItem("bestCriAnimal", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "cri-animal", score * 10);
}

playBtn.addEventListener("click", () => playCurrentSound());
document.getElementById("replayBtn").onclick = () => location.reload();

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
window.__criAnimalDebug = { handlePick, playCurrentSound, getState: () => ({ round, score, over, current, streak }) };

best = Number(localStorage.getItem("bestCriAnimal") || 0);
applyLang();
startRound();
