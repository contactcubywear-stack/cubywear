import { saveScore } from "../api.js";

const ROUNDS = 5;
const box = document.getElementById("box");
const statusEl = document.getElementById("status");
const roundInfoEl = document.getElementById("roundInfo");

let round = 0;
let times = [];
let startTime = 0;
let timeoutId = null;
let state = "idle"; // idle, waiting, ready, toosoon

function startRound() {
  state = "waiting";
  box.className = "tap-box waiting";
  statusEl.textContent = "Attends le vert...";

  const delay = 1200 + Math.random() * 2500;
  timeoutId = setTimeout(() => {
    state = "ready";
    box.className = "tap-box ready";
    statusEl.textContent = "MAINTENANT !";
    startTime = performance.now();
  }, delay);
}

function handleTap() {
  if (state === "idle") {
    round = 0;
    times = [];
    roundInfoEl.textContent = `Manche 0/${ROUNDS}`;
    startRound();
    return;
  }

  if (state === "waiting") {
    clearTimeout(timeoutId);
    state = "toosoon";
    box.className = "tap-box toosoon";
    statusEl.textContent = "Trop tôt ! Réessaie...";
    setTimeout(startRound, 3000);
    return;
  }

  if (state === "ready") {
    const reaction = Math.round(performance.now() - startTime);
    times.push(reaction);
    round++;
    roundInfoEl.textContent = `Manche ${round}/${ROUNDS}`;

    if (round >= ROUNDS) {
      state = "done";
      box.className = "tap-box idle";
      statusEl.textContent = "Terminé !";
      endGame();
    } else {
      box.className = "tap-box idle";
      statusEl.textContent = `${toSeconds(reaction)} s — au suivant dans 3s`;
      state = "pending";
      setTimeout(startRound, 3000);
    }
  }
}

function toSeconds(ms) {
  return (ms / 1000).toFixed(2);
}

async function endGame() {
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const best = Math.min(...times);
  const record = Math.min(best, Number(localStorage.getItem("reactionBest") || Infinity));
  localStorage.setItem("reactionBest", record);

  document.getElementById("statAvg").textContent = toSeconds(avg);
  document.getElementById("statBest").textContent = toSeconds(best);
  document.getElementById("statRecord").textContent = toSeconds(record);
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "reaction-tap", Math.max(1000 - avg, 50));
}

box.addEventListener("click", handleTap);
document.getElementById("replayBtn").onclick = () => location.reload();
