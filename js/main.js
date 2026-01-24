// main.js
import { CONFIG } from "./config.js";
import { loadMap } from "./world.js";
import { renderMapToPre, renderTitleToPre } from "./render.js";
import { bindInput } from "./input.js";
import { ChipPlayer } from "./music.js";
import { SONGS } from "./songs.js";

const els = {
  map: document.getElementById("map"),
  dialogue: document.getElementById("dialogue"),
  portrait: document.getElementById("portrait"),
  inventory: document.getElementById("inventory"),
};

const chip = new ChipPlayer();

let state = {
  map: null,

  // mode: "boot" | "title" | "game"
  mode: "boot",

  title: {
    frame: 0,
    seed: 1337,
    logoX: 0,
    logoSpeed: -0.35, // right-to-left
    logoLines: [
      "██████╗ ██╗   ██╗███████╗██╗  ██╗██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗",
      "██╔══██╗██║   ██║██╔════╝██║ ██╔╝██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║",
      "██║  ██║██║   ██║███████╗█████╔╝ ██║ █╗ ██║███████║   ██║   ██║     ███████║",
      "██║  ██║██║   ██║╚════██║██╔═██╗ ██║███╗██║██╔══██║   ██║   ██║     ██╔══██║",
      "██████╔╝╚██████╔╝███████║██║  ██╗╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║",
      "╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝",
    ],
    didInitX: false,
  },

  player: {
    x: CONFIG.defaultSpawn.x,
    y: CONFIG.defaultSpawn.y,
    facing: CONFIG.defaultSpawn.facing,
    skin: "#d7c2a1",
    clothes: "#a9a9a9",
  },

  audio: {
    ctx: null,
    master: null,
    isReady: false,
    songStop: null,
    currentSong: "none",
  },
};

// -------------------- BOOT OVERLAY --------------------

function createBootOverlay(onBoot) {
  const overlay = document.createElement("div");
  overlay.id = "bootOverlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "9999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.background = "#000";

  const btn = document.createElement("button");
  btn.textContent = "BOOT GAME";
  btn.style.fontSize = "18px";
  btn.style.padding = "14px 18px";
  btn.style.border = "2px double #fff";
  btn.style.background = "#000";
  btn.style.color = "#fff";
  btn.style.minWidth = "180px";
  btn.style.minHeight = "56px";

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "BOOTING...";
    try {
      await onBoot();
      overlay.remove();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "BOOT GAME";
      els.dialogue.textContent = String(e);
    }
  });

  overlay.appendChild(btn);
  document.body.appendChild(overlay);
}

// -------------------- AUDIO (CHIPTUNES) --------------------

function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

async function initAudio() {
  if (state.audio.isReady) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new Error("WebAudio not supported in this browser.");

  const ctx = new AudioCtx();
  // iOS needs resume during user gesture, but we are inside click handler
  if (ctx.state === "suspended") await ctx.resume();

  const master = ctx.createGain();
  master.gain.value = 0.12;
  master.connect(ctx.destination);

  state.audio.ctx = ctx;
  state.audio.master = master;
  state.audio.isReady = true;
}

function stopSong() {
  if (state.audio.songStop) {
    state.audio.songStop();
    state.audio.songStop = null;
  }
  state.audio.currentSong = "none";
}

function playSong({ bpm, lead, bass }) {
  stopSong();
  const ctx = state.audio.ctx;
  const master = state.audio.master;
  if (!ctx || !master) return;

  let step = 0;
  const stepDur = (60 / bpm) / 4; // 16th notes
  const startAt = ctx.currentTime + 0.02;

  const makeVoice = (type) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    return { osc, gain };
  };

  const vLead = makeVoice("square");
  const vBass = makeVoice("triangle");

  const env = (voice, t, dur, vol) => {
    voice.gain.gain.cancelScheduledValues(t);
    voice.gain.gain.setValueAtTime(0.0001, t);
    voice.gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    voice.gain.gain.linearRampToValueAtTime(0.0001, t + Math.max(0.03, dur - 0.01));
  };

  const timer = setInterval(() => {
    const t = startAt + step * stepDur;

    const l = lead[step % lead.length];
    const b = bass[step % bass.length];

    if (l != null) {
      vLead.osc.frequency.setValueAtTime(midiToFreq(l), t);
      env(vLead, t, stepDur, 0.10);
    } else {
      vLead.gain.gain.setValueAtTime(0.0001, t);
    }

    if (b != null) {
      vBass.osc.frequency.setValueAtTime(midiToFreq(b), t);
      env(vBass, t, stepDur, 0.08);
    } else {
      vBass.gain.gain.setValueAtTime(0.0001, t);
    }

    step++;
  }, stepDur * 1000);

  state.audio.songStop = () => {
    clearInterval(timer);
    try { vLead.osc.stop(); } catch {}
    try { vBass.osc.stop(); } catch {}
  };
}

function playTitleMusic() {
  state.audio.currentSong = "title";
  // simple upbeat loop
  playSong({
    bpm: 132,
    // 16-step pattern, null = rest
    lead: [72, null, 76, null, 79, null, 76, null, 74, null, 76, null, 79, null, 83, null],
    bass: [48, null, 48, null, 50, null, 50, null, 43, null, 43, null, 45, null, 45, null],
  });
}

function playOverworldMusic() {
  state.audio.currentSong = "overworld";
  playSong({
    bpm: 120,
    lead: [76, 79, 81, null, 79, 76, 74, null, 72, 74, 76, null, 74, 72, null, null],
    bass: [40, null, 43, null, 45, null, 43, null, 38, null, 40, null, 43, null, 35, null],
  });
}

// -------------------- GAME LOGIC --------------------

function getStartMapName() {
  if (!CONFIG.useUrlMapOverride) return CONFIG.defaultMap;
  const params = new URLSearchParams(location.search);
  const m = params.get("map");
  return m || CONFIG.defaultMap;
}

function isBlocked(ch) {
  return ch === "#" || ch === "T" || ch === "~";
}

function tryMove(dir) {
  if (state.mode !== "game") return;

  const p = state.player;
  p.facing = dir;

  const dx = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  const dy = dir === "up" ? -1 : dir === "down" ? 1 : 0;

  const nx = p.x + dx;
  const ny = p.y + dy;

  if (!state.map) return;
  if (nx < 0 || ny < 0 || nx >= state.map.width || ny >= state.map.height) return;

  const ch = state.map.grid[ny][nx];
  if (isBlocked(ch)) {
    els.dialogue.textContent = "Bumped.";
    renderOnce();
    return;
  }

  p.x = nx;
  p.y = ny;
  els.dialogue.textContent = `Moved ${dir}`;
  renderOnce();
}

function measureCharSize(preEl) {
  const cs = getComputedStyle(preEl);

  const probe = document.createElement("pre");
  probe.style.visibility = "hidden";
  probe.style.position = "absolute";
  probe.style.left = "-9999px";
  probe.style.top = "0";
  probe.style.margin = "0";
  probe.style.padding = "0";
  probe.style.border = "0";
  probe.style.whiteSpace = "pre";
  probe.style.fontFamily = cs.fontFamily;
  probe.style.fontSize = cs.fontSize;
  probe.style.lineHeight = cs.lineHeight;
  probe.style.letterSpacing = cs.letterSpacing;
  probe.style.fontVariantLigatures = "none";

  const n = 50;
  const line = ".".repeat(n);
  probe.textContent = line + "\n" + line;

  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  document.body.removeChild(probe);

  return { cw: rect.width / n, ch: rect.height / 2 };
}

function computeViewport(preEl, desiredW, desiredH) {
  const { cw, ch } = measureCharSize(preEl);

  const fitW = Math.floor(preEl.clientWidth / cw);
  const fitH = Math.floor(preEl.clientHeight / ch);

  let vw = Math.max(9, fitW);
  let vh = Math.max(9, fitH);

  if (vw % 2 === 0) vw -= 1;
  if (vh % 2 === 0) vh -= 1;

  vw = Math.min(vw, desiredW);
  vh = Math.min(vh, desiredH);

  return { vw, vh };
}

function renderOnce() {
  const { vw, vh } = computeViewport(els.map, CONFIG.viewWidth, CONFIG.viewHeight);

  if (state.mode === "title") {
    state.title.frame += 1;

    if (!state.title.didInitX) {
      // start fully off the right edge
      const logoW = Math.max(...state.title.logoLines.map(l => l.length));
      state.title.logoX = vw;
      state.title.didInitX = true;
      // if vw is tiny, still okay
      if (logoW > vw) state.title.logoX = vw;
    }

    state.title.logoX += state.title.logoSpeed;

    const logoW = Math.max(...state.title.logoLines.map(l => l.length));
    if (state.title.logoX < -logoW) {
      state.title.logoX = vw;
    }

    renderTitleToPre(els.map, state.title, vw, vh);
    return;
  }

  if (state.mode !== "game") return;
  if (!state.map) return;

  renderMapToPre(els.map, state.map, state.player, vw, vh);
}

let rafId = null;
function startTitleLoop() {
  if (rafId != null) cancelAnimationFrame(rafId);

  const tick = () => {
    if (state.mode === "title") {
      renderOnce();
      rafId = requestAnimationFrame(tick);
    }
  };
  rafId = requestAnimationFrame(tick);
}

function startTitle() {
  state.mode = "title";
  els.dialogue.textContent = "Title. Press Start.";
  playTitleMusic();
  startTitleLoop();
}

function startGame() {
  state.mode = "game";
  els.dialogue.textContent = "Loaded. Use D-pad.";

  chip.play(SONGS.overworld);

  renderOnce();
}

async function boot() {
  els.portrait.textContent = "Portrait\n(later)";
  els.inventory.textContent = "- Nothing";
  els.dialogue.textContent = "Loading...";

  const startMap = getStartMapName();
  state.map = await loadMap(startMap);

  // Bind inputs once
  bindInput({
    onMove: tryMove,
    onA: () => { els.dialogue.textContent = "A pressed"; },
    onB: () => { els.dialogue.textContent = "B pressed"; },
    onStart: () => {
      if (state.mode === "title") startGame();
      else els.dialogue.textContent = "Start pressed";
    },
    onSelect: () => {
      // optional: go back to title for testing
      els.dialogue.textContent = "Select pressed";
    },
  });

  window.addEventListener("resize", () => {
    renderOnce();
  });

  // Show boot overlay and do not render anything until user clicks it
  state.mode = "boot";
  createBootOverlay(async () => {
    await chip.init();
    chip.play(SONGS.title);
    startTitle();
  });
}

boot().catch(err => {
  els.dialogue.textContent = String(err);
});