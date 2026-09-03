// Hash SHA-256 du mot de passe admin (jamais stocké en clair dans le code).
// Rappel : ceci n'est qu'un frein, pas une vraie sécurité — le site est
// entièrement statique (GitHub Pages), donc rien côté client n'est
// réellement inviolable face à quelqu'un qui lit le code source.
const PASSWORD_HASH = "278b2801d2792cd5404f892aca6d516d57c10c833d85f0a0808c21eacf746942";
const SESSION_KEY = "cubywearAdminAuth";

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const gateEl = document.getElementById("adminGate");
const panelEl = document.getElementById("adminPanel");
const passwordInput = document.getElementById("passwordInput");
const passwordForm = document.getElementById("passwordForm");
const passwordError = document.getElementById("passwordError");

function unlock() {
  sessionStorage.setItem(SESSION_KEY, "1");
  gateEl.hidden = true;
  panelEl.hidden = false;
  initPanel();
}

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const hash = await sha256(passwordInput.value);
  if (hash === PASSWORD_HASH) {
    passwordError.hidden = true;
    unlock();
  } else {
    passwordError.hidden = false;
    passwordInput.value = "";
    passwordInput.focus();
  }
});

if (sessionStorage.getItem(SESSION_KEY) === "1") {
  unlock();
}

// --- Panneau : choix des 3 jeux du jour ---
const DEFAULT_DAILY = ["memory", "tictactoe", "flappy"];

function loadDailyGames() {
  try {
    const saved = JSON.parse(localStorage.getItem("cubywearDailyGames"));
    if (Array.isArray(saved) && saved.length === 3 && saved.every(id => GAMES_BY_ID[id])) {
      return saved;
    }
  } catch (e) {}
  return DEFAULT_DAILY;
}

function initPanel() {
  const dailyGames = loadDailyGames();

  ["gameSelector1", "gameSelector2", "gameSelector3"].forEach((selId, i) => {
    const selectorEl = document.getElementById(selId);
    selectorEl.innerHTML = "";
    GAMES.forEach(game => {
      const option = document.createElement("option");
      option.value = game.id;
      option.textContent = `${game.icon} ${game.fr.name}`;
      selectorEl.appendChild(option);
    });
    selectorEl.value = dailyGames[i];
  });

  document.getElementById("applyBtn").onclick = () => {
    const ids = [
      document.getElementById("gameSelector1").value,
      document.getElementById("gameSelector2").value,
      document.getElementById("gameSelector3").value
    ];
    localStorage.setItem("cubywearDailyGames", JSON.stringify(ids));
    const statusEl = document.getElementById("applyStatus");
    statusEl.hidden = false;
    clearTimeout(initPanel._t);
    initPanel._t = setTimeout(() => (statusEl.hidden = true), 2500);
  };

  document.getElementById("resetBtn").onclick = () => {
    localStorage.removeItem("cubywearDailyGames");
    initPanel();
  };

  document.getElementById("logoutBtn").onclick = () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  };
}
