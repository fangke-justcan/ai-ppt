/* 第 5 关 · 海浪叠加 */
LESSONS.push({
  id: 'layers',
  title: '海浪叠加',
  sub: '大波叠小波，才像自然',
  goal: { text: '把波叠满 5 层，并让画面处于播放中。', hint: '「加一层」按五次，再点播放' },
  notes: [
    {
      near: '.fig', title: '你看到的两层画面',
      html: '黄线 = 「每个横排要被搬多远」的<b>位移曲线</b>；下面的彩虹纹 = 按这条曲线<b>错位</b>后的样子。播放时曲线动一下，纹路立刻跟着搅。',
    },
    {
      near: '.add-row', title: '你叠的五层波',
      html: '每加一层：频率 <b>×2</b>（更细）、振幅 <b>×0.45</b>（更弱）。一层是抖绳子，五层是起风的湖面。项目的 D() 水流就是这样叠了 6 层。',
    },
    {
      near: '.add-row', title: '频率必须整数倍',
      html: '项目代码注释特别强调：频率保持整数倍，波在画面边缘才<b>接得上</b>，否则会出现裂缝。',
    },
  ],
  build(demoArea, api) {
    const W = 320, H = 220;
    const fig = api.el('div', 'fig');
    demoArea.appendChild(fig);
    const cv = api.TU.canvas(fig, W, H);
    cv.style.width = '440px';
    const ctx = cv.getContext('2d');

    const layers = [];
    function addLayer() {
      const i = layers.length;
      layers.push({ amp: 16 * Math.pow(0.45, i), freq: 1.6 * Math.pow(2, i), speed: 0.9 * Math.pow(-1.1, i), ph: i * 1.7 });
    }
    function disp(y, t) {
      let s = 0;
      for (const L of layers) s += L.amp * Math.cos(L.freq * (y / H) * Math.PI * 2 + L.speed * t + L.ph);
      return s;
    }

    let t = 0, playing = false, timer = null;
    api.onCleanup(() => clearInterval(timer));

    function draw() {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const stripH = H / 2, y0 = stripH;
      for (let y = 0; y < stripH; y++) {
        const dx = Math.round(disp(y, t));
        for (let x = 0; x < W; x++) {
          const sx = ((x - dx) % W + W) % W;
          const hue = sx / W * 300;
          ctx.fillStyle = 'hsl(' + hue + ',85%,' + (35 + y / stripH * 25) + '%)';
          ctx.fillRect(x, y0 + y, 1, 1);
        }
      }
      ctx.strokeStyle = '#3a352c';
      ctx.strokeRect(0.5, 0.5, W - 1, stripH - 1);
      ctx.beginPath();
      for (let y = 0; y < stripH; y++) {
        const px = stripH / 2 + disp(y, t) * 3;
        if (y === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
      }
      ctx.strokeStyle = '#ffc247';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.moveTo(stripH / 2, 0); ctx.lineTo(stripH / 2, stripH); ctx.stroke();
    }
    function setRo() {
      ro.set('已叠加 <b>' + layers.length + '</b> 层　时间 t = <b>' + t.toFixed(1) + '</b>' + (playing ? '　播放中' : '　已暂停'));
    }
    function tick() {
      t += 0.25;
      draw(); setRo();
      if (layers.length >= 5 && playing) api.win('五层碎浪把彩虹纹搅成了流动的波——多频叠加上手。');
    }

    const ctr = api.el('div', 'controls');
    demoArea.appendChild(ctr);
    const ro = api.TU.readout(ctr);
    const bar = api.el('div', 'btnrow add-row');
    ctr.appendChild(bar);
    api.TU.button(bar, '＋ 加一层', 'primary', () => {
      if (layers.length >= 5) { api.toast('叠满 5 层了——真实代码也只叠 6 层就很自然'); return; }
      addLayer(); draw(); setRo();
    });
    api.TU.button(bar, '播放 / 暂停', '', () => {
      if (playing) { clearInterval(timer); playing = false; }
      else { timer = setInterval(tick, 90); playing = true; }
      setRo();
    });
    api.TU.button(bar, '重置', '', () => {
      layers.length = 0; t = 0;
      if (playing) { clearInterval(timer); playing = false; }
      draw(); setRo();
    });
    draw(); setRo();
  },
  theory: {
    story:
      '<div class="metaphor"><span class="mt">打个比方</span>' +
      '一层波是抖动的绳子；往起风的湖面连扔四次石头，就是五层波。</div>' +
      '<p>程序化图形最常用的魔法：<b>简单的东西叠出来，就复杂得像自然</b>。</p>',
    code: {
      src: 'bufferA.frag 的 D()',
      html:
        '<span class="cm">// v = (振幅, 频率, 时间)，每层 ×(0.45, 2, -1.1)</span>\n' +
        '<span class="kw">for</span>(<span class="kw">float</span> j = 0.1; j &lt; 0.24; j += 0.02, v *= vec3(0.45, 2, -1.1))\n' +
        '    r += v.x * <span class="fn">cos</span>(v.y * C + v.z * t + j);',
    },
  },
  takeaway: '复杂运动 = 简单波层层叠加（频率×2、振幅×0.45）。项目的水流 D() 就是 6 层波。',
});
