// Giao diện HTML: thẻ phép tính, bàn phím số, màn chọn màn / thắng / thua.
window.MR = window.MR || {};

(function (MR) {
  'use strict';

  const NAME = String((window.PROFILE && window.PROFILE.nickname) || 'bạn')
    .replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
  const SYNC_TEXT = {
    synced: '☁️ Đã lưu lên mạng, đổi máy vẫn chơi tiếp được',
    offline: '📴 Chưa lưu lên mạng được, đang lưu tạm trong máy',
    local: '',
  };

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';'); }
  function starText(n) { return '⭐'.repeat(n) + '☆'.repeat(3 - n); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function overlay(html) {
    const ov = el('overlay');
    ov.innerHTML = '<div class="panel">' + html + '</div>';
    ov.classList.remove('hidden');
    return ov;
  }

  MR.ui = {
    NAME,

    // ---- Thẻ phép tính ----
    showProblem(p) {
      el('card').classList.remove('hidden', 'reveal', 'correct');
      el('cardText').innerHTML = esc(p.text) + ' = <span class="ans" id="cardAns">?</span>';
      el('cardHeard').textContent = '';
      this.setTimer(1);
    },
    setTyped(text) { el('cardAns').textContent = text || '?'; },
    setTimer(f) { el('cardTimer').style.transform = 'scaleX(' + Math.max(0, Math.min(1, f)) + ')'; el('cardTimer').classList.toggle('low', f < 0.3); },
    heard(text) { el('cardHeard').textContent = text ? '🎤 ' + NAME + ' nói: “' + text + '”' : ''; },
    correct(p) {
      el('cardAns').textContent = p.answer;
      el('card').classList.add('correct');
      el('cardHeard').textContent = pick(['Đúng rồi! 🎉', 'Giỏi quá! ⭐', 'Chính xác! 👏', 'Siêu quá! 🚀']);
    },
    wrong(value) {
      const card = el('card');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      el('cardHeard').textContent = (value === null ? '' : value + ' chưa đúng. ') + 'Thử lại nhé!';
    },
    reveal(p) {
      el('cardAns').textContent = p.answer;
      el('card').classList.add('reveal');
      el('cardHeard').textContent = 'Ối! Đáp án là ' + p.answer + ' nhé';
    },
    hideCard() { el('card').classList.add('hidden'); },

    setMic(state) {
      const btn = el('btnMic');
      const labels = {
        listening: '🎤 Đang nghe...', off: '🎤 Bật giọng nói', denied: '🚫 Chưa cho phép micro',
        unsupported: '🎤 Máy này chưa hỗ trợ giọng nói',
      };
      btn.textContent = labels[state] || labels.off;
      btn.classList.toggle('on', state === 'listening');
      btn.disabled = state === 'unsupported';
    },

    // ---- Màn hình phủ ----
    showMenu(progress, status, onPick) {
      const buttons = MR.LEVELS.map((lv, i) => {
        const locked = i > progress.unlocked;
        const stars = progress.stars[i] || 0;
        return '<button class="level-btn' + (locked ? ' locked' : '') + (i === progress.unlocked ? ' current' : '') +
          '" data-i="' + i + '"' + (locked ? ' disabled' : '') + '><span class="num">' + (locked ? '🔒 ' : '') + (i + 1) +
          '</span><span class="keys">' + lv.name + '</span><span class="stars">' + (stars ? starText(stars) : '') + '</span></button>';
      }).join('');
      const voiceTip = MR.voice.supported
        ? '<p>🎤 Bấm <b>Bật giọng nói</b> rồi <b>nói to đáp án</b>, ví dụ “bảy”, “mười hai”. Hoặc gõ số rồi nhấn Enter.</p>'
        : '<p>Máy này chưa nghe được giọng nói (hãy dùng Chrome hoặc Edge). ' + NAME + ' gõ số rồi nhấn Enter nhé.</p>';
      const ov = overlay(
        '<div class="menu-head"><img src="../../assets/dua.webp" alt=""><h1>Chạy Đua Toán Học</h1>' +
        '<img src="img/ob_rock.webp" alt=""></div>' +
        '<p>Chào <b>' + NAME + '</b>! Giải đúng phép tính trước khi chạm chướng ngại vật để nhảy qua. Có 3 trái tim ❤️ đấy!</p>' +
        voiceTip + '<div class="level-grid">' + buttons + '</div>' +
        (SYNC_TEXT[status] ? '<p class="sync">' + SYNC_TEXT[status] + '</p>' : ''));
      ov.querySelectorAll('.level-btn:not(.locked)').forEach(b => b.addEventListener('click', () => onPick(Number(b.dataset.i))));
    },

    showDone(levelIndex, stars, s, handlers) {
      const hasNext = levelIndex + 1 < MR.LEVELS.length;
      const praise = stars === 3 ? pick([NAME + ' giỏi quá! 🎉', 'Siêu đỉnh, ' + NAME + '! 🌟']) : stars === 2 ? NAME + ' giỏi lắm! 👏' : 'Về đích rồi, ' + NAME + '! 💪';
      overlay(
        '<div class="menu-head"><img src="../../assets/dua.webp" alt=""><h1>' + praise + '</h1></div>' +
        '<div class="big-stars">' + starText(stars) + '</div>' +
        '<p>Đúng <b>' + s.coins + '/' + s.problems.length + '</b> phép tính, va vào chướng ngại vật <b>' + s.hits + '</b> lần.</p>' +
        (hasNext ? '' : '<p>🏆 ' + NAME + ' đã qua tất cả các màn! Quá giỏi!</p>') +
        '<div class="button-row"><button class="btn blue" id="btnRetry">🔁 Chơi lại</button>' +
        (hasNext ? '<button class="btn green" id="btnNext">▶ Màn tiếp (Enter)</button>' : '') +
        '<button class="btn" id="btnLevels">☰ Chọn màn</button></div>');
      el('btnRetry').onclick = handlers.retry;
      el('btnLevels').onclick = handlers.menu;
      if (hasNext) el('btnNext').onclick = handlers.next;
    },

    showGameOver(s, handlers) {
      overlay(
        '<div class="menu-head"><img src="img/hero_hurt.webp" alt=""><h1>Hết tim rồi!</h1></div>' +
        '<p>Không sao đâu ' + NAME + ' ơi, mình chơi lại nhé! Lần này đã đúng <b>' + s.coins + '</b> phép tính rồi đấy.</p>' +
        '<div class="button-row"><button class="btn green" id="btnRetry">🔁 Chơi lại (Enter)</button>' +
        '<button class="btn" id="btnLevels">☰ Chọn màn</button></div>');
      el('btnRetry').onclick = handlers.retry;
      el('btnLevels').onclick = handlers.menu;
    },

    hide() { el('overlay').classList.add('hidden'); },
    isOpen() { return !el('overlay').classList.contains('hidden'); },
  };
})(window.MR);
