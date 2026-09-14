/* 第 6 关 · 搬座位：双射 */
LESSONS.push({
  id: 'bijection',
  title: '搬座位：双射',
  sub: 'round 取整 + mod 环绕——项目名里 Bijection 的含义',
  goal: { text: '用「取整+环绕」搬法，把位移调到 7.5，按一次「搬一次」。', hint: '搬完看读数：颜色种类应该还是 24/24' },
  notes: [
    {
      near: '.fig', title: '你刚才那一搬',
      html: '位移 7.5 被取整成 <b>round(7.5)=8 格</b>：整数平移只换顺序、不产生重叠——所以搬完后颜色依然 24/24。',
    },
    {
      near: '.mode-row', title: '双射 vs 反例',
      html: '<b>取整+环绕</b>：只换顺序，不丢不重——数学上叫<b>双射（bijection）</b>，项目名里的那个词。<br><b>小数位移+取平均</b>：颜色跟邻居掺和，反复搬就全糊了。',
    },
    {
      near: '.repeat-row', title: '这就是「不衰减」的原因',
      html: '项目每一帧都用双射搬运，所以粒子被搬几千帧，内容依旧完好——反例搬 300 次就什么都没了。',
    },
  ],
  build(demoArea, api) {
    const N = 24, BS = 15;
    const fig = api.el('div', 'fig');
    demoArea.appendChild(fig);
    const cv = api.TU.canvas(fig, N * BS, BS * 2.2);
    cv.style.width = '420px';
    const ctx = cv.getContext('2d');

    let cur = makeHues();
    let mode = 'round', d = 2;
    function makeHues() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const c = hsl2rgb(i / N, 0.85, 0.55);
        a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2];
      }
      return a;
    }
    function hsl2rgb(h, s, l) {
      const f = n => {
        const k = (n + h * 12) % 12;
        return Math.round(255 * (l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
      };
      return [f(0), f(8), f(4)];
    }
    function drawBeads() {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < N; i++) {
        ctx.fillStyle = 'rgb(' + (cur[i * 3] | 0) + ',' + (cur[i * 3 + 1] | 0) + ',' + (cur[i * 3 + 2] | 0) + ')';
        ctx.fillRect(i * BS + 1, BS * 0.6, BS - 2, BS - 2);
      }
    }
    const wrap = i => ((i % N) + N) % N;
    function step(m) {
      const next = new Float32Array(N * 3);
      if (m === 'round') {
        const s = Math.round(d);
        for (let i = 0; i < N; i++) {
          const src = wrap(i - s);
          next[i * 3] = cur[src * 3]; next[i * 3 + 1] = cur[src * 3 + 1]; next[i * 3 + 2] = cur[src * 3 + 2];
        }
      } else {
        for (let i = 0; i < N; i++) {
          const s = i - d, i0 = Math.floor(s), f = s - i0;
          const a = wrap(i0), b = wrap(i0 + 1);
          for (let c = 0; c < 3; c++) next[i * 3 + c] = cur[a * 3 + c] * (1 - f) + cur[b * 3 + c] * f;
        }
      }
      cur = next;
      drawBeads();
      report();
    }
    function uniq() {
      const set = new Set();
      for (let i = 0; i < N; i++)
        set.add(((cur[i * 3] >> 4) << 8) | ((cur[i * 3 + 1] >> 4) << 4) | (cur[i * 3 + 2] >> 4));
      return set.size;
    }
    function report() {
      const u = uniq();
      const good = u === N;
      ro.innerHTML = '颜色种类：<b class="' + (good ? 'ok' : 'bad') + '">' + u + ' / ' + N + '</b>　' +
        (good ? '不丢不重，内容完好' : '内容已经被搅糊/弄丢') +
        '<br>搬法：' + (mode === 'round' ? '取整+环绕（双射）' : '小数位移+取平均（会糊）') +
        '　位移 d = <b>' + d + '</b>' + (mode === 'round' ? '（round(' + d + ') = ' + Math.round(d) + '）' : '');
    }

    const ctr = api.el('div', 'controls');
    demoArea.appendChild(ctr);
    const ro = api.TU.readout(ctr);
    const bar1 = api.el('div', 'btnrow mode-row');
    ctr.appendChild(bar1);
    const bRound = api.TU.button(bar1, '取整+环绕（项目的做法）', 'small on', () => {
      mode = 'round'; bRound.classList.add('on'); bBlur.classList.remove('on'); report();
    });
    const bBlur = api.TU.button(bar1, '小数位移+取平均（反例）', 'small', () => {
      mode = 'blur'; bBlur.classList.add('on'); bRound.classList.remove('on');
      if (Number.isInteger(d)) { d = 0.5; dSlider.set(0.5); }
      report();
    });
    const bar2 = api.el('div', 'btnrow repeat-row');
    ctr.appendChild(bar2);
    api.TU.button(bar2, '搬一次', 'primary', () => {
      step(mode);
      if (mode === 'round' && Math.abs(d - 7.5) < 1e-9) api.win('位移 7.5 → 实际搬 round(7.5)=8 格：珠子换了一圈座位，颜色依然 24/24。双射！');
    });
    api.TU.button(bar2, '反复搬 ×300', '', () => {
      for (let i = 0; i < 300; i++) step(mode);
      if (mode === 'round') api.toast('双射搬 300 次依然 24/24：永不衰减');
      else api.toast('反例搬 300 次：颜色互相掺和全部趋同——不取整的下场');
    });
    api.TU.button(bar2, '复原', '', () => { cur = makeHues(); drawBeads(); report(); });
    const dSlider = api.TU.slider(ctr, {
      label: '位移 d（可为负、可为小数）', min: -12, max: 12, step: 0.25, value: d,
      fmt: v => v + ' 格',
      onInput: v => { d = v; report(); },
    });
    drawBeads();
    report();
  },
  theory: {
    story:
      '<div class="metaphor"><span class="mt">打个比方</span>' +
      '全班按<b>整数个座位整体挪</b>：人数不变、没人挤一座，只是顺序变了——这就是「取整 + 环绕」。<br>' +
      '而「复印机复印自己的复印件」每 copy 一次糊一点，几百次后什么都没了。</div>' +
      '<p>项目每一帧的搬运都是双射，所以粒子被搬几千帧后内容依旧完好。</p>',
    code: {
      src: 'bufferA.frag（原作注释：Shift row or col by a constant, with wrap）',
      html: 'p[i&amp;1] = <span class="fn">mod</span>(p[i&amp;1] - <span class="fn">round</span>(D(...)), iResolution[i&amp;1]);',
    },
  },
  takeaway: 'round 取整 + mod 环绕 = 双射搬运：只换座位，永不重叠、永不丢失。',
});
