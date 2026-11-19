// Bàn phím ảo: tô màu theo ngón tay, vẽ hai bàn tay, tô sáng phím cần gõ.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  const ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  KJ.FINGERS = {
    lp: { name: 'ngón út trái', color: '#f9a8d4', home: 'a' },
    lr: { name: 'ngón áp út trái', color: '#c4b5fd', home: 's' },
    lm: { name: 'ngón giữa trái', color: '#93c5fd', home: 'd' },
    li: { name: 'ngón trỏ trái', color: '#86efac', home: 'f' },
    ri: { name: 'ngón trỏ phải', color: '#fdba74', home: 'j' },
    rm: { name: 'ngón giữa phải', color: '#93c5fd', home: 'k' },
    rr: { name: 'ngón áp út phải', color: '#c4b5fd', home: 'l' },
    rp: { name: 'ngón út phải', color: '#f9a8d4', home: ';' },
  };

  const FINGER_KEYS = { lp: '1qaz', lr: '2wsx', lm: '3edc', li: '45rtfgvb', ri: '67yuhjnm', rm: '8ik', rr: '9ol', rp: '0p;' };
  KJ.KEY_FINGER = {};
  Object.keys(FINGER_KEYS).forEach(f => FINGER_KEYS[f].split('').forEach(k => { KJ.KEY_FINGER[k] = f; }));

  // Dùng e.code để không bị ảnh hưởng bởi bộ gõ tiếng Việt (Unikey/Telex) hay Caps Lock.
  KJ.codeToKey = function (code) {
    if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^Numpad[0-9]$/.test(code)) return code.slice(6);
    if (code === 'Semicolon') return ';';
    return null;
  };

  // Tạo một bàn phím ảo trong container. onPress(key) khi bấm chuột/chạm.
  KJ.createKeyboard = function (container, onPress) {
    const root = document.createElement('div');
    root.className = 'kb';
    const keyEls = {};
    ROWS.forEach((row, ri) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      rowEl.style.marginLeft = (ri * 0.45) + 'em';
      row.forEach(k => {
        const el = document.createElement('div');
        el.className = 'key' + (k === 'f' || k === 'j' ? ' home' : '');
        el.style.setProperty('--fc', KJ.FINGERS[KJ.KEY_FINGER[k]].color);
        el.textContent = k.toUpperCase();
        el.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (onPress) onPress(k);
        });
        rowEl.appendChild(el);
        keyEls[k] = el;
      });
      root.appendChild(rowEl);
    });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'hands');
    root.appendChild(svg);
    container.appendChild(root);

    let last = { active: [], targets: [], reach: null };
    let lastSig = '';

    function show(active, targets, reach) {
      last = { active, targets, reach };
      Object.keys(keyEls).forEach(k => {
        const el = keyEls[k];
        el.classList.toggle('dim', active.length > 0 && active.indexOf(k) < 0 && targets.indexOf(k) < 0);
        el.classList.toggle('target', targets.indexOf(k) >= 0);
      });
      const sig = targets.join() + '|' + reach + '|' + root.clientWidth;
      if (sig === lastSig) return;
      lastSig = sig;
      const fingers = targets.map(k => KJ.KEY_FINGER[k]);
      KJ.drawHands(svg, root, keyEls, fingers, reach);
    }

    function flash(key, good) {
      const el = keyEls[key];
      if (!el) return;
      const cls = good ? 'good' : 'bad';
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), 220);
    }

    window.addEventListener('resize', () => { lastSig = ''; show(last.active, last.targets, last.reach); });
    return { show, flash, redraw: () => { lastSig = ''; show(last.active, last.targets, last.reach); } };
  };
})(window.KJ);
