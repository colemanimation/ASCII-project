// music.js
function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export class ChipPlayer {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.isReady = false;

    this._timer = null;
    this._nextNoteTime = 0;
    this._step = 0;
    this._song = null;

    // scheduling
    this.lookaheadMs = 25;
    this.scheduleAheadSec = 0.12;
  }

  async init() {
    if (this.isReady) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error("WebAudio not supported.");

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") await ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0.14;
    master.connect(ctx.destination);

    this.ctx = ctx;
    this.master = master;
    this.isReady = true;
  }

  stop() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;

    if (this._song && this._song._voices) {
      for (const v of Object.values(this._song._voices)) {
        try { v.osc.stop(); } catch {}
      }
    }

    this._song = null;
    this._step = 0;
  }

  play(song) {
    if (!this.isReady) return;
    this.stop();

    this._song = this._prepareSong(song);
    this._step = 0;
    this._nextNoteTime = this.ctx.currentTime + 0.05;

    this._timer = setInterval(() => this._scheduler(), this.lookaheadMs);
  }

  _prepareSong(song) {
    const ctx = this.ctx;

    const makeVoice = (type, vol) => {
      const osc = ctx.createOscillator();
      osc.type = type;

      const gain = ctx.createGain();
      gain.gain.value = 0.0001;

      osc.connect(gain);
      gain.connect(this.master);
      osc.start();

      return { osc, gain, vol };
    };

    // noise for drums
    const makeNoise = (vol) => {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = 0.0001;

      src.connect(gain);
      gain.connect(this.master);
      src.start();

      return { src, gain, vol };
    };

    const voices = {
      lead: makeVoice("square", 0.10),
      arp: makeVoice("square", 0.06),
      bass: makeVoice("triangle", 0.08),
      drum: makeNoise(0.10),
    };

    const s = { ...song };
    s._voices = voices;
    return s;
  }

  _env(gainNode, t, dur, peak) {
    // quick attack, short decay, then off
    gainNode.gain.cancelScheduledValues(t);
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.linearRampToValueAtTime(peak, t + 0.008);
    gainNode.gain.linearRampToValueAtTime(0.0001, t + Math.max(0.03, dur - 0.01));
  }

  _playNote(voice, midi, t, dur) {
    if (midi == null) return;
    voice.osc.frequency.setValueAtTime(midiToFreq(midi), t);
    this._env(voice.gain, t, dur, voice.vol);
  }

  _hitNoise(noise, t, dur) {
    this._env(noise.gain, t, dur, noise.vol);
  }

  _scheduler() {
    const ctx = this.ctx;
    const song = this._song;
    if (!ctx || !song) return;

    const stepDur = (60 / song.bpm) / 4; // 16th notes
    const stepsPerBar = song.stepsPerBar ?? 16;

    while (this._nextNoteTime < ctx.currentTime + this.scheduleAheadSec) {
      const i = this._step % song.lengthSteps;

      // patterns are arrays of midi or null
      const lead = song.lead[i % song.lead.length];
      const bass = song.bass[i % song.bass.length];

      // arpeggio: rotate chord tones
      let arp = null;
      if (song.arpChords && song.arpChords.length) {
        const chord = song.arpChords[Math.floor(i / stepsPerBar) % song.arpChords.length];
        const tone = chord[i % chord.length];
        arp = tone;
      }

      // drums: 1 = hit, 0 = rest
      const drum = song.drum[i % song.drum.length];

      const t = this._nextNoteTime;
      this._playNote(song._voices.lead, lead, t, stepDur);
      this._playNote(song._voices.bass, bass, t, stepDur);
      this._playNote(song._voices.arp, arp, t, stepDur);
      if (drum) this._hitNoise(song._voices.drum, t, stepDur);

      this._nextNoteTime += stepDur;
      this._step += 1;

      // hard loop to exact length, avoids drift
      if (this._step >= song.lengthSteps) {
        this._step = 0;
      }
    }
  }
}
