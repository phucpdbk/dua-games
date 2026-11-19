// Hướng dẫn đầu mỗi màn: đặt hai ngón trỏ lên F và J, rồi làm quen các phím mới của màn.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  let g = null; // { level, kb, step, pressed, tries, onDone, timer, cycle }

  function el(id) { return document.getElementById(id); }

  function chip(key, done) {
    const f = KJ.FINGERS[KJ.KEY_FINGER[key]];
    return '<span class="chip' + (done ? ' done' : '') + '" style="--fc:' + f.color + '">' +
      '<b>' + key.toUpperCase() + '</b> ' + f.name + (done ? ' ✓' : '') + '</span>';
  }

  function allKeys() { return g.level.newKeys.concat(g.level.reviewKeys); }

  function renderStep1() {
    el('gTitle').textContent = '✋ ' + ((window.PROFILE && window.PROFILE.nickname) || 'Bạn') + ' ơi, đặt tay vào vị trí nhé';
    el('gText').innerHTML = 'Sờ tìm 2 phím có <b>gờ nổi</b>: <b>F</b> và <b>J</b>.<br>' +
      'Đặt <b>ngón trỏ trái</b> lên F, <b>ngón trỏ phải</b> lên J.<br>Các ngón khác xếp hàng bên cạnh.' +
      '<br>👇 Nhìn hình bàn tay ở bàn phím bên dưới. Nhấn F và J để tiếp tục.';
    el('gChips').innerHTML = chip('f', g.pressed.f) + chip('j', g.pressed.j);
    g.kb.show([], ['f', 'j'].filter(k => !g.pressed[k]), null);
  }

  // Màn ít phím mới: gõ thử từng phím. Màn nhiều phím: tự giới thiệu lần lượt, nhấn Enter để chơi.
  function renderStep2() {
    const keys = g.level.newKeys;
    const practice = keys.length <= 4;
    el('gTitle').textContent = '🌟 Phím mới của màn này';
    el('gChips').innerHTML = keys.map(k => chip(k, practice && g.tries[k])).join('');
    if (practice) {
      const next = keys.find(k => !g.tries[k]);
      el('gText').innerHTML = next
        ? 'Giữ tay ở vị trí cũ, chỉ duỗi ngón được tô màu. Gõ thử phím <b>' + next.toUpperCase() + '</b>!'
        : 'Giỏi quá! Bắt đầu nào!';
      g.kb.show(allKeys(), next ? [next] : [], next);
      if (!next) g.timer = setTimeout(finish, 700);
      return;
    }
    el('gText').innerHTML = 'Mỗi phím dùng một ngón tay riêng, nhìn màu trên bàn phím nhé. Nhấn <b>Enter</b> để chơi!';
    let i = 0;
    const tick = () => {
      const k = keys[i % keys.length];
      g.kb.show(allKeys(), [k], k);
      i++;
    };
    tick();
    g.cycle = setInterval(tick, 1300);
  }

  function goStep2() {
    g.step = 2;
    if (g.level.newKeys.every(k => k === 'f' || k === 'j')) { finish(); return; }
    renderStep2();
  }

  function finish() {
    if (!g) return;
    clearTimeout(g.timer);
    clearInterval(g.cycle);
    const done = g.onDone;
    g = null;
    done();
  }

  KJ.guide = {
    open(level, kb, onDone) {
      const ov = el('overlay');
      ov.innerHTML = '<div class="panel guide">' +
        '<h1 id="gTitle"></h1><p id="gText"></p><div id="gChips" class="chips"></div>' +
        '<div class="button-row"><button class="btn green" id="gStart">▶ Bắt đầu chơi (Enter)</button></div></div>';
      ov.classList.remove('hidden');
      g = { level, kb, step: 1, pressed: {}, tries: {}, onDone, timer: 0, cycle: 0 };
      el('gStart').onclick = finish;
      renderStep1();
    },

    isActive() { return g !== null; },

    // key: chữ cái/số, hoặc 'enter'
    handle(key) {
      if (!g) return;
      if (key === 'enter') { finish(); return; }
      if (g.step === 1) {
        const ok = key === 'f' || key === 'j';
        g.kb.flash(key, ok);
        KJ.audio.play(ok ? 'ok' : 'wrong');
        if (!ok) return;
        g.pressed[key] = true;
        if (g.pressed.f && g.pressed.j) goStep2(); else renderStep1();
        return;
      }
      const keys = g.level.newKeys;
      if (keys.length > 4) { g.kb.flash(key, allKeys().indexOf(key) >= 0); return; }
      const next = keys.find(k => !g.tries[k]);
      const ok = key === next;
      g.kb.flash(key, ok);
      KJ.audio.play(ok ? 'ok' : 'wrong');
      if (ok) { g.tries[key] = true; renderStep2(); }
    },
  };
})(window.KJ);
