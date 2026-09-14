/* 第 1 关 · 紫金花的世界 */
LESSONS.push({
  id: 'welcome',
  title: '紫金花的世界',
  sub: '一朵由代码实时画出来的花',
  goal: { text: '按一次「重新撒种」，看看什么变了、什么没变。', hint: '按之前先盯住花瓣的形状' },
  notes: [
    {
      near: '.fig', title: '这朵花是算出来的',
      html: '刚才你看到的每一帧，都是项目里几百行<b>着色器（shader）</b>在你的显卡上逐像素算出来的——没有素材图。',
    },
    {
      near: '.reseed-row', title: '刚才按撒种时发生了什么',
      html: '粒子（紫点金点）换了一批——只有「随机种子」变了；花瓣轮廓一丝不动——它由公式 <b>R(θ)</b> 决定，跟撒点无关。',
    },
    {
      near: '.fig', title: '整门课的三招',
      html: '① 每个像素<b>同时</b>做题；② 粒子<b>搬座位不丢人</b>；③ 每帧<b>复印上一帧的自己</b>。后面几关一招一招拆。',
      after: 12000,
    },
  ],
  build(demoArea, api) {
    const row = api.row(demoArea);
    const fig = api.el('div', 'fig');
    row.appendChild(fig);
    const cv = api.TU.canvas(fig, 220, 220);
    cv.style.width = '360px';
    const ctx = cv.getContext('2d');
    let tick = 0;
    api.TU.drawFlower(ctx, 220, 220, tick);

    const side = api.el('div', 'controls');
    row.appendChild(side);
    const reseedRow = api.el('div', 'btnrow reseed-row');
    side.appendChild(reseedRow);
    api.TU.button(reseedRow, '重新撒种', 'primary', () => {
      tick++;
      api.TU.drawFlower(ctx, 220, 220, tick);
      if (tick >= 1) api.win('粒子换了一批（撒点的随机数变了），花瓣形状（公式 R(θ)）一点没变。');
    });
    const ro = api.TU.readout(side);
    ro.set('已撒种 ' + tick + ' 次。撒点由「确定性哈希」决定：同一个种子永远撒出同一批粒子。');
  },
  theory: {
    story:
      '<p>先记住这朵花的来历：它<b>不是图片</b>，而是 Shadertoy 原作 Subpixel Bijection Flow（chronos, 2026）' +
      '在本项目里被改造成「紫金花」版后，显卡逐像素实时算出来的。</p>' +
      '<div class="metaphor"><span class="mt">打个比方</span>' +
      '粒子是「班上的同学」，花瓣轮廓是「教室的墙」。换一批同学（重新撒种），墙一动不动（公式不变）。</div>' +
      '<p>后面几关拆开这朵花的三个机关：像素并行、双射搬运、逐帧反馈。</p>',
  },
  takeaway: '这朵花是显卡逐像素算出来的：粒子会换，形状公式不变。',
});
