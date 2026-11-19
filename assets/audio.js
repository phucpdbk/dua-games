// Âm thanh dùng chung cho các game, tự tạo bằng WebAudio (không cần file mp3).
window.GameAudio = null;

(function () {
  'use strict';

  let ctx = null;
  let musicOn = true;
  let musicTimer = null;
  let musicStep = 0;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol, slideTo) {
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + start;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol || 0.15, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const SFX = {
    jump: () => tone(300, 0, 0.25, 'square', 0.12, 800),
    ok: () => tone(880, 0, 0.08, 'triangle', 0.15),
    coin: () => { tone(988, 0, 0.08, 'square', 0.1); tone(1319, 0.08, 0.3, 'square', 0.1); },
    wrong: () => tone(160, 0, 0.3, 'sawtooth', 0.12, 90),
    hit: () => { tone(120, 0, 0.35, 'square', 0.18, 50); tone(90, 0.05, 0.3, 'triangle', 0.15, 40); },
    lose: () => [392, 349, 311, 262].forEach((f, i) => tone(f, i * 0.22, 0.3, 'triangle', 0.12)),
    win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.2, 'square', 0.1)),
  };

  // Giai điệu vui tươi tự sáng tác (ngũ cung), lặp lại.
  const MELODY = [523, 0, 659, 784, 659, 0, 587, 523, 440, 0, 523, 587, 659, 0, 0, 0,
    523, 0, 659, 784, 880, 0, 784, 659, 587, 0, 659, 587, 523, 0, 0, 0];
  const BASS = [131, 131, 165, 165, 110, 110, 147, 147];

  function musicTick() {
    const i = musicStep % MELODY.length;
    if (MELODY[i]) tone(MELODY[i], 0, 0.16, 'triangle', 0.05);
    if (i % 4 === 0) tone(BASS[(i / 4) % BASS.length], 0, 0.3, 'square', 0.03);
    musicStep++;
  }

  window.GameAudio = {
    play(name) { if (SFX[name]) SFX[name](); },
    startMusic() {
      if (!musicOn || musicTimer || !ac()) return;
      musicTimer = setInterval(musicTick, 170);
    },
    stopMusic() {
      clearInterval(musicTimer);
      musicTimer = null;
    },
    toggleMusic() {
      musicOn = !musicOn;
      if (musicOn) this.startMusic(); else this.stopMusic();
      return musicOn;
    },
    isMusicOn() { return musicOn; },
  };
})();
