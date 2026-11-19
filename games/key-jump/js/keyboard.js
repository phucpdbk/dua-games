// Bàn phím ảo trên màn hình: tô sáng phím cần gõ, bấm được bằng chuột/cảm ứng.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  const ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  const keyEls = {};
  let onPress = null;

  // Dùng e.code để không bị ảnh hưởng bởi bộ gõ tiếng Việt (Unikey/Telex) hay Caps Lock.
  KJ.codeToKey = function (code) {
    if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^Numpad[0-9]$/.test(code)) return code.slice(6);
    return null;
  };

  KJ.keyboard = {
    init(container, pressHandler) {
      onPress = pressHandler;
      ROWS.forEach((row, ri) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'kb-row';
        rowEl.style.marginLeft = (ri * 18) + 'px';
        row.forEach(k => {
          const el = document.createElement('div');
          el.className = 'key' + (k === 'f' || k === 'j' ? ' home' : '');
          el.textContent = k.toUpperCase();
          el.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (onPress) onPress(k);
          });
          rowEl.appendChild(el);
          keyEls[k] = el;
        });
        container.appendChild(rowEl);
      });
    },

    // activeKeys: các phím của màn hiện tại; target: phím cần gõ ngay
    show(activeKeys, target) {
      Object.keys(keyEls).forEach(k => {
        const el = keyEls[k];
        el.classList.toggle('dim', activeKeys.length > 0 && activeKeys.indexOf(k) < 0);
        el.classList.toggle('target', k === target);
      });
    },

    flash(key, good) {
      const el = keyEls[key];
      if (!el) return;
      const cls = good ? 'good' : 'bad';
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), 220);
    },
  };
})(window.KJ);
