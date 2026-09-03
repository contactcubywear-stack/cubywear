import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    done: "🖼️ Terminé !", finalScore: "Score final", bestStreak: "Meilleure série"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    done: "🖼️ Done!", finalScore: "Final score", bestStreak: "Best streak"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const ITEMS = [
  { emoji: "🍕", fr: "Pizza", en: "Pizza" }, { emoji: "🚀", fr: "Fusée", en: "Rocket" }, { emoji: "🐶", fr: "Chien", en: "Dog" },
  { emoji: "🎸", fr: "Guitare", en: "Guitar" }, { emoji: "🌈", fr: "Arc-en-ciel", en: "Rainbow" }, { emoji: "🦄", fr: "Licorne", en: "Unicorn" },
  { emoji: "🎁", fr: "Cadeau", en: "Gift" }, { emoji: "🍩", fr: "Donut", en: "Donut" }, { emoji: "🚁", fr: "Hélicoptère", en: "Helicopter" },
  { emoji: "🐸", fr: "Grenouille", en: "Frog" }, { emoji: "🎯", fr: "Cible", en: "Target" }, { emoji: "🧩", fr: "Puzzle", en: "Puzzle" },
  { emoji: "🦁", fr: "Lion", en: "Lion" }, { emoji: "⚓", fr: "Ancre", en: "Anchor" }, { emoji: "🎃", fr: "Citrouille", en: "Pumpkin" },
  { emoji: "🐢", fr: "Tortue", en: "Turtle" }, { emoji: "🍉", fr: "Pastèque", en: "Watermelon" }, { emoji: "🎈", fr: "Ballon", en: "Balloon" },

  { emoji: "🍎", fr: "Pomme", en: "Apple" }, { emoji: "🍌", fr: "Banane", en: "Banana" }, { emoji: "🍇", fr: "Raisin", en: "Grapes" },
  { emoji: "🍓", fr: "Fraise", en: "Strawberry" }, { emoji: "🍒", fr: "Cerise", en: "Cherry" }, { emoji: "🍑", fr: "Pêche", en: "Peach" },
  { emoji: "🍍", fr: "Ananas", en: "Pineapple" }, { emoji: "🥑", fr: "Avocat", en: "Avocado" }, { emoji: "🥕", fr: "Carotte", en: "Carrot" },
  { emoji: "🌽", fr: "Maïs", en: "Corn" }, { emoji: "🍔", fr: "Burger", en: "Burger" }, { emoji: "🍟", fr: "Frites", en: "Fries" },
  { emoji: "🌭", fr: "Hot-dog", en: "Hot Dog" }, { emoji: "🍿", fr: "Popcorn", en: "Popcorn" }, { emoji: "🧀", fr: "Fromage", en: "Cheese" },
  { emoji: "🍦", fr: "Crème glacée", en: "Ice Cream" }, { emoji: "🍪", fr: "Biscuit", en: "Cookie" }, { emoji: "🎂", fr: "Gâteau", en: "Cake" },
  { emoji: "🍭", fr: "Sucette", en: "Lollipop" }, { emoji: "☕", fr: "Café", en: "Coffee" },

  { emoji: "🐱", fr: "Chat", en: "Cat" }, { emoji: "🐭", fr: "Souris", en: "Mouse" }, { emoji: "🐹", fr: "Hamster", en: "Hamster" },
  { emoji: "🐰", fr: "Lapin", en: "Rabbit" }, { emoji: "🦊", fr: "Renard", en: "Fox" }, { emoji: "🐻", fr: "Ours", en: "Bear" },
  { emoji: "🐼", fr: "Panda", en: "Panda" }, { emoji: "🐨", fr: "Koala", en: "Koala" }, { emoji: "🐯", fr: "Tigre", en: "Tiger" },
  { emoji: "🐮", fr: "Vache", en: "Cow" }, { emoji: "🐷", fr: "Cochon", en: "Pig" }, { emoji: "🐵", fr: "Singe", en: "Monkey" },
  { emoji: "🐔", fr: "Poule", en: "Chicken" }, { emoji: "🐧", fr: "Manchot", en: "Penguin" }, { emoji: "🐦", fr: "Oiseau", en: "Bird" },
  { emoji: "🦉", fr: "Hibou", en: "Owl" }, { emoji: "🦋", fr: "Papillon", en: "Butterfly" }, { emoji: "🐝", fr: "Abeille", en: "Bee" },
  { emoji: "🐌", fr: "Escargot", en: "Snail" }, { emoji: "🐙", fr: "Poulpe", en: "Octopus" }, { emoji: "🐠", fr: "Poisson", en: "Fish" },
  { emoji: "🦈", fr: "Requin", en: "Shark" }, { emoji: "🐳", fr: "Baleine", en: "Whale" }, { emoji: "🦒", fr: "Girafe", en: "Giraffe" },
  { emoji: "🦓", fr: "Zèbre", en: "Zebra" }, { emoji: "🐘", fr: "Éléphant", en: "Elephant" }, { emoji: "🦘", fr: "Kangourou", en: "Kangaroo" },
  { emoji: "🐴", fr: "Cheval", en: "Horse" }, { emoji: "🦇", fr: "Chauve-souris", en: "Bat" }, { emoji: "🕷️", fr: "Araignée", en: "Spider" },
  { emoji: "🐍", fr: "Serpent", en: "Snake" },

  { emoji: "📱", fr: "Téléphone", en: "Phone" }, { emoji: "💻", fr: "Ordinateur", en: "Laptop" }, { emoji: "📷", fr: "Appareil photo", en: "Camera" },
  { emoji: "🎧", fr: "Casque audio", en: "Headphones" }, { emoji: "⌚", fr: "Montre", en: "Watch" }, { emoji: "💡", fr: "Ampoule", en: "Light Bulb" },
  { emoji: "🔑", fr: "Clé", en: "Key" }, { emoji: "🔒", fr: "Cadenas", en: "Lock" }, { emoji: "📚", fr: "Livres", en: "Books" },
  { emoji: "✏️", fr: "Crayon", en: "Pencil" }, { emoji: "🎨", fr: "Palette", en: "Palette" }, { emoji: "🎮", fr: "Manette", en: "Game Controller" },
  { emoji: "🎲", fr: "Dé", en: "Dice" }, { emoji: "🧸", fr: "Peluche", en: "Teddy Bear" }, { emoji: "👑", fr: "Couronne", en: "Crown" },
  { emoji: "💎", fr: "Diamant", en: "Diamond" }, { emoji: "🔔", fr: "Cloche", en: "Bell" }, { emoji: "⏰", fr: "Réveil", en: "Alarm Clock" },
  { emoji: "🧲", fr: "Aimant", en: "Magnet" }, { emoji: "🪁", fr: "Cerf-volant", en: "Kite" },

  { emoji: "🌸", fr: "Fleur de cerisier", en: "Cherry Blossom" }, { emoji: "🌻", fr: "Tournesol", en: "Sunflower" }, { emoji: "🌵", fr: "Cactus", en: "Cactus" },
  { emoji: "🍄", fr: "Champignon", en: "Mushroom" }, { emoji: "🌴", fr: "Palmier", en: "Palm Tree" }, { emoji: "⭐", fr: "Étoile", en: "Star" },
  { emoji: "🌙", fr: "Lune", en: "Moon" }, { emoji: "☀️", fr: "Soleil", en: "Sun" }, { emoji: "⛄", fr: "Bonhomme de neige", en: "Snowman" },
  { emoji: "❄️", fr: "Flocon de neige", en: "Snowflake" }, { emoji: "🔥", fr: "Feu", en: "Fire" }, { emoji: "⚡", fr: "Éclair", en: "Lightning" },
  { emoji: "🌊", fr: "Vague", en: "Wave" },

  { emoji: "🚗", fr: "Voiture", en: "Car" }, { emoji: "🚲", fr: "Vélo", en: "Bicycle" }, { emoji: "✈️", fr: "Avion", en: "Airplane" },
  { emoji: "🚢", fr: "Bateau", en: "Ship" }, { emoji: "🚂", fr: "Train", en: "Train" }, { emoji: "🛴", fr: "Trottinette", en: "Scooter" },
  { emoji: "🏍️", fr: "Moto", en: "Motorcycle" }, { emoji: "🚌", fr: "Bus", en: "Bus" }, { emoji: "⛵", fr: "Voilier", en: "Sailboat" },

  { emoji: "⚽", fr: "Ballon de foot", en: "Soccer Ball" }, { emoji: "🏀", fr: "Basketball", en: "Basketball" }, { emoji: "🎾", fr: "Tennis", en: "Tennis" },
  { emoji: "🏈", fr: "Football américain", en: "American Football" }, { emoji: "⚾", fr: "Baseball", en: "Baseball" }, { emoji: "🥊", fr: "Gant de boxe", en: "Boxing Glove" },
  { emoji: "🎳", fr: "Bowling", en: "Bowling" }, { emoji: "🏆", fr: "Trophée", en: "Trophy" },

  { emoji: "🎪", fr: "Cirque", en: "Circus" }, { emoji: "🎭", fr: "Théâtre", en: "Theater" }, { emoji: "🎬", fr: "Cinéma", en: "Movie Clapper" },
  { emoji: "🎹", fr: "Piano", en: "Piano" }, { emoji: "🥁", fr: "Tambour", en: "Drum" }, { emoji: "🔮", fr: "Boule de cristal", en: "Crystal Ball" },
  { emoji: "🪀", fr: "Yoyo", en: "Yo-yo" }, { emoji: "🛸", fr: "OVNI", en: "UFO" }, { emoji: "🏰", fr: "Château", en: "Castle" },
  { emoji: "⛺", fr: "Tente", en: "Tent" }, { emoji: "🗿", fr: "Statue", en: "Moai Statue" }
];

const DIFFICULTIES = {
  facile:     { rounds: 6,  interval: 2800, choices: 4, steps: [8, 12, 18, 28, 45, 70] },
  moyen:      { rounds: 8,  interval: 2200, choices: 4, steps: [4, 6, 9, 14, 22, 40] },
  difficile:  { rounds: 10, interval: 1800, choices: 5, steps: [3, 5, 7, 11, 17, 28] },
  impossible: { rounds: 12, interval: 1400, choices: 6, steps: [2, 3, 5, 8, 13, 20] }
};

let cfg = DIFFICULTIES.moyen;

const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");
const offCanvas = document.createElement("canvas");
const offCtx = offCanvas.getContext("2d");
const choicesEl = document.getElementById("choices");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let over = false;
let current = null;
let stepIndex = 0;
let stepTimer = null;

function updateHud() {
  document.getElementById("roundVal").textContent = `${round + 1}/${cfg.rounds}`;
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("streakVal").textContent = streak;
}

function renderPixelated(emoji, pixelSize) {
  offCanvas.width = pixelSize;
  offCanvas.height = pixelSize;
  offCtx.clearRect(0, 0, pixelSize, pixelSize);
  offCtx.font = `${pixelSize * 0.85}px Arial`;
  offCtx.textAlign = "center";
  offCtx.textBaseline = "middle";
  offCtx.fillText(emoji, pixelSize / 2, pixelSize / 2);

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offCanvas, 0, 0, pixelSize, pixelSize, 0, 0, canvas.width, canvas.height);
}

function pickChoices(correct) {
  const others = ITEMS.filter(i => i.fr !== correct.fr).sort(() => Math.random() - 0.5).slice(0, cfg.choices - 1);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

function nextStep() {
  if (over) return;
  if (stepIndex < cfg.steps.length - 1) {
    stepIndex++;
    renderPixelated(current.emoji, cfg.steps[stepIndex]);
    stepTimer = setTimeout(nextStep, cfg.interval);
  }
}

function startRound() {
  if (round >= cfg.rounds) {
    endGame();
    return;
  }
  updateHud();

  current = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  stepIndex = 0;
  renderPixelated(current.emoji, cfg.steps[0]);
  clearTimeout(stepTimer);
  stepTimer = setTimeout(nextStep, cfg.interval);

  choicesEl.innerHTML = "";
  pickChoices(current).forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handleGuess(choice.fr === current.fr, btn);
    choicesEl.appendChild(btn);
  });
}

function handleGuess(correct, btn) {
  if (over) return;
  clearTimeout(stepTimer);
  document.querySelectorAll(".choice-btn").forEach(b => (b.onclick = null));

  if (correct) {
    btn.classList.add("correct");
    const points = Math.max(60 - stepIndex * 10, 10);
    score += points;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    if (window.CubySfx) CubySfx.match();
  } else {
    btn.classList.add("wrong");
    streak = 0;
    if (window.CubySfx) CubySfx.fail();
  }

  round++;
  setTimeout(startRound, 500);
}

async function endGame() {
  over = true;
  clearTimeout(stepTimer);
  if (window.CubySfx) CubySfx.win();

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "bon-pixel", score);
}

function startGame(diff) {
  cfg = DIFFICULTIES[diff];
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
window.__bonPixelDebug = { handleGuess, getState: () => ({ round, score, over, stepIndex, current, streak }) };

applyLang();
