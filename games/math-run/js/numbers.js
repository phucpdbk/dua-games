// Đọc số từ câu nói tiếng Việt: "bảy", "mười lăm", "hai mươi mốt", "hai mốt", "một trăm", "12"...
window.MR = window.MR || {};

(function (MR) {
  'use strict';

  const UNITS = {
    'không': 0, 'một': 1, 'mốt': 1, 'hai': 2, 'ba': 3, 'bốn': 4, 'tư': 4,
    'năm': 5, 'lăm': 5, 'nhăm': 5, 'sáu': 6, 'bảy': 7, 'bẩy': 7, 'tám': 8, 'chín': 9,
  };
  // Đứng sau hàng chục mà không có "mươi" vẫn hiểu là số hai chữ số: "hai mốt" = 21, "ba lăm" = 35.
  const COLLOQUIAL_TAIL = { 'mốt': 1, 'lăm': 5, 'nhăm': 5, 'tư': 4 };
  const ZERO_LINK = { 'linh': true, 'lẻ': true };

  function unitAfter(tokens, i) {
    const t = tokens[i];
    if (t === undefined || t === 'không' || !(t in UNITS)) return null;
    return UNITS[t];
  }

  // Đọc số bắt đầu ở tokens[i]. Trả về { value, len } hoặc null.
  function parseTens(tokens, i) {
    const t = tokens[i];
    if (t === 'mười') {
      const u = unitAfter(tokens, i + 1);
      return u === null ? { value: 10, len: 1 } : { value: 10 + u, len: 2 };
    }
    if (!(t in UNITS)) return null;
    const d = UNITS[t];
    const next = tokens[i + 1];
    if (next === 'mươi' || next === 'chục') {
      const u = unitAfter(tokens, i + 2);
      return u === null ? { value: d * 10, len: 2 } : { value: d * 10 + u, len: 3 };
    }
    if (d >= 2 && next in COLLOQUIAL_TAIL) return { value: d * 10 + COLLOQUIAL_TAIL[next], len: 2 };
    return { value: d, len: 1 };
  }

  function parseAt(tokens, i) {
    const t = tokens[i];
    if (/^\d+$/.test(t)) return { value: Number(t), len: 1 };
    if (t === 'trăm' || ((t in UNITS) && tokens[i + 1] === 'trăm')) {
      const hasUnit = t !== 'trăm';
      let value = (hasUnit ? UNITS[t] : 1) * 100;
      let len = hasUnit ? 2 : 1;
      if (ZERO_LINK[tokens[i + len]] && unitAfter(tokens, i + len + 1) !== null) {
        return { value: value + unitAfter(tokens, i + len + 1), len: len + 2 };
      }
      const rest = parseTens(tokens, i + len);
      if (rest) { value += rest.value; len += rest.len; }
      return { value, len };
    }
    return parseTens(tokens, i);
  }

  // Trả về tất cả các số trong câu, theo thứ tự xuất hiện.
  MR.parseNumbers = function (text) {
    const clean = String(text || '').normalize('NFC').toLowerCase()
      .replace(/(\d)[.,](\d{3})/g, '$1$2')
      .replace(/(\d+)/g, ' $1 ')
      .replace(/[^\p{L}\d]+/gu, ' ')
      .trim();
    if (!clean) return [];
    const tokens = clean.split(/\s+/);
    const found = [];
    for (let i = 0; i < tokens.length;) {
      const hit = parseAt(tokens, i);
      if (hit) { found.push(hit.value); i += hit.len; } else { i += 1; }
    }
    return found;
  };

  // Số cuối cùng trong câu (trẻ hay nói "bằng bảy", "là mười hai").
  MR.lastNumber = function (text) {
    const all = MR.parseNumbers(text);
    return all.length ? all[all.length - 1] : null;
  };
})(window.MR);
