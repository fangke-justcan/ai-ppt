/* 第 4 关 · 复印自己：反馈循环 */
LESSONS.push({
  id: 'feedback',
  title: '复印自己：反馈循环',
  sub: 'Buffer A 的秘密：每帧拿「上一帧的自己」当底稿',
  goal: { text: '打开反馈，让帧数 iFrame 跑过 120。', hint: '嫌慢可以把速度拉满 60 帧/秒' },
  notes: [
    {
      near: '.fig', title: '反馈关着时为什么静止',
      html: '每一帧都<b>直接重画种子</b>——画一万帧也一模一样。普通的画就是这样。',
    },
    {
      near: '.feed-row', title: '打开反馈后发生了什么',
      html: '每帧的底稿换成<b>上一帧的画面</b>，再按双射规则搬一次座位（上一关的双射）。就像复印机复印自己昨天的复印件。',
    },
    {
      near: '.readout', title: '帧数就是时间',
      html: '演化按<b>帧</b>推进：30 帧内认得出种子，一百多帧搅出流纹，几百帧后变成细颗粒。下一关的时间机器可以逐帧回看全程。',
    },
  ],
  build(demoArea, api) {
    const W = 168, H = 108;
    const fig = api.el('div', 'fig');
    demoArea.appendChild(fig);
    const cv = api.TU.canvas(fig, W, H);
    cv.style.width = '460px';
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(W, H);

    let seedIdx = 0, on = false, frame = 0, amp = 4, speed = 25, timer = null;
    const seeds = ['彩虹条纹', '圆点阵', '紫金花'];
    api.onCleanup(() => clearInterval(timer));

    function makeSeed() {
      const a = new Float32Array(W * H * 3);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          let c;
          if (seedIdx === 0) {
            const hue = x / W;
            c = [30 + 225 * Math.abs(Math.sin(hue * 9)), 40 + 180 * Math.abs(Math.cos(hue * 6)), 60 + 195 * Math.abs(Math.sin(hue * 12))];
          } else if (seedIdx === 1) {
            const gx = x % 16, gy = y % 16;
            const inDot = Math.hypot(gx - 8, gy - 8) < 6;
            const hue = (x / W * 4) % 1;
            c = inDot ? [40 + 215 * hue, 220 - 80 * hue, 255 - 160 * hue] : [8, 6, 14];
          } else {
            const fx = x - W / 2, fy = y - H / 2;
            const r = Math.hypot(fx, fy), th = Math.atan2(fy, fx);
            const R = TU.flowerR(th, Math.min(W, H) * 0.47);
            if (r < R) {
              const cell = Math.floor(x / 3) * 7.3 + Math.floor(y / 3) * 3.1;
              const h1 = TU.hash21(cell, 1.7);
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
    function present() {
      const d = img.data;
      for (let i = 0; i < W * H; i++) {
        d[i * 4] = buf[i * 3]; d[i * 4 + 1] = buf[i * 3 + 1]; d[i * 4 + 2] = buf[i * 3 + 2]; d[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
    function warp() {
      const t = frame / 60;
      const next = new Float32Array(W * H * 3);
      for (let y = 0; y < H; y++) {
        const dx = Math.round(amp * Math.sin(y * 0.11 + t * 0.9) + amp * 0.6 * Math.sin(y * 0.037 - t * 0.5));
        for (let x = 0; x < W; x++) {
          const sx = ((x - dx) % W + W) % W;
          const o = (y * W + x) * 3, s = (y * W + sx) * 3;
          next[o] = buf[s]; next[o + 1] = buf[s + 1]; next[o + 2] = buf[s + 2];
        }
      }
      const out = new Float32Array(W * H * 3);
      for (let x = 0; x < W; x++) {
        const dy = Math.round(amp * 0.8 * Math.sin(x * 0.09 - t * 0.7));
        for (let y = 0; y < H; y++) {
          const sy = ((y - dy) % H + H) % H;
          const o = (y * W + x) * 3, s = (sy * W + x) * 3;
          out[o] = next[s]; out[o + 1] = next[s + 1]; out[o + 2] = next[s + 2];
        }
      }
      buf = out;
    }
    function stageName() {
      if (frame < 30) return '种子期（还认得出原图）';
      if (frame < 120) return '卷流期（被水流搅动）';
      if (frame < 400) return '混合期（大理石纹）';
      return '均匀期（细颗粒）';
    }
    function tick() {
      if (on) { warp(); frame++; }
      else buf = makeSeed();
      present();
      ro.innerHTML = '反馈：<b class="' + (on ? 'ok' : 'bad') + '">' + (on ? '开' : '关') + '</b>　帧数 = <b>' + frame + '</b>' +
        (on ? '<br>阶段：' + stageName() : '<br>（每帧都直接重画种子，永远静止）');
      if (on && frame >= 120) api.win('画面被「自己复印自己」搬出了新图案。Buffer A 每帧都在做这件事。');
    }
    function restart() { clearInterval(timer); timer = setInterval(tick, 1000 / speed); }

    const ctr = api.el('div', 'controls');
    demoArea.appendChild(ctr);
    const ro = api.TU.readout(ctr);
    const bar = api.el('div', 'btnrow feed-row');
    ctr.appendChild(bar);
    const bOn = api.TU.button(bar, '反馈：关', 'primary', () => {
      on = !on;
      bOn.textContent = '反馈：' + (on ? '开' : '关');
      bOn.classList.toggle('on', on);
      tick();
    });
    api.TU.button(bar, '重新播种', '', () => {
      seedIdx = (seedIdx + 1) % seeds.length;
      buf = makeSeed(); frame = 0;
      present(); tick();
      api.toast('种子换成「' + seeds[seedIdx] + '」，帧数归零');
    });
    api.TU.slider(ctr, {
      label: '剪切力度（每帧最多搬多少像素）', min: 1, max: 8, step: 0.5, value: amp,
      fmt: v => v + 'px',
      onInput: v => { amp = v; },
    });
    api.TU.slider(ctr, {
      label: '演化速度', min: 5, max: 60, step: 5, value: speed,
      fmt: v => v + ' 帧/秒',
      onInput: v => { speed = v; restart(); },
    });
    present(); tick(); restart();
  },
  theory: {
    story:
      '<div class="metaphor"><span class="mt">打个比方</span>' +
      '一台复印机，你放进去的不是白纸，而是<b>它昨天印的那张纸</b>。每次复印顺手把图案挪一点。一个月后拿到的那张纸，早就看不出原图——变成了层层挪移叠出的大理石纹。</div>' +
      '<p>这就是 Buffer A 与普通渲染最大的不同：<b>自反馈</b>。种子只播一次，之后的一切都是帧数驱动的连锁复印。</p>',
    code: {
      src: 'bufferA.frag',
      html: 'result[c] = <span class="fn">texelFetch</span>(iChannel0, <span class="fn">ivec2</span>(p), 0)[c];  <span class="cm">// iChannel0 = 上一帧的自己</span>',
    },
  },
  takeaway: '自反馈 = 每帧以「上一帧的自己」为底稿再搬一次。种子播一次，演化自己长。',
});
