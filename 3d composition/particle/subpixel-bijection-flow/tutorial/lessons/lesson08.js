/* 第 8 关 · 两个水桶：ping-pong */
LESSONS.push({
  id: 'pingpong',
  title: '两个水桶：ping-pong',
  sub: '「读自己上一帧」在硬件上的实现方式',
  goal: { text: '单步跑 4 次乒乓循环，然后答对右侧两道问题。', hint: '绿框是正在读、金框是正在写，每帧互换' },
  notes: [
    {
      near: '.buckets', title: '为什么不只用一块显存',
      html: '一块显存同一时刻只能干一件事：一边往纸上写字、一边读这行字下面的内容，读到的是<b>写了一半的乱码</b>。读写必须分开。',
    },
    {
      near: '.pp-step-row', title: '你单步看到的循环',
      html: '这一帧：<b>绿框读旧内容 → 金框写新内容 → 两个桶交换名字</b>，像乒乓球轮流。屏幕显示的是<b>刚写好</b>的那个——这也是运行器特意保证的（曾修过一帧延迟 bug）。',
    },
    {
      near: '.buckets', title: '对应项目里的三行',
      html: '读 bufTex[bufRead]、写 bufFbo[1-bufRead]、帧末 bufRead = 1-bufRead。右栏「通关讲解」里有原文。',
    },
  ],
  build(demoArea, api) {
    const W = 96, H = 64;
    const mkBucket = name => {
      const b = api.el('div', 'bucket');
      b.appendChild(api.el('div', 'note-small', name));
      const c = document.createElement('canvas');
      c.className = 'demo'; c.width = W; c.height = H;
      c.style.width = '150px';
      b.appendChild(c);
      return { b, cv: c, ctx: c.getContext('2d') };
    };
    const buckets = [mkBucket('桶 A'), mkBucket('桶 B')];
    const bucketsRow = api.el('div', 'demo-grid buckets');
    demoArea.appendChild(bucketsRow);
    bucketsRow.appendChild(buckets[0].b);
    bucketsRow.appendChild(api.el('div', 'note-small', '⇄<br>轮流<br>读写'));
    bucketsRow.appendChild(buckets[1].b);

    let data = [new Float32Array(W * H * 3), new Float32Array(W * H * 3)];
    function seedInto(b) {
      const a = data[b];
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const hue = (x / W + y * 0.008) % 1;
          const o = (y * W + x) * 3;
          a[o] = 30 + 220 * Math.abs(Math.sin(hue * 8));
          a[o + 1] = 40 + 190 * Math.abs(Math.sin(hue * 5 + 1));
          a[o + 2] = 70 + 180 * Math.abs(Math.cos(hue * 9));
        }
    }
    function warp(src, dst, f) {
      const s = data[src], d = data[dst];
      for (let y = 0; y < H; y++) {
        const dx = Math.round(2.5 * Math.sin(y * 0.15 + f * 0.5));
        for (let x = 0; x < W; x++) {
          const sx = ((x - dx) % W + W) % W;
          const o = (y * W + x) * 3, so = (y * W + sx) * 3;
          d[o] = s[so]; d[o + 1] = s[so + 1]; d[o + 2] = s[so + 2];
        }
      }
    }
    function draw(b) {
      const a = data[b];
      const img = buckets[b].ctx.createImageData(W, H);
      for (let i = 0; i < W * H; i++) {
        img.data[i * 4] = a[i * 3]; img.data[i * 4 + 1] = a[i * 3 + 1];
        img.data[i * 4 + 2] = a[i * 3 + 2]; img.data[i * 4 + 3] = 255;
      }
      buckets[b].ctx.putImageData(img, 0, 0);
    }
    let read = 0, frame = 0, auto = null;
    api.onCleanup(() => clearInterval(auto));
    function paint() {
      draw(0); draw(1);
      buckets[0].b.classList.remove('read', 'write');
      buckets[1].b.classList.remove('read', 'write');
      buckets[read].b.classList.add('read');
      buckets[1 - read].b.classList.add('write');
    }
    const log = api.TU.readout(demoArea);
    function step() {
      const w = 1 - read;
      warp(read, w, frame);
      logLines.unshift('第 ' + frame + ' 帧：读 桶' + (read ? 'B' : 'A') + ' → 写入 桶' + (w ? 'B' : 'A') + ' → 交换');
      if (logLines.length > 4) logLines.pop();
      log.set(logLines.join('<br>'));
      read = w; frame++;
      paint();
    }
    const logLines = [];

    const bar = api.el('div', 'btnrow pp-step-row');
    demoArea.appendChild(bar);
    api.TU.button(bar, '单步', 'primary', step);
    api.TU.button(bar, '自动播放', '', function () {
      if (auto) { clearInterval(auto); auto = null; this.textContent = '自动播放'; }
      else { auto = setInterval(step, 450); this.textContent = '暂停'; }
    });
    api.TU.button(bar, '重置', '', () => {
      clearInterval(auto); auto = null;
      seedInto(0); data[1].fill(0);
      read = 0; frame = 0; logLines.length = 0;
      log.set('还没开始');
      paint();
    });

    seedInto(0);
    paint();
    log.set('还没开始');

    // 右栏两道题
    api.quiz([
      {
        q: '1. 一块显存为什么不够？',
        opts: ['容量太小装不下画面', '一边读一边写会读到「写了一半」的乱码', '两个桶颜色更鲜艳'],
        correct: 1,
        exp: '写的同时读同一块显存，读到的是改到一半的数据。读写必须分开。',
      },
      {
        q: '2. 每帧结束时屏幕显示哪个桶？',
        opts: ['刚写好的那一帧', '正在被读的旧桶', '两个桶各显示一半'],
        correct: 0,
        exp: '本项目运行器让显示层读「本帧刚写好」的缓冲，写完立刻交换名字。',
      },
    ], () => api.win('乒乓循环看懂了：读 A 写 B、帧末交换。'));
  },
  theory: {
    story:
      '<div class="metaphor"><span class="mt">打个比方</span>' +
      '两个水桶轮流当「今天的水」和「昨天的水」：每天从昨天桶抽水倒进今天桶，然后俩桶<b>交换名字</b>。</div>' +
      '<p>所以「读自己上一帧」其实是一对缓冲区在打乒乓。窗口缩放重分配缓冲后，项目会把 iFrame 归零重新播种，否则反馈内容丢失会黑屏。</p>',
    code: {
      src: '本项目运行器 index.html',
      html:
        '<span class="fn">gl.bindFramebuffer</span>(gl.FRAMEBUFFER, bufFbo[1 - bufRead]); <span class="cm">// 写：另一个桶</span>\n' +
        '<span class="fn">gl.bindTexture</span>(gl.TEXTURE0, bufTex[bufRead]); <span class="cm">// 读：当前桶</span>\n' +
        'bufRead = 1 - bufRead; <span class="cm">// 帧末交换</span>',
    },
  },
  takeaway: '自反馈 ≠ 直接改自己：读 A 写 B、帧末交换（ping-pong），才能读到完整旧帧、写出干净新帧。',
});
