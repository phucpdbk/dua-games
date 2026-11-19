// Vòng lặp game: nhân vật tự chạy, dừng trước quái vật, gõ đúng phím thì nhảy qua.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  KJ.HERO_SCREEN_X = 170;
  const STOP_GAP = 70;       // khoảng cách dừng chờ trước quái vật
  const JUMP_GAP = 100;      // khoảng cách bắt đầu nhảy nếu đã gõ đúng
  const ACTIVE_GAP = 560;    // quái vật trong tầm này mới nhận phím
  const JUMP_DUR = 0.85;
  const JUMP_H = 170;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let progress = KJ.progress.load();
  let kb = null;
  let s = null;              // trạng thái màn hiện tại
  let running = false;
  let lastTime = 0;
  let clock = 0;

  function setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = KJ.W * dpr;
    canvas.height = KJ.H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingQuality = 'high';
  }

  function newLevel(index) {
    const level = KJ.LEVELS[index];
    const keys = KJ.buildKeySequence(level);
    let x = 900;
    const kinds = KJ.MONSTER_KINDS;
    const monsters = keys.map((key, i) => {
      const m = { x, key, state: 'alive', poofT: -1, shake: 0, kind: kinds[(index + i) % kinds.length], phase: Math.random() * 6 };
      x += 470 + Math.random() * 180;
      return m;
    });
    return {
      levelIndex: index, level, monsters,
      allKeys: level.newKeys.concat(level.reviewKeys),
      goalX: x + 200, worldX: 0, coins: 0, mistakes: 0,
      runSpeed: 220 + index * 6,
      hero: { y: KJ.GROUND_Y, jumping: false, jumpT: 0, jumpSpeed: 0, pose: 'idle', shakeX: 0, shakeT: 0 },
      particles: [], done: false,
    };
  }

  function heroWorldX() { return s.worldX + KJ.HERO_SCREEN_X; }
  function gapTo(m) { return m.x - (heroWorldX() + KJ.HERO_W); }
  function nextUnjumped() { return s.monsters.find(m => m.state !== 'jumped'); }

  KJ.currentTarget = function () {
    if (!s || !running) return null;
    const m = s.monsters.find(mm => mm.state === 'alive');
    return m && gapTo(m) < ACTIVE_GAP ? m : null;
  };

  function spawnPoof(m) {
    const cx = m.x - s.worldX + KJ.MONSTER_W / 2;
    const cy = KJ.GROUND_Y - 55;
    const colors = ['#facc15', '#f472b6', '#60a5fa', '#4ade80', '#fb923c'];
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 140 + Math.random() * 220;
      s.particles.push({ type: 'spark', x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120,
        life: 0.8, color: colors[i % colors.length], g: 500 });
    }
    s.particles.push({ type: 'coin', x: cx, y: cy - 40, vx: 0, vy: -170, life: 0.9, g: 0 });
    s.particles.push({ type: 'text', text: '+1', color: '#fde047', x: cx + 40, y: cy - 70, vx: 0, vy: -80, life: 1, g: 0 });
  }

  function startJump(m) {
    const h = s.hero;
    h.jumping = true;
    h.jumpT = 0;
    h.jumpSpeed = (gapTo(m) + KJ.HERO_W + KJ.MONSTER_W + 30) / JUMP_DUR;
    KJ.audio.play('jump');
  }

  function updateHero(dt) {
    const h = s.hero;
    if (h.jumping) {
      h.jumpT += dt;
      const p = Math.min(1, h.jumpT / JUMP_DUR);
      h.y = KJ.GROUND_Y - 4 * JUMP_H * p * (1 - p);
      s.worldX += h.jumpSpeed * dt;
      h.pose = 'jump';
      if (p >= 1) { h.jumping = false; h.y = KJ.GROUND_Y; }
      return;
    }

    const m = nextUnjumped();
    if (m && m.state === 'marked' && gapTo(m) <= JUMP_GAP) {
      m.state = 'jumping-over';
      startJump(m);
      return;
    }

    let move = s.runSpeed * dt;
    if (m && m.state === 'alive') move = Math.max(0, Math.min(move, gapTo(m) - STOP_GAP));
    s.worldX += move;
    h.pose = move > 0.01 ? 'run' : 'idle';
    if (heroWorldX() >= s.goalX && !s.done) finishLevel();
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

  function update(dt) {
    const h = s.hero;
    h.shakeT = Math.max(0, h.shakeT - dt);
    h.shakeX = h.shakeT > 0 ? Math.sin(h.shakeT * 60) * 5 : 0;
    updateHero(dt);
    updateMonsters(dt);
    s.particles = s.particles
      .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + p.g * dt, life: p.life - dt }))
      .filter(p => p.life > 0);
    const target = KJ.currentTarget();
    kb.show(s.allKeys, target ? [target.key] : [], target ? target.key : null);
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
    s.hero.pose = 'idle';
    const stars = s.mistakes <= 1 ? 3 : s.mistakes <= 4 ? 2 : 1;
    const i = s.levelIndex;
    progress = {
      unlocked: Math.max(progress.unlocked, Math.min(i + 1, KJ.LEVELS.length - 1)),
      stars: { ...progress.stars, [i]: Math.max(progress.stars[i] || 0, stars) },
    };
    KJ.progress.save(progress);
    KJ.audio.play('win');
    kb.show([], [], null);
    KJ.ui.showLevelDone(i, stars, s.mistakes, {
      retry: () => startLevel(i),
      next: () => startLevel(i + 1),
      menu: openMenu,
    });
  }

  function startLevel(index) {
    s = newLevel(index);
    running = false;
    KJ.audio.startMusic();
    KJ.guide.open(s.level, kb, () => {
      KJ.ui.hide();
      running = true;
    });
  }

  function openMenu() {
    running = false;
    if (!s) s = newLevel(progress.unlocked);
    kb.show([], [], null);
    KJ.ui.showMenu(progress, startLevel);
  }

  function handleKey(key) {
    if (KJ.guide.isActive()) { KJ.guide.handle(key); return; }
    if (!running || !s) return;
    const target = KJ.currentTarget();
    if (!target) return;
    if (key === target.key) {
      target.state = 'marked';
      kb.flash(key, true);
      KJ.audio.play('ok');
      return;
    }
    s.mistakes++;
    target.shake = 1;
    s.hero.shakeT = 0.3;
    kb.flash(key, false);
    KJ.audio.play('wrong');
  }

  function onKeyDown(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const isEnter = e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space';
    if (KJ.guide.isActive()) {
      const key = isEnter ? 'enter' : KJ.codeToKey(e.code);
      if (key && !e.repeat) { e.preventDefault(); KJ.guide.handle(key); }
      return;
    }
    if (KJ.ui.isOpen()) {
      if (isEnter) {
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

  async function init() {
    setupCanvas();
    kb = KJ.createKeyboard(document.getElementById('keyboard'), handleKey);
    document.getElementById('btnMenu').onclick = e => { e.currentTarget.blur(); openMenu(); };
    const musicBtn = document.getElementById('btnMusic');
    musicBtn.onclick = () => {
      const on = KJ.audio.toggleMusic();
      musicBtn.textContent = '🎵 Nhạc: ' + (on ? 'Bật' : 'Tắt');
      musicBtn.blur();
    };
    const [, , synced] = await Promise.all([
      KJ.loadImages(), document.fonts ? document.fonts.ready : null, KJ.progress.sync(progress),
    ]);
    progress = synced;
    window.addEventListener('keydown', onKeyDown); // chỉ nhận phím khi ảnh đã sẵn sàng
    openMenu();
    requestAnimationFrame(frame);
  }

  init();
})(window.KJ);
