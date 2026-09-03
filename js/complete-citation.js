import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "Choisis la bonne suite",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    done: "💬 Terminé !", score: "Score", bestStreak: "Meilleure série",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Pick the right continuation",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    done: "💬 Done!", score: "Score", bestStreak: "Best streak",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Comptines, proverbes et courtes citations connues (domaine public / très courts extraits).
const QUOTES_FR = [
  { id: "souris-verte", begin: "Une souris verte, qui courait dans l'herbe", end: "je l'attrape par la queue", cat: "comptine" },
  { id: "petit-navire", begin: "Il était un petit navire", end: "qui n'avait ja-ja-jamais navigué", cat: "comptine" },
  { id: "frere-jacques", begin: "Frère Jacques, Frère Jacques", end: "dormez-vous ? Dormez-vous ?", cat: "comptine" },
  { id: "au-clair-de-la-lune", begin: "Au clair de la lune, mon ami Pierrot", end: "prête-moi ta plume pour écrire un mot", cat: "comptine" },
  { id: "pont-avignon", begin: "Sur le pont d'Avignon", end: "on y danse, on y danse", cat: "comptine" },
  { id: "claire-fontaine", begin: "À la claire fontaine, m'en allant promener", end: "j'ai trouvé l'eau si belle que je m'y suis baigné", cat: "comptine" },
  { id: "meunier", begin: "Meunier, tu dors", end: "ton moulin, ton moulin va trop vite", cat: "comptine" },
  { id: "ainsi-font", begin: "Ainsi font, font, font", end: "les petites marionnettes", cat: "comptine" },
  { id: "houston", begin: "Houston, on a un", end: "problème", cat: "citation" },
  { id: "force", begin: "Que la force soit", end: "avec toi", cat: "citation" },
  { id: "grands-maux", begin: "Aux grands maux les grands", end: "remèdes", cat: "proverbe" },
  { id: "devise", begin: "Liberté, égalité,", end: "fraternité", cat: "proverbe" },
  { id: "union", begin: "L'union fait la", end: "force", cat: "proverbe" },
  { id: "lievre-tortue", begin: "Rien ne sert de courir, il faut partir à", end: "point", cat: "proverbe" },
  { id: "tiens", begin: "Un tiens vaut mieux que deux tu", end: "l'auras", cat: "proverbe" },
  { id: "petit-oiseau", begin: "Petit à petit, l'oiseau fait son", end: "nid", cat: "proverbe" }
];

const QUOTES_EN = [
  { id: "twinkle", begin: "Twinkle, twinkle, little", end: "star", cat: "rhyme" },
  { id: "jack-jill", begin: "Jack and Jill went up the", end: "hill", cat: "rhyme" },
  { id: "humpty", begin: "Humpty Dumpty sat on a", end: "wall", cat: "rhyme" },
  { id: "row-boat", begin: "Row, row, row your", end: "boat", cat: "rhyme" },
  { id: "mary-lamb", begin: "Mary had a little", end: "lamb", cat: "rhyme" },
  { id: "old-macdonald", begin: "Old MacDonald had a", end: "farm", cat: "rhyme" },
  { id: "rain-rain", begin: "Rain, rain, go", end: "away", cat: "rhyme" },
  { id: "hickory", begin: "Hickory dickory", end: "dock", cat: "rhyme" },
  { id: "early-bird", begin: "The early bird catches the", end: "worm", cat: "proverb" },
  { id: "picture-words", begin: "A picture is worth a thousand", end: "words", cat: "proverb" },
  { id: "actions", begin: "Actions speak louder than", end: "words", cat: "proverb" },
  { id: "rome", begin: "When in Rome, do as the Romans", end: "do", cat: "proverb" },
  { id: "force-en", begin: "May the Force be with", end: "you", cat: "quote" },
  { id: "houston-en", begin: "Houston, we have a", end: "problem", cat: "quote" },
  { id: "to-be", begin: "To be or not to", end: "be", cat: "quote" },
  { id: "apple", begin: "An apple a day keeps the doctor", end: "away", cat: "proverb" }
];

const DIFFICULTIES = {
  facile: { rounds: 8, time: 14, hardness: 0 },
  moyen: { rounds: 10, time: 11, hardness: 1 },
  difficile: { rounds: 12, time: 9, hardness: 2 },
  impossible: { rounds: 14, time: 7, hardness: 3 }
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

function timeForRound() {
  return Math.max(cfg.time - round * 0.2, cfg.time - 4);
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

function pickChoices(pool, correct) {
  const sameCat = pool.filter(p => p.cat === correct.cat && p.id !== correct.id);
  const otherCat = pool.filter(p => p.cat !== correct.cat);
  let wrongPool;
  if (cfg.hardness === 0) {
    wrongPool = otherCat.length ? otherCat : pool.filter(p => p.id !== correct.id);
  } else if (cfg.hardness === 1) {
    wrongPool = [...sameCat.sort(() => Math.random() - 0.5).slice(0, 1), ...otherCat];
  } else {
    wrongPool = sameCat.length >= 3 ? sameCat : [...sameCat, ...otherCat];
  }

  const seenLabels = new Set([correct[lang]]);
  const wrong = [];
  for (const p of wrongPool.sort(() => Math.random() - 0.5)) {
    if (wrong.length >= 3) break;
    if (seenLabels.has(p[lang])) continue;
    seenLabels.add(p[lang]);
    wrong.push(p);
  }
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

function startRound() {
  if (round >= TOTAL_ROUNDS()) {
    endGame();
    return;
  }
  clearInterval(timerInterval);
  stimulusEl.className = "quiz-stimulus text-quiz";
  updateHud();
  choicesEl.innerHTML = "";

  const src = lang === "fr" ? QUOTES_FR : QUOTES_EN;
  const q = src[Math.floor(Math.random() * src.length)];
  const pool = src.map(x => ({ id: x.id, fr: x.end, en: x.end, cat: x.cat }));
  current = pool.find(p => p.id === q.id);
  stimulusEl.textContent = `« ${q.begin}... »`;

  const choices = pickChoices(pool, current);
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
  setTimeout(startRound, 1100);
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.win();

  if (score > best) {
    best = score;
    localStorage.setItem("bestCompleteCitation", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "complete-citation", score * 10);
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
window.__completeCitationDebug = { handlePick, startGame, getState: () => ({ round, score, over, current, streak, diffKey }) };

best = Number(localStorage.getItem("bestCompleteCitation") || 0);
applyLang();
