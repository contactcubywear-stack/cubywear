// Petit kit d'effets sonores synthétisés (aucun fichier audio requis).
window.CubySfx = (function () {
  let ctx;

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function beep(freq, duration, type = "sine", volume = 0.15, delay = 0) {
    try {
      const c = ensureCtx();
      const t0 = c.currentTime + delay;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    } catch (e) {}
  }

  return {
    flip: () => beep(440, 0.08, "triangle", 0.12),
    match: () => { beep(660, 0.1, "triangle", 0.15); beep(880, 0.12, "triangle", 0.15, 0.08); },
    fail: () => beep(160, 0.18, "sawtooth", 0.12),
    win: () => { [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.15, "triangle", 0.15, i * 0.09)); },
    lose: () => { beep(300, 0.2, "sawtooth", 0.12); beep(200, 0.25, "sawtooth", 0.12, 0.15); },
    tap: () => beep(520, 0.05, "square", 0.08),
    place: () => beep(392, 0.07, "triangle", 0.12),
    coin: () => { beep(988, 0.06, "square", 0.12); beep(1318, 0.08, "square", 0.12, 0.05); },
    hit: () => beep(120, 0.25, "sawtooth", 0.18),
    draw: () => { beep(392, 0.12, "triangle", 0.12); beep(392, 0.12, "triangle", 0.12, 0.12); }
  };
})();
