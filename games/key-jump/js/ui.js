// Màn hình chọn màn và hoàn thành màn.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  const NAME = String((window.PROFILE && window.PROFILE.nickname) || 'bạn')
    .replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');

  const SYNC_TEXT = {
    synced: '☁️ Đã lưu lên mạng, đổi máy vẫn chơi tiếp được',
    offline: '📴 Chưa kết nối mạng, đang lưu tạm trong máy',
    local: '',
  };

  function praiseFor(stars) {
    if (stars === 3) return pick(['Tuyệt vời, ' + NAME + ' ơi! 🎉', NAME + ' giỏi quá! 🎉', 'Siêu đỉnh luôn, ' + NAME + '! 🌟']);
    if (stars === 2) return pick([NAME + ' giỏi lắm! 👏', 'Hay lắm, ' + NAME + '! 👏']);
    return 'Hoàn thành rồi, ' + NAME + '! 💪';
  }

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

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
        '<div class="menu-head"><img src="../../assets/dua.webp" alt=""><h1>Nhảy Qua Quái Vật</h1>' +
        '<img src="img/monster_slime.webp" alt=""></div>' +
        '<p>Chào <b>' + NAME + '</b>! Mỗi con quái vật giơ một chữ cái. Gõ đúng phím đó để nhảy qua và nhặt đồng vàng nhé!</p>' +
        '<div class="level-grid">' + buttons + '</div>' +
        '<p>Nhấn <b>Enter</b> để chơi màn mới nhất</p>' +
        (SYNC_TEXT[KJ.progress.status] ? '<p class="sync">' + SYNC_TEXT[KJ.progress.status] + '</p>' : '') +
        '</div>';
      ov.classList.remove('hidden');
      ov.querySelectorAll('.level-btn:not(.locked)').forEach(b => {
        b.addEventListener('click', () => onPick(Number(b.dataset.i)));
      });
    },

    showLevelDone(levelIndex, stars, mistakes, handlers) {
      const ov = el('overlay');
      const hasNext = levelIndex + 1 < KJ.LEVELS.length;
      ov.innerHTML =
        '<div class="panel">' +
        '<div class="menu-head"><img src="../../assets/dua.webp" alt=""><h1>' + praiseFor(stars) + '</h1></div>' +
        '<div class="big-stars">' + starText(stars) + '</div>' +
        '<p>Màn ' + (levelIndex + 1) + ' xong rồi! Gõ sai: <b>' + mistakes + '</b> lần.</p>' +
        (hasNext ? '' : '<p>🏆 ' + NAME + ' đã hoàn thành tất cả các màn! Quá giỏi!</p>') +
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
