// Vòng lặp game: chạy liên tục, mỗi chướng ngại vật kèm một phép tính.
// Trả lời đúng (nói hoặc gõ) thì tăng tốc và nhảy qua; hết giờ thì va vào, mất một tim.
window.MR = window.MR || {};

(function (MR) {
  'use strict';

  const RUN_SPEED = 170;
  const SPRINT_SPEED = 650;
  const JUMP_GAP = 110;
  const JUMP_DUR = 0.8;
  const JUMP_H = 170;
  const HURT_TIME = 2.2;

  const audio = window.GameAudio;
  const progressStore = window.GameProgress.create({ field: 'mathrun', storeKey: 'mathrun-progress-v1', levelCount: MR.LEVELS.length });
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let progress = progressStore.load();
  let s = null;
  let running = false;
  let typed = '';
  let lastTime = 0;
  let clock = 0;
  let readAloud = true;

  function newLevel(index) {
    const level = MR.LEVELS[index];
    return {
      levelIndex: index, level, problems: MR.makeProblems(level), index: 0,
      worldX: 0, hearts: 3, coins: 0, hits: 0, obstacles: [], current: null, particles: [],
      hero: { y: MR.GROUND_Y, pose: 'run', jumping: false, jumpT: 0, jumpSpeed: 0, sprint: false, hurtT: 0 },
    };
  }

  const heroFront = () => s.worldX + MR.HERO_X + MR.HERO_W;
  const problem = () => s.problems[s.index];

  function spawnObstacle() {
    const dist = RUN_SPEED * s.level.time + JUMP_GAP;
    const ob = { x: heroFront() + dist, dist, kind: MR.OBSTACLES[s.index % MR.OBSTACLES.length], state: 'coming', poofT: -1 };
    s.obstacles = s.obstacles.filter(o => o.x - s.worldX > -300).concat([ob]);
    s.current = ob;
    typed = '';
    MR.ui.showProblem(problem());
    MR.voice.reset();
    if (readAloud) MR.voice.speak(problem().spoken);
  }

  function burst(cx, cy, colors) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 140 + Math.random() * 200;
      s.particles.push({ type: 'spark', x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.8, color: colors[i % colors.length], g: 500 });
    }
  }

  function answer(value, final) {
    if (!running || !s.current || s.current.state !== 'coming') return;
    const p = problem();
    if (value === p.answer) {
      s.current.state = 'answered';
      s.hero.sprint = true;
      MR.ui.correct(p);
      audio.play('ok');
      return;
    }
    if (final) { MR.ui.wrong(value); audio.play('wrong'); }
  }

  function nextProblem() {
    s.index += 1;
    s.current = null;
    if (s.hearts <= 0) { gameOver(); return; }
    if (s.index >= s.problems.length) { finish(); return; }
    spawnObstacle();
  }

  function hit(ob) {
    ob.state = 'hit';
    ob.poofT = 0;
    s.hearts -= 1;
    s.hits += 1;
    s.hero.pose = 'hurt';
    s.hero.hurtT = HURT_TIME;
    burst(ob.x - s.worldX + MR.OB_W / 2, MR.GROUND_Y - 50, ['#a8a29e', '#fbbf24', '#f87171']);
    audio.play('hit');
    const p = problem();
    MR.ui.reveal(p);
    if (readAloud) MR.voice.speak(p.spoken.replace('bằng mấy?', 'bằng ' + p.answer));
  }

  function updateHero(dt) {
    const h = s.hero;
    const ob = s.current;
    if (h.hurtT > 0) {
      h.hurtT -= dt;
      if (h.hurtT <= 0) { h.pose = 'run'; nextProblem(); }
      return;
    }
    if (h.jumping) {
      h.jumpT += dt;
      const p = Math.min(1, h.jumpT / JUMP_DUR);
      h.y = MR.GROUND_Y - 4 * JUMP_H * p * (1 - p);
      s.worldX += h.jumpSpeed * dt;
      if (p >= 1) {
        h.jumping = false;
        h.y = MR.GROUND_Y;
        h.pose = 'run';
        nextProblem();
      }
      return;
    }
    if (!ob) return;
    const gap = ob.x - heroFront();
    if (ob.state === 'answered' && gap <= JUMP_GAP) {
      ob.state = 'cleared';
      h.jumping = true;
      h.jumpT = 0;
      h.sprint = false;
      h.pose = 'jump';
      h.jumpSpeed = (gap + MR.HERO_W + MR.OB_W + 40) / JUMP_DUR;
      s.coins += 1;
      const cx = MR.HERO_X + 30;
      s.particles.push({ type: 'coin', x: cx, y: MR.GROUND_Y - 190, vx: 0, vy: -120, life: 1, g: 0 });
      s.particles.push({ type: 'text', text: '+1', color: '#fde047', x: cx + 50, y: MR.GROUND_Y - 200, vx: 0, vy: -70, life: 1, g: 0 });
      audio.play('jump');
      setTimeout(() => audio.play('coin'), 250);
      return;
    }
    const speed = h.sprint ? SPRINT_SPEED : RUN_SPEED;
    s.worldX += Math.min(speed * dt, Math.max(0, gap));
    h.pose = 'run';
    if (ob.state === 'coming') {
      MR.ui.setTimer(gap / ob.dist);
      if (gap <= 0) hit(ob);
    }
  }

  function update(dt) {
    updateHero(dt);
    s.obstacles.forEach(o => { if (o.poofT >= 0) o.poofT += dt; });
    s.particles = s.particles
      .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + p.g * dt, life: p.life - dt }))
      .filter(p => p.life > 0);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;
    clock += dt;
    if (running && s) update(dt);
    if (s) MR.render(ctx, s, clock);
    requestAnimationFrame(frame);
  }

  async function finish() {
    running = false;
    MR.ui.hideCard();
    s.hero.pose = 'idle';
    const stars = s.hits === 0 ? 3 : s.hits === 1 ? 2 : 1;
    const i = s.levelIndex;
    audio.play('win');
    MR.ui.showDone(i, stars, s, { retry: () => startLevel(i), next: () => startLevel(i + 1), menu: openMenu });
    progress = await progressStore.complete(progress, i, stars);
  }

  function gameOver() {
    running = false;
    MR.ui.hideCard();
    audio.play('lose');
    MR.ui.showGameOver(s, { retry: () => startLevel(s.levelIndex), menu: openMenu });
  }

  function startLevel(index) {
    s = newLevel(index);
    MR.ui.hide();
    running = true;
    audio.startMusic();
    spawnObstacle();
  }

  function openMenu() {
    running = false;
    MR.ui.hideCard();
    if (!s) s = newLevel(progress.unlocked);
    s.hero.pose = 'idle';
    MR.ui.showMenu(progress, progressStore.status, startLevel);
  }

  function onKeyDown(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const enter = e.code === 'Enter' || e.code === 'NumpadEnter';
    if (MR.ui.isOpen()) {
      if (enter || e.code === 'Space') {
        e.preventDefault();
        const btn = document.getElementById('btnNext') || document.getElementById('btnRetry');
        if (btn) btn.click(); else startLevel(progress.unlocked);
      }
      return;
    }
    if (e.code === 'Escape') { openMenu(); return; }
    const digit = /^(Digit|Numpad)(\d)$/.exec(e.code);
    if (digit) { e.preventDefault(); pressPad(digit[2]); return; }
    if (e.code === 'Backspace') { e.preventDefault(); pressPad('del'); return; }
    if (enter) { e.preventDefault(); pressPad('ok'); }
  }

  // Bàn phím số trên màn hình và phím số trên bàn phím thật.
  function pressPad(key) {
    if (!running || !s.current || s.current.state !== 'coming') return;
    if (key === 'del') typed = typed.slice(0, -1);
    else if (key === 'ok') { if (typed) { answer(Number(typed), true); typed = ''; } }
    else if (typed.length < 3) typed += key;
    if (s.current.state !== 'coming') return;
    MR.ui.setTyped(typed);
    if (typed && Number(typed) === problem().answer) answer(Number(typed), false);
  }

  function onHeard(alts, isFinal) {
    if (!running || !s.current || s.current.state !== 'coming') return;
    MR.ui.heard(alts[0]);
    const nums = alts.map(MR.lastNumber);
    const match = nums.find(n => n === problem().answer);
    if (match !== undefined) { answer(match, true); return; }
    if (isFinal && nums[0] !== null) answer(nums[0], true);
  }

  // Cho phép giả lập kết quả nghe được khi kiểm thử (máy kiểm thử không có micro).
  MR.simulateHeard = onHeard;

  function setupControls() {
    document.querySelectorAll('#pad [data-k]').forEach(b => {
      b.addEventListener('pointerdown', e => { e.preventDefault(); pressPad(b.dataset.k); });
    });
    const micBtn = document.getElementById('btnMic');
    micBtn.onclick = () => {
      if (MR.voice.isOn()) MR.voice.stop(); else MR.voice.start();
      try { localStorage.setItem('mathrun-voice', MR.voice.isOn() ? 'on' : 'off'); } catch (e) { /* bỏ qua */ }
      micBtn.blur();
    };
    const readBtn = document.getElementById('btnRead');
    readBtn.onclick = () => {
      readAloud = !readAloud;
      readBtn.textContent = '🔊 Đọc đề: ' + (readAloud ? 'Bật' : 'Tắt');
      readBtn.blur();
    };
    if (!MR.voice.canSpeak()) setTimeout(() => { readBtn.hidden = !MR.voice.canSpeak(); }, 1500);
    const musicBtn = document.getElementById('btnMusic');
    musicBtn.onclick = () => { musicBtn.textContent = '🎵 Nhạc: ' + (audio.toggleMusic() ? 'Bật' : 'Tắt'); musicBtn.blur(); };
    document.getElementById('btnMenu').onclick = e => { e.currentTarget.blur(); openMenu(); };
  }

  async function init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = MR.W * dpr;
    canvas.height = MR.H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    MR.voice.init({ onHeard, onState: st => MR.ui.setMic(st) });
    MR.ui.setMic(MR.voice.supported ? 'off' : 'unsupported');
    setupControls();
    const [, , synced] = await Promise.all([MR.loadImages(), document.fonts ? document.fonts.ready : null, progressStore.sync(progress)]);
    progress = synced;
    window.addEventListener('keydown', onKeyDown);
    let voicePref = 'off';
    try { voicePref = localStorage.getItem('mathrun-voice') || 'off'; } catch (e) { /* bỏ qua */ }
    if (voicePref === 'on') MR.voice.start();
    openMenu();
    requestAnimationFrame(frame);
  }

  init();
})(window.MR);
