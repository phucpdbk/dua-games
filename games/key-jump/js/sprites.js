// Nhân vật pixel-art và quái vật vẽ bằng canvas.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  const PX = 5;
  const PAL = {
    H: '#f59e0b', h: '#b45309', S: '#fcd7b0', E: '#1f2937', M: '#c2410c',
    B: '#2563eb', Y: '#fde047', P: '#1e3a8a', W: '#6b3f1d',
  };

  const TOP = [
    '...HHHHHH...',
    '..HHHHHHHH..',
    '..HHHHHHhhhh',
    '..SSSSSSSS..',
    '..SSSESSES..',
    '..SSSSSSSS..',
    '...SSMMSS...',
    '....SSSS....',
    '..BBBBBBBB..',
    '.SBBBYYBBBS.',
    '.SBBBBBBBBS.',
    '..BBBBBBBB..',
    '..PPPPPPPP..',
  ];

  const LEGS = {
    run1: ['..PPP..PPP..', '.PPP....PPP.', 'WWW......WWW'],
    run2: ['...PPP.PPP..', '...PPP.PPP..', '..WWWW.WWWW.'],
    jump: ['.PPPP..PPP..', 'WWWW....PPP.', '........WWW.'],
  };

  KJ.HERO_W = 12 * PX;
  KJ.HERO_H = 16 * PX;
  KJ.MONSTER_W = 96;
  KJ.MONSTER_H = 90;

  // x, y = góc dưới-trái
  KJ.drawHero = function (ctx, x, y, frame) {
    const rows = TOP.concat(LEGS[frame] || LEGS.run2);
    const top = y - rows.length * PX;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        ctx.fillStyle = PAL[ch];
        ctx.fillRect(Math.round(x + c * PX), Math.round(top + r * PX), PX, PX);
      }
    }
  };

  KJ.MONSTER_COLORS = [
    ['#8b5cf6', '#5b21b6'], ['#ef4444', '#991b1b'], ['#10b981', '#065f46'],
    ['#f97316', '#9a3412'], ['#ec4899', '#9d174d'], ['#0ea5e9', '#075985'],
  ];

  function drawSpikes(ctx, cx, top, w, color) {
    ctx.fillStyle = color;
    for (let i = -2; i <= 2; i++) {
      const sx = cx + i * (w / 6);
      ctx.beginPath();
      ctx.moveTo(sx - 9, top + 14);
      ctx.lineTo(sx, top - 8 + Math.abs(i) * 4);
      ctx.lineTo(sx + 9, top + 14);
      ctx.fill();
    }
  }

  function drawHorns(ctx, cx, top, color) {
    ctx.fillStyle = color;
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(cx + s * 20, top + 12);
      ctx.quadraticCurveTo(cx + s * 40, top - 4, cx + s * 36, top - 22);
      ctx.lineTo(cx + s * 30, top + 14);
      ctx.fill();
    });
  }

  function drawFace(ctx, cx, top, angry) {
    [-1, 1].forEach(s => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(cx + s * 15, top + 24, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(cx + s * 15 - 4, top + 26, 5, 0, Math.PI * 2);
      ctx.fill();
      if (angry) {
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx + s * 26, top + 8);
        ctx.lineTo(cx + s * 6, top + 15);
        ctx.stroke();
      }
    });
  }

  function drawBadge(ctx, cx, cy, key, active, t) {
    const size = 46 + (active ? Math.sin(t * 8) * 3 : 0);
    if (active) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = active ? '#ca8a04' : '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(cx - size / 2, cy - size / 2, size, size, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(key.toUpperCase(), cx, cy + 2);
  }

  // m: { kind, color, key, phase, shake, poofT }, x = mép trái, groundY = mặt đất
  KJ.drawMonster = function (ctx, m, x, groundY, t, active) {
    const w = KJ.MONSTER_W;
    const h = KJ.MONSTER_H;
    const [body, dark] = KJ.MONSTER_COLORS[m.color];
    const bounce = m.poofT >= 0 ? 0 : Math.abs(Math.sin(t * 5 + m.phase)) * 8;
    const scale = m.poofT >= 0 ? Math.max(0, 1 - m.poofT * 3) : 1;
    if (scale <= 0) return;

    ctx.save();
    const shakeX = m.shake > 0 ? Math.sin(t * 70) * 8 * m.shake : 0;
    const cx = x + w / 2 + shakeX;
    ctx.translate(cx, groundY);
    ctx.scale(1 + (1 - scale) * 0.6, scale);
    ctx.translate(-cx, -groundY);

    const base = groundY - bounce;
    const top = base - h;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(cx, groundY, w * 0.45, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (m.kind === 1) drawSpikes(ctx, cx, top, w, dark);
    if (m.kind === 2) drawHorns(ctx, cx, top, '#fef3c7');

    ctx.fillStyle = dark;
    ctx.fillRect(cx - 32, base - 12, 22, 12);
    ctx.fillRect(cx + 10, base - 12, 22, 12);

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(cx, top + h / 2, w / 2, h / 2 - 4, 0, 0, Math.PI * 2);
    ctx.fill();

    drawFace(ctx, cx, top, m.kind !== 0);
    drawBadge(ctx, cx, top + 62, m.key, active, t);
    ctx.restore();
  };

  KJ.drawCoin = function (ctx, x, y, t) {
    const sx = Math.abs(Math.cos(t * 8));
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, 14 * sx + 2, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
})(window.KJ);
