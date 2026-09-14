# AGENTS.md — 3d composition 工作区

本工作区是 Shadertoy shader 的本地复刻实验场。核心项目 `fractured-orb/`：Shadertoy 原作
[Fractured Orb](https://www.shadertoy.com/view/ttycWW)（tdhooper, 2021）的本地 WebGL2 运行器，
带实时参数面板、双模型（碎裂球体原版 / 碎裂方块）、噪点成因分析与公网隧道部署脚本。

第二个项目 `particle/subpixel-bijection-flow/`：Shadertoy 原作
[Subpixel Bijection Flow](https://www.shadertoy.com/view/73c3R7)（chronos, 2026）的本地复刻，
端口 8944。要点：Buffer A **自反馈**（读自己上一帧，需 ping-pong，与 fractured-orb 不同）；
演化由帧数驱动（条纹→大理石→噪点是算法本身的轨迹，见其 README 与 analysis/cpu_sim.js）。
其 `tutorial/` 子目录是 10 关**游戏化交互课堂**（面向小白讲像素并行/UV/双射/反馈/
ping-pong/演化，端口 8945，`node tutorial/server.js`）；关卡采用"故事→玩→挑战→小结"
四段式，引擎与课程插件分离，方法论与踩坑清单在 `tutorial/DESIGN.md`（未来把这套
模式泛化成"任意项目做交互教程"的 skill 的底稿）。改教程 JS 时注意：静态服务器已发
`Cache-Control: no-cache`（否则浏览器缓存旧课程脚本）；demo 定时器必须走 api.onCleanup。

## 目录结构

```
fractured-orb/
├── index.html          # 单文件运行器：WebGL2 双通道渲染 + 参数面板 UI（约 500 行）
├── server.js           # 极简静态服务器（node server.js [port]，默认 8123，实际用 8942）
├── start.bat           # 本地启动（服务器 + 打开浏览器）
├── deploy.bat          # 公网部署（服务器 + pinggy SSH 隧道，免费 60 分钟）
├── shaders/
│   ├── bufferA.frag    # 通道A：SDF 光线步进 + 折射色散（已参数化，含自制方块模型）
│   ├── image.frag      # 通道B：景深 + 色调映射（已参数化）
│   └── *.orig.frag     # 原作未修改备份
├── textures/bluenoise.png   # 原作蓝噪声纹理（1024²，从 Shadertoy 提取，勿删）
├── source/shader.json  # 原作完整源码与通道配置存档（含原始 GLSL）
├── analysis/           # 噪点分析对比截图
└── 噪点分析报告.md      # 噪点成因实验报告（改色散/景深参数前先读）
```

## 运行与验证

```bash
node fractured-orb/server.js 8942   # 启动后访问 http://localhost:8942/
```

- 没有构建/测试/lint 步骤；验证方式 = 浏览器打开后确认 `#err` 元素为空（shader 编译错误会写进去）。
- 无 git 仓库、无包管理器；全部原生 JS/GLSL，不引入依赖。
- 端口注意：8123 被用户其他服务占用，**用 8942**。

## 架构要点（改代码前必读）

- **双通道管线**：Buffer A 渲染到 ping-pong FBO → Image 通道读**本帧刚写好的**缓冲输出屏幕
  （曾修过"读上一帧"的一帧延迟 bug，勿回退）。Buffer A 只采样蓝噪声，不自反馈。
- **shader 与运行器的契约**：`shaders/*.frag` 直接使用 `u*` uniform（uShape、uMaxDisperse、
  uOrbOuter 等），uniform 声明在 index.html 的 `FRAG_HEADER` 里，`PARAMS` 数组驱动面板 UI 和
  每帧上传。新增可调参数 = 三处同步：FRAG_HEADER 声明 + PARAMS 条目 + frag 内使用。
- **frag 不是合法的独立 Shadertoy 源码**：缺少 uniform 声明（由运行器注入头部）。原始未参数化
  源码在 `source/shader.json` 和 `*.orig.frag`，勿把参数化版本当原作覆盖备份。
- **Shadertoy 兼容层**：`iFrame` 是 `int`（WebGL2 模板），`iChannel0..3` 采样器需显式声明；
  蓝噪声采样器配置 = mipmap + repeat + vflip（`UNPACK_FLIP_Y_WEBGL`）。
- **方块模型**（uShape=1）：六面片按 X/Y/Z 轴错峰爆炸；包围盒用 `fBox` 下界，必须保守（≤真实
  距离），否则光线步进穿透。

## 已知坑

- **Shadertoy 反爬极严**：curl/PowerShell/Node fetch 一律 403（TLS 指纹拦截）。要抓取内容必须用
  真实浏览器（browser-use），页面内有 Cloudflare 验证需等待；大文件（纹理）用"页面内 fetch +
  POST 到本地接收服务器"方式导出。
- **GPU 上下文会丢**：长时间高负载渲染后 WebGL 上下文丢失（黑屏）。index.html 已挂
  `webglcontextlost` 自动刷新，勿移除。频繁对页面做高强度实验时预期会触发。
- **后台标签页 rAF 节流**：非前台时渲染循环停摆 → readPixels/截图读到旧帧甚至超时。实验脚本要
  在 evaluate 里手动调 `loop(performance.now())` 同步渲染，或先把浏览器面板设为可见。
- **噪点不是 bug**：画面颗粒 = 原作者的蓝噪声随机色散设计（1spp/帧），色散采样数和景深模糊半径
  决定强弱，详见 `噪点分析报告.md`。不要"修复"它。
- iab 截图与部分 evaluate 偶发 MCP "Internal error"，属传输层抖动，重试即可；重型页面任务用
  "页面内异步 job + 轮询 window 变量"模式更稳。

## 版本管理约定

- 仓库 = `fractured-orb/`（远端 `fangke-justcan/fractured-orb`，Pages 自动部署）。
- **每个重大变化 = 一个 annotated 标签**：`git tag -a v1.x -m "说明"`，随后
  `git -c http.proxy=http://127.0.0.1:10080 push origin main --tags`，并把新版本加进
  `fractured-orb/VERSIONS.md` 的表格。
- **快速打开历史版本**：`node fractured-orb/versions.js`（或双击 versions.bat）——在
  `orb-versions/<标签>/` 生成只读快照并在 8943 端口开浏览器；用户说"打开 vN.M 版本"即调它。
- 打标签前先 commit；临时实验用分支，不打标签。

## 公网部署

**首选：GitHub Pages（长期有效）** — https://fangke-justcan.github.io/fractured-orb/
仓库 `fangke-justcan/fractured-orb`（公开），Pages 源 = main 分支根目录。更新流程：

```bash
cd fractured-orb && git add -A && git commit -m "..."
git -c http.proxy=http://127.0.0.1:10080 push origin main   # github.com 直连会被重置，必须走本地代理
```

网络要点：`github.com` 主站直连间歇性被重置，但 `api.github.com` / `raw.githubusercontent.com`
直连可用，SSH (22/443) 与 HTTPS 走本地代理 `127.0.0.1:10080`（配置在 ~/.ssh/config）均稳定。
凭据管理器存有 `fangke-justcan` 的 token（GCM 自动提供）；**SSH key 属于另一个账号
`fangkejustcan`，对该仓库无推送权**，推送必须走 HTTPS。

**临时演示：pinggy 隧道** — `deploy.bat` = 本地服务器 +
`ssh -p 443 -R0:localhost:8942 free.pinggy.io`（免 key，60 分钟有效，URL 每次随机）。
localhost.run 需 SSH key 不可匿名；serveo 不稳定；GitHub 直连下载常超时。
