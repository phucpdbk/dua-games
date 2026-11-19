// Trang chính: lời chào theo giờ trong ngày và số màn đã qua của từng game.
(function () {
  'use strict';

  const name = (window.PROFILE && window.PROFILE.nickname) || 'bạn';
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Chào buổi sáng, ' + name + '! ☀️'
    : hour < 14 ? 'Chào buổi trưa, ' + name + '! 🍚'
    : hour < 18 ? 'Chào buổi chiều, ' + name + '! 🌤️'
    : 'Chào buổi tối, ' + name + '! 🌙';
  document.getElementById('greeting').textContent = greeting;
  document.querySelectorAll('.name').forEach(el => { el.textContent = name; });

  const GAMES = [
    { storeKey: 'keyjump-progress-v1', badge: 'kjProgress', total: 15 },
    { storeKey: 'mathrun-progress-v1', badge: 'mrProgress', total: 11 },
  ];
  GAMES.forEach(g => {
    try {
      const data = JSON.parse(localStorage.getItem(g.storeKey) || 'null');
      const done = data && data.stars ? Object.keys(data.stars).length : 0;
      if (done > 0) document.getElementById(g.badge).textContent = '⭐ Đã qua ' + done + '/' + g.total + ' màn';
    } catch (e) { /* bỏ qua */ }
  });
})();
