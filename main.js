const GAMES = [
  { id: "memory", name: "Memory", icon: "🧠", desc: "Trouve toutes les paires", entry: "./games/memory-select.html" },
  { id: "tictactoe", name: "Tic Tac Toe", icon: "❌⭕", desc: "Bats l'IA ou ton ami" },
  { id: "flappy", name: "Flappy Bird", icon: "🐤", desc: "Évite les obstacles" },
  { id: "sudoku", name: "Sudoku", icon: "🔢", desc: "Résous la grille" },
  { id: "pendu", name: "Pendu", icon: "🪢", desc: "Découvre le mot lettre par lettre" },
  { id: "mastermind", name: "Mastermind", icon: "🎯", desc: "Devine la combinaison de couleurs" },
  { id: "2048", name: "2048 Lite", icon: "🔢", desc: "Fusionne les tuiles jusqu'à 2048" },
  { id: "labyrinthe", name: "Labyrinthe", icon: "🌀", desc: "Trouve la sortie avant la fin du temps" },
  { id: "puzzle-glissant", name: "Puzzle glissant", icon: "🧩", desc: "Reconstitue l'image en glissant les pièces" },
  { id: "reaction-tap", name: "Reaction Tap", icon: "⚡", desc: "Clique dès que ça devient vert" },
  { id: "aim-trainer", name: "Aim Trainer", icon: "🎯", desc: "Clique les cibles le plus vite possible" },
  { id: "swipe-runner", name: "Swipe Runner", icon: "🏃", desc: "Esquive les obstacles gauche/droite" },
  { id: "speed-math", name: "Speed Math", icon: "🧮", desc: "Résous des calculs contre le chrono" },
  { id: "catch-the-cube", name: "Catch the Cube", icon: "🧊", desc: "Attrape la mascotte avant qu'elle ne se téléporte" },
  { id: "snake", name: "Snake", icon: "🐍", desc: "Mange les pommes sans te mordre" },
  { id: "breakout", name: "Breakout", icon: "🧱", desc: "Détruis toutes les briques avec la balle" },
  { id: "space-shooter", name: "Space Shooter", icon: "🚀", desc: "Esquive et tire sur les ennemis" },
  { id: "runner-2d", name: "Runner 2D", icon: "🦘", desc: "Saute par-dessus les obstacles" },
  { id: "mini-tetris", name: "Mini-Tetris", icon: "🧱", desc: "Empile les pièces et complète des lignes" },
  { id: "trouve-objet", name: "Trouve l'objet", icon: "🔍", desc: "Repère l'objet différent dans la grille" },
  { id: "color-match", name: "Color Match", icon: "🎨", desc: "Choisis la nuance exacte" },
  { id: "symetrie", name: "Symétrie", icon: "🦋", desc: "Dis si la forme est symétrique" },
  { id: "memory-duo", name: "Memory Duo+", icon: "🧠", desc: "Un memory dont les cartes bougent" },
  { id: "bon-pixel", name: "Bon pixel", icon: "🖼️", desc: "Devine l'image pixelisée" },
  { id: "anagrammes", name: "Anagrammes", icon: "🔤", desc: "Remets les lettres dans le bon ordre" },
  { id: "mot-flash", name: "Mot Flash", icon: "⚡", desc: "Trouve le mot à partir d'un indice" },
  { id: "lettre-manquante", name: "Lettre manquante", icon: "🔡", desc: "Complète le mot" },
  { id: "mini-wordle", name: "Mini-Wordle", icon: "🟩", desc: "Devine le mot de 4 lettres en 5 essais" },
  { id: "mini-othello", name: "Mini-Othello", icon: "⚫", desc: "Retourne les pions de ton adversaire" },
  { id: "connect4-lite", name: "Connect 4 Lite", icon: "🔴", desc: "Aligne 4 pions avant le bot" },
  { id: "hexa-path", name: "Hexa-Path", icon: "🔷", desc: "Relie les deux côtés du plateau hexagonal" }
];

const GAMES_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

function entryFor(game) {
  return game.entry || `./games/${game.id}.html`;
}

let dailyGame = "memory";

document.getElementById("currentDate").textContent =
  new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

function updateDailyGame() {
  const game = GAMES_BY_ID[dailyGame];
  document.getElementById("dailyIcon").textContent = game.icon;
  document.getElementById("dailyGame").textContent = game.name;
  document.getElementById("dailyDesc").textContent = game.desc;
  document.getElementById("playButton").href = entryFor(game);
}

updateDailyGame();

function setDailyGame() {
  const selector = document.getElementById("gameSelector");
  dailyGame = selector.value;
  updateDailyGame();
}

// Sélecteur admin, généré depuis la même liste (plus de doublon à maintenir).
const selectorEl = document.getElementById("gameSelector");
GAMES.forEach(game => {
  const option = document.createElement("option");
  option.value = game.id;
  option.textContent = game.name;
  selectorEl.appendChild(option);
});
selectorEl.value = dailyGame;

// Grille "Tous les jeux" avec recherche.
const gridEl = document.getElementById("gameGrid");
const searchEl = document.getElementById("gameSearch");

function renderGrid(filter = "") {
  const query = filter.trim().toLowerCase();
  gridEl.innerHTML = "";

  GAMES.filter(g => g.name.toLowerCase().includes(query)).forEach(game => {
    const card = document.createElement("a");
    card.className = "game-tile";
    card.href = entryFor(game);
    card.innerHTML = `
      <span class="game-tile-icon">${game.icon}</span>
      <span class="game-tile-name">${game.name}</span>
    `;
    gridEl.appendChild(card);
  });
}

renderGrid();
searchEl.addEventListener("input", () => renderGrid(searchEl.value));
