# SignalPass 桌面精修与动效验收

日期：2026-09-28。起点：9410b00。本轮优先完善桌面阅读、交互反馈与演示节奏，延续现有纸张拼贴和人物插画。

## 已完成

1. 首页连接揭示缩短到约 2.8 秒，增加显式重播按钮；人物、节点和主要操作的位置保持稳定。
2. 人物卡片调整字体与头像占比，突出姓名、介绍及资料入口；桌面精细指针增加最多每轴 1.2° 倾斜与 4px 抬升，离开或键盘聚焦时恢复。
3. 阅读区域增加一次性、360ms 入场，交错延迟最多 135ms；静态回退不隐藏内容。
4. 写信区域根据四个文本框的实际填写数量显示进度，并强化当前字段。计数只代表草稿填写情况，不表示审核、发送或支付。
5. 对话框增加 190ms 入场、菜单增加 160ms 入场，保留键盘操作、Escape 关闭和焦点恢复。
6. 仅在回执已接受时显示一次性确认印章；待处理状态不会提前显示成功。收件人的审批说明改为 Approved by sender。

动画支持系统减少动态效果设置及其运行时切换，触控设备禁用卡片倾斜，页面隐藏时暂停所管理的动画，退出时清理。未新增动画依赖。

## 验证结果

| 检查 | 结果 | 记录 |
| --- | --- | --- |
| pnpm verify | 通过：类型检查、47 个合约测试、API/indexer、真实用户和重启回归、示例模式回归 | .run/motion-pass/product-regression.log |
| CHAIN_TEST_MOTION=enabled pnpm chain:verify | 通过：正常动效下的真实本地 EVM 钱包切网、资料同步、取消、锁定、上下文交换、接受、拒绝、过期与退款 | .run/motion-pass/wallet-regression.log |
| pnpm motion:record | 通过：动效生命周期、重播、减少动态效果、键盘焦点、草稿计数、接受印章和 16 组路由/视口检查 | .run/motion-pass/verify.log |
| pnpm build | 生产构建通过 | .run/motion-pass/build.log |
| 补充布局检查 | 28 组路由/断点通过；360–1920px 无横向溢出、标题重叠或缺图；被测操作区域至少 44px | .run/motion-pass/layout-check.log |
| 录像与对比页面 | 浏览器验证媒体元数据、实际播放和对比页面交互通过 | .run/motion-pass/media-check.json |

动效路由覆盖首页、发现、写信与回执，重点视口为 1280、1440、1920px，保留 390px 回归。未发现被测路径中的 JavaScript 错误、损坏图片或无限动画。

## 本地体验与交付

- 实际应用：http://localhost:3005/?demo=0
- 明确的示例模式：http://localhost:3005/?demo=1
- 当前对比预览：http://127.0.0.1:54701/review.html（端口记录于 .run/motion-pass/preview.json）
- 对比页面：.run/motion-pass/review.html
- 桌面录像：.run/motion-pass/desktop-tour.webm，16.16 秒、1440×900、1,918,375 字节。
- 前后截图：.run/ui-polish/motion-before/ 与 .run/ui-polish/motion-after/。
- 动效规范：design-explorations/signalpass-v4/polish/MOTION.md。

录像明确使用示例模式，展示首页、人物卡片、资料对话框、写信、确认与接受回执，不代表对外发送或公开链支付。验收日志和录像是忽略提交的本地 .run 产物。

## 边界与下一步

Hunyuan 保持未配置，沿用人工审核与零 AI 费用；链验证在本地 EVM（31337 / DEV）完成，未发送公开测试网交易。动效层不调用业务写入 API，也不推进任何业务或资金状态。

本轮环境不支持图片输入，因此已验证的是浏览器行为、几何尺寸、资源完整性、动画状态和真实交互，尚不能声称完成逐像素主观视觉审阅。下一步请在桌面操作页面或观看录像，评估纸张动效的力度、节奏与阅读感受；据反馈再做定点调整。
