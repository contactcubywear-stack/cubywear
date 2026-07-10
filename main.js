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
  "puzzle-glissant": "Reconstitue l'image en glissant les pièces"
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

