# V3 ImageGen 资产记录

本次使用的是内置 ImageGen 工具，输入图片作为 `reference`，输出先保留在 Codex generated-images 目录，再复制到本项目的 `assets/personas/` 并做透明边缘清理。

## 接受的资产

### Alex standing

- Source reference: `../02-personal-agent-privacy.png`
- Final file: `personas/alex-standing.png`
- Raw file: `personas/alex-standing-imagegen.png`

Prompt:

```text
Use the supplied screenshot only as a visual reference. Create a clean transparent-background 3D character cutout of the standing female persona on the left: same face, black hair in a bun, black knit sweater, cream wide-leg pants, black sneakers, holding a notebook, same thoughtful hand-on-chin pose and soft stylized 3D editorial rendering. Isolate the entire person from head to both shoes. Remove all UI, paper collage, plants, sidebar, text, shadows, and background. Preserve proportions, clothing colors, facial identity, pose, and lighting. No text, no logo, no watermark. Output a single full-body PNG with genuine transparency.
```

### Rohan standing

- Source reference: `../03-people-discovery.png`
- Final file: `personas/rohan-standing.png`
- Raw file: `personas/rohan-standing-imagegen.png`

Prompt:

```text
Use the supplied screenshot only as a visual reference. Create a clean transparent-background 3D character cutout of the standing male persona on the far right: same face, curly dark hair, round glasses, purple hoodie, dark trousers and sneakers, same thoughtful hand-on-chin pose, soft stylized 3D editorial rendering. Isolate the entire person from head to both shoes. Remove all UI, paper collage, plants, text, purple tape, shadows, and background. Preserve proportions, clothing colors, facial identity, pose, and lighting. No text, no logo, no watermark. Output a single full-body PNG with genuine transparency.
```

## 淘汰的实验

坐姿 Alex 的两次输出分别出现了棋盘格被绘制进图片、以及与原图不一致的姿态。它们保留在 `references/imagegen-experiments/` 仅用于记录，不要在网页中引用。坐姿的精确版本使用 `personas/alex-seated-source.png` 原图裁切，并配合同一纸张背景实现。

## 后续生成规则

- 需要透明资产时必须检查 PNG 是否真的有 alpha；ImageGen 预览中的棋盘格不等于真实透明。
- 需要保持身份和姿态时，每次只改一个变量，并保留原始 reference。
- UI 控件、文字、icon、渐变和边框不通过 ImageGen 生成；它们使用 CSS、SVG 或 DOM。
- 新资产使用版本化文件名，不覆盖现有 V3 文件。
