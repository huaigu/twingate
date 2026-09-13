# SignalPass V3 资产切分与还原说明

这套资产包用于把 6 张 AI 生成的 V3 UI 参考图还原成真实网页。原则是：**能用 CSS / SVG / DOM 表达的元素不做位图；必须保留画面质感或人物身份的元素才保留位图**。

- 资产总览：[assets/contact-sheet.png](./assets/contact-sheet.png)
- 机器可读清单：[assets/manifest.json](./assets/manifest.json)
- 可重复执行的裁切脚本：[assets/extract_assets.py](./assets/extract_assets.py)
- ImageGen 提示词与结果记录：[assets/IMAGEGEN-PROMPTS.md](./assets/IMAGEGEN-PROMPTS.md)

## 目录结构

```text
assets/
├── personas/                 # 可以直接放进页面的透明人物位图
│   ├── alex-standing.png
│   ├── alex-standing-imagegen.png
│   ├── rohan-standing.png
│   └── rohan-standing-imagegen.png
├── avatars/                  # 卡片头像裁切；页面中以圆形容器显示
├── textures/                 # 纸张、山体、紫色拼贴、橙色笔刷等视觉参考
├── references/components/    # 每个 V3 页面/按钮的像素裁切参考，不应直接当 UI
├── references/icons/         # 既有 icon 资产参考；实现优先使用 SVG
├── references/imagegen-experiments/ # 被淘汰的 ImageGen 透明/抠图实验
├── manifest.json
└── extract_assets.py
```

## 可直接复用的生产资产

### 人物

`personas/alex-standing.png` 和 `personas/rohan-standing.png` 是用 ImageGen 依据 V3 参考图生成，再做 alpha 孤立噪点清理的透明 PNG。它们适合做大尺寸装饰人物或桌面端侧栏人物；不要把它们当作真实 3D 模型，也不要在小尺寸头像中反复缩放。

```css
.persona {
  display: block;
  width: clamp(180px, 23vw, 565px);
  height: auto;
  object-fit: contain;
  object-position: bottom center;
}
```

ImageGen 输出不是像素级抠图，因此页面仍应允许通过 `object-position` 和裁切容器调整人物落点。AI 生成的人物只解决风格和身份连续性；需要严格复刻某一张图的遮挡关系时，使用对应的 `references/components/*-source.png` 裁切作为定位参照。

### 头像

`avatars/` 中的头像来自原始 V3 PNG 的像素裁切，已对头像区域做圆形 alpha mask。推荐用 CSS 控制最终尺寸和边框：

```css
.avatar {
  width: 72px;
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  background: #d3cee9;
}
```

`*-inbox.png` 只有约 65px 的原始像素，适合 32–48px 列表头像，不要放大到 Profile 主视觉。`alex-widget.png` 保留了选中蓝环和勾号，属于 Widget 选择器参考，不要当作无状态头像。

## 不应做成图片的元素

| 元素 | 还原方式 | 原因 |
| --- | --- | --- |
| Button | HTML button + CSS | 需要 hover、focus、disabled、点击状态和可访问性 |
| Container / Card | DOM + CSS background/border/shadow | 需要响应式高度、内容溢出和动态状态 |
| Icon | Lucide/Phosphor 或项目内联 SVG | 保证笔画、颜色、尺寸和无障碍标签可控 |
| 文案 | HTML 文本 | ImageGen/OCR 不能保证文字准确，也无法响应式换行 |
| Signal line / arrows | SVG 或 CSS | 需要动画、方向和交互态 |
| 3D Persona | 透明 PNG；若有真实模型再换 Three.js | 保留人物视觉质感，避免把人物拆成错误的矢量图 |

`references/components/button-*.png` 是按钮的像素参照，不能直接作为 `<img>` 使用。它们用于测量高度、圆角、边框、文字位置和渐变方向。

## 从像素图测得的视觉 Tokens

以下颜色从 V3 原图的平坦区域取样，是 CSS 起始值，不是设计系统的绝对真值。纹理、纸张纤维和轻微噪点应通过背景图片或 CSS overlay 叠加，不要把整张页面当背景图。

```css
:root {
  --sp-paper: #efe5dc;          /* 页面纸张底色 */
  --sp-card: #efe6dc;           /* 卡片纸张近似色 */
  --sp-ink: #050728;            /* 深蓝黑正文 */
  --sp-primary: #2117b8;        /* Monad / CTA indigo */
  --sp-primary-hi: #2f24d6;     /* CTA 高光，可选 */
  --sp-orange: #fc8b2b;         /* 手绘 underline */
  --sp-green-soft: #b6c8c6;     /* Shared curiosity / success */
  --sp-lavender: #d3cee9;       /* Agent / selected surface */
  --sp-lavender-selected: #dfd6f6;
  --sp-danger-soft: #eed7d4;
  --sp-border: rgba(5, 7, 40, .24);
  --sp-shadow: 0 18px 36px rgba(64, 42, 26, .12);
}

.sp-primary-button {
  background: linear-gradient(135deg, var(--sp-primary-hi), var(--sp-primary));
  border-radius: 999px;
}
```

原图 CTA 横向颜色变化很小，视觉上更接近深靛色而不是明显渐变；如果截图对比出现色带，先改成 `background: var(--sp-primary)` 再验收。`textures/brush-orange-reference.png` 可作为橙色笔刷的形状参考，实际网页建议用现有透明笔刷 PNG 或 SVG mask。

## 组件裁切参考如何使用

`references/components/` 里的图片都保留了原始像素比例和上下文，方便开发 Agent 对照定位：

- `profile-source-import.png` / `profile-draft.png`：Profile 导入与审核的两张卡。
- `public-profile-visibility.png` / `agent-matching.png`：两个必须独立的隐私控制区。
- `interests-curiosities.png` / `allowed-data-sources.png`：兴趣标签和来源选择。
- `discovery-query.png` / `discovery-results.png`：自然语言发现输入、目标按钮和候选卡片。
- `widget-editor.png` / `widget-preview.png` / `widget-embed.png`：Widget 编辑、预览和嵌入代码。
- `introduction-agent-panel.png` / `introduction-card.png`：Introduction 草稿、共享上下文和确认按钮。
- `recipient-list.png` / `recipient-detail.png`：接收方列表、摘要和 Accept / Ask / Decline。
- `button-*.png`：各个页面的 CTA / secondary / danger 样式参照。

每个裁切的原图、坐标和角色都记录在 `manifest.json` 的 `crop_xywh`、`source` 和 `role` 字段中。需要重新裁切时执行：

```bash
python3 design-explorations/signalpass-v3/assets/extract_assets.py
```

## ImageGen 使用记录与限制

ImageGen 只用于三类任务：透明人物资产、无法找到原始文件的装饰性插画、以及需要保留生成图质感的视觉补全。它不用于按钮、容器、文字或 icon 的结构识别，因为这些元素要求确定性、可访问性和响应式行为。

本次接受的 ImageGen 资产：

1. Alex standing：保留黑色针织衫、米色裤子、笔记本和托腮姿态。
2. Rohan standing：保留紫色 hoodie、圆眼镜和托腮姿态。

坐姿 Alex 的实验输出出现了棋盘格背景或姿态漂移，已经放入 `references/imagegen-experiments/`，不进入生产资产清单。需要精确复刻坐姿时，使用 `personas/alex-seated-source.png` 作为原图裁切参照，并在相同纸张背景上用 CSS 组合。

## 页面实现时的优先级

1. 先用 CSS/DOM 重建布局、卡片、按钮、文字和 icon。
2. 放入 `personas/*.png` 和 `avatars/*.png`，再调 `object-position`、层级和裁切。
3. 用 `textures/` 中的山体、紫色拼贴和纸张参照还原边角装饰；这些是 placement-bound bitmap，不要拉伸成整页背景。
4. 固定 `1440×900` 和 `390×844` 截图，对照六张原图逐页校准。
5. 所有动效只作用于 DOM/SVG 层：Signal line、hover、面板切换和确认状态不应写死在 PNG 中。

## 已知精度边界

- AI 生成的人物是风格一致的近似资产，不保证每根头发和原图像素一致。
- 原图中的字体、抗锯齿和纸张纹理受生成模型影响，CSS 只能近似；必须固定字体和浏览器做截图验收。
- inbox 小头像来自低分辨率区域，只适合列表尺寸；需要更大头像应使用 `avatars/*-card.png` 或重新生成高分辨率肖像。
- 页面文案、匹配分数和状态必须由 HTML 数据渲染，不能依赖截图中的文字。
