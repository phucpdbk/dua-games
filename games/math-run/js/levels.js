// Các màn chơi và cách sinh phép tính.
window.MR = window.MR || {};

(function (MR) {
  'use strict';

  // kind: 'add' | 'sub' | 'mix' | 'three' | 'tens' | 'mix100' ; carry: cho phép có nhớ (phạm vi 100)
  // time: số giây để trả lời trước khi chạm chướng ngại vật
  MR.LEVELS = [
    { name: 'Cộng trong 10', kind: 'add', max: 10, time: 12, count: 10 },
    { name: 'Trừ trong 10', kind: 'sub', max: 10, time: 12, count: 10 },
    { name: 'Cộng trừ trong 10', kind: 'mix', max: 10, time: 11, count: 12 },
    { name: 'Cộng trong 20', kind: 'add', max: 20, time: 13, count: 12 },
    { name: 'Trừ trong 20', kind: 'sub', max: 20, time: 13, count: 12 },
    { name: 'Cộng trừ trong 20', kind: 'mix', max: 20, time: 12, count: 14 },
    { name: 'Gộp 3 số trong 10', kind: 'three', max: 10, time: 16, count: 12 },
    { name: 'Gộp 3 số trong 20', kind: 'three', max: 20, time: 16, count: 14 },
    { name: 'Số tròn chục', kind: 'tens', max: 100, time: 12, count: 12 },
    { name: 'Trong 100, không nhớ', kind: 'mix100', max: 100, time: 18, count: 12, carry: false },
    { name: 'Trong 100, có nhớ', kind: 'mix100', max: 100, time: 20, count: 12, carry: true },
  ];

  function rnd(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

  function build(terms, ops) {
    const answer = terms.reduce((sum, t, k) => (k === 0 ? t : ops[k - 1] === '+' ? sum + t : sum - t), 0);
    const pretty = ops.map(o => (o === '-' ? '−' : '+'));
    const text = terms.map((t, k) => (k === 0 ? String(t) : pretty[k - 1] + ' ' + t)).join(' ');
    const spoken = terms.map((t, k) => (k === 0 ? String(t) : (ops[k - 1] === '+' ? 'cộng ' : 'trừ ') + t)).join(' ');
    return { terms, ops, answer, text, spoken: spoken + ' bằng mấy?' };
  }

  function add(max) {
    const sum = rnd(2, max);
    const a = rnd(1, sum - 1);
    return build([a, sum - a], ['+']);
  }

  function sub(max) {
    const a = rnd(2, max);
    const b = rnd(1, a);
    return build([a, b], ['-']);
  }

  // a ± b ± c, mọi bước trung gian nằm trong 0..max
  function three(max) {
    for (;;) {
      const ops = [Math.random() < 0.5 ? '+' : '-', Math.random() < 0.5 ? '+' : '-'];
      const terms = [rnd(1, max), rnd(1, Math.ceil(max / 2)), rnd(1, Math.ceil(max / 2))];
      const mid = ops[0] === '+' ? terms[0] + terms[1] : terms[0] - terms[1];
      const end = ops[1] === '+' ? mid + terms[2] : mid - terms[2];
      if (mid >= 0 && mid <= max && end >= 0 && end <= max) return build(terms, ops);
    }
  }

  function tens() {
    if (Math.random() < 0.5) {
      const s = rnd(2, 10);
      const a = rnd(1, s - 1);
      return build([a * 10, (s - a) * 10], ['+']);
    }
    const a = rnd(2, 10);
    return build([a * 10, rnd(1, a) * 10], ['-']);
  }

  function mix100(carry) {
    for (;;) {
      const plus = Math.random() < 0.5;
      const a = rnd(11, 99);
      const b = rnd(5, 89);
      const value = plus ? a + b : a - b;
      if (value < 0 || value > 100) continue;
      const hasCarry = plus ? (a % 10) + (b % 10) >= 10 : (a % 10) < (b % 10);
      if (hasCarry === carry) return build([a, b], [plus ? '+' : '-']);
    }
  }

  MR.makeProblem = function (level) {
    switch (level.kind) {
      case 'add': return add(level.max);
      case 'sub': return sub(level.max);
      case 'mix': return Math.random() < 0.5 ? add(level.max) : sub(level.max);
      case 'three': return three(level.max);
      case 'tens': return tens();
      default: return mix100(Boolean(level.carry));
    }
  };

  // Dãy phép tính cho một màn, không lặp lại phép giống hệt câu ngay trước.
  MR.makeProblems = function (level) {
    const list = [];
    while (list.length < level.count) {
      const p = MR.makeProblem(level);
      if (!list.length || list[list.length - 1].text !== p.text) list.push(p);
    }
    return list;
  };
})(window.MR);
