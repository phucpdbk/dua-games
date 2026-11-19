// Vòng lặp game: nhân vật tự chạy, dừng trước quái vật, gõ đúng phím thì nhảy qua.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  KJ.HERO_SCREEN_X = 180;
  const STOP_GAP = 60;       // khoảng cách dừng chờ trước quái vật
  const JUMP_GAP = 90;       // khoảng cách bắt đầu nhảy nếu đã gõ đúng
  const ACTIVE_GAP = 560;    // quái vật trong tầm này mới nhận phím
  const JUMP_DUR = 0.8;
  const JUMP_H = 150;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let progress = KJ.progress.load();
  let s = null;              // trạng thái màn hiện tại
  let running = false;
  let lastTime = 0;
  let clock = 0;

  function setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = KJ.W * dpr;
    canvas.height = KJ.H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function newLevel(index) {
    const level = KJ.LEVELS[index];
    const keys = KJ.buildKeySequence(level);
    let x = 900;
    const monsters = keys.map((key, i) => {
      const m = {
        x, key, state: 'alive', poofT: -1, shake: 0,
        kind: i % 3, color: Math.floor(Math.random() * KJ.MONSTER_COLORS.length),
        phase: Math.random() * 6,
      };
      x += 460 + Math.random() * 180;
      return m;
    });
    return {
      levelIndex: index, level, monsters,
      allKeys: level.newKeys.concat(level.reviewKeys),
      goalX: x + 200, worldX: 0, coins: 0, mistakes: 0, waitTime: 0,
      runSpeed: 220 + index * 6,
      hero: { y: KJ.GROUND_Y, jumping: false, jumpT: 0, jumpSpeed: 0, frame: 'run1', shakeX: 0, shakeT: 0 },
      particles: [], done: false,
    };
  }

  function heroWorldX() { return s.worldX + KJ.HERO_SCREEN_X; }
  function gapTo(m) { return m.x - (heroWorldX() + KJ.HERO_W); }
  function nextUnjumped() { return s.monsters.find(m => m.state !== 'jumped'); }

  KJ.currentTarget = function () {
    if (!s) return null;
    const m = s.monsters.find(mm => mm.state === 'alive');
    return m && gapTo(m) < ACTIVE_GAP ? m : null;
  };

  function spawnPoof(m) {
    const cx = m.x - s.worldX + KJ.MONSTER_W / 2;
    const cy = KJ.GROUND_Y - 50;
    const colors = ['#facc15', '#f472b6', '#60a5fa', '#4ade80'];
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 120 + Math.random() * 200;
      s.particles.push({ type: 'spark', x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100,
        life: 0.8, color: colors[i % colors.length], g: 400 });
    }
    s.particles.push({ type: 'coin', x: cx, y: cy - 40, vx: 0, vy: -160, life: 0.9, g: 0 });
    s.particles.push({ type: 'text', text: '+1', color: '#fde047', x: cx + 30, y: cy - 60, vx: 0, vy: -80, life: 1, g: 0 });
  }

  function startJump(m) {
    const h = s.hero;
    h.jumping = true;
    h.jumpT = 0;
    const dist = gapTo(m) + KJ.HERO_W + KJ.MONSTER_W + 30;
    h.jumpSpeed = dist / JUMP_DUR;
    KJ.audio.play('jump');
  }

  function updateHero(dt) {
    const h = s.hero;
    if (h.jumping) {
      h.jumpT += dt;
      const p = Math.min(1, h.jumpT / JUMP_DUR);
      h.y = KJ.GROUND_Y - 4 * JUMP_H * p * (1 - p);
      s.worldX += h.jumpSpeed * dt;
      h.frame = 'jump';
      if (p >= 1) { h.jumping = false; h.y = KJ.GROUND_Y; }
      return;
    }

    const m = nextUnjumped();
    if (m && m.state === 'marked' && gapTo(m) <= JUMP_GAP) {
      m.state = 'jumping-over';
      s.waitTime = 0;
      startJump(m);
      return;
    }

    let move = s.runSpeed * dt;
    if (m && m.state === 'alive') move = Math.max(0, Math.min(move, gapTo(m) - STOP_GAP));
    s.worldX += move;
    if (move > 0.01) {
      h.frame = Math.floor(s.worldX / 28) % 2 ? 'run1' : 'run2';
      s.waitTime = 0;
    } else {
      h.frame = 'run2';
      s.waitTime += dt;
    }

    if (heroWorldX() >= s.goalX - 20 && !s.done) finishLevel();
  }

  function updateMonsters(dt) {
    s.monsters.forEach(m => {
      if (m.shake > 0) m.shake = Math.max(0, m.shake - dt * 2.5);
      if (m.state === 'jumping-over' && heroWorldX() + KJ.HERO_W / 2 >= m.x + KJ.MONSTER_W / 2) {
        m.state = 'jumped';
        m.poofT = 0;
        s.coins++;
        spawnPoof(m);
        KJ.audio.play('coin');
      }
      if (m.poofT >= 0) m.poofT += dt;
    });
  }

  function updateParticles(dt) {
    s.particles = s.particles
      .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + p.g * dt, life: p.life - dt }))
      .filter(p => p.life > 0);
  }

  function update(dt) {
    const h = s.hero;
    if (h.shakeT > 0) {
      h.shakeT -= dt;
      h.shakeX = Math.sin(h.shakeT * 60) * 4;
    } else {
      h.shakeX = 0;
    }
    updateHero(dt);
    updateMonsters(dt);
    updateParticles(dt);
    const target = KJ.currentTarget();
    const upcoming = s.monsters.find(m => m.state === 'alive');
    KJ.keyboard.show(s.allKeys, target ? target.key : null);
    if (!target && upcoming) KJ.keyboard.show(s.allKeys, null);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;
    clock += dt;
    if (running && s) update(dt);
    if (s) KJ.render(ctx, s, clock);
    requestAnimationFrame(frame);
  }

  function finishLevel() {
    s.done = true;
    running = false;
    const stars = s.mistakes <= 1 ? 3 : s.mistakes <= 4 ? 2 : 1;
    const i = s.levelIndex;
    const prevStars = progress.stars[i] || 0;
    progress = {
      unlocked: Math.max(progress.unlocked, Math.min(i + 1, KJ.LEVELS.length - 1)),
      stars: { ...progress.stars, [i]: Math.max(prevStars, stars) },
    };
    KJ.progress.save(progress);
    KJ.audio.play('win');
    KJ.ui.showLevelDone(i, stars, s.mistakes, {
      retry: () => startLevel(i),
      next: () => startLevel(i + 1),
      menu: openMenu,
    });
  }

  function startLevel(index) {
    s = newLevel(index);
    running = true;
    KJ.ui.hide();
    KJ.audio.startMusic();
  }

  function openMenu() {
    running = false;
    if (!s) s = newLevel(progress.unlocked);
    KJ.keyboard.show([], null);
    KJ.ui.showMenu(progress, startLevel);
  }

  function handleKey(key) {
    if (!running || !s) return;
    const target = KJ.currentTarget();
    if (!target) return;
    if (key === target.key) {
      target.state = 'marked';
      KJ.keyboard.flash(key, true);
      KJ.audio.play('ok');
    } else {
      s.mistakes++;
      target.shake = 1;
      s.hero.shakeT = 0.3;
      KJ.keyboard.flash(key, false);
      KJ.audio.play('wrong');
    }
  }

  function onKeyDown(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (KJ.ui.isOpen()) {
      if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
        e.preventDefault();
        const nextBtn = document.getElementById('btnNext');
        if (nextBtn) nextBtn.click(); else startLevel(progress.unlocked);
      }
      return;
    }
    if (e.code === 'Escape') { openMenu(); return; }
    const key = KJ.codeToKey(e.code);
    if (!key) return;
    e.preventDefault();
    if (!e.repeat) handleKey(key);
  }

  function init() {
    setupCanvas();
    KJ.keyboard.init(document.getElementById('keyboard'), handleKey);
    window.addEventListener('keydown', onKeyDown);
    document.getElementById('btnMenu').onclick = openMenu;
    const musicBtn = document.getElementById('btnMusic');
    musicBtn.onclick = () => {
      const on = KJ.audio.toggleMusic();
      musicBtn.textContent = '🎵 Nhạc: ' + (on ? 'Bật' : 'Tắt');
      musicBtn.blur();
    };
    openMenu();
    requestAnimationFrame(frame);
  }

  init();
})(window.KJ);
