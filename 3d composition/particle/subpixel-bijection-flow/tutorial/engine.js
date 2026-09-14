/* 交互教程引擎 v2.1 — 挑战先行 / 通关后讲解动画 / 单屏
 *
 * 课程契约（lessons/*.js）：
 * {
 *   id, title, sub,                       // 一行副标题
 *   goal: { text, hint },                 // 挑战（进关即可见，直接开玩）
 *   build(demoArea, api),                 // 挂载交互 demo；达成时调 api.win()
 *   notes: [{ near, title, html, after, pos }], // 【通关后】逐张播出的讲解动画，
 *                                               // 锚定在相关交互元素旁（临近原则）
 *   theory: { story, code: {src, html} }, // 右栏「通关讲解」完整文字版
 *   takeaway,                             // 页脚一句话（通关后可见）
 * }
 * notes 字段：
 *   near  — stage-wrap 内的 CSS 选择器（卡片出现在该元素旁）
 *   after — 自动继续的毫秒数（默认 9000；点「继续」立即推进）
 *   pos   — 卡片相对锚点的位置：bottom(默认) / top / right / left
 * 时序：进关零讲解 → 玩成挑战 → 印章落下后讲解卡片逐张播出；
 *       已通关的关卡再进入时，讲解收为右栏 pin，可点「重播」重新看动画。
 */
(function () {
  'use strict';
  window.LESSONS = window.LESSONS || [];

  // ---------- 公共工具 ----------
  const TU = {
    el(tag, cls, html) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (html != null) e.innerHTML = html;
      return e;
    },
    canvas(parent, w, h) {
      const c = document.createElement('canvas');
      c.className = 'demo';
      c.width = w; c.height = h;
      parent.appendChild(c);
      return c;
    },
    slider(parent, opt) {
      const wrap = TU.el('div', 'ctl');
      const lab = TU.el('label');
      const val = TU.el('b', null, (opt.fmt || (v => v))(opt.value));
      lab.appendChild(TU.el('span', null, opt.label));
      lab.appendChild(val);
      const inp = document.createElement('input');
      inp.type = 'range';
      inp.min = opt.min; inp.max = opt.max; inp.step = opt.step || 1;
      inp.value = opt.value;
      inp.addEventListener('input', () => {
        const v = Number(inp.value);
        val.textContent = (opt.fmt || (x => x))(v);
        opt.onInput(v);
      });
      wrap.appendChild(lab); wrap.appendChild(inp);
      parent.appendChild(wrap);
      return { input: inp, set(v) { inp.value = v; val.textContent = (opt.fmt || (x => x))(v); } };
    },
    button(parent, text, cls, onClick) {
      const b = TU.el('button', 'btn' + (cls ? ' ' + cls : ''), text);
      b.addEventListener('click', onClick);
      parent.appendChild(b);
      return b;
    },
    readout(parent) {
      const r = TU.el('div', 'readout');
      parent.appendChild(r);
      // 返回增强的元素：ro.set(html) 与 ro.innerHTML 两种写法都可用
      r.set = html => { r.innerHTML = html; };
      return r;
    },
    hash21(x, y) {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return s - Math.floor(s);
    },
    flowerR(th, size) {
      th += Math.PI * 0.5;
      const s = Math.pow(Math.abs(Math.cos(2.5 * th)), 1.6);
      return size * (0.45 + 0.55 * s);
    },
    drawFlower(ctx, w, h, seedTick) {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      const cx = w / 2, cy = h / 2;
      const size = Math.min(w, h) * 0.46;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const fx = x - cx, fy = y - cy;
          const r = Math.hypot(fx, fy);
          const th = Math.atan2(fy, fx);
          const R = TU.flowerR(th, size);
          const o = (y * w + x) * 4;
          let cr = 12, cg = 10, cb = 8;
          if (r < R) {
            const t = r / R;
            const vein = Math.pow(Math.abs(Math.cos(2.5 * (th + Math.PI * 0.5))), 0.8);
            cr = 18 + 12 * t + 20 * vein; cg = 6 + 4 * t; cb = 26 + 15 * t;
            const cell = Math.floor(x / 3) + Math.floor(y / 3) * 97 + (seedTick || 0) * 131;
            const h1 = TU.hash21(cell, 1.7), h2 = TU.hash21(cell + 19.7, 3.1);
            if (h1 < 0.55) {
              const seg = (2 * Math.PI) / 5;
              let dm = Math.abs(((th + Math.PI * 0.5) % seg + seg) % seg - seg * 0.5);
              dm = Math.min(dm, seg * 0.5 - dm);
              const onVein = dm < 0.13 && t < 0.92;
              const isGold = h2 < (onVein ? 0.55 : 0.13);
              if (isGold) { cr = 255 * (0.65 + 0.7 * h1); cg = 184 * (0.65 + 0.7 * h1); cb = 46; }
              else { cr = 199 * (0.42 + 0.58 * h2) * (0.7 + 0.6 * h1); cg = 97 * (0.42 + 0.58 * h2) * (0.7 + 0.6 * h1); cb = 255 * (0.42 + 0.58 * h2) * (0.7 + 0.6 * h1); }
            }
            const coreR = size * 0.16;
            if (r < coreR) { const k = 1 - (r / coreR) * 0.35; cr = 255 * k; cg = 189 * k; cb = 38 * k; }
          }
          d[o] = cr; d[o + 1] = cg; d[o + 2] = cb; d[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    purpleGold(v) {
      v = Math.max(0, Math.min(1, v));
      return [20 + 235 * Math.pow(v, 0.75), 8 + 176 * Math.pow(v, 1.4), 40 + 215 * Math.pow(v, 0.6)];
    },
    // 测验组件（挂到给定容器，一般传 api.quizSlot）
    quiz(container, questions, onAllCorrect) {
      let correctN = 0;
      questions.forEach((Q) => {
        const box = TU.el('div', 'quiz-qz');
        box.appendChild(TU.el('div', 'quiz-q', Q.q));
        Q.opts.forEach((txt, oi) => {
          const o = TU.el('div', 'quiz-opt', txt);
          o.addEventListener('click', () => {
            if (box.classList.contains('revealed')) return;
            if (oi === Q.correct) {
              o.classList.add('correct');
              box.classList.add('revealed');
              correctN++;
              if (correctN === questions.length) setTimeout(onAllCorrect, 250);
            } else {
              o.classList.add('wrong');
              toast('不对哦，再想一想');
              setTimeout(() => o.classList.remove('wrong'), 800);
            }
          });
          box.appendChild(o);
        });
        box.appendChild(TU.el('div', 'quiz-exp', Q.exp));
        container.appendChild(box);
      });
    },
  };
  window.TU = TU;

  // ---------- 状态 ----------
  const KEY = 'sbpf-tutorial-v2';
  let state = { completed: {}, teacher: false };
  try { const s = localStorage.getItem(KEY); if (s) state = Object.assign(state, JSON.parse(s)); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function isUnlocked(i) { return i === 0 || state.completed[LESSONS[i - 1].id] || state.teacher; }

  // ---------- 特效 ----------
  let toastTimer = null;
  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = TU.el('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
  }
  function ding() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ac = new AC();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(520, ac.currentTime);
      o.frequency.setValueAtTime(700, ac.currentTime + 0.08);
      g.gain.setValueAtTime(0.05, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + 0.37);
    } catch (e) {}
  }
  function inkBurst(x, y) {
    let c = document.getElementById('confetti');
    if (!c) { c = TU.el('canvas'); c.id = 'confetti'; document.body.appendChild(c); }
    const ctx = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    const colors = ['#211d17', '#bf4d28', '#a8842c', '#6f665a'];
    const parts = [];
    for (let i = 0; i < 42; i++) {
      parts.push({
        x, y, vx: (Math.random() - 0.5) * 9, vy: -3 - Math.random() * 5,
        s: 2 + Math.random() * 3.5, rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.25,
        col: colors[(Math.random() * colors.length) | 0],
      });
    }
    let t = 0;
    (function frame() {
      t++;
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.26; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      }
      if (t < 55) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, c.width, c.height);
    })();
  }

  // ---------- 渲染 ----------
  let current = -1;
  let cleanups = [];
  function runCleanups() { for (const fn of cleanups) { try { fn(); } catch (e) {} } cleanups = []; }

  function renderToc() {
    const list = document.getElementById('toc');
    list.innerHTML = '';
    LESSONS.forEach((L, i) => {
      const done = !!state.completed[L.id];
      const unlocked = isUnlocked(i);
      const item = TU.el('div', 'toc-item' + (i === current ? ' active' : '') + (done ? ' done' : '') + (unlocked ? '' : ' locked'));
      item.appendChild(TU.el('span', 'no', String(i + 1)));
      item.appendChild(TU.el('span', 'nm', L.title));
      item.appendChild(TU.el('span', 'dot'));
      item.addEventListener('click', () => {
        if (!unlocked) { toast('先完成上一关的挑战'); return; }
        goto(i);
      });
      list.appendChild(item);
    });
    const doneN = LESSONS.filter(L => state.completed[L.id]).length;
    document.getElementById('side-progress').textContent = '进度 ' + doneN + ' / ' + LESSONS.length;
  }

  function goto(i) {
    runCleanups();
    current = i;
    const L = LESSONS[i];
    const main = document.getElementById('content');
    main.innerHTML = '';
    window.scrollTo(0, 0);

    // 头部
    const head = TU.el('div', 'lesson-head');
    head.appendChild(TU.el('span', 'no', '第 ' + (i + 1) + ' 关'));
    head.appendChild(TU.el('h1', null, L.title));
    if (L.sub) head.appendChild(TU.el('span', 'sub', L.sub));
    main.appendChild(head);

    // 挑战条（先玩）
    const goal = TU.el('div', 'goalbar');
    goal.appendChild(TU.el('span', 'tag', '挑战'));
    const goalTxt = TU.el('span', null, L.goal.text + '　');
    goal.appendChild(goalTxt);
    if (L.goal.hint) goal.appendChild(TU.el('span', 'goal-hint', '（' + L.goal.hint + '）'));
    goal.appendChild(TU.el('span', 'status', '进行中'));
    main.appendChild(goal);

    // 舞台：demo 区 + 右栏
    const wrap = TU.el('div', 'stage-wrap');
    const demoArea = TU.el('div', 'demo-area');
    wrap.appendChild(demoArea);
    const rail = TU.el('div', 'rail');
    wrap.appendChild(rail);
    main.appendChild(wrap);

    // 页脚
    const foot = TU.el('div', 'lesson-foot');
    const tk = TU.el('div', 'takeaway hidden-untl-win');
    foot.appendChild(tk);
    const nav = TU.el('div', 'nav');
    foot.appendChild(nav);
    main.appendChild(foot);

    // 导航按钮
    if (i > 0) {
      TU.button(nav, '← 上一关', '', () => goto(i - 1));
    }
    const nextBtn = TU.el('button', 'btn');
    nextBtn.textContent = '下一关 →';
    nextBtn.disabled = true;
    nextBtn.addEventListener('click', () => { if (!nextBtn.disabled) goto(i + 1); });
    nav.appendChild(nextBtn);

    main.appendChild(foot);

    // ---------- api ----------
    let won = false;
    let noteState = null; // {list, idx, openCard, timer, pinned}
    const pinSlot = TU.el('div');
    const quizSlot = TU.el('div');
    const detailSlot = TU.el('div', 'details');
    const replayBtn = TU.el('button', 'btn small', '重播讲解 ▸');
    replayBtn.style.display = 'none';
    replayBtn.addEventListener('click', () => startNotes(L.notes || []));

    const api = {
      TU, el: TU.el, toast,
      win(msg) {
        if (won) return;
        won = true;
        state.completed[L.id] = true;
        save();
        goal.classList.add('won');
        goal.querySelector('.status').textContent = '完成 ✓';
        goal.appendChild(TU.el('span', 'stamp', '完成'));
        if (msg) toast(msg);
        // 页脚小结
        tk.classList.remove('hidden-untl-win');
        tk.innerHTML = '<b>记住了</b>　' + L.takeaway;
        // 下一关
        if (i < LESSONS.length - 1) nextBtn.disabled = false;
        else nextBtn.textContent = '已通关';
        inkBurst(innerWidth * 0.62, innerHeight * 0.3);
        ding();
        renderToc();
        // 挑战成功 → 播出讲解动画（等印章落定）
        buildDetails();
        if ((L.notes || []).length) {
          replayBtn.style.display = 'inline-block';
          setTimeout(() => startNotes(L.notes), 750);
        }
      },
      markWonSilent() {
        if (won) return;
        won = true;
        goal.classList.add('won');
        goal.querySelector('.status').textContent = '完成 ✓（之前已完成）';
        tk.classList.remove('hidden-untl-win');
        tk.innerHTML = '<b>记住了</b>　' + L.takeaway;
        if (i < LESSONS.length - 1) nextBtn.disabled = false;
        else nextBtn.textContent = '已通关';
        buildDetails();
        promoteAllNotes();
      },
      row(area) {
        const r = TU.el('div', 'demo-grid');
        (area || demoArea).appendChild(r);
        return r;
      },
      onCleanup(fn) { cleanups.push(fn); },
      // 右栏三个槽位
      railPins: pinSlot.parentElement, rail: rail,
      quizSlot, detailSlot,
      notes(list) { startNotes(list || L.notes || []); },
    };

    function placeCard(card, anchor, pos) {
      const wrapRect = wrap.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const top0 = a.top - wrapRect.top, left0 = a.left - wrapRect.left;
      let x, y;
      if (pos === 'top') { x = left0 + a.width / 2 - 126; y = top0 - card.offsetHeight - 12; }
      else if (pos === 'right') { x = left0 + a.width + 14; y = top0; }
      else if (pos === 'left') { x = left0 - 252 - 14; y = top0; }
      else { x = left0 + a.width / 2 - 126; y = top0 + a.height + 12; }
      x = Math.max(6, Math.min(x, wrap.clientWidth - 258));
      y = Math.max(6, Math.min(y, wrap.clientHeight - card.offsetHeight - 6));
      card.style.left = x + 'px';
      card.style.top = y + 'px';
    }

    function showNote(idx) {
      const list = noteState.list;
      if (idx >= list.length) { noteState.idx = idx; return; }
      noteState.idx = idx;
      const N = list[idx];
      const anchor = N.near ? wrap.querySelector(N.near) : demoArea;
      const card = TU.el('div', 'note-card');
      card.appendChild(TU.el('div', 'nh',
        '<span class="nno">' + (idx + 1) + '</span><span class="ntitle">' + N.title + '</span>'));
      card.appendChild(TU.el('div', 'nbody', N.html));
      const nfoot = TU.el('div', 'nfoot');
      nfoot.appendChild(TU.el('span', 'nauto', Math.round((N.after || 9000) / 1000) + 's 后自动继续'));
      const cont = TU.el('button', 'btn small', idx === list.length - 1 ? '知道了' : '继续 ▸');
      nfoot.appendChild(cont);
      card.appendChild(nfoot);
      wrap.appendChild(card);
      placeCard(card, anchor || demoArea, N.pos || 'bottom');
      cont.addEventListener('click', () => advance());
      // 悬停时暂停自动推进
      let timer = setTimeout(advance, N.after || 9000);
      card.addEventListener('mouseenter', () => clearTimeout(timer));
      card.addEventListener('mouseleave', () => { timer = setTimeout(advance, 3500); });
      noteState.openCard = card;
      noteState.timer = timer;
      // 之前卡片收成 pin
      if (idx > 0) collapseToPin(idx - 1);
    }
    function advance() {
      if (!noteState) return;
      clearTimeout(noteState.timer);
      if (noteState.idx < noteState.list.length) collapseToPin(noteState.idx);
      const card = noteState.openCard;
      if (card) { card.remove(); noteState.openCard = null; }
      showNote(noteState.idx + 1);
    }
    function collapseToPin(idx) {
      const N = noteState.list[idx];
      if (!N || noteState.pinned.has(idx)) return;
      noteState.pinned.add(idx);
      const pin = TU.el('div', 'pin', '<span class="pno">' + (idx + 1) + '</span><span>' + N.title + '</span>');
      pin.addEventListener('click', () => {
        const open = pin.classList.contains('open');
        closePins();
        if (!open) {
          pin.classList.add('open');
          const anchor = N.near ? wrap.querySelector(N.near) : demoArea;
          const card = TU.el('div', 'note-card');
          card.appendChild(TU.el('div', 'nh', '<span class="nno">' + (idx + 1) + '</span><span class="ntitle">' + N.title + '</span>'));
          card.appendChild(TU.el('div', 'nbody', N.html));
          const x = TU.el('span', 'close-x', '✕');
          x.addEventListener('click', e => { e.stopPropagation(); closePins(); });
          card.appendChild(x);
          wrap.appendChild(card);
          placeCard(card, anchor || demoArea, N.pos || 'bottom');
          noteState.openCard = card;
          pin._card = card;
        }
      });
      pin._idx = idx;
      pinSlot.appendChild(pin);
    }
    function closePins() {
      [...rail.querySelectorAll('.pin.open')].forEach(p => p.classList.remove('open'));
      if (noteState && noteState.openCard) { noteState.openCard.remove(); noteState.openCard = null; }
      wrap.querySelectorAll('.note-card').forEach(c => c.remove());
    }
    function makeNoteState(list) {
      return { list, idx: -1, openCard: null, timer: null, pinned: new Set() };
    }
    wrap.addEventListener('click', e => {
      if (!e.target.closest('.note-card') && !e.target.closest('.pin')) closePins();
    });

    function startNotes(list) {
      if (!list || !list.length) return;
      closePins();
      pinSlot.innerHTML = '';
      noteState = makeNoteState(list);
      showNote(0);
    }
    // 已通关的关：不自动播放，全部收为 pin 供点看
    function promoteAllNotes() {
      const list = L.notes || [];
      if (!list.length) return;
      if (!noteState) noteState = makeNoteState(list);
      for (let k = 0; k < list.length; k++) collapseToPin(k);
      replayBtn.style.display = 'inline-block';
    }

    function buildDetails() {
      if (!L.theory) return;
      detailSlot.innerHTML = '';
      detailSlot.appendChild(TU.el('h4', null, '通关讲解'));
      detailSlot.innerHTML = L.theory.story || '';
      if (L.theory.code) {
        detailSlot.appendChild(TU.el('div', 'codebox', L.theory.code.html));
        if (L.theory.code.src) detailSlot.appendChild(TU.el('div', 'code-src', '—— ' + L.theory.code.src));
      }
    }

    // 右栏骨架
    const h4notes = TU.el('h4', null, '讲解回放');
    h4notes.style.display = 'flex';
    h4notes.style.alignItems = 'center';
    h4notes.style.justifyContent = 'space-between';
    h4notes.appendChild(replayBtn);
    rail.appendChild(h4notes);
    rail.appendChild(pinSlot);
    rail.appendChild(TU.el('h4', null, '问题'));
    rail.appendChild(quizSlot);
    rail.appendChild(TU.el('h4', null, '通关讲解'));
    rail.appendChild(detailSlot);
    api.quiz = (qs, cb) => TU.quiz(quizSlot, qs, cb);

    // 挂载 demo
    try {
      L.build(demoArea, api);
    } catch (e) {
      demoArea.appendChild(TU.el('div', 'readout', '课程脚本出错: ' + e.message));
      console.error(e);
    }
    // 播放注释卡片（延迟一点，等 demo 布局稳定）
    // 进关零讲解：notes 只在挑战成功后（win/markWonSilent）播出或收为 pin
    if (state.completed[L.id]) api.markWonSilent();

    renderToc();
  }

  // ---------- 启动 ----------
  function boot() {
    document.getElementById('reset-progress').addEventListener('click', () => {
      if (confirm('确定清空全部学习进度吗？')) {
        state.completed = {}; state.teacher = false;
        save(); goto(0);
        toast('进度已清空');
      }
    });
    document.getElementById('teacher-mode').addEventListener('click', () => {
      state.teacher = !state.teacher;
      save();
      toast(state.teacher ? '教师模式：全部解锁' : '教师模式已关闭');
      renderToc();
    });
    goto(0);
  }

  window.Engine = { boot, goto, toast };
})();
