/* 第 10 关 · 毕业实验室 */
LESSONS.push({
  id: 'finale',
  title: '毕业实验室',
  sub: '微缩版 Buffer A 随便玩，答对三题毕业',
  goal: { text: '让实验室跑过 60 帧，然后答对右侧全部 3 道毕业题。', hint: '实验室默认就在跑；三题分别考「双射」「ping-pong」「时间机器」' },
  notes: [
    {
      near: '.fig', title: '你玩的就是微缩 Buffer A',
      html: '刚才的实验室 = 自反馈 + 双射搬运的全部：换种子、拖「水流力度/密度」，演化立刻走上一条不同的路。',
    },
    {
      near: '.rail', title: '答对的三题 = 三招',
      html: '双射、ping-pong、帧数演化（核心三关）——正好是整门课的骨架。',
    },
    {
      near: '.fig', title: '去玩真的',
      html: '在 Shadertoy 打开原作（shadertoy.com/view/73c3R7）实时运行，按 <b>R</b> 重新播种，观察真实紫金花的完整演化。',
    },
  ],
  build(demoArea, api) {
    const W = 168, H = 108;
    const fig = api.el('div', 'fig');
    demoArea.appendChild(fig);
    const cv = api.TU.canvas(fig, W, H);
    cv.style.width = '440px';
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(W, H);

    let seedIdx = 2, amp = 3, freq = 1, speed = 30, frame = 0, timer = null;
    api.onCleanup(() => clearInterval(timer));

    function makeSeed() {
      const a = new Float32Array(W * H * 3);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          let c;
          if (seedIdx === 0) {
            const s = Math.sin(x / W * Math.PI * 6 * freq);
            c = [120 + 120 * s, 40 + 60 * Math.abs(s), 200 + 55 * s];
          } else if (seedIdx === 1) {
            const inDot = Math.hypot(x % 24 - 12, y % 24 - 12) < 8;
            c = inDot ? [255, 194, 71] : [30, 14, 50];
          } else {
            const fx = x - W / 2, fy = y - H / 2;
            const r = Math.hypot(fx, fy), th = Math.atan2(fy, fx);
            const R = TU.flowerR(th, Math.min(W, H) * 0.47);
            if (r < R) {
              const h1 = TU.hash21(Math.floor(x / 3) * 7.3 + Math.floor(y / 3) * 3.1, 1.7);
              if (h1 < 0.5) c = [170 + 85 * h1, 60 + 60 * h1, 255 - 40 * h1];
              else c = [20 + 25 * (r / R), 8, 40 + 30 * (r / R)];
              if (r < Math.min(W, H) * 0.08) c = [255, 189, 38];
            } else c = [8, 6, 14];
          }
          const o = (y * W + x) * 3;
          a[o] = c[0]; a[o + 1] = c[1]; a[o + 2] = c[2];
        }
      return a;
    }
    let buf = makeSeed();
    function stageName() {
      if (frame < 30) return '种子期';
      if (frame < 120) return '卷流期';
      if (frame < 400) return '混合期';
      return '均匀期';
    }
    function present() {
      const d = img.data;
      for (let i = 0; i < W * H; i++) {
        d[i * 4] = buf[i * 3]; d[i * 4 + 1] = buf[i * 3 + 1]; d[i * 4 + 2] = buf[i * 3 + 2]; d[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
    function tick() {
      const t = frame / 60;
      const out = new Float32Array(W * H * 3);
      for (let y = 0; y < H; y++) {
        const dx = Math.round(amp * Math.sin(y * 0.11 * freq + t * 0.9) + amp * 0.6 * Math.sin(y * 0.037 * freq - t * 0.5));
        for (let x = 0; x < W; x++) {
          const sx = ((x - dx) % W + W) % W;
          const o = (y * W + x) * 3, s = (y * W + sx) * 3;
          out[o] = buf[s]; out[o + 1] = buf[s + 1]; out[o + 2] = buf[s + 2];
        }
      }
      const fin = new Float32Array(W * H * 3);
      for (let x = 0; x < W; x++) {
        const dy = Math.round(amp * 0.8 * Math.sin(x * 0.09 * freq - t * 0.7));
        for (let y = 0; y < H; y++) {
          const sy = ((y - dy) % H + H) % H;
          const o = (y * W + x) * 3, s = (sy * W + x) * 3;
          fin[o] = out[s]; fin[o + 1] = out[s + 1]; fin[o + 2] = out[s + 2];
        }
      }
      buf = fin; frame++;
      present();
      ro.set('帧 = <b>' + frame + '</b>　阶段：<b>' + stageName() + '</b>');
    }
    function restart() { clearInterval(timer); timer = setInterval(tick, 1000 / speed); }

    const ctr = api.el('div', 'controls');
    demoArea.appendChild(ctr);
    const ro = api.TU.readout(ctr);
    const bar = api.el('div', 'btnrow');
    ctr.appendChild(bar);
    const seedBtns = [['条纹', 0], ['圆点', 1], ['紫金花', 2]];
    seedBtns.forEach(s => {
      api.TU.button(bar, s[0], 'small' + (s[1] === seedIdx ? ' on' : ''), function () {
        seedIdx = s[1];
        bar.querySelectorAll('.btn').forEach(x => x.classList.remove('on'));
        this.classList.add('on');
        buf = makeSeed(); frame = 0; present(); tick();
      });
    });
    api.TU.button(bar, '重新播种', 'primary', () => { buf = makeSeed(); frame = 0; present(); tick(); });
    TU.slider(ctr, { label: '水流力度 amp', min: 1, max: 8, step: 0.5, value: amp, onInput: v => { amp = v; } });
    TU.slider(ctr, { label: '水流密度 freq', min: 0.5, max: 3, step: 0.25, value: freq, onInput: v => { freq = v; } });
    TU.slider(ctr, { label: '演化速度', min: 5, max: 60, step: 5, value: speed, onInput: v => { speed = v; restart(); } });

    present(); tick(); restart();

    api.quiz([
      {
        q: '1. round + mod 搬运为什么永不丢内容？',
        opts: ['画面颜色暗看不出来', '整数平移+环绕是一一对应的双射', '每帧都重画原图'],
        correct: 1,
        exp: '整数平移不重叠不空缺，mod 把出界的绕回来——Bijection（双射）。',
      },
      {
        q: '2. 「读自己上一帧」靠什么实现？',
        opts: ['直接一边读一边写', '存硬盘再读回来', 'ping-pong 双缓冲交替读写'],
        correct: 2,
        exp: '读 A 写 B、帧末交换，像乒乓球轮流。',
      },
      {
        q: '3. 演化由什么驱动？',
        opts: ['墙上的时钟', '帧数 iFrame：每帧一次确定性搬运', '鼠标位置'],
        correct: 1,
        exp: 'shader 时间 = iFrame/60，一切由帧数决定。',
      },
    ], () => {
      api.win('毕业快乐！你已经能看懂这份着色器了。');
      detailSlotBadge(api);
    });

    function detailSlotBadge(apiRef) {
      api.detailSlot.appendChild(
        api.el('div', 'badge-line',
          '<div class="medal">花</div><div class="nm">紫金花搬运士</div>' +
          '<div class="ds">像素并行 · UV · 多频波 · 双射 · 反馈 · ping-pong · 演化</div>' +
          '<div class="ds">去玩真正的紫金花：<a href="https://www.shadertoy.com/view/73c3R7" target="_blank">Shadertoy 原作 73c3R7</a>（页面下方可看全部源码）</div>')
      );
    }
  },
  theory: {
    story:
      '<p>三招合体：<b>像素并行出题 → 双射搬运换座位 → ping-pong 反馈接力</b>。这就是 Subpixel Bijection Flow 的全部骨架。</p>' +
      '<p>想继续深入：在 Shadertoy 页面点开原作源码（bufferA 的英文注释非常棒）；本仓库的 <b>DESIGN.md</b> 记录了这套课程背后的设计拆解。</p>',
  },
  takeaway: '像素并行出题 → 双射搬运换座位 → ping-pong 反馈接力。骨架就是这三行。',
});
