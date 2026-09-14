/* 第 2 关 · 屏幕是一张表格 */
LESSONS.push({
  id: 'pixels',
  title: '屏幕是一张表格',
  sub: '着色器：让所有像素同时做同一道题',
  goal: { text: '选「同心圆」规则，用 GPU 模式运行一次。', hint: '建议先跑一次 CPU 模式对比' },
  notes: [
    {
      near: '.fig', title: '刚才那两次运行',
      html: 'CPU 模式一格一格交卷、你看得见进度；GPU 模式<b>一瞬间</b>全部完成。真实显卡就是后者：几百万像素同时执行同一个函数。',
    },
    {
      near: '.mode-row', title: '规则就是公式',
      html: '棋盘 / 条纹 / 同心圆，只是换了公式。项目里每个像素都执行同一个 <b>mainImage</b>，入参 q 就是它的座位号。',
    },
    {
      near: '.fig', title: '并行是后面一切的基础',
      html: '之后每一关，都默认几十万个像素在<b>同时</b>做同样的事——记住这个画面。',
    },
  ],
  build(demoArea, api) {
    const GW = 32, GH = 20, CELL = 12;
    const fig = api.el('div', 'fig');
    demoArea.appendChild(fig);
    const cv = api.TU.canvas(fig, GW * CELL, GH * CELL);
    cv.style.width = '600px';
    const ctx = cv.getContext('2d');

    const rules = {
      checker: { name: '棋盘', fn: (x, y) => (x + y) % 2 ? [235, 235, 235] : [20, 20, 30] },
      stripes: { name: '竖条纹', fn: x => x % 3 ? [20, 20, 30] : [180, 107, 255] },
      rings: { name: '同心圆', fn: (x, y) => {
        const d = Math.hypot(x - GW / 2, y - GH / 2) | 0;
        return d % 2 ? [255, 194, 71] : [30, 16, 50];
      } },
      glow: { name: '中心光斑', fn: (x, y) => {
        const d = Math.hypot(x - GW / 2, y - GH / 2);
        const v = Math.max(0, 1 - d / 14);
        return [20 + 235 * v * v, 20 + 150 * v * v, 30 + 60 * v];
      } },
    };
    let rule = 'checker', mode = null, cellColors = null, busy = false, timer = null;
    api.onCleanup(() => clearInterval(timer));

    function drawGrid(hover) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, cv.width, cv.height);
      for (let y = 0; y < GH; y++)
        for (let x = 0; x < GW; x++) {
          const c = cellColors && cellColors[y * GW + x];
          if (c) { ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1); }
          else { ctx.strokeStyle = '#3a352c'; ctx.strokeRect(x * CELL + .5, y * CELL + .5, CELL - 1, CELL - 1); }
        }
      if (hover) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.strokeRect(hover.x * CELL, hover.y * CELL, CELL, CELL);
        ctx.lineWidth = 1;
      }
    }
    drawGrid();
    cv.addEventListener('mousemove', e => {
      const r = cv.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left) / r.width * GW);
      const y = Math.floor((e.clientY - r.top) / r.height * GH);
      if (x < 0 || y < 0 || x >= GW || y >= GH) return;
      drawGrid({ x, y });
      ro.innerHTML = '你指着的像素：第 <b>' + x + '</b> 列 · 第 <b>' + y + '</b> 行';
    });
    cv.addEventListener('mouseleave', () => drawGrid());

    const bar = api.el('div', 'btnrow mode-row');
    demoArea.appendChild(bar);
    const sel = document.createElement('select');
    sel.className = 'sel';
    for (const k in rules) {
      const o = document.createElement('option');
      o.value = k; o.textContent = '规则：' + rules[k].name;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => { rule = sel.value; });
    bar.appendChild(sel);
    api.TU.button(bar, '用 CPU 算（一个一个来）', '', () => run('cpu'));
    api.TU.button(bar, '用 GPU 算（全体同时）', 'primary', () => run('gpu'));

    const ro = api.TU.readout(demoArea);
    ro.set('先移动鼠标看看像素坐标，再分别用两种模式运行。');

    function run(m) {
      if (busy) return;
      clearInterval(timer);
      mode = m;
      const f = rules[rule].fn;
      const next = new Array(GW * GH);
      if (m === 'gpu') {
        for (let y = 0; y < GH; y++)
          for (let x = 0; x < GW; x++) next[y * GW + x] = f(x, y);
        cellColors = next; drawGrid();
        ro.set('GPU 模式：640 个像素<b>一瞬间</b>全部交卷。');
        maybeWin();
      } else {
        busy = true;
        let n = 0;
        timer = setInterval(() => {
          for (let k = 0; k < 8 && n < GW * GH; k++, n++) {
            const x = n % GW, y = (n / GW) | 0;
            next[n] = f(x, y);
          }
          cellColors = next;
          drawGrid();
          ro.set('CPU 模式：已算完 <b>' + n + ' / ' + (GW * GH) + '</b> 个像素……');
          if (n >= GW * GH) { clearInterval(timer); busy = false; }
        }, 16);
      }
    }
    function maybeWin() {
      if (mode === 'gpu' && rule === 'rings') api.win('全体像素同时交卷——这就是着色器的本职工作。');
    }
  },
  theory: {
    story:
      '<div class="metaphor"><span class="mt">打个比方</span>' +
      '全校学生同时拿到同一张考卷，每人<b>座位号不同</b>所以答案不同，但所有人<b>同时动笔</b>，一瞬间全部交卷。显卡就是这样工作的。</div>' +
      '<p>着色器程序 = 考卷；显卡 = 让全屏幕像素并行作答的考场。</p>',
    code: {
      src: 'bufferA.frag',
      html:
        '<span class="cm">// 每个像素都会执行这个函数，q 就是它的座位号</span>\n' +
        '<span class="kw">void</span> <span class="fn">mainImage</span>( <span class="kw">out</span> vec4 O, <span class="kw">in</span> vec2 q )\n' +
        '{\n    <span class="cm">// 全屏幕像素同时运行到这里，各自算出自己的颜色 O</span>\n}',
    },
  },
  takeaway: '着色器 = 发给全屏幕像素的同一张考卷，显卡让它们并行作答。',
});
