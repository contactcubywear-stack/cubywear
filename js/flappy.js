import { saveScore } from "../api.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let birdY = 300;
let velocity = 0;
let score = 0;

function loop() {
  velocity += 0.3;
  birdY += velocity;

  ctx.clearRect(0,0,400,600);
  ctx.fillStyle = "yellow";
  ctx.fillRect(50, birdY, 30, 30);

  if (birdY > 600 || birdY < 0) return endGame();

  score++;
  requestAnimationFrame(loop);
}

function endGame() {
  alert("Game Over ! Score : " + score);
  saveScore("CW-BLK-1-0001", "flappy", score);
  window.location.href = "../index.html";
}

window.onclick = () => velocity = -8;

loop();
