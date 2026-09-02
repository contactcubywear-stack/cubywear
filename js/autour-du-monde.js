import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "Reconnais-tu cet endroit ?",
    done: "🌍 Terminé !", score: "Score", bestStreak: "Meilleure série",
    loading: "Chargement",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Do you recognize this place?",
    done: "🌍 Done!", score: "Score", bestStreak: "Best streak",
    loading: "Loading",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Titres Wikipédia vérifiés à l'avance pour garantir une vraie photo du lieu.
const PLACES = [
  { title: "Eiffel Tower", fr: "Tour Eiffel (France)", en: "Eiffel Tower (France)" },
  { title: "Statue of Liberty", fr: "Statue de la Liberté (États-Unis)", en: "Statue of Liberty (USA)" },
  { title: "Big Ben", fr: "Big Ben (Royaume-Uni)", en: "Big Ben (UK)" },
  { title: "Christ the Redeemer (statue)", fr: "Christ Rédempteur (Brésil)", en: "Christ the Redeemer (Brazil)" },
  { title: "Great Wall of China", fr: "Grande Muraille (Chine)", en: "Great Wall (China)" },
  { title: "Taj Mahal", fr: "Taj Mahal (Inde)", en: "Taj Mahal (India)" },
  { title: "Colosseum", fr: "Colisée (Italie)", en: "Colosseum (Italy)" },
  { title: "Sydney Opera House", fr: "Opéra de Sydney (Australie)", en: "Sydney Opera House (Australia)" },
  { title: "Great Pyramid of Giza", fr: "Pyramides de Gizeh (Égypte)", en: "Pyramids of Giza (Egypt)" },
  { title: "Machu Picchu", fr: "Machu Picchu (Pérou)", en: "Machu Picchu (Peru)" },
  { title: "Golden Gate Bridge", fr: "Golden Gate (États-Unis)", en: "Golden Gate Bridge (USA)" },
  { title: "Burj Khalifa", fr: "Burj Khalifa (Émirats)", en: "Burj Khalifa (UAE)" },
  { title: "Leaning Tower of Pisa", fr: "Tour de Pise (Italie)", en: "Tower of Pisa (Italy)" },
  { title: "Neuschwanstein Castle", fr: "Château de Neuschwanstein (Allemagne)", en: "Neuschwanstein Castle (Germany)" },
  { title: "Petra", fr: "Pétra (Jordanie)", en: "Petra (Jordan)" },
  { title: "Mount Fuji", fr: "Mont Fuji (Japon)", en: "Mount Fuji (Japan)" },
  { title: "Kinderdijk", fr: "Moulins de Kinderdijk (Pays-Bas)", en: "Windmills of Kinderdijk (Netherlands)" },
  { title: "Sagrada Família", fr: "Sagrada Família (Espagne)", en: "Sagrada Família (Spain)" },
  { title: "Angkor Wat", fr: "Angkor Vat (Cambodge)", en: "Angkor Wat (Cambodia)" },
  { title: "Stonehenge", fr: "Stonehenge (Royaume-Uni)", en: "Stonehenge (UK)" },
  { title: "Table Mountain", fr: "Montagne de la Table (Afrique du Sud)", en: "Table Mountain (South Africa)" }
];

const TOTAL_ROUNDS = 10;

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
  return Math.max(12 - round * 0.4, 7);
}

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, TOTAL_ROUNDS);
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
  const others = PLACES.filter(p => p.title !== correct.title).sort(() => Math.random() - 0.5).slice(0, 3);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

function showLoading(show) {
  let loadingEl = document.getElementById("quizLoading");
  if (show) {
    stimulusEl.innerHTML = "";
    loadingEl = document.createElement("p");
    loadingEl.id = "quizLoading";
    loadingEl.className = "quiz-loading";
    loadingEl.textContent = T[lang].loading;
    stimulusEl.appendChild(loadingEl);
  }
}

async function startRound() {
  if (round >= TOTAL_ROUNDS) {
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
  let place = null;
  while (attempts < 4 && !src) {
    place = PLACES[Math.floor(Math.random() * PLACES.length)];
    src = await fetchWikiImage(place.title);
    attempts++;
  }

  if (!src) {
    stimulusEl.innerHTML = "";
    return;
  }

  current = place;
  stimulusEl.className = "quiz-stimulus photo-quiz";
  stimulusEl.innerHTML = `<img src="${src}" alt="">`;

  const choices = pickChoices(current);
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handlePick(choice.title === current.title, btn);
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
    localStorage.setItem("bestAutourDuMonde", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "autour-du-monde", score * 10);
}

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
window.__autourDuMondeDebug = { handlePick, getState: () => ({ round, score, over, current, streak }) };

best = Number(localStorage.getItem("bestAutourDuMonde") || 0);
applyLang();

const timerWrap = document.createElement("div");
timerWrap.className = "timer-bar";
timerWrap.innerHTML = `<div class="timer-fill" id="timerFill"></div>`;
stimulusEl.after(timerWrap);

startRound();
