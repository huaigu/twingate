# SignalPass Agent Surface 与未来产品形态

这份文档把 SignalPass 从 Web-first 黑客松 Demo 延展到 Agent-first 产品时的边界固定下来。目标不是做一个公开的 AI 分身广场，而是让每个 Builder 拥有一个私有 Personal Agent，帮助他们发现值得认识的人、准备 Introduction，并处理别人发来的请求。

## 核心模型

```text
Human
  ├─ owns → Profile
  ├─ controls → Gate Policy
  ├─ may choose → 3D Persona
  └─ authorizes → Personal Agent

Personal Agent
  ├─ as sender → Intro Coach
  ├─ as recipient → Gatekeeper
  └─ through a host → Web / OpenClaw / Hermes / other client

SignalPass Network
  ├─ Builder discovery
  ├─ Introduction Card
  ├─ bilateral evaluation
  ├─ protected queue
  ├─ fee + refundable attention bond
  └─ receipt + consented handoff
```

### Profile、Persona、Agent 的区别

| 概念 | 是否公开 | 主要用途 | 不应该代表什么 |
| --- | --- | --- | --- |
| Profile | 是 | 说明正在做什么、想认识谁、能提供什么、当前是否开放。 | 不是全局信誉分。 |
| 3D Persona | 可选、通常公开 | 让 Builder 有一个容易记住的视觉门面。 | 不是身份认证、真人证明或用户的替身。 |
| Personal Agent | 私有 | 读取用户授权的目标和边界，推荐候选人、整理上下文、管理请求。 | 不是可以自由公开行动的第二个用户。 |
| Gate Policy | 公开摘要 + 版本哈希 | 说明接收者愿意考虑什么、当前可接触状态和希望的下一步。 | 不是平台替用户建立的黑箱评分。 |

一个人只有一个 Personal Agent；`Intro Coach` 和 `Gatekeeper` 是这个 Agent 在不同方向上的工作角色，不需要用户分别养两个机器人。

## 当前 MVP 与未来形态

### 当前黑客松 MVP

```text
Web
  → 人手动浏览 Builders
  → 人选择 Bob
  → 人填写 Introduction
  → Agent 评估
  → Bob 的受保护队列
  → Bob 接受 / 追问 / 拒绝
```

这条路径用 Alice/Bob 和 mock 或 Hunyuan evaluator 验证产品机制。它不需要 OpenClaw 或 Hermes，也不应该因为没有 Agent 宿主就无法演示。

### 黑客松的 Agent-first 增量

```text
Personal Agent
  → 读取用户目标
  → 从公开 Profile 生成候选列表
  → 解释“为什么推荐这个人”
  → 等待用户确认
  → 起草 Introduction
  → 等待用户确认费用与发送
```

Agent 辅助发现改变的是“怎么找到 Bob”，不改变“谁可以决定发送”和“谁可以决定接受”。候选推荐可以自动化，关系建立不能自动化。

### 生产形态

```text
Web / OpenClaw / Hermes / other host
  → provider-neutral SignalPass skills
  → SignalPass API and state machine
  → recipient's Personal Agent
  → human consent
  → Monad settlement + receipt
  → private introduction handoff
```

OpenClaw 和 Hermes 是客户端入口。它们可以承载 Personal Agent，也可以只作为调用工具的宿主；SignalPass 不把自己的 Profile、Introduction、Gate Policy 和资金规则复制到每个宿主里。

## Provider-neutral skills

黑客松先定义能力和权限，再写具体宿主的安装格式。下面的名字是产品能力名，不假设 OpenClaw 或 Hermes 的具体 SDK。

| Skill | 作用 | 权限 | 是否需要人确认 |
| --- | --- | --- | --- |
| `discover-builders` | 根据用户目标和公开 Profile 返回候选 Builder、匹配理由和 Profile 链接。 | 只读 | 发送前仍需确认候选人。 |
| `read-profile` | 读取某个 Builder 的公开 Profile、可接触状态和 Gate Policy 摘要。 | 只读 | 否。 |
| `draft-introduction` | 根据四个问题生成或改写 Introduction Card。 | 读用户输入、写草稿 | 发送前必须确认正文。 |
| `quote-introduction` | 计算 Evaluation Fee、Attention Bond、过期时间和报价解释。 | 只读 | 锁定前必须确认金额。 |
| `submit-introduction` | 提交已确认的 Introduction，并触发评估。 | 改变关系和资金状态 | 必须确认。 |
| `review-introduction` | 展示共同点、缺失上下文、建议问题和 Gatekeeper recommendation。 | 读取用户收到的摘要 | 接受前必须确认。 |
| `manage-introductions` | 查看自己的发送记录和接收队列，支持撤回、接受、追问或拒绝。 | 读取；部分动作会改状态 | 所有关系状态动作必须确认。 |
| `open-private-introduction` | 在双方同意后打开私密 handoff，并显示下一步。 | 读取已授权的私密上下文 | 必须确认进入私密空间。 |

每个 skill 返回的数据都要带上：

- `source_scope`：使用了哪些公开 Profile、用户输入或已同意的 Verified Context。
- `confidence`：Agent 的判断强度，不是人的信誉分。
- `status`：`suggested`、`awaiting_confirmation` 或 `confirmed`。
- `next_action`：用户现在可以做什么，不能把建议伪装成已经执行。

## Agent 辅助发现的用户体验

### 1. 一次性设置

用户创建 Profile，填写：

- 我正在构建什么
- 我希望认识什么样的人
- 我能提供什么
- 我目前是否开放
- 哪些信息可以被 Agent 使用
- 哪些动作永远需要确认

用户可以生成 3D Persona，但没有 Persona 也可以完整使用 SignalPass。

### 2. Agent 给出候选，而不是自动联系

用户可以问：

> 帮我找正在做 Monad 开发者工具，并且愿意聊基础设施合作的人。

Agent 返回少量候选，每个候选至少解释：

- 共同的构建主题
- 对方公开的想认识对象
- 这次联系可以提供什么
- 哪些信息还不确定

它不能直接发送 Introduction，也不能因为“匹配度高”就绕过用户。

### 3. Agent 起草 Introduction

用户确认候选人后，Agent 根据四个问题起草卡片。用户看到原文、修改建议和缺失上下文；系统展示 Evaluation Fee 与 Attention Bond，直到用户确认才锁定。

### 4. 对方 Agent 处理请求

Recipient 的 Personal Agent 按照用户的 Gate Policy 生成摘要：为什么可能相关、对方能提供什么、是否需要一条补充问题。Agent 不能接受关系，也不能决定罚没 bond。

### 5. 人决定后续

Recipient 可以接受、要求补充上下文或拒绝。接受后才允许进入 private introduction handoff；在此之前，双方 Agent 只能处理受限上下文。

## OpenClaw / Hermes 适配原则

1. **宿主可替换。** Web、OpenClaw、Hermes 调用同一组能力，不把核心状态机复制到宿主侧。
2. **权限最小化。** `discover-builders` 和 `read-profile` 默认只读；`submit`、`accept`、`decline`、`open-private-introduction` 是显式确认动作。
3. **用户拥有上下文。** Personal Agent 使用的目标、边界、记忆和披露权限属于用户，可查看、修改和撤回。
4. **动作可追踪。** 每个外部宿主的调用都要能回到一个 Introduction、一个用户确认和一个可复核 Receipt。
5. **不做公开自动代理。** 不允许 Agent 自动 Feed 发帖、批量私信、无限点赞或伪造真人回应。
6. **明确 AI 身份。** Agent 生成的摘要和建议必须标明来源和“recommendation, not decision”。

适配器的安装方式、宿主 API 和权限声明需要分别根据 OpenClaw、Hermes 的官方能力验证；本文件只固定 SignalPass 的产品和安全边界。

## 黑客松验收标准

黑客松可以把目标收敛为下面 6 个可演示结果：

1. Alice 能用 Personal Agent 请求“帮我找合适的 Monad Builder”。
2. Agent 返回 Bob 和可解释的推荐理由，不自动发送。
3. Alice 确认后，Agent 生成四问 Introduction Card 和透明报价。
4. Alice 确认发送后，Intro Coach 与 Bob 的 Gatekeeper 返回双方摘要。
5. Bob 通过 Web 或 Agent 宿主看到受保护请求，并明确选择接受、追问或拒绝。
6. 应用展示状态、费用/Bond 结果和 Receipt；任何尚未实现的 private handoff、真实链上结算或宿主深度集成都明确标注为下一阶段。

