// Danh sách màn chơi: mỗi màn giới thiệu phím mới và ôn lại phím cũ.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  const HOME = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const TOP = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const BOTTOM = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  // newKeys: phím mới của màn; reviewKeys: phím cũ ôn lại (xuất hiện ít hơn)
  KJ.LEVELS = [
    { name: 'F và J', newKeys: ['f', 'j'], reviewKeys: [], count: 8 },
    { name: 'D và K', newKeys: ['d', 'k'], reviewKeys: ['f', 'j'], count: 10 },
    { name: 'S và L', newKeys: ['s', 'l'], reviewKeys: ['f', 'j', 'd', 'k'], count: 10 },
    { name: 'A, G và H', newKeys: ['a', 'g', 'h'], reviewKeys: ['s', 'd', 'f', 'j', 'k', 'l'], count: 12 },
    { name: 'Hàng giữa', newKeys: HOME, reviewKeys: [], count: 14 },
    { name: 'E và I', newKeys: ['e', 'i'], reviewKeys: HOME, count: 12 },
    { name: 'R và U', newKeys: ['r', 'u'], reviewKeys: ['e', 'i', 'f', 'j'], count: 12 },
    { name: 'W và O', newKeys: ['w', 'o'], reviewKeys: ['e', 'i', 'r', 'u'], count: 12 },
    { name: 'Q, P, T, Y', newKeys: ['q', 'p', 't', 'y'], reviewKeys: ['w', 'e', 'r', 'u', 'i', 'o'], count: 14 },
    { name: 'Hàng trên', newKeys: TOP, reviewKeys: HOME, count: 16 },
    { name: 'C, V, N, M', newKeys: ['c', 'v', 'n', 'm'], reviewKeys: HOME, count: 14 },
    { name: 'Z, X, B', newKeys: ['z', 'x', 'b'], reviewKeys: ['c', 'v', 'n', 'm'], count: 14 },
    { name: 'Tất cả chữ cái', newKeys: HOME.concat(TOP, BOTTOM), reviewKeys: [], count: 20 },
    { name: 'Số 1 đến 5', newKeys: ['1', '2', '3', '4', '5'], reviewKeys: [], count: 14 },
    { name: 'Số 6 đến 0', newKeys: ['6', '7', '8', '9', '0'], reviewKeys: ['1', '2', '3', '4', '5'], count: 16 },
  ];

  // Tạo dãy phím cho một màn, tránh lặp 1 phím quá 2 lần liền nhau.
  KJ.buildKeySequence = function (level) {
    const seq = [];
    for (let i = 0; i < level.count; i++) {
      const useReview = level.reviewKeys.length > 0 && Math.random() < 0.35;
      const pool = useReview ? level.reviewKeys : level.newKeys;
      let key = pool[Math.floor(Math.random() * pool.length)];
      const n = seq.length;
      if (n >= 2 && seq[n - 1] === key && seq[n - 2] === key) {
        const others = level.newKeys.concat(level.reviewKeys).filter(k => k !== key);
        if (others.length) key = others[Math.floor(Math.random() * others.length)];
      }
      seq.push(key);
    }
    return seq;
  };
})(window.KJ);
