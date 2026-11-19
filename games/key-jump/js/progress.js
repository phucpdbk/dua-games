// Nối game với các phần dùng chung (assets/audio.js, assets/progress.js).
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  KJ.audio = window.GameAudio;
  KJ.progress = window.GameProgress.create({
    field: 'keyjump',
    storeKey: 'keyjump-progress-v1',
    levelCount: KJ.LEVELS.length,
  });
})(window.KJ);
