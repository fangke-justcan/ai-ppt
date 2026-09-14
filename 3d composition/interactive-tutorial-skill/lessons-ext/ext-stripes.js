/* 第 4 关 · 波纹发生器 */
LESSONS.push({
  id: 'stripes',
  title: '波纹发生器',
  sub: '一行 sin 公式，画出 k 条条纹',
  goal: { text: '在竖条纹模式下，调出恰好 6 条暗条纹。', hint: '盯住读数里的计数' },
  notes: [
    {
      near: '.ctl', title: '你调出的 6 条纹是怎么来的',
      html: '公式 0.5 + 0.5·sin(u·k·2π)：u 从 0 走到 1，波正好起伏 k 次 → 屏幕上出现 <b>k 条</b>暗纹。你把 k 停在 6，读数当场数了出来。',
    },
    {
      near: '.mode-row', title: '喂什么坐标，波就什么形状',
      html: '斜条纹是把 <b>u+v</b> 喂进去；同心圆是喂「到中心的距离」。函数没变，变的只是坐标。',
    },
    {
      near: '.fig', title: '水流的种子',
      html: '紫金花那条搬运粒子的「大水流」，底层就是一堆不同密度的 sin/cos 波——下一关教你叠。',
    },
  ],
  build(demoArea, api) {
    const W = 320, H = 180;
    const fig = api.el('div', 'fig');
    demoArea.appendChild(fig);
    const cv = api.TU.canvas(fig, W, H);
    cv.style.width = '480px';
    const ctx = cv.getContext('2d');

    let k = 5, pattern = 'v';
    function val(x, y) {
      const u = x / W, v = y / H;
      let p;
      if (pattern === 'v') p = u;
      else if (pattern === 'd') p = u + v;
      else p = Math.hypot(u - 0.5, v - 0.5) * 1.6;
      return 0.5 + 0.5 * Math.sin(p * k * Math.PI * 2);
    }
    function draw() {
      const img = ctx.createImageData(W, H);
      const d = img.data;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const t = val(x, y);
          const o = (y * W + x) * 4;
          d[o] = 18 + 200 * t; d[o + 1] = 12 + 90 * t; d[o + 2] = 30 + 220 * t; d[o + 3] = 255;
        }
      ctx.putImageData(img, 0, 0);
    }
    function countDark() {
      let n = 0, inside = false;
      for (let x = 0; x < W; x++) {
        const dark = val(x, H / 2) < 0.5;
        if (dark && !inside) n++;
        inside = dark;
      }
      return n;
    }
    function refresh() {
      draw();
      const n = countDark();
      ro.set('密度 k = <b>' + k + '</b>　|　暗条纹数量：<b>' + n + '</b> 条');
      if (pattern === 'v' && n === 6) api.win('竖条纹 + k=6：不多不少 6 条暗纹。公式参数和画面一一对应。');
    }

    const ctr = api.el('div', 'controls');
    demoArea.appendChild(ctr);
    const ro = api.TU.readout(ctr);
    const bar = api.el('div', 'btnrow mode-row');
    ctr.appendChild(bar);
    [['v', '竖条纹'], ['d', '斜条纹'], ['r', '同心圆']].forEach(m => {
      const b = api.TU.button(bar, m[1], 'small', () => {
        pattern = m[0];
        bar.querySelectorAll('.btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        refresh();
      });
    });
    bar.firstChild.classList.add('on');
    api.TU.slider(ctr, {
      label: '密度 k（波起伏几次）', min: 0, max: 24, step: 1, value: k,
      onInput: v => { k = v; refresh(); },
    });
    refresh();
  },
  theory: {
    story:
      '<div class="metaphor"><span class="mt">打个比方</span>' +
      'sin 是一台<b>波浪窗帘机</b>：你只给一个「密度旋钮」，它就把整块布压出一道道均匀的褶。</div>' +
      '<p>喂给它的坐标决定褶的方向：u → 竖纹，u+v → 斜纹，距离 r → 同心环。</p>',
    code: {
      src: '着色器惯用写法',
      html:
        'float v = 0.5 + 0.5 * <span class="fn">sin</span>(u * k * 6.2832);       <span class="cm">// 竖条纹</span>\n' +
        'float v3 = 0.5 + 0.5 * <span class="fn">sin</span>(<span class="fn">length</span>(uv - 0.5) * k * 6.2832); <span class="cm">// 同心圆</span>',
    },
  },
  takeaway: 'sin(位置 × 频率) = 条纹；喂不同坐标，得到不同方向的波。',
});
