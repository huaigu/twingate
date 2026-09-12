# SignalPass 产品方向与目标架构

> 规范定位：SignalPass 是 Monad 上面向 Builder 的高信号介绍网络。它不是新的聊天协议，也不是面向开发者出售的基础设施；它用用户自有的 Agent Persona、结构化介绍、发起人承担评估成本和可验证的注意力承诺，让陌生联系变得有上下文、可选择、可追溯。

## 1. 一句话定位

SignalPass 把冷私信变成一次郑重的介绍：发起人说明“我是谁、我为什么找你、我能提供什么、下一步想做什么”，承担对方 Agent 评估这次请求的推理成本，并在接收者明确同意后打开私密介绍。

主赛道是 **03 Social, Attention & Culture**。产品的核心价值是让 Monad Builder 更容易发现和建立有意义的合作关系，而不是让第三方应用构建在一套公共 API 之上。

## 2. 社交体验，而不是表单加交易

SignalPass 的交互单位是 Introduction，不是 Message。

1. Builder 创建一张 Profile：正在做什么、希望认识谁、能提供什么、当前的可接触状态。
2. Builder 可以选择生成一个 3D Agent Persona，作为自己在网络中的数字门面。
3. 另一位 Builder 发起一张 Introduction Card，而不是直接发送冷私信。
4. 两个私人 Concierge Agent 完成一次受限上下文的评估，主人只看到可行动的总结。
5. 接收者选择接受、要求补充或婉拒；接受后才打开私密介绍空间。

目标体验是“认真地认识一个人”，不是在收件箱里处理一串支付交易。

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

## 8. 黑客松 MVP

1. Alice 用 Dynamic 登录，获得嵌入式钱包，并创建自己的 Builder Profile。
2. Alice 选择生成一个 3D Agent Persona；该资产在 Profile 中异步出现。
3. Alice 找到 Bob 的 Profile，写一张 Introduction Card，并选择是否披露自己的 Verified Context。
4. 应用展示 Introduction Evaluation Fee 与 Attention Bond；Alice 签名并在 Monad 锁定它们。
5. Hunyuan 进行私人双侧评估：Alice 得到改进建议，Bob 得到匹配摘要和下一步。
6. Envio 让 Bob 的受保护介绍队列和活动视图由真实合约事件实时更新。
7. Bob 接受、要求补充或婉拒；接受时两人进入私密介绍空间，应用展示回执和资金状态。

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
- 不把 Agent SDK、MCP Server 或公共 A2A 协议作为黑客松 MVP 的交付目标。
- 不让 AI 或钱包余额单独决定人的价值、对话资格或资金罚没。

## 11. 研究来源

- [Hunyuan 3D API](https://www.tencentcloud.com/document/product/1284/75540)
- [XMTP: User consent preferences](https://docs.xmtp.org/chat-apps/user-consent/user-consent)
- [Push Chat: Architecture, request inbox and spam prevention](https://comms.push.org/docs/chat/concepts/push-chat-architecture/)
- [LinkedIn: InMail message credits and renewal process](https://www.linkedin.com/help/linkedin/answer/a543695/inmail-message-credits-and-renewal-process)
- [Cal.com: Routing Forms](https://calcom-cal-com.mintlify.app/features/routing-forms)
- [Nansen API](https://docs.nansen.ai/)
