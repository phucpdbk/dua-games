// Nạp ảnh (tạo bằng tools/gen_art.mjs) và vẽ nhân vật, quái vật, đồng vàng.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  KJ.MONSTER_KINDS = ['monster_slime', 'monster_spiky', 'monster_dino', 'monster_fluff', 'monster_octo', 'monster_rock'];
  const NAMES = ['hero', 'hero_jump', 'hero_idle', 'coin', 'goal', 'bg', 'ground'].concat(KJ.MONSTER_KINDS);

  KJ.HERO_W = 60;        // bề rộng dùng để tính va chạm
  KJ.MONSTER_W = 100;
  const HERO_DRAW_H = 132;
  const MONSTER_DRAW_H = 118;

  KJ.img = {};

  KJ.loadImages = function () {
    return Promise.all(NAMES.map(name => new Promise(resolve => {
      const im = new Image();
      im.onload = () => { KJ.img[name] = im; resolve(); };
      im.onerror = () => resolve();
      im.src = 'img/' + name + '.webp';
    })));
  };

  // Vẽ ảnh căn giữa theo cx, đáy tại bottom. Trả về bề rộng đã vẽ.
  function drawImage(ctx, name, cx, bottom, height) {
    const im = KJ.img[name];
    const w = im ? height * im.width / im.height : height * 0.8;
    if (im) {
      ctx.drawImage(im, cx - w / 2, bottom - height, w, height);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx - w / 2, bottom - height, w, height);
    }
    return w;
  }

  function drawShadow(ctx, cx, groundY, rx) {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.22)';
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 2, rx, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // pose: 'run' | 'jump' | 'idle'; x = mép trái vùng va chạm, y = chân
  KJ.drawHero = function (ctx, x, y, pose, t) {
    const cx = x + KJ.HERO_W / 2;
    const airborne = KJ.GROUND_Y - y;
    drawShadow(ctx, cx, KJ.GROUND_Y, Math.max(16, 34 - airborne * 0.12));
    ctx.save();
    if (pose === 'run') {
      const bob = Math.abs(Math.sin(t * 13)) * 6;
      ctx.translate(cx, y - bob);
      ctx.rotate(Math.sin(t * 13) * 0.05);
      drawImage(ctx, 'hero', 0, 0, HERO_DRAW_H);
    } else if (pose === 'jump') {
      ctx.translate(cx, y);
      drawImage(ctx, KJ.img.hero_jump ? 'hero_jump' : 'hero', 0, 0, HERO_DRAW_H + 6);
    } else {
      const breathe = 1 + Math.sin(t * 3) * 0.02;
      ctx.translate(cx, y);
      ctx.scale(1 / breathe, breathe);
      drawImage(ctx, KJ.img.hero_idle ? 'hero_idle' : 'hero', 0, 0, HERO_DRAW_H);
    }
    ctx.restore();
  };

  function drawKeySign(ctx, cx, bottom, key, active, t) {
    const size = 64 + (active ? Math.sin(t * 8) * 4 : 0);
    const top = bottom - size;
    if (active) {
      ctx.save();
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 28;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.roundRect(cx - size / 2 - 6, top - 6, size + 12, size + 12, 18);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = active ? '#a16207' : '#475569';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(cx - size / 2, top, size, size, 14);
    ctx.moveTo(cx - 10, bottom);
    ctx.lineTo(cx, bottom + 12);
    ctx.lineTo(cx + 10, bottom);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 8, bottom - 4, 16, 6);
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 46px "Baloo 2", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(key.toUpperCase(), cx, top + size / 2 + 3);
  }

  // m: { kind, key, phase, shake, poofT }, x = mép trái
  KJ.drawMonster = function (ctx, m, x, groundY, t, active) {
    const scale = m.poofT >= 0 ? Math.max(0, 1 - m.poofT * 3.5) : 1;
    if (scale <= 0) return;
    const cx = x + KJ.MONSTER_W / 2 + (m.shake > 0 ? Math.sin(t * 70) * 9 * m.shake : 0);
    const squash = Math.sin(t * 6 + m.phase) * 0.05;

    drawShadow(ctx, cx, groundY, 40 * scale);
    ctx.save();
    ctx.translate(cx, groundY);
    ctx.scale((1 + squash) * (2 - scale), (1 - squash) * scale);
    drawImage(ctx, m.kind, 0, 0, MONSTER_DRAW_H);
    ctx.restore();

    if (m.state === 'alive' || m.state === 'marked') {
      const hop = Math.abs(Math.sin(t * 3 + m.phase)) * 4;
      drawKeySign(ctx, cx, groundY - MONSTER_DRAW_H - 22 - hop, m.key, active, t);
    }
  };

  KJ.drawCoin = function (ctx, x, y, t, size) {
    const s = size || 34;
    const spin = t ? Math.abs(Math.cos(t * 6)) * 0.8 + 0.2 : 1;
    const im = KJ.img.coin;
    if (im) {
      ctx.drawImage(im, x - (s * spin) / 2, y - s / 2, s * spin, s);
      return;
    }
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(x, y, (s / 2) * spin, s / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  KJ.drawGoal = function (ctx, x, groundY) {
    drawImage(ctx, 'goal', x + 120, groundY + 6, 300);
  };
})(window.KJ);
