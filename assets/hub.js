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

  try {
    const kj = JSON.parse(localStorage.getItem('keyjump-progress-v1') || 'null');
    const done = kj && kj.stars ? Object.keys(kj.stars).length : 0;
    if (done > 0) document.getElementById('kjProgress').textContent = '⭐ Đã qua ' + done + '/15 màn';
  } catch (e) { /* bỏ qua */ }
})();
