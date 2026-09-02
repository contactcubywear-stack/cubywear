import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "Écoute et devine l'animal !",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    done: "🔊 Terminé !", score: "Score", bestStreak: "Meilleure série",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Listen and guess the animal!",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    done: "🔊 Done!", score: "Score", bestStreak: "Best streak",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Vrais enregistrements (Wikimedia Commons), chaque URL vérifiée lisible.
const ANIMALS = [
  { key: "dog", fr: "Chien", en: "Dog", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Barking_of_a_dog.ogg" },
  { key: "cat", fr: "Chat", en: "Cat", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Meow_domestic_cat.ogg" },
  { key: "cow", fr: "Vache", en: "Cow", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Single_Cow_Moo.ogg" },
  { key: "duck", fr: "Canard", en: "Duck", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/3/39/Pekin_duck_%26_mallard.ogg" },
  { key: "rooster", fr: "Coq", en: "Rooster", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Rooster_crowing.ogg" },
  { key: "hen", fr: "Poule", en: "Hen", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Chickens_demanding_food.ogg" },
  { key: "sheep", fr: "Mouton", en: "Sheep", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/1/13/Sheep_bleating.ogg" },
  { key: "goat", fr: "Chèvre", en: "Goat", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Herd_of_goats_bleating.ogg" },
  { key: "pig", fr: "Cochon", en: "Pig", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Pig_grunt_-_Erdie.ogg" },
  { key: "horse", fr: "Cheval", en: "Horse", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/d/db/Wiehern.ogg" },
  { key: "donkey", fr: "Âne", en: "Donkey", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/2/25/157763_felix-blume_a-donkey-is-braying-in-his-enclosure-in-south-of-france.wav" },
  { key: "turkey", fr: "Dinde", en: "Turkey", cat: "farm", url: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Meleagris_gallopavo_-_Wild_Turkey_XC136045.ogg" },

  { key: "lion", fr: "Lion", en: "Lion", cat: "big_cats", url: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Lionroar.wav" },
  { key: "tiger", fr: "Tigre", en: "Tiger", cat: "big_cats", url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Tiger_Mad.ogg" },

  { key: "wolf", fr: "Loup", en: "Wolf", cat: "canids", url: "https://upload.wikimedia.org/wikipedia/commons/8/87/Wolf_howls.ogg" },
  { key: "fox", fr: "Renard", en: "Fox", cat: "canids", url: "https://upload.wikimedia.org/wikipedia/commons/7/79/Red_Fox_%28Vulpes_vulpes%29_%28W1CDR0001529_BD12%29.ogg" },
  { key: "coyote", fr: "Coyote", en: "Coyote", cat: "canids", url: "https://upload.wikimedia.org/wikipedia/commons/6/67/Pack_of_coyotes_howling.ogg" },
  { key: "jackal", fr: "Chacal", en: "Jackal", cat: "canids", url: "https://upload.wikimedia.org/wikipedia/commons/5/57/Lupulella_mesomelas%2C_roep_met_skemer%2C_Skeerpoort%2C_2022-01-01%2C_a.mp3" },

  { key: "elephant", fr: "Éléphant", en: "Elephant", cat: "savanna", url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Elephant_voice_-_trumpeting.ogg" },
  { key: "giraffe", fr: "Girafe", en: "Giraffe", cat: "savanna", url: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Giraffe_Hum.oga" },
  { key: "zebra", fr: "Zèbre", en: "Zebra", cat: "savanna", url: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Gr%C3%A9vys_zebra_%28Sound_Effects%29.ogg" },

  { key: "owl", fr: "Hibou", en: "Owl", cat: "birds", url: "https://upload.wikimedia.org/wikipedia/commons/9/94/Maghreb_owl_hooting.wav" },
  { key: "peacock", fr: "Paon", en: "Peacock", cat: "birds", url: "https://upload.wikimedia.org/wikipedia/commons/0/05/Pavo_cristatus_%28call%29.ogg" },
  { key: "crow", fr: "Corneille", en: "Crow", cat: "birds", url: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Corvus_corone_-_Carrion_Crow_XC509838.mp3" },
  { key: "raven", fr: "Corbeau", en: "Raven", cat: "birds", url: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Corvus_corax_-_Northern_Raven_XC488951.mp3" },
  { key: "dove", fr: "Colombe", en: "Dove", cat: "birds", url: "https://upload.wikimedia.org/wikipedia/commons/0/05/Dove_cooing.ogg" },
  { key: "swan", fr: "Cygne", en: "Swan", cat: "birds", url: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Cygnus_olor_-_Mute_Swan_XC307509.mp3" },
  { key: "stork", fr: "Cigogne", en: "Stork", cat: "birds", url: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Ciconia_ciconia_bill-clattering.ogg" },
  { key: "woodpecker", fr: "Pic-vert", en: "Woodpecker", cat: "birds", url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Great_Spotted_Woodpecker_drum.ogg" },
  { key: "penguin", fr: "Manchot", en: "Penguin", cat: "birds", url: "https://upload.wikimedia.org/wikipedia/commons/5/5a/20091121_Little_Penguin_calls_at_St_Kilda_Breakwater.ogg" },

  { key: "frog", fr: "Grenouille", en: "Frog", cat: "amphibians", url: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Single_Frog_Croak.oga" },
  { key: "toad", fr: "Crapaud", en: "Toad", cat: "amphibians", url: "https://upload.wikimedia.org/wikipedia/commons/c/c8/American_Toads_%28Anaxyrus_americanus%29_-_Guelph%2C_Ontario_2020-05-20_%2804%29.mp3" },

  { key: "bee", fr: "Abeille", en: "Bee", cat: "insects", url: "https://upload.wikimedia.org/wikipedia/commons/7/77/Buzzing_bees.ogg" },
  { key: "cicada", fr: "Cigale", en: "Cicada", cat: "insects", url: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Cicada_orni_%28Singing%29.ogg" },

  { key: "whale", fr: "Baleine", en: "Whale", cat: "marine", url: "https://upload.wikimedia.org/wikipedia/commons/1/12/Humpback-Whale-Song-and-Foraging-Behavior-on-an-Antarctic-Feeding-Ground-pone.0051214.s001.oga" },

  { key: "bear", fr: "Ours", en: "Bear", cat: "predators", url: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Bear_growl.ogg" },
  { key: "hyena", fr: "Hyène", en: "Hyena", cat: "predators", url: "https://upload.wikimedia.org/wikipedia/commons/d/de/Giggling_call_of_a_spotted_hyena_%28Crocuta_crocuta%29_-_1472-6785-10-9-S4.oga" },

  { key: "alligator", fr: "Alligator", en: "Alligator", cat: "reptiles", url: "https://upload.wikimedia.org/wikipedia/commons/d/db/Alligatorbellowedit.ogg" },
  { key: "rattlesnake", fr: "Serpent à sonnette", en: "Rattlesnake", cat: "reptiles", url: "https://upload.wikimedia.org/wikipedia/commons/2/22/Rattlesnake.ogg" },

  { key: "gibbon", fr: "Gibbon", en: "Gibbon", cat: "primates", url: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Hoolock_Gibbon_Call.ogg" },
  { key: "chimpanzee", fr: "Chimpanzé", en: "Chimpanzee", cat: "primates", url: "https://upload.wikimedia.org/wikipedia/commons/5/56/Pant-hoot_call_made_by_a_male_chimpanzee.ogg" }
];

const DIFFICULTIES = {
  facile: { rounds: 8, playMs: 5000, hardness: 0 },
  moyen: { rounds: 10, playMs: 4000, hardness: 1 },
  difficile: { rounds: 12, playMs: 3000, hardness: 2 },
  impossible: { rounds: 14, playMs: 2200, hardness: 3 }
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

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, TOTAL_ROUNDS());
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("bestVal").textContent = best;
}

function playCurrentSound() {
  if (!current) return;
  if (audioEl) { audioEl.pause(); audioEl = null; }
  clearTimeout(stopTimer);

  audioEl = new Audio(current.url);
  audioEl.play().catch(() => {});
  playBtn.classList.add("playing");
  stopTimer = setTimeout(() => {
    if (audioEl) audioEl.pause();
    playBtn.classList.remove("playing");
  }, cfg.playMs);
  audioEl.addEventListener("ended", () => playBtn.classList.remove("playing"));
}

function pickChoices(correct) {
  const sameCat = ANIMALS.filter(a => a.cat === correct.cat && a.key !== correct.key);
  const otherCat = ANIMALS.filter(a => a.cat !== correct.cat);
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

function startRound() {
  if (round >= TOTAL_ROUNDS()) {
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
window.__criAnimalDebug = { handlePick, playCurrentSound, startGame, getState: () => ({ round, score, over, current, streak, diffKey }) };

best = Number(localStorage.getItem("bestCriAnimal") || 0);
applyLang();
