// Màn hình chọn màn, hoàn thành màn, và lưu tiến độ.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  const STORE_KEY = 'keyjump-progress-v1';

  KJ.progress = {
    load() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        const data = raw ? JSON.parse(raw) : null;
        if (data && typeof data.unlocked === 'number') return data;
      } catch (e) { /* bỏ qua: chế độ ẩn danh hoặc bị chặn */ }
      return { unlocked: 0, stars: {} };
    },
    save(data) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* bỏ qua */ }
    },
  };

  function starText(n) {
    return '⭐'.repeat(n) + '☆'.repeat(3 - n);
  }

  function el(id) { return document.getElementById(id); }

  KJ.ui = {
    showMenu(progress, onPick) {
      const ov = el('overlay');
      const buttons = KJ.LEVELS.map((lv, i) => {
        const locked = i > progress.unlocked;
        const stars = progress.stars[i] || 0;
        const keys = lv.newKeys.length > 6 ? '' : lv.newKeys.map(k => k.toUpperCase()).join(' ');
        return '<button class="level-btn' + (locked ? ' locked' : '') +
          (i === progress.unlocked ? ' current' : '') + '" data-i="' + i + '"' +
          (locked ? ' disabled' : '') + '>' +
          '<span class="num">' + (locked ? '🔒 ' : '') + (i + 1) + '</span>' +
          '<span class="keys">' + (keys || lv.name) + '</span>' +
          '<span class="stars">' + (stars ? starText(stars) : '') + '</span></button>';
      }).join('');

      ov.innerHTML =
        '<div class="panel">' +
        '<div class="menu-head"><img src="img/hero_jump.webp" alt=""><h1>Nhảy Qua Quái Vật</h1>' +
        '<img src="img/monster_slime.webp" alt=""></div>' +
        '<p>Mỗi con quái vật giơ một chữ cái. Gõ đúng phím đó để bạn nhỏ nhảy qua và nhặt đồng vàng!</p>' +
        '<div class="level-grid">' + buttons + '</div>' +
        '<p>Nhấn <b>Enter</b> để chơi màn mới nhất</p>' +
        '</div>';
      ov.classList.remove('hidden');
      ov.querySelectorAll('.level-btn:not(.locked)').forEach(b => {
        b.addEventListener('click', () => onPick(Number(b.dataset.i)));
      });
    },

    showLevelDone(levelIndex, stars, mistakes, handlers) {
      const ov = el('overlay');
      const hasNext = levelIndex + 1 < KJ.LEVELS.length;
      const praise = stars === 3 ? 'Tuyệt vời! 🎉' : stars === 2 ? 'Giỏi lắm! 👏' : 'Hoàn thành! 💪';
      ov.innerHTML =
        '<div class="panel">' +
        '<h1>' + praise + '</h1>' +
        '<div class="big-stars">' + starText(stars) + '</div>' +
        '<p>Màn ' + (levelIndex + 1) + ' xong rồi! Gõ sai: <b>' + mistakes + '</b> lần.</p>' +
        (hasNext ? '' : '<p>🏆 Con đã hoàn thành tất cả các màn!</p>') +
        '<div class="button-row">' +
        '<button class="btn blue" id="btnRetry">🔁 Chơi lại</button>' +
        (hasNext ? '<button class="btn green" id="btnNext">▶ Màn tiếp (Enter)</button>' : '') +
        '<button class="btn" id="btnLevels">☰ Chọn màn</button>' +
        '</div></div>';
      ov.classList.remove('hidden');
      el('btnRetry').onclick = handlers.retry;
      el('btnLevels').onclick = handlers.menu;
      if (hasNext) el('btnNext').onclick = handlers.next;
    },

    hide() { el('overlay').classList.add('hidden'); },
    isOpen() { return !el('overlay').classList.contains('hidden'); },
  };
})(window.KJ);
