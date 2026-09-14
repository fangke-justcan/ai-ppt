/* 第 6 关 · 时间机器：帧数驱动的演化（cpu_sim.js 的浏览器移植） */
LESSONS.push({
  id: 'evolution',
  title: '时间机器',
  sub: '条纹 → 大理石 → 均匀：真实算法的逐帧回放',
  goal: { text: '把时间轴拨到 300 帧附近，答对右侧的「现在处于哪个阶段」。', hint: '看清画面再选' },
  notes: [
    {
      near: '.fig', title: '你刚才开的是真机器',
      html: '它就是项目 <b>analysis/cpu_sim.js</b>（float64 参考模拟）逐行移植的浏览器版：第 300 帧长什么样，真程序第 300 帧就长什么样。',
    },
    {
      near: '.evol-row', title: '把前几关拼起来',
      html: '每帧：像素按 <b>D() 水流</b>算位移（这种水流怎么叠出来的，见扩展关「海浪叠加」），<b>取整+环绕</b>（双射那关）搬家，底稿是<b>上一帧</b>（反馈那关）。种子就这样被一步步搅匀。',
    },
    {
      near: '.evol-flow', title: '箭头是位移场',
      html: '勾上「显示水流箭头」：金色小箭头 = 每个像素这一帧要搬去的方向。拖时间轴，箭头跟着帧数变。',
    },
    {
      near: '.evol-row', title: '确定性：帧数就是命运',
      html: '按「重新播种」后，同样的帧数永远长出同样的画面——演化由<b>帧数</b>驱动，不由墙上的时钟驱动。',
      after: 11000,
    },
  ],
  build(demoArea, api) {
    const W = 132, H = 74;
    const fig = api.el('div', 'fig');
    demoArea.appendChild(fig);
    const cv = api.TU.canvas(fig, W, H);
    cv.style.width = '528px';
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(W, H);

    const TAU = 2 * Math.acos(-1);
    const PHI = 0.5 * Math.sqrt(5) - 0.5;
    const gmod = (x, y) => x - y * Math.floor(x / y);
    function D(c, tx, ty, i) {
      const P = i * PHI;
      let rx = tx * 9 * Math.sin(P * TAU);
      let ry = ty * 9 * Math.sin(P * TAU);
      const t0 = tx + P, t1 = ty + P;
      let Cx = c * TAU, Cy = c * TAU;
      Cx += 0.5 * Math.sin(Cx + t0 * 0.1);
      Cy += 0.5 * Math.sin(Cy + t1 * 0.1);
      let vx = 320, vy = 1, vz = 0.14;
      for (let j = 0.1; j < 0.24; j += 0.02) {
        rx += vx * Math.cos(vy * Cx + vz * t0 + j);
        ry += vx * Math.cos(vy * Cy + vz * t1 + j);
        vx *= 0.45; vy *= 2; vz *= -1.1;
      }
      return Math.round(rx - ry);
    }
    function initBuf() {
      const a = new Float32Array(W * H);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
          a[y * W + x] = Math.pow(2, 4 * Math.sin(x / 99) - 4) * 255;
      return a;
    }
    function stepFrame(f) {
      const prev = frames[f - 1], out = new Float32Array(W * H);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          let px = x, py = y;
          for (let i = 0; i < 6; i++) {
            const axis = i & 1, other = (~i) & 1;
            const cc = other === 0 ? px / W : py / H;
            const d = D(cc, f / 60, (f - 1) / 60, i);
            if (axis === 0) px = gmod(px - d, W); else py = gmod(py - d, H);
          }
          out[y * W + x] = prev[(py | 0) * W + (px | 0)];
        }
      return out;
    }
    let frames = [initBuf()];
    let bgTimer = null, cancelled = false;
    function ensure(n) {
      while (frames.length <= n) {
        const f = frames.length;
        frames.push(f < 9 ? frames[f - 1] : stepFrame(f));
      }
    }
    api.onCleanup(() => { cancelled = true; clearTimeout(bgTimer); });

    let showFlow = false;
    function stageName(f) {
      if (f < 30) return '种子期（条纹还认得出）';
      if (f < 150) return '卷流期（大卷入）';
      if (f < 400) return '混合期（大理石纹）';
      return '均匀期（细颗粒）';
    }
    function draw(f) {
      ensure(f);
      const buf = frames[f];
      const d = img.data;
      let diff = 0;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const v = buf[y * W + x] / 255;
          const c = TU.purpleGold(v);
          const o = (y * W + x) * 4;
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
          if (x < W - 1) diff += Math.abs(buf[y * W + x] - buf[y * W + x + 1]);
        }
      diff /= (W - 1) * H;
      ctx.putImageData(img, 0, 0);
      if (showFlow) drawArrows(f);
      ro.set('帧 = <b>' + f + '</b>　阶段：<b>' + stageName(f) + '</b><br>相邻像素差异（越小越均匀）：<b>' + diff.toFixed(1) + '</b>');
    }
    function drawArrows(f) {
      ctx.strokeStyle = 'rgba(255,220,120,.9)';
      ctx.fillStyle = 'rgba(255,220,120,.95)';
      for (let y = 6; y < H; y += 10)
        for (let x = 6; x < W; x += 12) {
          let px = x, py = y;
          for (let i = 0; i < 6; i++) {
            const axis = i & 1, other = (~i) & 1;
            const cc = other === 0 ? px / W : py / H;
            const d = D(cc, f / 60, (f - 1) / 60, i);
            if (axis === 0) px = gmod(px - d, W); else py = gmod(py - d, H);
          }
          const dx = px - x, dy = py - y;
          if (Math.abs(dx) > W / 2 || Math.abs(dy) > H / 2) continue;
          if (Math.abs(dx) + Math.abs(dy) < 0.8) continue;
          ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(px, py);
          ctx.stroke();
          ctx.fillRect(px - 1, py - 1, 2, 2);
        }
    }

    const ctr = api.el('div', 'controls');
    demoArea.appendChild(ctr);
    const ro = api.TU.readout(ctr);
    const prog = api.TU.readout(ctr);
    const bar = api.el('div', 'btnrow evol-row');
    ctr.appendChild(bar);
    let playing = false, playTimer = null;
    api.onCleanup(() => clearInterval(playTimer));
    const playBtn = api.TU.button(bar, '播放', 'primary', () => {
      if (playing) { clearInterval(playTimer); playing = false; playBtn.textContent = '播放'; }
      else {
        playing = true; playBtn.textContent = '暂停';
        playTimer = setInterval(() => {
          const v = Math.min(500, Number(slider.input.value) + 2);
          slider.set(v); draw(v);
          if (v >= 500) { clearInterval(playTimer); playing = false; playBtn.textContent = '播放'; }
        }, 40);
      }
    });
    api.TU.button(bar, '重新播种', '', () => {
      frames = [initBuf()];
      slider.set(0); draw(0);
      api.toast('已重新播种——同样的帧数会重演出同样的轨迹');
      (function pc() {
        if (cancelled) return;
        if (frames.length < 500) { ensure(Math.min(frames.length + 2, 500)); prog.set('预计算 ' + frames.length + ' / 500 帧'); bgTimer = setTimeout(pc, 0); }
        else prog.set('预计算完成：0-500 帧就绪');
      })();
    });
    const flowLabel = api.el('label', 'note-small evol-flow', '<input type="checkbox" style="vertical-align:-2px"> 显示水流箭头（D() 位移场）');
    flowLabel.style.marginTop = '4px';
    flowLabel.querySelector('input').addEventListener('change', e => { showFlow = e.target.checked; draw(Number(slider.input.value)); });
    ctr.appendChild(flowLabel);
    const slider = TU.slider(ctr, {
      label: '时间轴（帧）', min: 0, max: 500, step: 1, value: 0,
      onInput: v => { if (playing) { clearInterval(playTimer); playing = false; playBtn.textContent = '播放'; } draw(v); },
    });

    // 后台预计算（放在控件创建之后，避免引用未初始化的组件）
    (function precompute() {
      if (cancelled) return;
      if (frames.length < 500) {
        ensure(Math.min(frames.length + 2, 500));
        prog.set('后台预计算 ' + frames.length + ' / 500 帧');
        bgTimer = setTimeout(precompute, 0);
      } else prog.set('预计算完成：0-500 帧就绪');
    })();

    draw(0);

    api.quiz([{
      q: '第 300 帧处于哪个阶段？（先把时间轴拨过去看看）',
      opts: ['种子期：条纹清清楚楚', '混合期：大理石纹漩涡', '均匀期：完全均匀的细颗粒', '空白黑屏'],
      correct: 1,
      exp: '第 300 帧在混合期——条纹被卷成大理石纹，几百帧后才完全均匀。',
    }], () => api.win('时间机器驾驶完毕：同一个帧数永远是同一幅画面。'));
  },
  theory: {
    story:
      '<div class="metaphor"><span class="mt">打个比方</span>' +
      '往咖啡里倒一点奶，按同一套手法<b>轻轻搅 500 下</b>：先是大理石纹，最后整杯均匀。而且这里的「时间」是帧数——第 300 帧永远长成第 300 帧的样子。</div>' +
      '<p>原作全屏版最终也会变成均匀噪点——这是这类「保面积输运」的固有性质，不是 bug。浏览器后台标签页会暂停渲染，所以演化变慢但<b>不失真</b>。</p>',
    code: {
      src: 'analysis/cpu_sim.js（本课演示的母本）',
      html: '<span class="kw">if</span> (axis === 0) px = <span class="fn">gmod</span>(px - d, W); <span class="kw">else</span> py = <span class="fn">gmod</span>(py - d, H);',
    },
  },
  takeaway: '演化 = 帧数驱动 + 每帧一次确定性搬运：种子 → 卷流 → 大理石 → 均匀。',
});
