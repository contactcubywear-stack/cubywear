import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "Écoute et devine la chanson !",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    done: "🎧 Terminé !", score: "Score", bestStreak: "Meilleure série",
    loading: "Chargement",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Listen and guess the song!",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    done: "🎧 Done!", score: "Score", bestStreak: "Best streak",
    loading: "Loading",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Prévisualisations vérifiées via l'API de recherche iTunes (pas de clé requise).
const SONGS = [
  { id: "bohemian-rhapsody", search: "Queen Bohemian Rhapsody", fr: "Bohemian Rhapsody – Queen", en: "Bohemian Rhapsody – Queen", cat: "rock" },
  { id: "dont-stop-me-now", search: "Queen Dont Stop Me Now", fr: "Don't Stop Me Now – Queen", en: "Don't Stop Me Now – Queen", cat: "rock" },
  { id: "billie-jean", search: "Michael Jackson Billie Jean", fr: "Billie Jean – Michael Jackson", en: "Billie Jean – Michael Jackson", cat: "pop" },
  { id: "thriller", search: "Michael Jackson Thriller", fr: "Thriller – Michael Jackson", en: "Thriller – Michael Jackson", cat: "pop" },
  { id: "dancing-queen", search: "ABBA Dancing Queen", fr: "Dancing Queen – ABBA", en: "Dancing Queen – ABBA", cat: "pop" },
  { id: "hey-jude", search: "The Beatles Hey Jude", fr: "Hey Jude – The Beatles", en: "Hey Jude – The Beatles", cat: "rock" },
  { id: "shape-of-you", search: "Ed Sheeran Shape of You", fr: "Shape of You – Ed Sheeran", en: "Shape of You – Ed Sheeran", cat: "pop" },
  { id: "rolling-in-the-deep", search: "Adele Rolling in the Deep", fr: "Rolling in the Deep – Adele", en: "Rolling in the Deep – Adele", cat: "pop" },
  { id: "i-wanna-dance", search: "Whitney Houston I Wanna Dance with Somebody", fr: "I Wanna Dance with Somebody – Whitney Houston", en: "I Wanna Dance with Somebody – Whitney Houston", cat: "pop" },
  { id: "smells-like-teen-spirit", search: "Nirvana Smells Like Teen Spirit", fr: "Smells Like Teen Spirit – Nirvana", en: "Smells Like Teen Spirit – Nirvana", cat: "rock" },
  { id: "halo", search: "Beyonce Halo", fr: "Halo – Beyoncé", en: "Halo – Beyoncé", cat: "pop" },
  { id: "viva-la-vida", search: "Coldplay Viva la Vida", fr: "Viva la Vida – Coldplay", en: "Viva la Vida – Coldplay", cat: "rock" },
  { id: "umbrella", search: "Rihanna Umbrella", fr: "Umbrella – Rihanna", en: "Umbrella – Rihanna", cat: "pop" },
  { id: "uptown-funk", search: "Bruno Mars Uptown Funk", fr: "Uptown Funk – Bruno Mars", en: "Uptown Funk – Bruno Mars", cat: "pop" },
  { id: "my-heart-will-go-on", search: "Celine Dion My Heart Will Go On", fr: "My Heart Will Go On – Céline Dion", en: "My Heart Will Go On – Celine Dion", cat: "classic" },
  { id: "get-lucky", search: "Daft Punk Get Lucky", fr: "Get Lucky – Daft Punk", en: "Get Lucky – Daft Punk", cat: "pop" },
  { id: "lose-yourself", search: "Eminem Lose Yourself", fr: "Lose Yourself – Eminem", en: "Lose Yourself – Eminem", cat: "hiphop" },
  { id: "bad-romance", search: "Lady Gaga Bad Romance", fr: "Bad Romance – Lady Gaga", en: "Bad Romance – Lady Gaga", cat: "pop" },
  { id: "rocket-man", search: "Elton John Rocket Man", fr: "Rocket Man – Elton John", en: "Rocket Man – Elton John", cat: "classic" },
  { id: "no-woman-no-cry", search: "Bob Marley No Woman No Cry", fr: "No Woman, No Cry – Bob Marley", en: "No Woman, No Cry – Bob Marley", cat: "reggae" },
  { id: "blinding-lights", search: "The Weeknd Blinding Lights", fr: "Blinding Lights – The Weeknd", en: "Blinding Lights – The Weeknd", cat: "pop" },
  { id: "firework", search: "Katy Perry Firework", fr: "Firework – Katy Perry", en: "Firework – Katy Perry", cat: "pop" },
  { id: "believer", search: "Imagine Dragons Believer", fr: "Believer – Imagine Dragons", en: "Believer – Imagine Dragons", cat: "rock" },
  { id: "alors-on-danse", search: "Stromae Alors on danse", fr: "Alors on danse – Stromae", en: "Alors on danse – Stromae", cat: "french" }
];

const DIFFICULTIES = {
  facile: { rounds: 8, playMs: 6000, hardness: 0 },
  moyen: { rounds: 10, playMs: 5000, hardness: 1 },
  difficile: { rounds: 12, playMs: 3500, hardness: 2 },
  impossible: { rounds: 14, playMs: 2500, hardness: 3 }
};

let cfg = DIFFICULTIES.moyen;
let diffKey = "moyen";
const TOTAL_ROUNDS = () => cfg.rounds;

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
let audioEl = null;
let stopTimer = null;

const previewCache = new Map();

async function fetchPreviewUrl(song) {
  if (previewCache.has(song.id)) return previewCache.get(song.id);
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(song.search)}&media=music&entity=song&limit=1&country=CA`;
    const res = await fetch(url);
    const data = await res.json();
    const src = data?.results?.[0]?.previewUrl || null;
    previewCache.set(song.id, src);
    return src;
  } catch (e) {
    return null;
  }
}

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, TOTAL_ROUNDS());
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("bestVal").textContent = best;
}

function playCurrentSound() {
  if (!current || !current.previewUrl) return;
  if (audioEl) { audioEl.pause(); audioEl = null; }
  clearTimeout(stopTimer);

  audioEl = new Audio(current.previewUrl);
  audioEl.play().catch(() => {});
  playBtn.classList.add("playing");
  stopTimer = setTimeout(() => {
    if (audioEl) audioEl.pause();
    playBtn.classList.remove("playing");
  }, cfg.playMs);
  audioEl.addEventListener("ended", () => playBtn.classList.remove("playing"));
}

function pickChoices(correct) {
  const sameCat = SONGS.filter(s => s.cat === correct.cat && s.id !== correct.id);
  const otherCat = SONGS.filter(s => s.cat !== correct.cat);
  let pool;
  if (cfg.hardness === 0) {
    pool = otherCat;
  } else if (cfg.hardness === 1) {
    const sameSample = sameCat.sort(() => Math.random() - 0.5).slice(0, 1);
    pool = [...sameSample, ...otherCat];
  } else {
    pool = sameCat.length >= 3 ? sameCat : [...sameCat, ...otherCat];
  }
  const wrong = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

async function startRound() {
  if (round >= TOTAL_ROUNDS()) {
    endGame();
    return;
  }
  stimulusEl.className = "quiz-stimulus";
  updateHud();
  choicesEl.innerHTML = "";
  playBtn.classList.remove("playing");

  let attempts = 0;
  let previewUrl = null;
  let song = null;
  while (attempts < 4 && !previewUrl) {
    song = SONGS[Math.floor(Math.random() * SONGS.length)];
    previewUrl = await fetchPreviewUrl(song);
    attempts++;
  }

  if (!previewUrl) return;

  current = { ...song, previewUrl };

  const choices = pickChoices(song);
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handlePick(choice.id === current.id, btn);
    choicesEl.appendChild(btn);
  });

  setTimeout(playCurrentSound, 300);
}

function handlePick(correct, btn) {
  if (over) return;
  document.querySelectorAll(".choice-btn").forEach(b => (b.onclick = null));
  if (audioEl) { audioEl.pause(); audioEl = null; }
  clearTimeout(stopTimer);
  playBtn.classList.remove("playing");

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
  setTimeout(startRound, 1000);
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.win();

  if (score > best) {
    best = score;
    localStorage.setItem("bestBlindTest", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "blind-test", score * 10);
}

function startGame(difficulty) {
  diffKey = difficulty;
  cfg = DIFFICULTIES[difficulty] || DIFFICULTIES.moyen;
  round = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  over = false;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  startRound();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

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
window.__blindTestDebug = { handlePick, playCurrentSound, startGame, getState: () => ({ round, score, over, current, streak, diffKey }) };

best = Number(localStorage.getItem("bestBlindTest") || 0);
applyLang();
