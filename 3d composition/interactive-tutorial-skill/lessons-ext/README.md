# 扩展关（可选课程）

核心七关讲透了示例项目最关键的机制（并行 → 双射 → 反馈 → ping-pong → 演化）。
这三关是**基础知识扩展**，想加深学习时再按下面的方法加回来：

| 文件 | 关卡 | 讲什么 |
|---|---|---|
| `ext-uv.js` | 像素的座位号 UV | 0→1 百分比坐标、与分辨率无关 |
| `ext-stripes.js` | 波纹发生器 | sin(位置×频率) = 条纹 |
| `ext-layers.js` | 海浪叠加 | 多频叠加（D() 水流的构成原理） |

## 怎么加

打开 `index.html`，把想要的 `<script>` 从注释里挪出来，**插到你想要的位置**：

```html
<script src="lessons/lesson02.js"></script>
<script src="lessons-ext/ext-uv.js"></script>       <!-- 加进来 -->
<script src="lessons-ext/ext-stripes.js"></script>  <!-- 加进来 -->
<script src="lessons-ext/ext-layers.js"></script>   <!-- 加进来 -->
<script src="lessons/lesson03.js"></script>
```

规则只有两条：

1. **课程顺序 = script 顺序**（关卡编号自动重排，进度按关卡 id 记录，不受顺序影响）；
2. 跨关引用一律用**关卡名**，不写编号（本仓库示例已遵守）。

建议插在「屏幕是一张表格」之后——它们是后面「时间机器」一关里
D() 水流的构成原理，先学后看会更透。
