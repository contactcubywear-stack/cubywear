import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "De qui vient cette œuvre ?",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    done: "🖼️ Terminé !", score: "Score", bestStreak: "Meilleure série",
    loading: "Chargement",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Who made this artwork?",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    done: "🖼️ Done!", score: "Score", bestStreak: "Best streak",
    loading: "Loading",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Nom de l'artiste, utilisé aussi comme identifiant de recherche Wikipédia (portrait non affiché ici).
const ARTIST_NAMES = {
  "Leonardo da Vinci": { fr: "Léonard de Vinci", en: "Leonardo da Vinci" },
  "Michelangelo": { fr: "Michel-Ange", en: "Michelangelo" },
  "Rembrandt": { fr: "Rembrandt", en: "Rembrandt" },
  "Sandro Botticelli": { fr: "Sandro Botticelli", en: "Sandro Botticelli" },
  "Johannes Vermeer": { fr: "Johannes Vermeer", en: "Johannes Vermeer" },
  "Diego Velázquez": { fr: "Diego Velázquez", en: "Diego Velázquez" },
  "Jan van Eyck": { fr: "Jan van Eyck", en: "Jan van Eyck" },
  "Vincent van Gogh": { fr: "Vincent van Gogh", en: "Vincent van Gogh" },
  "Claude Monet": { fr: "Claude Monet", en: "Claude Monet" },
  "Katsushika Hokusai": { fr: "Hokusai", en: "Hokusai" },
  "Edvard Munch": { fr: "Edvard Munch", en: "Edvard Munch" },
  "Wassily Kandinsky": { fr: "Vassily Kandinsky", en: "Wassily Kandinsky" },
  "Gustav Klimt": { fr: "Gustav Klimt", en: "Gustav Klimt" },
  "Edward Hopper": { fr: "Edward Hopper", en: "Edward Hopper" },
  "Grant Wood": { fr: "Grant Wood", en: "Grant Wood" },
  "Eugène Delacroix": { fr: "Eugène Delacroix", en: "Eugène Delacroix" },
  "James McNeill Whistler": { fr: "James McNeill Whistler", en: "James McNeill Whistler" },
  "Auguste Rodin": { fr: "Auguste Rodin", en: "Auguste Rodin" },
  "Andy Warhol": { fr: "Andy Warhol", en: "Andy Warhol" },
  "Caspar David Friedrich": { fr: "Caspar David Friedrich", en: "Caspar David Friedrich" }
};

// Œuvres du domaine public, image vérifiée via l'API Wikipedia (pageimages).
const ARTWORKS = [
  { wikiTitle: "Mona Lisa", artist: "Leonardo da Vinci", cat: "classical_art" },
  { wikiTitle: "The Last Supper", artist: "Leonardo da Vinci", cat: "classical_art" },
  { wikiTitle: "The Creation of Adam", artist: "Michelangelo", cat: "classical_art" },
  { wikiTitle: "David (Michelangelo)", artist: "Michelangelo", cat: "classical_art" },
  { wikiTitle: "The Birth of Venus", artist: "Sandro Botticelli", cat: "classical_art" },
  { wikiTitle: "Girl with a Pearl Earring", artist: "Johannes Vermeer", cat: "classical_art" },
  { wikiTitle: "The Night Watch", artist: "Rembrandt", cat: "classical_art" },
  { wikiTitle: "Las Meninas", artist: "Diego Velázquez", cat: "classical_art" },
  { wikiTitle: "The Anatomy Lesson of Dr. Nicolaes Tulp", artist: "Rembrandt", cat: "classical_art" },
  { wikiTitle: "The Arnolfini Portrait", artist: "Jan van Eyck", cat: "classical_art" },
  { wikiTitle: "The Starry Night", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "Café Terrace at Night", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "Impression, Sunrise", artist: "Claude Monet", cat: "modern_art" },
  { wikiTitle: "The Great Wave off Kanagawa", artist: "Katsushika Hokusai", cat: "modern_art" },
  { wikiTitle: "The Scream", artist: "Edvard Munch", cat: "modern_art" },
  { wikiTitle: "Composition VII", artist: "Wassily Kandinsky", cat: "modern_art" },
  { wikiTitle: "The Kiss (Klimt)", artist: "Gustav Klimt", cat: "modern_art" },
  { wikiTitle: "Nighthawks (painting)", artist: "Edward Hopper", cat: "modern_art" },
  { wikiTitle: "American Gothic", artist: "Grant Wood", cat: "modern_art" },
  { wikiTitle: "Liberty Leading the People", artist: "Eugène Delacroix", cat: "modern_art" },
  { wikiTitle: "Whistler's Mother", artist: "James McNeill Whistler", cat: "modern_art" },
  { wikiTitle: "The Thinker", artist: "Auguste Rodin", cat: "modern_art" },
  { wikiTitle: "Campbell's Soup Cans", artist: "Andy Warhol", cat: "modern_art" },
  { wikiTitle: "Wanderer above the Sea of Fog", artist: "Caspar David Friedrich", cat: "modern_art" }
];

// Liste dédupliquée des artistes, utilisée comme choix de réponse.
const ARTIST_POOL = Array.from(
  new Map(ARTWORKS.map(a => [a.artist, { id: a.artist, ...ARTIST_NAMES[a.artist], cat: a.cat }])).values()
);

const DIFFICULTIES = {
  facile: { rounds: 8, time: 12, hardness: 0 },
  moyen: { rounds: 10, time: 10, hardness: 1 },
  difficile: { rounds: 12, time: 8, hardness: 2 },
  impossible: { rounds: 14, time: 6, hardness: 3 }
};

let cfg = DIFFICULTIES.moyen;
let diffKey = "moyen";
const TOTAL_ROUNDS = () => cfg.rounds;

const stimulusEl = document.getElementById("stimulus");
const choicesEl = document.getElementById("choices");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let best = 0;
let over = false;
let current = null;
let timeLeft = 0;
let timerInterval = null;

const imgCache = new Map();

async function fetchWikiImage(title, size = 500) {
  if (imgCache.has(title)) return imgCache.get(title);
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=${size}&origin=*&redirects=1`;
    const res = await fetch(url);
    const data = await res.json();
    const page = Object.values(data.query.pages)[0];
    const src = page?.thumbnail?.source || null;
    imgCache.set(title, src);
    return src;
  } catch (e) {
    return null;
  }
}

function timeForRound() {
  return Math.max(cfg.time - round * 0.3, cfg.time - 4);
}

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, TOTAL_ROUNDS());
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("bestVal").textContent = best;
}

function updateTimerBar() {
  const fill = document.getElementById("timerFill");
  if (!fill) return;
  const total = timeForRound();
  const ratio = Math.max(timeLeft / total, 0);
  fill.style.width = `${ratio * 100}%`;
  fill.classList.toggle("warn", ratio <= 0.5 && ratio > 0.2);
  fill.classList.toggle("danger", ratio <= 0.2);
}

function pickChoices(correct) {
  const sameCat = ARTIST_POOL.filter(p => p.cat === correct.cat && p.id !== correct.id);
  const otherCat = ARTIST_POOL.filter(p => p.cat !== correct.cat);
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

function showLoading(show) {
  if (show) {
    stimulusEl.innerHTML = "";
    const loadingEl = document.createElement("p");
    loadingEl.className = "quiz-loading";
    loadingEl.textContent = T[lang].loading;
    stimulusEl.appendChild(loadingEl);
  }
}

async function startRound() {
  if (round >= TOTAL_ROUNDS()) {
    endGame();
    return;
  }
  clearInterval(timerInterval);
  stimulusEl.className = "quiz-stimulus";
  updateHud();
  choicesEl.innerHTML = "";
  showLoading(true);

  let attempts = 0;
  let src = null;
  let work = null;
  while (attempts < 4 && !src) {
    work = ARTWORKS[Math.floor(Math.random() * ARTWORKS.length)];
    src = await fetchWikiImage(work.wikiTitle);
    attempts++;
  }

  if (!src) {
    stimulusEl.innerHTML = "";
    return;
  }

  current = ARTIST_POOL.find(a => a.id === work.artist);
  stimulusEl.className = "quiz-stimulus photo-quiz";
  stimulusEl.innerHTML = `<img src="${src}" alt="">`;

  const choices = pickChoices(current);
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handlePick(choice.id === current.id, btn);
    choicesEl.appendChild(btn);
  });

  timeLeft = timeForRound();
  updateTimerBar();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    updateTimerBar();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handlePick(false, null);
    }
  }, 100);
}

function handlePick(correct, btn) {
  if (over) return;
  clearInterval(timerInterval);
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
  setTimeout(startRound, 1000);
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.win();

  if (score > best) {
    best = score;
    localStorage.setItem("bestChefDoeuvre", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "chef-doeuvre", score * 10);
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

  const timerWrap = document.createElement("div");
  timerWrap.className = "timer-bar";
  timerWrap.innerHTML = `<div class="timer-fill" id="timerFill"></div>`;
  stimulusEl.after(timerWrap);

  startRound();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

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
window.__chefDoeuvreDebug = { handlePick, startGame, getState: () => ({ round, score, over, current, streak, diffKey }) };

best = Number(localStorage.getItem("bestChefDoeuvre") || 0);
applyLang();
