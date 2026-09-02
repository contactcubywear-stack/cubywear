const T = {
  fr: {
    chooseLevel: "Choisis ton niveau",
    easy: "Facile", easyDesc: "5 minutes · 30 essais · 4×4",
    medium: "Moyen", mediumDesc: "3 minutes · 10 essais · 4×4",
    hard: "Difficile", hardDesc: "1 minute · 5 essais · 6×6",
    impossible: "Impossible", impossibleDesc: "30 secondes · 3 essais · 6×6",
    back: "Retour"
  },
  en: {
    chooseLevel: "Choose your level",
    easy: "Easy", easyDesc: "5 minutes · 30 tries · 4×4",
    medium: "Medium", mediumDesc: "3 minutes · 10 tries · 4×4",
    hard: "Hard", hardDesc: "1 minute · 5 tries · 6×6",
    impossible: "Impossible", impossibleDesc: "30 seconds · 3 tries · 6×6",
    back: "Back"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}

function applyLang() {
  const lang = getLang();
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.getElementById("langToggle").textContent = lang.toUpperCase();
}

document.getElementById("langToggle").addEventListener("click", () => {
  const next = getLang() === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", next);
  applyLang();
});

applyLang();

function startMemory(level) {
  const settings = {
    facile:   { time: 5 * 60,  tries: 30, grid: 4 },
    moyen:    { time: 3 * 60,  tries: 10, grid: 4 },
    difficile:{ time: 1 * 60,  tries: 5,  grid: 6 },
    impossible:{ time: 30,     tries: 3,  grid: 6 }
  };

  localStorage.setItem("memorySettings", JSON.stringify({ ...settings[level], level }));

  window.location.href = "memory.html";
}
