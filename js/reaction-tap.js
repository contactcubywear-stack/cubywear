import { saveScore } from "../api.js";

const T = {
  fr: {
    clickToStart: "Clique pour commencer",
    waitGreen: "Attends le vert...",
    now: "MAINTENANT !",
    tooSoon: "Trop tôt ! Réessaie...",
    done: "Terminé !",
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    results: "⚡ Résultats", avgTime: "Temps moyen", bestTime: "Meilleur temps", record: "Record personnel",
    round: (n, total) => `Manche ${n}/${total}`,
    nextIn: s => `${s} s — au suivant dans 3s`
  },
  en: {
    clickToStart: "Click to start",
    waitGreen: "Wait for green...",
    now: "NOW!",
    tooSoon: "Too soon! Try again...",
    done: "Done!",
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    results: "⚡ Results", avgTime: "Average time", bestTime: "Best time", record: "Personal record",
    round: (n, total) => `Round ${n}/${total}`,
    nextIn: s => `${s} s — next in 3s`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

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
  statusEl.textContent = T[lang].waitGreen;

  const delay = 1200 + Math.random() * 2500;
  timeoutId = setTimeout(() => {
    state = "ready";
    box.className = "tap-box ready";
    statusEl.textContent = T[lang].now;
    startTime = performance.now();
  }, delay);
}

function handleTap() {
  if (state === "idle") {
    round = 0;
    times = [];
    roundInfoEl.textContent = T[lang].round(0, ROUNDS);
    startRound();
    return;
  }

  if (state === "waiting") {
    clearTimeout(timeoutId);
    state = "toosoon";
    box.className = "tap-box toosoon";
    statusEl.textContent = T[lang].tooSoon;
    if (window.CubySfx) CubySfx.fail();
    setTimeout(startRound, 3000);
    return;
  }

  if (state === "ready") {
    const reaction = Math.round(performance.now() - startTime);
    times.push(reaction);
    round++;
    roundInfoEl.textContent = T[lang].round(round, ROUNDS);
    if (window.CubySfx) CubySfx.tap();

    if (round >= ROUNDS) {
      state = "done";
      box.className = "tap-box idle";
      statusEl.textContent = T[lang].done;
      endGame();
    } else {
      box.className = "tap-box idle";
      statusEl.textContent = T[lang].nextIn(toSeconds(reaction));
      state = "pending";
      setTimeout(startRound, 3000);
    }
  }
}

function toSeconds(ms) {
  return (ms / 1000).toFixed(2);
}

function renderBars(best) {
  const barsEl = document.getElementById("roundBars");
  barsEl.innerHTML = "";
  const maxTime = Math.max(...times);
  times.forEach((t, i) => {
    const bar = document.createElement("div");
    bar.className = "round-bar" + (t === best ? " best" : "");
    bar.style.height = `${10 + (t / maxTime) * 50}px`;
    bar.style.animationDelay = `${i * 0.06}s`;
    barsEl.appendChild(bar);
  });
}

async function endGame() {
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const best = Math.min(...times);
  const prevRecord = Number(localStorage.getItem("reactionBest") || Infinity);
  const record = Math.min(best, prevRecord);
  localStorage.setItem("reactionBest", record);

  const isNewRecord = best < prevRecord;
  if (window.CubySfx) (isNewRecord ? CubySfx.win() : CubySfx.match());

  renderBars(best);
  document.getElementById("statAvg").textContent = toSeconds(avg);
  document.getElementById("statBest").textContent = toSeconds(best);
  document.getElementById("statRecord").textContent = toSeconds(record);
  document.getElementById("newRecordBadge").hidden = !isNewRecord;
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "reaction-tap", Math.max(1000 - avg, 50));
}

box.addEventListener("click", handleTap);
document.getElementById("replayBtn").onclick = () => location.reload();

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.getElementById("langToggle").textContent = lang.toUpperCase();
  roundInfoEl.textContent = T[lang].round(round, ROUNDS);
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

applyLang();
