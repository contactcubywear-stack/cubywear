import { saveScore } from "../api.js";

const GAME_DURATION = 60;

const hudEl = document.getElementById("hud");
const problemEl = document.getElementById("problem");
const answerEl = document.getElementById("answer");
const mathBox = document.querySelector(".math-box");

let correct = 0;
let wrong = 0;
let timeLeft = GAME_DURATION;
let currentAnswer = 0;
let over = false;
let timerInterval = null;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function newProblem() {
  const ops = ["+", "-", "×"];
  const op = ops[rand(0, 2)];
  let a, b;

  if (op === "+") {
    a = rand(1, 40);
    b = rand(1, 40);
    currentAnswer = a + b;
  } else if (op === "-") {
    a = rand(1, 40);
    b = rand(1, a);
    currentAnswer = a - b;
  } else {
    a = rand(1, 12);
    b = rand(1, 12);
    currentAnswer = a * b;
  }

  problemEl.textContent = `${a} ${op} ${b} = ?`;
  answerEl.value = "";
  answerEl.focus();
}

function flash(isCorrect) {
  mathBox.classList.remove("feedback-flash", "wrong");
  void mathBox.offsetWidth;
  mathBox.classList.add("feedback-flash");
  if (!isCorrect) mathBox.classList.add("wrong");
}

function submitAnswer() {
  if (over) return;
  const value = Number(answerEl.value);

  if (answerEl.value.trim() !== "" && value === currentAnswer) {
    correct++;
    flash(true);
  } else {
    wrong++;
    flash(false);
  }

  hudEl.textContent = `Score : ${correct} · Temps : ${timeLeft}s`;
  newProblem();
}

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  answerEl.disabled = true;

  document.getElementById("statCorrect").textContent = correct;
  document.getElementById("statWrong").textContent = wrong;
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "speed-math", correct);
}

document.getElementById("submitBtn").onclick = submitAnswer;
answerEl.addEventListener("keydown", e => {
  if (e.key === "Enter") submitAnswer();
});

document.getElementById("replayBtn").onclick = () => location.reload();

timerInterval = setInterval(() => {
  timeLeft--;
  hudEl.textContent = `Score : ${correct} · Temps : ${timeLeft}s`;
  if (timeLeft <= 0) endGame();
}, 1000);

newProblem();
