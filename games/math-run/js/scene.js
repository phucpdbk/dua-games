// Nạp ảnh và vẽ cảnh: nền, mặt đất, chướng ngại vật, nhân vật, hiệu ứng, HUD.
window.MR = window.MR || {};

(function (MR) {
  'use strict';

  const W = 960;
  const H = 540;
  MR.W = W;
  MR.H = H;
  MR.GROUND_Y = 440;
  MR.HERO_X = 170;
  MR.HERO_W = 60;
  MR.OB_W = 110;
  MR.OBSTACLES = ['ob_rock', 'ob_log', 'ob_crate', 'ob_stump', 'ob_hay'];
  const FONT = '"Baloo 2", "Segoe UI", Arial, sans-serif';
  const NAMES = ['hero', 'hero_jump', 'hero_idle', 'hero_hurt', 'coin', 'mr_bg', 'mr_ground'].concat(MR.OBSTACLES);

  MR.img = {};
  MR.loadImages = function () {
    return Promise.all(NAMES.map(name => new Promise(resolve => {
      const im = new Image();
      im.onload = () => { MR.img[name] = im; resolve(); };
      im.onerror = () => resolve();
      im.src = 'img/' + name + '.webp';
    })));
  };

  function wrap(v, span) { return ((v % span) + span) % span; }

  function tileMirror(ctx, im, offset, y, h) {
    const w = h * im.width / im.height;
    const start = -wrap(offset, w * 2);
    for (let x = start, i = 0; x < W; x += w, i++) {
      ctx.save();
      if (i % 2) { ctx.translate(x + w, y); ctx.scale(-1, 1); } else { ctx.translate(x, y); }
      ctx.drawImage(im, -0.5, 0, w + 1, h);
      ctx.restore();
    }
  }

  function drawImage(ctx, name, cx, bottom, height) {
    const im = MR.img[name];
    const w = im ? height * im.width / im.height : height * 0.8;
    if (im) ctx.drawImage(im, cx - w / 2, bottom - height, w, height);
    else { ctx.fillStyle = '#94a3b8'; ctx.fillRect(cx - w / 2, bottom - height, w, height); }
  }

  function shadow(ctx, cx, rx) {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.22)';
    ctx.beginPath();
    ctx.ellipse(cx, MR.GROUND_Y - 2, rx, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHero(ctx, hero, t) {
    const cx = MR.HERO_X + MR.HERO_W / 2;
    shadow(ctx, cx, Math.max(16, 34 - (MR.GROUND_Y - hero.y) * 0.12));
    ctx.save();
    if (hero.pose === 'hurt') {
      ctx.translate(cx - 6, MR.GROUND_Y + 4);
      drawImage(ctx, MR.img.hero_hurt ? 'hero_hurt' : 'hero', 0, 0, 110);
    } else if (hero.pose === 'jump') {
      ctx.translate(cx, hero.y);
      drawImage(ctx, 'hero_jump', 0, 0, 138);
    } else if (hero.pose === 'idle') {
      ctx.translate(cx, hero.y);
      drawImage(ctx, 'hero_idle', 0, 0, 132);
    } else {
      const speed = hero.sprint ? 22 : 13;
      ctx.translate(cx, hero.y - Math.abs(Math.sin(t * speed)) * 6);
      ctx.rotate(Math.sin(t * speed) * 0.05 + (hero.sprint ? 0.08 : 0));
      drawImage(ctx, 'hero', 0, 0, 132);
    }
    ctx.restore();
  }

  function drawObstacle(ctx, ob, worldX) {
    const scale = ob.poofT >= 0 ? Math.max(0, 1 - ob.poofT * 3) : 1;
    if (scale <= 0) return;
    const cx = ob.x - worldX + MR.OB_W / 2;
    shadow(ctx, cx, 48 * scale);
    ctx.save();
    ctx.translate(cx, MR.GROUND_Y + 6);
    ctx.scale(2 - scale, scale);
    drawImage(ctx, ob.kind, 0, 0, 100);
    ctx.restore();
  }

  function drawParticles(ctx, particles, t) {
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      if (p.type === 'coin' && MR.img.coin) {
        const s = 46 * (Math.abs(Math.cos(t * 6)) * 0.8 + 0.2);
        ctx.drawImage(MR.img.coin, p.x - s / 2, p.y - 23, s, 46);
      } else if (p.type === 'text') {
        ctx.font = '800 34px ' + FONT;
        ctx.textAlign = 'center';
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#78350f';
        ctx.fillStyle = p.color;
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

  function drawHud(ctx, s) {
    ctx.textBaseline = 'middle';
    pill(ctx, 16, 14, 150, 46, 'rgba(255,255,255,0.88)');
    ctx.font = '28px ' + FONT;
    ctx.textAlign = 'left';
    for (let i = 0; i < 3; i++) ctx.fillText(i < s.hearts ? '❤️' : '🤍', 30 + i * 44, 39);

    const done = s.index;
    const total = s.problems.length;
    pill(ctx, W - 250, 14, 234, 46, 'rgba(255,255,255,0.88)');
    pill(ctx, W - 234, 31, 130, 14, '#cbd5e1');
    if (done > 0) pill(ctx, W - 234, 31, Math.max(14, 130 * done / total), 14, '#22c55e');
    ctx.font = '800 24px ' + FONT;
    ctx.fillStyle = '#0c4a6e';
    ctx.fillText('🪙 ' + s.coins, W - 92, 39);
  }

  MR.render = function (ctx, s, t) {
    if (MR.img.mr_bg) tileMirror(ctx, MR.img.mr_bg, s.worldX * 0.3, 0, H);
    else { ctx.fillStyle = '#7dd3fc'; ctx.fillRect(0, 0, W, H); }
    const top = MR.GROUND_Y - 8;
    if (MR.img.mr_ground) tileMirror(ctx, MR.img.mr_ground, s.worldX, top, H - top);
    s.obstacles.forEach(ob => drawObstacle(ctx, ob, s.worldX));
    drawHero(ctx, s.hero, t);
    drawParticles(ctx, s.particles, t);
    drawHud(ctx, s);
  };
})(window.MR);
