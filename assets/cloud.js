// Lưu tiến trình lên Firestore qua REST (không cần thư viện Firebase).
// Mỗi người chơi là một document players/<playerId>; mỗi game là một trường chứa chuỗi JSON.
// Chưa cấu hình Firebase hoặc mất mạng thì mọi hàm trả về null, game vẫn lưu trong máy như bình thường.
window.CloudSave = (function () {
  'use strict';

  const profile = window.PROFILE || {};
  const cfg = profile.firebase || {};
  const enabled = Boolean(cfg.projectId && cfg.apiKey && profile.playerId);
  const base = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(cfg.projectId) +
    '/databases/(default)/documents/players/' + encodeURIComponent(profile.playerId || '');

  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(resolve => setTimeout(() => resolve(null), ms))]);
  }

  async function load(field) {
    if (!enabled) return null;
    try {
      const res = await withTimeout(fetch(base + '?key=' + encodeURIComponent(cfg.apiKey)), 4000);
      if (!res) return null;
      if (res.status === 404) return {};
      if (!res.ok) return null;
      const doc = await res.json();
      const raw = doc.fields && doc.fields[field] && doc.fields[field].stringValue;
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return null;
    }
  }

  async function save(field, value) {
    if (!enabled) return false;
    try {
      const url = base + '?key=' + encodeURIComponent(cfg.apiKey) + '&updateMask.fieldPaths=' + field;
      const res = await withTimeout(fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { [field]: { stringValue: JSON.stringify(value) } } }),
      }), 6000);
      return Boolean(res && res.ok);
    } catch (e) {
      return false;
    }
  }

  return { enabled, load, save };
})();
