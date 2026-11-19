// Vẽ cảnh nền, mặt đất, cờ đích, hiệu ứng và HUD.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  const W = 960;
  const H = 540;
  KJ.W = W;
  KJ.H = H;
  KJ.GROUND_Y = 440;
  const TILE = 40;

  function wrap(v, span) { return ((v % span) + span) % span; }

  function drawCloud(ctx, x, y, s) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 26 * s, y - 12 * s, 28 * s, 0, Math.PI * 2);
    ctx.arc(x + 56 * s, y, 22 * s, 0, Math.PI * 2);
    ctx.fillRect(x, y, 56 * s, 22 * s);
    ctx.fill();
  }

  function drawSky(ctx, worldX) {
    const g = ctx.createLinearGradient(0, 0, 0, KJ.GROUND_Y);
    g.addColorStop(0, '#38bdf8');
    g.addColorStop(1, '#bae6fd');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const span = W + 300;
    for (let i = 0; i < 5; i++) {
      const x = wrap(i * 290 - worldX * 0.15, span) - 150;
      drawCloud(ctx, x, 70 + (i % 3) * 45, 0.9 + (i % 2) * 0.4);
    }

    const hillSpan = W + 500;
    for (let i = 0; i < 4; i++) {
      const x = wrap(i * 380 - worldX * 0.35, hillSpan) - 250;
      ctx.fillStyle = i % 2 ? '#4ade80' : '#22c55e';
      ctx.beginPath();
      ctx.ellipse(x + 160, KJ.GROUND_Y, 170, 110 + (i % 2) * 40, 0, Math.PI, 0);
      ctx.fill();
    }

    const bushSpan = W + 400;
    for (let i = 0; i < 4; i++) {
      const x = wrap(i * 330 + 120 - worldX * 0.7, bushSpan) - 200;
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(x, KJ.GROUND_Y, 26, Math.PI, 0);
      ctx.arc(x + 34, KJ.GROUND_Y, 34, Math.PI, 0);
      ctx.arc(x + 70, KJ.GROUND_Y, 24, Math.PI, 0);
      ctx.fill();
    }
  }

  function drawGround(ctx, worldX) {
    const off = wrap(worldX, TILE);
    for (let x = -off; x < W; x += TILE) {
      for (let y = KJ.GROUND_Y; y < H; y += TILE) {
        ctx.fillStyle = '#c2703d';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#9a4f22';
        ctx.fillRect(x, y + TILE - 4, TILE, 4);
        ctx.fillRect(x + TILE - 4, y, 4, TILE);
        ctx.fillStyle = '#e09862';
        ctx.fillRect(x + 4, y + 4, 8, 4);
      }
    }
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, KJ.GROUND_Y, W, 10);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, KJ.GROUND_Y + 10, W, 3);
  }

  function drawGoal(ctx, sx, t) {
    const g = KJ.GROUND_Y;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(sx, g - 300, 8, 300);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(sx + 4, g - 304, 10, 0, Math.PI * 2);
    ctx.fill();
    const wave = Math.sin(t * 6) * 6;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(sx + 8, g - 290);
    ctx.lineTo(sx + 78, g - 268 + wave);
    ctx.lineTo(sx + 8, g - 240);
    ctx.fill();
    ctx.font = '28px serif';
    ctx.fillText('⭐', sx + 22, g - 258);

    const hx = sx + 120;
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(hx, g - 110, 140, 110);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(hx - 15, g - 110);
    ctx.lineTo(hx + 70, g - 175);
    ctx.lineTo(hx + 155, g - 110);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.fillRect(hx + 52, g - 64, 36, 64);
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(hx + 12, g - 90, 28, 26);
    ctx.fillRect(hx + 100, g - 90, 28, 26);
  }

  function drawParticles(ctx, particles, t) {
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      if (p.type === 'coin') {
        KJ.drawCoin(ctx, p.x, p.y, t);
      } else if (p.type === 'text') {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 30px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
      }
    });
    ctx.globalAlpha = 1;
  }

  function drawHud(ctx, s) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.beginPath();
    ctx.roundRect(12, 12, W - 24, 52, 14);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Segoe UI", Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Màn ' + (s.levelIndex + 1) + ': ' + s.level.name, 28, 38);

    KJ.drawCoin(ctx, W - 160, 38, 0);
    ctx.fillStyle = '#fff';
    ctx.fillText('× ' + s.coins, W - 138, 38);

    const total = s.monsters.length;
    const barW = 160;
    const bx = W - 360;
    ctx.fillStyle = '#334155';
    ctx.fillRect(bx, 30, barW, 16);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(bx, 30, barW * (s.coins / total), 16);
  }

  KJ.render = function (ctx, s, t) {
    drawSky(ctx, s.worldX);
    if (s.goalX - s.worldX < W + 300) drawGoal(ctx, s.goalX - s.worldX, t);
    drawGround(ctx, s.worldX);

    const target = KJ.currentTarget ? KJ.currentTarget() : null;
    s.monsters.forEach(m => {
      const sx = m.x - s.worldX;
      if (sx > W + 50 || sx < -KJ.MONSTER_W - 50) return;
      KJ.drawMonster(ctx, m, sx, KJ.GROUND_Y, t, m === target);
    });

    const hero = s.hero;
    KJ.drawHero(ctx, KJ.HERO_SCREEN_X + hero.shakeX, hero.y, hero.frame);
    drawParticles(ctx, s.particles, t);
    drawHud(ctx, s);

    if (s.waitTime > 3 && target) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 28px "Segoe UI", Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Gõ phím  ' + target.key.toUpperCase() + '  để nhảy nhé!', W / 2, 120);
    }
  };
})(window.KJ);
