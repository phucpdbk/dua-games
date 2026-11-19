// Vẽ cảnh nền, mặt đất, đích, hiệu ứng và HUD.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  const W = 960;
  const H = 540;
  KJ.W = W;
  KJ.H = H;
  KJ.GROUND_Y = 440;
  const FONT = '"Baloo 2", "Segoe UI", Arial, sans-serif';

  function wrap(v, span) { return ((v % span) + span) % span; }

  // Lặp ảnh theo chiều ngang, tấm xen kẽ lật gương để không lộ đường nối.
  function tileMirror(ctx, im, offset, y, h) {
    const w = h * im.width / im.height;
    const start = -wrap(offset, w * 2);
    for (let x = start, i = 0; x < W; x += w, i++) {
      if (i % 2) {
        ctx.save();
        ctx.translate(x + w, y);
        ctx.scale(-1, 1);
        ctx.drawImage(im, -0.5, 0, w + 1, h);
        ctx.restore();
      } else {
        ctx.drawImage(im, x - 0.5, y, w + 1, h);
      }
    }
  }

  function drawBackground(ctx, worldX) {
    if (KJ.img.bg) {
      tileMirror(ctx, KJ.img.bg, worldX * 0.3, 0, H);
    } else {
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawGround(ctx, worldX) {
    const top = KJ.GROUND_Y - 18;
    if (KJ.img.ground) {
      tileMirror(ctx, KJ.img.ground, worldX, top, H - top);
    } else {
      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, top, W, H - top);
    }
  }

  function drawParticles(ctx, particles, t) {
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      if (p.type === 'coin') {
        KJ.drawCoin(ctx, p.x, p.y, t, 48);
      } else if (p.type === 'text') {
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 5;
        ctx.font = '800 36px ' + FONT;
        ctx.textAlign = 'center';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  function pill(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
  }

  function drawHud(ctx, s, target) {
    ctx.textBaseline = 'middle';
    ctx.font = '800 24px ' + FONT;
    const title = 'Màn ' + (s.levelIndex + 1) + ': ' + s.level.name;
    const tw = ctx.measureText(title).width;
    pill(ctx, 16, 14, tw + 36, 46, 'rgba(255,255,255,0.88)');
    ctx.fillStyle = '#0c4a6e';
    ctx.textAlign = 'left';
    ctx.fillText(title, 34, 39);

    const total = s.monsters.length;
    pill(ctx, W - 300, 14, 284, 46, 'rgba(255,255,255,0.88)');
    pill(ctx, W - 284, 31, 150, 14, '#cbd5e1');
    if (s.coins > 0) pill(ctx, W - 284, 31, Math.max(14, 150 * (s.coins / total)), 14, '#22c55e');
    KJ.drawCoin(ctx, W - 108, 37, 0, 32);
    ctx.fillStyle = '#0c4a6e';
    ctx.fillText(s.coins + '/' + total, W - 86, 39);

    if (!target) return;
    const finger = KJ.FINGERS[KJ.KEY_FINGER[target.key]];
    if (!finger) return;
    const label = 'Phím ' + target.key.toUpperCase() + ' · ' + finger.name;
    ctx.font = '800 24px ' + FONT;
    const lw = ctx.measureText(label).width + 40;
    pill(ctx, W / 2 - lw / 2, 74, lw, 42, finger.color);
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(label, W / 2, 97);
  }

  KJ.render = function (ctx, s, t) {
    drawBackground(ctx, s.worldX);
    const goalSx = s.goalX - s.worldX;
    if (goalSx < W + 300) KJ.drawGoal(ctx, goalSx, KJ.GROUND_Y);
    drawGround(ctx, s.worldX);

    const target = KJ.currentTarget ? KJ.currentTarget() : null;
    s.monsters.forEach(m => {
      const sx = m.x - s.worldX;
      if (sx > W + 80 || sx < -KJ.MONSTER_W - 80) return;
      KJ.drawMonster(ctx, m, sx, KJ.GROUND_Y, t, m === target);
    });

    KJ.drawHero(ctx, KJ.HERO_SCREEN_X + s.hero.shakeX, s.hero.y, s.hero.pose, t);
    drawParticles(ctx, s.particles, t);
    drawHud(ctx, s, target);
  };
})(window.KJ);
