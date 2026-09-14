# interactive-tutorial-skill · 游戏化交互教程生成器

把**任意项目**里的知识，做成学生可以边玩边学的游戏化交互教程：
**核心 5~7 关讲透关键知识点**、每关单屏、进关即玩、通关后才播讲解动画、
零依赖纯静态；其余知识点放扩展池，想学随时继续加关。

- **在线示例（紫金花交互课堂 · 核心七关）**：https://fangke-justcan.github.io/interactive-tutorial-skill/
- **制作方法（SKILL）**：见 [SKILL.md](SKILL.md) —— 其他同学拿着自己的项目照做即可
- **示例项目的设计笔记**：见 [DESIGN.md](DESIGN.md)

核心七关讲透示例项目最关键的机制：像素并行 → **双射搬运** → **自反馈** →
**ping-pong 双缓冲** → **帧数驱动的演化** → 毕业测验。
UV / sin 条纹 / 多频叠加三个基础知识点放在 `lessons-ext/` 扩展池，
想加深学习时按 [lessons-ext/README.md](lessons-ext/README.md) 一分钟加回来——
这正是本 skill 的"先核心、可继续加"模式。

## 本地运行

```bash
node server.js 8945      # 或双击 start.bat
# 打开 http://localhost:8945/
```

## 快速开始：为你自己的项目做一套

1. 读 [SKILL.md](SKILL.md)，列出你项目里的 3~6 个"魔法时刻"；
2. 拷贝本仓库的 `index.html / style.css / engine.js / server.js / start.bat`，清空 `lessons/`；
3. 每个知识点写一个 `lessons/lessonNN.js` 插件（契约见 SKILL.md 阶段 3）；
4. 按验收清单逐条检查，推上 GitHub 开 Pages。

## 目录结构

```
├── SKILL.md        # ★ 制作方法论（四阶段工作流 + 四条硬标准 + 坑清单）
├── DESIGN.md       # 示例的设计笔记
├── engine.js       # 通用引擎：解锁进度 / 挑战判定 / 讲解动画 / 测验 / 庆祝
├── style.css       # 纸面编辑风主题（去 AI 味清单见 SKILL.md）
├── index.html      # 外壳（课程顺序 = script 顺序）
├── lessons/        # 核心七关，每关一个独立插件文件
├── lessons-ext/    # 扩展池：3 个基础扩展关 + 加关说明（想学再加）
├── server.js       # 本地静态服务器
└── start.bat       # Windows 一键启动
```

## 致谢

- 原作：[Subpixel Bijection Flow](https://www.shadertoy.com/view/73c3R7) — chronos
- 本教程讲解的本地实现位于 [particle/subpixel-bijection-flow](../particle/subpixel-bijection-flow)（未包含在本仓库）

## License

MIT
