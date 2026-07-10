// Charger les paramètres
const settings = JSON.parse(localStorage.getItem("memorySettings"));

// Sécurité : si on arrive ici sans avoir choisi de niveau, on renvoie vers la sélection
if (!settings) {
  location.href = "memory-select.html";
}

const gridSize = settings.grid;
const maxTries = settings.tries;
let timeLeft = settings.time;

let tries = 0;
let matched = 0;

// Générer les icônes : un pool de 50 emojis, dont on tire un sous-ensemble
// aléatoire à chaque partie pour que le jeu varie d'une fois à l'autre.
const baseIcons = [
  "🎮","⭐","🔥","💀","⚡","🎲","🎹","🎧","🎯","🎁",
  "🚀","🧩","🎈","🪄","🔮","🍀","🦄","🍩","🍕","🍔",
  "🍟","🌮","🍎","🍇","🍉","🥑","🐶","🐱","🐵","🦊",
  "🐸","🐧","🦁","🐢","🌟","🌈","☀️","🌙","⚽","🏀",
  "🎾","🏈","🎳","🎱","🚗","✈️","🚁","🛸","⚓","🎸"
];
const needed = (gridSize * gridSize) / 2;
const icons = [...baseIcons].sort(() => Math.random() - 0.5).slice(0, needed);

let cards = [...icons, ...icons];
cards.sort(() => Math.random() - 0.5);

// Construire la grille
const board = document.getElementById("gameBoard");
board.style.setProperty("--cols", gridSize);

// Taille de police/coins adaptée au nombre de cases (appliquée dès la création,
// donc ça fonctionne aussi bien sur mobile que sur desktop)
let cardFontSize = "26px";
let cardRadius = "8px";

if (gridSize >= 6) {
  cardFontSize = "20px";
  cardRadius = "7px";
}
if (gridSize >= 10) {
  cardFontSize = "16px";
  cardRadius = "5px";
}
if (gridSize >= 15) {
  cardFontSize = "11px";
  cardRadius = "4px";
}

cards.forEach((icon, index) => {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.icon = icon;
  card.textContent = "?";
  card.style.fontSize = cardFontSize;
  card.style.borderRadius = cardRadius;
  card.addEventListener("click", () => flipCard(card));
  board.appendChild(card);
});

// Timer
const timerInterval = setInterval(() => {
  timeLeft--;
  const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${min}:${sec}`;

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    alert("Temps écoulé !");
    location.href = "memory-select.html";
  }
}, 1000);

document.getElementById("triesLeft").textContent = `Essais restants : ${maxTries}`;

let flipped = [];
let boardLocked = false;

function flipCard(card) {
  if (boardLocked) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;
  if (flipped.length === 2) return;

  card.classList.add("flipped");
  card.textContent = card.dataset.icon;
  flipped.push(card);

  if (flipped.length === 2) {
    boardLocked = true;
    setTimeout(checkMatch, 500);
  }
}

function checkMatch() {
  const [c1, c2] = flipped;

  tries++;
  document.getElementById("info").textContent = `${tries} coups`;

  if (c1.dataset.icon === c2.dataset.icon) {
    c1.classList.add("matched");
    c2.classList.add("matched");
    matched++;

    if (matched === icons.length) {
      clearInterval(timerInterval);
      showWinModal();
      return;
    }
  } else {
    c1.classList.remove("flipped");
    c2.classList.remove("flipped");
    c1.textContent = "?";
    c2.textContent = "?";
  }

  flipped = [];
  boardLocked = false;

  if (tries >= maxTries) {
    clearInterval(timerInterval);
    alert("Tu as utilisé tous tes essais !");
    location.href = "memory-select.html";
  }
}

function showWinModal() {
  const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec = String(timeLeft % 60).padStart(2, "0");

  document.getElementById("statLevel").textContent = settings.level || "-";
  document.getElementById("statMoves").textContent = tries;
  document.getElementById("statTime").textContent = `${min}:${sec}`;

  document.getElementById("winModal").hidden = false;
}

document.getElementById("replayBtn").onclick = () => location.reload();

