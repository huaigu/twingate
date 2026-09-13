# SignalPass 产品方向与目标架构

> 规范定位：SignalPass 是 Monad 上面向 Builder 的高信号介绍网络。它不是新的聊天协议，也不是面向开发者出售的基础设施；它用用户自有的 Agent Persona、结构化介绍、发起人承担评估成本和可验证的注意力承诺，让陌生联系变得有上下文、可选择、可追溯。

## 1. 一句话定位

SignalPass 把冷私信变成一次郑重的介绍：发起人说明“我是谁、我为什么找你、我能提供什么、下一步想做什么”，承担对方 Agent 评估这次请求的推理成本，并在接收者明确同意后打开私密介绍。

主赛道是 **03 Social, Attention & Culture**。产品的核心价值是让 Monad Builder 更容易发现和建立有意义的合作关系，而不是让第三方应用构建在一套公共 API 之上。

### 1.1 未来形态：一人一私有 Agent，一张公开 Profile，可选 Persona

SignalPass 的长期形态不是一个由公开数字分身组成的内容广场，而是一个由个人 Agent 协助发现、由人确认的高信号关系网络。

- **Human** 是身份、注意力、授权和最终决定的拥有者。
- **Profile** 是用户主动发布的公开意图：正在做什么、想认识谁、能提供什么、当前是否开放。
- **Personal Agent** 是用户的私有 Concierge，了解用户的兴趣、边界、目标和沟通偏好。
- **Persona** 是可选的 3D 数字门面，帮助别人记住这个人；它不是身份认证、信誉分或真人替身。
- 同一个 Personal Agent 在发起介绍时扮演 **Intro Coach**，在接收介绍时扮演 **Gatekeeper**。

Agent 可以发现候选人、解释推荐理由、整理上下文和提醒用户，但不能未经确认公开发帖、自动发送介绍、替用户接受关系或单独决定资金结果。

OpenClaw、Hermes 等 Agent 宿主是未来的入口适配器，不是 SignalPass 的产品本体。用户可以通过它们使用同一套 SignalPass Agent 能力，但 Profile、Introduction、Gate Policy、评估和同意规则仍属于 SignalPass。

## 2. 社交体验，而不是表单加交易

SignalPass 的交互单位是 Introduction，不是 Message。

1. Builder 创建一张 Profile：正在做什么、希望认识谁、能提供什么、当前的可接触状态。
2. Builder 可以选择生成一个 3D Agent Persona，作为自己在网络中的数字门面。
3. 另一位 Builder 发起一张 Introduction Card，而不是直接发送冷私信。
4. 两个私人 Concierge Agent 完成一次受限上下文的评估，主人只看到可行动的总结。
5. 接收者选择接受、要求补充或婉拒；接受后才打开私密介绍空间。

目标体验是“认真地认识一个人”，不是在收件箱里处理一串支付交易。

当前黑客松 MVP 保留人工发现：用户先在 Builder 目录中选择一个具体对象。Agent 辅助发现属于下一步增强：Personal Agent 可以从公开 Profile 和用户自己的目标中生成候选列表，但每次发送 Introduction 之前仍需要用户确认。

## 3. 3D Agent Persona

Hunyuan 3D 用于在 Profile 创建或更新时生成可选的 Agent Persona。用户可提供一张自己拥有使用权的图片，或使用文字描述一个代表其兴趣和工作方式的数字形象。

- Persona 是可自定义的社交呈现，不是身份认证、真人证明或信誉分。
- 3D 生成是异步后台任务，生成结果缓存为展示资产；介绍请求不等待它完成。
- 用户没有 3D Persona 时，产品仍完整可用，并提供静态默认形象。
- Persona 在个人主页、Introduction Card 和已接受的私密介绍中出现，让 Agent 成为社交存在而非不可见的黑箱。

## 4. 隐形的 Agent Handshake

Agent-to-Agent 交互是产品的内部机制，不是用户需要学习的协议。

### 4.1 发起人侧：Intro Coach

在发起人确认报价并锁定资金后，Hunyuan 的 Intro Coach 检查请求是否具备足够上下文。它可以要求补充一个关键问题，或将原始草稿整理为简洁、尊重对方注意力的 Introduction Card。

### 4.2 接收者侧：Gatekeeper

同一次评估也会由接收者的 Gatekeeper 映射到其公开的、可版本化的偏好，例如合作主题、当前可接触状态和希望的下一步。Gatekeeper 产出：

- 这次介绍为什么可能相关，或为什么当前不合适。
- 一个可解释的建议：review、ask for context 或 not now。
- 面向接收者的三条摘要与建议开场问题。

模型不自动打开私密介绍，也不单独决定资金罚没。最终同意权始终属于接收者。

### 4.3 前台只显示结果

Agent 间的原始对话、私有策略文本、Prompt、内部评分和未经授权的钱包数据都不在前台展示。双方主人只看见：

| 对象 | 可见结果 |
| --- | --- |
| 发起人 | 是否进入 Review、需要补充什么、下一步可做什么。 |
| 接收者 | 为什么值得看、对方提供什么、是否接受或追问。 |

### 4.4 Personal Agent 与入口适配器

用户不需要理解 Intro Coach 和 Gatekeeper 是两个独立的机器人。产品层面只有一个属于用户的 Personal Agent，它在不同场景承担不同职责：

| 场景 | Personal Agent 的职责 | 人必须确认什么 |
| --- | --- | --- |
| 发现 | 根据 Profile、目标和边界推荐候选 Builder，并解释原因。 | 是否查看候选人、是否发起介绍。 |
| 发起 | 把四个问题整理成 Introduction Card，指出缺失上下文。 | 卡片内容、披露信号、Evaluation Fee、Attention Bond 和发送动作。 |
| 接收 | 把陌生请求映射到用户的 Gate Policy，生成摘要和建议。 | 接受、要求补充上下文或拒绝。 |
| 后续 | 在双方同意后准备开场问题、约定下一步或整理回顾。 | 是否继续沟通、是否授权更多动作。 |

Web、OpenClaw、Hermes 或其他宿主都只实现入口适配器。黑客松先提供一个 provider-neutral 的 Agent surface 和一个 Web 参考客户端，再为 OpenClaw/Hermes 提供可复用的 skills；不把任何一个宿主写成协议依赖。

## 5. 费用与公平边界

“想接触某个人，就承担让对方安全评估你的成本”是 SignalPass 的社会契约，但这不等于付钱购买对方的聊天许可。

| 项目 | 付款方 | 目的 | 规则 |
| --- | --- | --- | --- |
| Persona generation fee | Profile owner | 生成可选 3D Agent Persona。 | 与陌生介绍无关，异步计费。 |
| Introduction Evaluation Fee | Sender | 覆盖 Intro Coach 与对方 Gatekeeper 的推理、评估回执和必要的结算成本。 | 报价透明、不可退；接收者从不为陌生请求付推理费。 |
| Attention Bond | Sender | 在请求未决期间表达可验证的注意力承诺，并限制批量骚扰吞吐。 | 按公开的超时和结算规则处理；LLM 不能单独没收。 |

MVP 至少实行每个发起人对同一接收者的未决请求上限与明确的自动超时退款。接收者不能无限期占用发起人资金；任何确定性罚没规则必须公开并提供申诉路径。

## 6. Nansen Verified Context

Nansen 是 Gatekeeper 的可选上下文，而不是全局信誉排序器。

用户可以选择将少量相关链上事实附在 Introduction Card 上，例如与 Monad 的公开交互、已部署的合约或经用户认可的生态活动。Gatekeeper 只使用实际可用且已获授权的信号，并在摘要中解释它为何与这次介绍有关。

- 不展示原始余额、资产组合或“谁更有钱”式排名。
- 不生成不可解释的单一信誉分。
- 不让 Nansen 数据独立接受、拒绝或罚没任何请求。
- 不具备所需链上覆盖时，产品优雅退化为不带 Verified Context 的介绍。

这让钱包成为可选择的社交上下文，而不是新人必须跨越的门槛。

## 7. 技术边界

交付物落在 **7 个自建部分**上：6 个链下单元 + 1 组链上合约。三处外部依赖（Dynamic / Hunyuan / Nansen）按下述边界接入，不与自建部分混作一层。

### 链上

`packages/contracts` —— Monad 合约只保存可结算和可验证的最小事实，不保存原文与模型上下文。

| 合约 | 保存什么 |
| --- | --- |
| `ProfileRegistry` | Profile 与 Gate 策略及其版本哈希。 |
| `IntroductionEscrow` | 报价、Evaluation Fee、Attention Bond、请求状态机与超时窗口。 |
| `IntroductionReceipt` | 双方同意后的结果回执哈希。 |

### 链下

| 自建部分 | 位置 | 负责什么 |
| --- | --- | --- |
| 网页 | `apps/web` | 唯一的用户界面：Builder Profile、Introduction Card 编写、受保护队列、回执与状态页。 |
| 编排 API | `services/api` | 最小化上下文编排：报价、落 Introduction、调用评估、驱动状态机、向接收者开放队列，以及加密载荷与通知。 |
| Agent 服务 | `services/evaluator` | Intro Coach 与 Gatekeeper 的双侧受限评估，以及可选的 3D Agent Persona。 |
| 索引服务 | `services/indexer` | 基于 Envio HyperIndex 索引事件，建立请求队列、回执历史与非敏感的聚合队列健康度。 |
| 领域内核 | `packages/core` | 状态机、报价曲线、schema 与 EIP-712。API 与 Agent 共用同一份，避免两端规则漂移。 |
| 端到端验证 | `scripts/e2e.mjs` | 拉起服务跑完整链路；不参与运行时。 |

### 外部依赖

- Dynamic：登录、嵌入式钱包和签名。
- Tencent Hunyuan：3D Agent Persona 的生成，以及 Intro Coach / Gatekeeper 的受限评估。
- Nansen：用户授权的 Verified Context。

原文、原始 Agent 对话、模型上下文、向量、内部评分和未经许可的 Nansen 数据都不直接上链。

### Agent-facing surface（黑客松目标）

黑客松目标是先稳定能力边界，再接入具体宿主。建议提供以下 provider-neutral skills：

1. `discover-builders`：只读地返回候选 Builder、匹配理由和公开 Profile 链接。
2. `draft-introduction`：根据用户确认的对象和四个问题生成 Introduction 草稿。
3. `quote-introduction`：展示 Evaluation Fee、Attention Bond、过期时间和影响报价的因素。
4. `submit-introduction`：只有在用户明确确认卡片和报价后，才锁定请求。
5. `review-introduction`：把 Gatekeeper 结果整理为共同点、缺失上下文和下一步建议。
6. `manage-introductions`：查询自己的发送记录和接收队列，支持查看、撤回和决定。

所有 skill 都必须返回结构化结果和来源范围，并明确区分 `suggested` 与 `confirmed`。`submit-introduction`、`accept`、`decline` 和任何涉及资金或关系状态的动作都必须有人的显式确认；Agent 不能通过宿主权限绕过这一层。

## 8. 黑客松 MVP 与 Agent-first 目标

### 8.1 必须交付的垂直闭环

1. Alice 用 Web 参考客户端创建或读取自己的 Builder Profile。
2. Alice 在 Builder 目录中手动选择 Bob；目录推荐不是本阶段的前置依赖。
3. Alice 写一张四问 Introduction Card，并选择是否披露 Verified Context。
4. 应用展示 Introduction Evaluation Fee 与 Attention Bond；Alice 明确确认后锁定请求。
5. Intro Coach 与 Gatekeeper 运行一次受限的双侧评估；Alice 得到改进建议，Bob 得到共同点摘要。
6. `ready_for_review` 请求进入 Bob 的受保护队列；Bob 接受、要求补充上下文或拒绝。
7. 应用展示可复核的 Receipt、资金状态和下一步；接受后的私密介绍可以先是诚实标注的 handoff 页面，不能伪装成已完成的聊天网络。

### 8.2 本次黑客松新增的 Agent-first 目标

1. 提供一个官方的 Personal Agent 参考实现，包含上述 provider-neutral skills。
2. 增加 `discover-builders`：Agent 读取公开 Profile，根据用户目标返回候选人和解释，不自动联系任何人。
3. 允许用户通过一个 Web 聊天式面板，或一个宿主适配器，调用同一套 skills。
4. 为 OpenClaw 和 Hermes 提供最小适配说明或示例 skill 包；适配器只调用 SignalPass surface，不复制状态机和资金规则。
5. 在每次 Agent 动作旁显示“建议 / 待确认 / 已确认”，让用户知道什么时候只是推荐，什么时候会改变关系或资金状态。

### 8.3 明确延期到生产阶段

- 多宿主的稳定发布、权限模型和版本兼容。
- 用户自己的长期 Agent memory、加密存储、删除和迁移。
- Dynamic 登录、真实 Monad 结算、Envio 实时读模型和真实 Nansen 数据接入。
- 接受后的长期私密沟通、日程协作和跨平台通知。
- 大规模自动候选排序、公开社交 Feed 和 Agent 自主发帖。

## 9. 已选 Sponsor Bounties

| Sponsor | 核心贡献 |
| --- | --- |
| Tencent Hunyuan | 3D Agent Persona 与深度互动的双侧介绍评估。 |
| Dynamic | 无插件的登录、嵌入式钱包和注意力承诺签名。 |
| Envio | 请求生命周期、队列和聚合实体的实时读模型。 |
| Nansen | 经同意披露的、可解释的 Builder Verified Context。 |

详细验收计划保存在仓库之外，因为它不属提交物。

## 10. 明确不做

- 不做公开 Feed、交易式注意力市场或完整聊天平台。
- 不要求用户安装浏览器插件、管理助记词或理解 Gas。
- 不把某个 Agent 宿主的 SDK、MCP Server 或公共 A2A 协议当成 SignalPass 的核心协议；黑客松只提供 provider-neutral surface 和最小适配器。
- 不让 AI 或钱包余额单独决定人的价值、对话资格或资金罚没。
- 不让 Personal Agent 代替用户公开行动；所有关系和资金动作都需要人的明确确认。

## 11. 研究来源

- [Hunyuan 3D API](https://www.tencentcloud.com/document/product/1284/75540)
- [XMTP: User consent preferences](https://docs.xmtp.org/chat-apps/user-consent/user-consent)
- [Push Chat: Architecture, request inbox and spam prevention](https://comms.push.org/docs/chat/concepts/push-chat-architecture/)
- [LinkedIn: InMail message credits and renewal process](https://www.linkedin.com/help/linkedin/answer/a543695/inmail-message-credits-and-renewal-process)
- [Cal.com: Routing Forms](https://calcom-cal-com.mintlify.app/features/routing-forms)
- [Nansen API](https://docs.nansen.ai/)
