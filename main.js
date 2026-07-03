let dailyGame = "memory";

const descriptions = {
  memory: "Trouve toutes les paires",
  tictactoe: "Bats l'IA ou ton ami",
  flappy: "Évite les obstacles",
  sudoku: "Résous la grille",
  pendu: "Découvre le mot lettre par lettre"
};

document.getElementById("currentDate").textContent =
  new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

function updateDailyGame() {
  document.getElementById("dailyGame").textContent = dailyGame;
  document.getElementById("dailyDesc").textContent = descriptions[dailyGame];
  document.getElementById("playButton").href = `./games/${dailyGame}.html`;
}

updateDailyGame();

function setDailyGame() {
  const selector = document.getElementById("gameSelector");
  dailyGame = selector.value;
  updateDailyGame();
}

