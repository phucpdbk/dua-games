// Lưu tiến độ dùng chung cho các game: luôn lưu trong máy (localStorage) và đồng bộ lên Firestore (assets/cloud.js).
// Khi gộp, lấy màn mở xa nhất và số sao cao nhất của từng màn, nên chơi ở máy nào cũng không mất gì.
// Dạng dữ liệu: { unlocked: số màn đã mở (chỉ số), stars: { "<chỉ số màn>": 1..3 } }
window.GameProgress = (function () {
  'use strict';

  function create(opts) {
    const { field, storeKey, levelCount } = opts;
    const EMPTY = { unlocked: 0, stars: {} };
    const cloud = window.CloudSave;

    function sanitize(data) {
      if (!data || typeof data.unlocked !== 'number') return EMPTY;
      const max = levelCount - 1;
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

    function saveLocal(data) {
      try { localStorage.setItem(storeKey, JSON.stringify(data)); } catch (e) { /* chế độ ẩn danh hoặc bị chặn */ }
    }

    return {
      cloudEnabled: Boolean(cloud && cloud.enabled),
      status: 'local', // 'local' | 'synced' | 'offline'

      load() {
        try {
          const raw = localStorage.getItem(storeKey);
          return sanitize(raw ? JSON.parse(raw) : null);
        } catch (e) {
          return EMPTY;
        }
      },

      // Gộp tiến độ trong máy với trên mạng; trả về bản đã gộp.
      async sync(local) {
        if (!this.cloudEnabled) return local;
        const remote = await cloud.load(field);
        if (remote === null) { this.status = 'offline'; return local; }
        const remoteClean = sanitize(remote);
        const merged = merge(local, remoteClean);
        saveLocal(merged);
        const same = JSON.stringify(merged) === JSON.stringify(remoteClean);
        const ok = same || await cloud.save(field, merged);
        this.status = ok ? 'synced' : 'offline';
        return merged;
      },

      // Lưu sau khi xong màn. Trả về bản mới (không sửa bản cũ).
      async complete(current, levelIndex, stars) {
        const next = {
          unlocked: Math.max(current.unlocked, Math.min(levelIndex + 1, levelCount - 1)),
          stars: { ...current.stars, [levelIndex]: Math.max(current.stars[levelIndex] || 0, stars) },
        };
        saveLocal(next);
        if (this.cloudEnabled) {
          const ok = await cloud.save(field, next);
          this.status = ok ? 'synced' : 'offline';
        }
        return next;
      },

      async save(data) {
        saveLocal(data);
        if (!this.cloudEnabled) return;
        const ok = await cloud.save(field, data);
        this.status = ok ? 'synced' : 'offline';
      },
    };
  }

  return { create };
})();
