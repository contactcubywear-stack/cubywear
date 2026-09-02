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

// Vrais enregistrements (Wikimedia Commons), vérifiés lisibles.
const ANIMAL_SOUNDS_URL = {
  dog: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Barking_of_a_dog.ogg",
  cat: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Meow_domestic_cat.ogg",
  cow: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Single_Cow_Moo.ogg",
  duck: "https://upload.wikimedia.org/wikipedia/commons/3/39/Pekin_duck_%26_mallard.ogg",
  rooster: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Rooster_crowing.ogg",
  lion: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Lionroar.wav",
  owl: "https://upload.wikimedia.org/wikipedia/commons/9/94/Maghreb_owl_hooting.wav",
  sheep: "https://upload.wikimedia.org/wikipedia/commons/1/13/Sheep_bleating.ogg",
  pig: "https://upload.wikimedia.org/wikipedia/commons/7/73/Mudchute_pig_1.ogg",
  horse: "https://upload.wikimedia.org/wikipedia/commons/d/db/Wiehern.ogg",
  frog: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Single_Frog_Croak.oga",
  wolf: "https://upload.wikimedia.org/wikipedia/commons/8/87/Wolf_howls.ogg",
  elephant: "https://upload.wikimedia.org/wikipedia/commons/4/40/Elephant_voice_-_trumpeting.ogg",
  bird: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Juvenile_white-backed_Australian_magpie_%28Gymnorhina_tibicen_tyrannica%29_song.ogg",
  bee: "https://upload.wikimedia.org/wikipedia/commons/7/77/Buzzing_bees.ogg",
  donkey: "https://upload.wikimedia.org/wikipedia/commons/2/25/157763_felix-blume_a-donkey-is-braying-in-his-enclosure-in-south-of-france.wav"
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
  { key: "donkey", emoji: "🫏", fr: "Âne", en: "Donkey" }
];

const TOTAL_ROUNDS = 10;
const MAX_PLAY_MS = 4000;

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

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, TOTAL_ROUNDS);
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("bestVal").textContent = best;
}

function playCurrentSound() {
  if (!current) return;
  if (audioEl) { audioEl.pause(); audioEl = null; }
  clearTimeout(stopTimer);

  audioEl = new Audio(ANIMAL_SOUNDS_URL[current.key]);
  audioEl.play().catch(() => {});
  playBtn.classList.add("playing");
  stopTimer = setTimeout(() => {
    if (audioEl) audioEl.pause();
    playBtn.classList.remove("playing");
  }, MAX_PLAY_MS);
  audioEl.addEventListener("ended", () => playBtn.classList.remove("playing"));
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
