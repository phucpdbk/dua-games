// Nghe giọng nói (Web Speech API, tiếng Việt) và đọc đề bài thành tiếng.
// Chạy tốt nhất trên Chrome/Edge; trình duyệt không hỗ trợ thì game vẫn chơi bằng bàn phím số.
window.MR = window.MR || {};

(function (MR) {
  'use strict';

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  let wanted = false;       // người chơi muốn bật mic
  let running = false;
  let ignoreUntil = 0;      // bỏ qua kết quả trong lúc máy đang đọc đề (tránh tự nghe chính mình)
  let onHeard = null;       // (alternatives: string[], isFinal: boolean) => void
  let onState = null;       // ('listening' | 'off' | 'denied' | 'unsupported') => void

  function setState(s) { if (onState) onState(s); }

  function build() {
    rec = new SR();
    rec.lang = 'vi-VN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;

    rec.onresult = e => {
      if (Date.now() < ignoreUntil) return;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const alts = [];
        for (let j = 0; j < res.length; j++) alts.push(res[j].transcript);
        if (onHeard) onHeard(alts, res.isFinal);
      }
    };
    rec.onstart = () => { running = true; setState('listening'); };
    rec.onend = () => {
      running = false;
      if (wanted) setTimeout(() => { if (wanted && !running) safeStart(); }, 150);
      else setState('off');
    };
    rec.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        wanted = false;
        setState('denied');
      }
    };
  }

  function safeStart() {
    try { rec.start(); } catch (e) { /* đang chạy rồi */ }
  }

  let viVoice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    viVoice = voices.find(v => /^vi/i.test(v.lang)) || null;
  }
  if (window.speechSynthesis) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }

  MR.voice = {
    supported: Boolean(SR),

    init(handlers) {
      onHeard = handlers.onHeard;
      onState = handlers.onState;
      if (!SR) setState('unsupported');
    },

    start() {
      if (!SR) return;
      if (!rec) build();
      wanted = true;
      if (!running) safeStart();
    },

    stop() {
      wanted = false;
      if (rec && running) rec.abort();
    },

    isOn() { return wanted; },

    // Xoá câu đang nghe dở (gọi khi sang câu hỏi mới để không lẫn đáp án cũ).
    reset() {
      if (!rec || !wanted) return;
      ignoreUntil = Date.now() + 250;
      if (running) rec.abort();
    },

    canSpeak() { return Boolean(window.speechSynthesis && viVoice); },

    // Đọc một câu tiếng Việt; trong lúc đọc thì không nghe.
    speak(text) {
      if (!this.canSpeak()) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = viVoice;
      u.lang = viVoice.lang;
      u.rate = 0.95;
      ignoreUntil = Date.now() + 60000;
      u.onend = () => { ignoreUntil = Date.now() + 300; if (wanted && running) rec.abort(); };
      u.onerror = () => { ignoreUntil = 0; };
      synth.speak(u);
    },
  };
})(window.MR);
