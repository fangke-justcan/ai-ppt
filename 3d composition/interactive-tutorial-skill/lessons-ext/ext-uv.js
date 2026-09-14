/* 第 3 关 · 像素的座位号 UV */
LESSONS.push({
  id: 'uv',
  title: '像素的座位号 UV',
  sub: '回答「我在哪」，才有资格回答「我是什么颜色」',
  goal: { text: '把鼠标移进画布右上角的虚线框。', hint: '读数会提示该往哪边走：u > 0.9 且 v < 0.1' },
  notes: [
    {
      near: '.fig', title: '你刚才用的就是 UV',
      html: '宽度当 <b>0 → 1</b>、高度当 <b>0 → 1</b>：你移动鼠标时，读数一直在做这个换算。右上角那个框，就是 u &gt; 0.9 且 v &lt; 0.1 的区域。',
    },
    {
      near: '.ctl', title: '分辨率变了，UV 不变',
      html: '你拖动滑块把格子变粗变细，图案规律完全一样——<b>UV 与分辨率无关</b>，所以同一份代码在手机和电脑上画出同样的图。',
      after: 11000,
    },
  ],
  build(demoArea, api) {
    const W = 300, H = 200;
    const fig = api.el('div', 'fig');
    demoArea.appendChild(fig);
    const cv = api.TU.canvas(fig, W, H);
    cv.style.width = '540px';
    const ctx = cv.getContext('2d');

    let block = 10;
    function draw() {
      for (let y = 0; y < H; y += block)
        for (let x = 0; x < W; x += block) {
          const u = (x + block / 2) / W, v = (y + block / 2) / H;
          ctx.fillStyle = 'rgb(' + (u * 255) + ',' + (v * 255) + ',70)';
          ctx.fillRect(x, y, block, block);
        }
      ctx.strokeStyle = '#ffc247';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2;
      ctx.strokeRect(W * 0.9, 0, W * 0.1 - 1, H * 0.1 - 1);
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }
    draw();

    const ctr = api.el('div', 'controls');
    demoArea.appendChild(ctr);
    api.TU.slider(ctr, {
      label: '像素大小（分辨率粗糙度）', min: 4, max: 40, step: 2, value: block,
      fmt: v => v + 'px',
      onInput: v => { block = v; draw(); },
    });
    const ro = api.TU.readout(ctr);
    ro.set('把鼠标移到画布上');

    cv.addEventListener('mousemove', e => {
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * W;
      const y = (e.clientY - r.top) / r.height * H;
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const u = x / W, v = y / H;
      draw();
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
      ctx.moveTo(0, y); ctx.lineTo(W, y);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
      let hint = '';
      if (u <= 0.9) hint += ' → 往右';
      if (v >= 0.1) hint += ' → 往上';
      ro.innerHTML = '像素 (' + (x | 0) + ', ' + (y | 0) + ')　→　<b>u = ' + u.toFixed(2) + ', v = ' + v.toFixed(2) + '</b>' + hint;
      if (u > 0.9 && v < 0.1) api.win('u > 0.9 且 v < 0.1——你把指针放进了右上角的框。百分比座位号到手。');
    });
  },
  theory: {
    story:
      '<div class="metaphor"><span class="mt">打个比方</span>' +
      '「7 排 3 座」换算成「横向走 70%、纵向走 30%」——不管电影院多大，这个百分比座位号都成立。</div>' +
      '<p>所以着色器从不写死「第 300 个像素」，而是写「u = 0.3 的地方」。</p>',
    code: {
      src: '着色器惯用写法',
      html: 'vec2 uv = q / iResolution.xy;   <span class="cm">// u = 横向 0→1，v = 纵向 0→1</span>',
    },
  },
  takeaway: 'UV = 用 0→1 的百分比表示像素位置，与分辨率无关。',
});
