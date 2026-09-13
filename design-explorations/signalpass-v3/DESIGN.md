# SignalPass V3 页面设计

V3 继续保持首页原 Hero 的纸张拼贴、Alice/Bob 3D Persona、Introduction Card 和 Monad violet signal line。变化集中在“任何人都可以被理解和发现”这一层：Builder 是黑客松示例，产品本身面向所有愿意认识新人的人。

核心一句话：**People worth knowing, with context.**

## 页面清单

| 文件 | 页面 | 作用 |
| --- | --- | --- |
| `01-profile-source-import.png` | Profile source import | 社交登录后选择 GitHub、Twitter/X、个人网站或自己的 Agent 作为资料来源；Agent 生成草稿，用户审核。 |
| `02-personal-agent-privacy.png` | Personal Agent privacy | 将 Profile visibility 与 Agent matching 分开；Private Profile 也可以打开私有匹配。 |
| `03-people-discovery.png` | People discovery | 用自然语言表达“我最近对什么好奇”，按 Chat / Collaborate / Learn 生成少量候选和解释。 |
| `04-profile-widget.png` | Profile Widget | 生成一个用于个人网站的轻量数字名片：3D Persona、名字、一句话和 3–5 个公开兴趣标签。 |
| `05-introduction-composer.png` | Broad Introduction composer | Agent 起草一次聊天、合作或学习的介绍，用户编辑并批准后发送。 |
| `06-recipient-inbox.png` | Recipient inbox | 接收方 Agent 过滤和总结，接收方本人选择 Accept / Ask for context / Decline。 |

配套的页面连接骨架见 [V3 流转图](./flow-v3.html) 和 [流转说明](./FLOW.md)。
页面还原资产见 [资产切分说明](./ASSETS.md) 与 [资产总览](./assets/contact-sheet.png)。

## V3 主流程

```text
Social login
  → Add sources（GitHub / Twitter / website / own Agent）
  → Agent Profile Draft
  → User reviews and publishes
  → Optional Profile Widget
  → User turns Agent matching on
  → “I’m curious about…”
  → Agent returns explained shortlist
  → User chooses a person
  → Agent drafts Introduction
  → User approves and sends
  → Recipient Agent summarizes
  → Recipient accepts / asks for context / declines
```

## 隐私和权限

```text
Profile visibility: Public / Limited / Private
Allow Agent matching: On / Off
```

两个开关独立存在。Private Profile + matching On 时，服务器可以在双方都授权后比较兴趣和目标，但默认只返回抽象共同点；原始兴趣、Agent memory 和私有 Gate Policy 不进入公开页面或 Widget。

每个 Agent 的动作都标记为：

- `suggested`：只读建议，还没有改变任何状态。
- `awaiting confirmation`：草稿或报价等待用户确认。
- `confirmed`：用户批准后才发送、发布或改变关系状态。

## 黑客松范围

本次黑客松优先实现一个真实可运行的薄闭环：

1. 社交登录后粘贴 GitHub 或公开链接。
2. Agent 根据资料生成 Profile Draft，用户编辑并批准。
3. Agent 根据自然语言目标返回少量候选和匹配理由。
4. 用户选择候选人，生成 Introduction Draft。
5. 用户确认后发送，接收方看到 Agent 摘要并做决定。
6. Widget 做成可复制的公开名片 v0。

LangGraph（或同等 workflow）负责状态编排，匹配器使用兴趣相似度、目标对齐、能力互补和 availability fit 的透明组合；前台显示理由，不显示单一匹配分数。

## 非目标

- 不做公开 AI Feed。
- 不让 Agent 自动私信、发帖、点赞或代替用户建立关系。
- 不把未验证的 Twitter/GitHub 链接显示成身份或信誉证明。
- 不要求钱包才能创建 Profile 或参与匹配。
- 不把 OpenClaw / Hermes 的具体 SDK 当作 SignalPass 核心依赖；它们是可替换的 Agent 宿主。
