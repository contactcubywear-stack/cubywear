import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "Dans quel pays voit-on ça ?",
    done: "🌍 Terminé !", score: "Score", bestStreak: "Meilleure série",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Which country is this?",
    done: "🌍 Done!", score: "Score", bestStreak: "Best streak",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const PLACES = [
  { scene: "🗼🥐", fr: "France", en: "France" },
  { scene: "🗽🦅", fr: "États-Unis", en: "United States" },
  { scene: "🍁🦫", fr: "Canada", en: "Canada" },
  { scene: "🌮🌵", fr: "Mexique", en: "Mexico" },
  { scene: "⚽🌴", fr: "Brésil", en: "Brazil" },
  { scene: "🥩💃", fr: "Argentine", en: "Argentina" },
  { scene: "☂️👑", fr: "Royaume-Uni", en: "United Kingdom" },
  { scene: "🍺🥨", fr: "Allemagne", en: "Germany" },
  { scene: "🍕🍝", fr: "Italie", en: "Italy" },
  { scene: "💃🐂", fr: "Espagne", en: "Spain" },
  { scene: "🌷🧀", fr: "Pays-Bas", en: "Netherlands" },
  { scene: "🏔️🍫", fr: "Suisse", en: "Switzerland" },
  { scene: "🏛️🌊", fr: "Grèce", en: "Greece" },
  { scene: "❄️🪆", fr: "Russie", en: "Russia" },
  { scene: "🐉🥢", fr: "Chine", en: "China" },
  { scene: "🗻🍣", fr: "Japon", en: "Japan" },
  { scene: "🎤🍜", fr: "Corée du Sud", en: "South Korea" },
  { scene: "🐘🍛", fr: "Inde", en: "India" },
  { scene: "🦘🐨", fr: "Australie", en: "Australia" },
  { scene: "🐫☀️", fr: "Égypte", en: "Egypt" },
  { scene: "🦁🏃", fr: "Kenya", en: "Kenya" },
  { scene: "🕌☕", fr: "Turquie", en: "Turkey" },
  { scene: "🎻☘️", fr: "Irlande", en: "Ireland" },
  { scene: "🦙⛰️", fr: "Pérou", en: "Peru" }
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

function timeForRound() {
  return Math.max(10 - round * 0.4, 5);
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
  const others = PLACES.filter(p => p.fr !== correct.fr).sort(() => Math.random() - 0.5).slice(0, 3);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

function startRound() {
  if (round >= TOTAL_ROUNDS) {
    endGame();
    return;
  }
  stimulusEl.className = "quiz-stimulus postcard";
  updateHud();

  current = PLACES[Math.floor(Math.random() * PLACES.length)];
  stimulusEl.textContent = current.scene;

  const choices = pickChoices(current);
  choicesEl.innerHTML = "";
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handlePick(choice.fr === current.fr, btn);
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
  setTimeout(startRound, 700);
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
