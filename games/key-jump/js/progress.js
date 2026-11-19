// Lưu tiến độ: luôn lưu trong máy (localStorage), và đồng bộ lên mạng nếu đã cấu hình Firebase.
// Khi gộp, lấy màn mở xa nhất và số sao cao nhất của từng màn, nên chơi ở máy nào cũng không mất gì.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  const STORE_KEY = 'keyjump-progress-v1';
  const CLOUD_FIELD = 'keyjump';
  const EMPTY = { unlocked: 0, stars: {} };

  function sanitize(data) {
    if (!data || typeof data.unlocked !== 'number') return EMPTY;
    const max = KJ.LEVELS.length - 1;
    const stars = {};
    Object.keys(data.stars || {}).forEach(k => {
      const n = Number(data.stars[k]);
      if (Number(k) >= 0 && Number(k) <= max && n >= 1 && n <= 3) stars[k] = Math.floor(n);
    });
    return { unlocked: Math.max(0, Math.min(max, Math.floor(data.unlocked))), stars };
  }

  function merge(a, b) {
    const stars = { ...a.stars };
    Object.keys(b.stars).forEach(k => { stars[k] = Math.max(stars[k] || 0, b.stars[k]); });
    return { unlocked: Math.max(a.unlocked, b.unlocked), stars };
  }

  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  function saveLocal(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* chế độ ẩn danh hoặc bị chặn */ }
  }

  KJ.progress = {
    cloudEnabled: Boolean(window.CloudSave && window.CloudSave.enabled),
    status: 'local', // 'local' | 'synced' | 'offline'

    load() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        return sanitize(raw ? JSON.parse(raw) : null);
      } catch (e) {
        return EMPTY;
      }
    },

    // Gộp tiến độ trong máy với trên mạng. Trả về bản đã gộp.
    async sync(local) {
      if (!this.cloudEnabled) return local;
      const remote = await window.CloudSave.load(CLOUD_FIELD);
      if (remote === null) { this.status = 'offline'; return local; }
      const merged = merge(local, sanitize(remote));
      saveLocal(merged);
      const ok = same(merged, sanitize(remote)) || await window.CloudSave.save(CLOUD_FIELD, merged);
      this.status = ok ? 'synced' : 'offline';
      return merged;
    },

    async save(data) {
      saveLocal(data);
      if (!this.cloudEnabled) return;
      const ok = await window.CloudSave.save(CLOUD_FIELD, data);
      this.status = ok ? 'synced' : 'offline';
    },
  };
})(window.KJ);
