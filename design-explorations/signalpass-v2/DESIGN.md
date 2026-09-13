# SignalPass Homepage / Product Pages V2

V2 保留首页原 Hero 主视觉：纸张拼贴、Alice/Bob 3D Builder Persona、中央 Introduction Card、Monad violet signal line 和原有构图不变。

V2 的变化集中在 Hero 之后和相关页面：每个人有一个私有 Personal Agent；公开的是 Builder Profile；3D Persona 是可选的视觉门面；Agent 只做建议和准备，用户确认后才发送或接受 Introduction。

## 视觉稿清单

| 文件 | 对应页面 | 重点 |
| --- | --- | --- |
| `01-builders-agent-assisted.png` | Builders / Find builders | Agent 从公开 Profile 返回候选和“Why this match”，并保留手动 Browse all builders。 |
| `02-profile-personal-agent.png` | Builder Profile | 将公开资料和私有 Personal Agent / Gate Policy 分开。 |
| `03-introduction-agent-draft.png` | Introduction Composer | Agent 起草，用户编辑并在发送前确认。 |
| `04-inbox-agent-review.png` | Recipient Inbox | Agent 过滤并总结，Recipient 做最终选择。 |
| `05-hero-agent-actions-storyboard.png` | Hero interaction storyboard | 原 Hero 不变，补充 Agent suggests、You review、Save for later 三个状态。 |

## V2 页面流转

```text
Homepage Hero
  → Explore introductions
Builders / Find builders
  → Ask my agent（只读建议）
  → View profile
Builder Profile
  → Start an introduction
Introduction Composer
  → Agent draft
  → User edits
  → Approve and send
Recipient Inbox
  → Agent summary
  → Accept introduction / Ask for context / Decline introduction
Receipt
  → Private handoff（双方同意后）
```

## 实现边界

- 当前 Web 端已经加入 Agent-assisted discovery 的交互展示；推荐基于公开 Profile 的本地数据，属于可解释的 MVP 演示。
- `Ask my agent` 只展示建议，不自动联系 Builder。
- Composer 的 Agent 草稿明确标为 `suggestion · not sent`，主按钮是 `Approve and send`。
- Inbox 的 Agent 说明明确标为 `Suggestion, not decision`。
- OpenClaw / Hermes 仍是未来的宿主适配器，本轮没有伪造它们已经接入。
- 首页原 Hero 图片和交互热点保持不变，v2 只扩展下游页面和信息层级。

