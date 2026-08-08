let dailyGame = "memory";

const descriptions = {
  memory: "Trouve toutes les paires",
  tictactoe: "Bats l'IA ou ton ami",
  flappy: "Évite les obstacles",
  sudoku: "Résous la grille",
  pendu: "Découvre le mot lettre par lettre",
  mastermind: "Devine la combinaison de couleurs",
  "2048": "Fusionne les tuiles jusqu'à 2048",
  labyrinthe: "Trouve la sortie avant la fin du temps",
  "puzzle-glissant": "Reconstitue l'image en glissant les pièces",
  "reaction-tap": "Clique dès que ça devient vert",
  "aim-trainer": "Clique les cibles le plus vite possible",
  "swipe-runner": "Esquive les obstacles gauche/droite",
  "speed-math": "Résous des calculs contre le chrono",
  "catch-the-cube": "Attrape la mascotte avant qu'elle ne se téléporte",
  snake: "Mange les pommes sans te mordre",
  breakout: "Détruis toutes les briques avec la balle",
  "space-shooter": "Esquive et tire sur les ennemis",
  "runner-2d": "Saute par-dessus les obstacles",
  "mini-tetris": "Empile les pièces et complète des lignes"
};

document.getElementById("currentDate").textContent =
  new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

const GAME_ENTRY_POINTS = {
  memory: "./games/memory-select.html"
};

function updateDailyGame() {
  document.getElementById("dailyGame").textContent = dailyGame;
  document.getElementById("dailyDesc").textContent = descriptions[dailyGame];
  document.getElementById("playButton").href = GAME_ENTRY_POINTS[dailyGame] || `./games/${dailyGame}.html`;
}

updateDailyGame();

function setDailyGame() {
  const selector = document.getElementById("gameSelector");
  dailyGame = selector.value;
  updateDailyGame();
}

