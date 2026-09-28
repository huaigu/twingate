# SignalPass：AI 技术复审与黑客松取舍

**研究截止：2026-09-27；本地代码基线：`08247a6`，同时检查工作区现有文件。**

本报告核验官方规范、官方文档、官方 GitHub release 和一个只读公开能力端点；未读取密钥，未调用付费模型，未发送交易，未修改产品代码。版本表中的“发布”来自 release 元数据；没有明确发布日期的持续更新文档只标记本次核验日期，不把网页缓存时间当作发布日。

## 1. 决策结论

**需要修改，但应加深现有产品，而不是改造成多协议 Agent 平台。** 最值得赢得评委注意的技术主张是：**用户批准的上下文变成可核对的介绍；发起人承担评估费；接收方得到有证据、有边界的建议；双方人的决定通过真实状态机和资金回执落实。**

这是一项产品判断，不是获奖概率预测。优先级如下：

| 优先级 | 应做的修改 | 为什么值得做 | 完成证据 |
| --- | --- | --- | --- |
| P0 | Hunyuan 真实调用、严格结果校验、明确标识降级 | 从模板摘要变成可验证的 AI 产品 | 一次可复现请求，provider/model/request 标识，脱敏 trace，失败时显示真实状态 |
| P0 | 来源批准 → Profile 草稿 → 字段级证据 → 用户发布 | 让“个人 Agent”真正减少用户整理自己的负担 | 用户可逐字段查看来源、编辑、拒绝和撤回 |
| P0 | 小规模候选集的可解释匹配 | 让用户体验到“找到了值得认识的人” | 每条理由关联双方允许使用的事实；缺证据就显示未知 |
| P0 | 双侧上下文隔离、确认绑定、持久化与幂等 | 信任和资金语义不能只靠 Prompt | 越权、篡改、重放、重启、模型失败用例通过 |
| P0 | 小型离线评测和现场质量证据 | 证明推荐并非随机生成的漂亮文案 | 带版本的数据集、结果、失败案例和真实用量 |
| P1 | 一个可工作的宿主适配器 / MCP surface | 展示同一产品能力可被外部 Agent 使用 | 同一用户权限和确认策略，完成一条实际调用 |
| P1（有余力） | x402 的推理服务付费演示 | 与“发起人支付评估成本”有直接关系 | Monad 测试网上真实 402 → 授权 → 服务 → 可核对结算 |
| P2 | A2A、ERC-8004、多个宿主、长期记忆 | 只有跨组织互操作需求真实出现后才产生收益 | 不纳入当前核心闭环依赖 |

**不要为了展示“最新 AI”同时加上 A2A、MCP、x402、ERC-8004、向量数据库、长期记忆与自主浏览器。** 当前最缺的是能力真实性、授权边界和产品闭环，而不是名词密度。

## 2. 当前实现到底证明了什么

以下是代码观察，置信度高；只表示这次审阅到的工作区状态，不表示服务已部署。

| 代码 / 文档证据 | 观察 | 对外表述边界 |
| --- | --- | --- |
| `services/evaluator/src/hunyuan.ts` | 一次 `/chat/completions` 请求同时产出 sender coach 和 recipient summary；使用 `response_format: json_object` | 可以称“双侧受限评估设计”；不能据此称“两个独立私有 Agent 已互相协商” |
| 同上；`services/evaluator/src/types.ts` | 手工提取 JSON；检查 recommendation enum；其他字段做类型过滤、截断、默认值；没有完整结果 schema 拒绝策略 | 不是完整的 schema-constrained evaluation；缺失的三条摘要可能被悄悄变成空数组 |
| `services/evaluator/src/index.ts`；`services/api/src/index.ts` | 无配置或调用失败存在 mock fallback | fallback 适合离线演示；真实评估失败不能被 UI 或付费回执伪装成 Hunyuan 成功 |
| `services/api/src/store.ts` | `Map` 保存 Profile、policy、introduction 和 evaluation outcome | 当前数据会随进程丢失，不能称为持久化 Personal Agent 或可恢复工作流 |
| `docs/SIGNALPASS_AGENT_SURFACES.md` | 设计包含来源导入、私有 matching、LangGraph 或等价编排、provider-neutral skills | 规范不是实现证据；需要 endpoint、真实状态和演示验证 |
| evaluator/API/core `package.json` 与 lockfile | 当前主要依赖 Hono、Zod、Viem；未发现 MCP、A2A、x402、ERC-8004 或 LangGraph 的已实现调用证据 | 安装包也不能证明接入；更不能将设计文档中的协议算作 sponsor integration |
| `services/evaluator/src/hunyuan.ts` 的 persona adapter | 接收自定义 endpoint，发送 `prompt/source_kind/format`，读取 `task_id/asset_url` | 它可能适配自建网关；不能直接称为已完成腾讯官方 3D API 集成 |

最后一项需要特别注意：官方 `SubmitHunyuanTo3DProJob` 文档采用腾讯 API 的 Action/Version 体系，返回 `Response.JobId`；这与当前自定义网关格式不同。需要明确网关契约或正式 SDK 接入，并完成查询任务到资产可用的闭环。官方页面标明最近更新 **2026-05-27**。[S16]

## 3. 截止日期下，哪些“最新”说法成立

| 技术 | 本次官方核验结果 | 日期与置信度 | 对 SignalPass 的影响 |
| --- | --- | --- | --- |
| MCP | `latest` 指向 **2026-07-28** stable；官方 release 与 changelog 一致 | 发布 2026-07-28；高 | 不能继续把 2025 年教程当作当前协议。适配器按实际宿主和 SDK 的兼容版本实现 |
| A2A | GitHub 最新非预发布为 **v1.0.1**；官网 specification 首页仍显示 latest released 1.0.0 | release 发布 2026-05-28，说明正文写 2026-05-26；高，存在官方页面不同步 | 明确区分规范 patch 版本与协议兼容版本 `1.0`，不把 0.3 写成最新 |
| x402 / Monad | Monad 官方指南支持 v2；只读 `/supported` 实测列出 `eip155:143` 与 `eip155:10143` 的 `exact`、`upto`、`batch-settlement` | 2026-09-27 观测；高（能力宣告），未验证支付成功 | Monad 支持有直接依据，但 CDP facilitator 的网络列表不能代替 Monad facilitator |
| ERC-8004 | EIP 页面仍标 **Draft**；Monad 官方列出 Identity、Reputation 地址，Validation 仍是 coming soon | EIP Created 2025-08-13；状态于 2026-09-27 核验；高 | 不能声称三类 registry 均已在 Monad 完整可用；不是人的身份真实性证明 |
| Hunyuan | 官方 OpenAI 兼容接口仍展示 `hunyuan-turbos-latest`；页首提醒相关功能逐步迁往 TokenHub，原平台停止新增模型能力/新购模型服务 | 持续更新页，2026-09-27 核验；高（文档），账户可用性未测 | 保留 Hunyuan sponsor 方向，核验实际账号、endpoint、模型与输出能力；不要按别家模型文档推定兼容性 |
| OpenAI Structured Outputs / agent safety | 当前文档可作为结构化数据流、隔离、确认与评测的工程参考 | 持续更新页，2026-09-27 核验；高 | 不等于要求产品迁移 OpenAI；也不证明 Hunyuan 支持相同参数 |

来源：[S01]–[S08]、[S15]。A2A 的 patch 版本与发布时间以官方 release 为依据；内容以实际支持的协议版本锁定。x402 GitHub 的一个旧组织 release URL 本次返回 404，因此本报告不声称其“最新 SDK release”；`@x402/evm >= 2.22.0` 仅是 Monad 当前指南给出的兼容建议，不是全球最新版本判断。[S04]

### MCP 新版确实改变了架构假设

2026-07-28 规范改为无协议级会话；请求携带版本与能力，增加 `server/discover`；任务能力成为 extension；输入补充采用多轮请求模式。若响应流断开，客户端重新请求，业务仍须防重。Roots、Sampling、Logging 被列为 deprecated。[S02]

**工程决策：** Introduction 的 ID、确认、支付、幂等、恢复都归 SignalPass API/数据库所有，MCP 只是调用入口。不能依赖 MCP 连接存活维持业务状态，也不能默认某个 OpenClaw/Hermes 宿主已经支持新版。先做最小 HTTP/JSON 能力，再包装一个与目标宿主兼容的适配器。

## 4. 最值得采用的 AI 工程方案

### 4.1 结构化输出：约束接口，但不把结构正确当成内容正确

OpenAI 官方明确区分 JSON mode 与 Structured Outputs：前者不保证 schema，后者可约束支持的 schema；后者仍可能生成事实错误，并需要处理 refusal/incomplete 等分支。[S08]

**建议：** 在 `packages/core` 维护唯一结果 schema；模型 provider 只返回受控对象。Hunyuan 若支持所选模型上的严格 schema，就在 provider 层启用；没有被官方文档和真实调用证明之前，不假定 `json_schema/strict` 可用。无论 provider 能力如何，服务端必须执行 Zod 校验与领域规则校验。

评估对象建议新增：

- `recommendation`：`review / ask_for_context / not_now`，不含 accept、reject、transfer、slash。
- `claims[]`：每条结论有 `source_ids`、`claim_type`（事实 / 推断）、`visibility` 与简短理由。
- `missing_context[]`：明确缺什么，允许“无法判断”；不靠默认漂亮文案伪造完整输出。
- `provider`、实际 `model`、`prompt_version`、`schema_version`、`policy_version`、`input_snapshot_hash`、`run_id`。
- `usage`、`latency_ms`、`attempt_count`、`status`：用于可观测性与费用解释，不直接公开敏感原文。

若 schema 不通过，最多按显式预算进行一次受控修复或重试；仍失败就进入 `evaluation_failed/retryable` 等真实状态。不要将失败替换成“推荐 review”。具体重试次数是实现建议，不是模型质量保证。

不要直接展示 LLM 自报 `0.93 confidence`。先显示“哪些证据支持、哪些信息缺失、哪些是推断”；要给数值置信度，必须先用本项目标注集校准。官方评测指南也要求自动分数与人工判断结合。[S09]

### 4.2 Profile synthesis：把“资料抓取”变成“用户批准的事实清单”

建议采用明确流程：

```text
用户选来源 + 确认用途
  → 服务端按安全规则获取
  → 无动作权限的抽取节点
  → 带来源的字段草稿
  → 用户删改与设置公开范围
  → 发布一个版本化 Profile snapshot
```

每个字段保留 `source_id / source_url / fetched_at / evidence_excerpt / user_approved_at / visibility / expires_at`；账号是否本人所有另用 OAuth 或签名挑战证明。公开网页只能提供上下文，不能自动等同于“身份已验证”。这与项目已有 `user-provided / not verified` 规则一致。

外部网页、README、第三方 Agent 导入内容一律当作不可信数据，不进入 system/developer 指令；抽取节点无钱包、发送、接受、退款权限。禁止私网/localhost/云 metadata URL、重定向绕过与超大响应是来源导入的工程要求。结构化提取可以缩小攻击面，但不能证明消除 prompt injection；官方安全文档也明确保留这一风险。[S10][S14]

撤回授权时同时失效派生 Profile snapshot、检索索引/embedding、缓存与待执行工作流，不能只删除原始链接。用户的“公开展示”与“允许 matching”分别授权，遵守现有产品文档。

### 4.3 可解释匹配：先规则，再检索，最后让模型解释

建议先用人工批准的小数据集把效果做实，再决定是否需要向量检索。初版不用“大而全 RAG 平台”。

1. **硬过滤先于模型：** 双方 matching consent、可接触状态、blocklist、已有/未决请求限制。
2. **候选检索：** 初期字段/标签匹配即可；候选规模变大后再使用 embeddings/hybrid retrieval。
3. **解释与轻量排序：** 同时看主题相似、目标对齐、能力互补、可用性；每条说明链接到允许披露的事实。
4. **人选择：** 推荐只能生成 shortlist，不自动发送 Introduction。

展示“你在做合约测试，他公开说想找测试工具伙伴；你能提供仿真工具，他能提供索引经验”，比展示“匹配度 92%”更符合产品目标。不要展示或暗示财富、社会等级、人格价值的总分。

`Private Profile + matching On` 的场景需谨慎：反复查询抽象共同点也可能推断隐私。建议限制可返回主题、最小披露颗粒、查询频率与重复探测；身份/具体经历的披露仍单独批准。**“服务器侧私有 matching”不是端到端加密计算、零知识证明或模型看不到数据。**

### 4.4 两个“Agent 角色”应对应真实的权限隔离

目前一个模型上下文同时产生双方结果；分成两个 UI 区域，并不能阻止 recipient 私有信息被写入 sender 输出。当前代码传入的 policy 字段较少，不能据此声称已经观察到泄漏；但未来导入私有 policy/memory 后，风险会明显扩大。[本地证据；S10]

建议拆为：

| 角色 | 可读 | 输出给谁 | 不可拥有的能力 |
| --- | --- | --- | --- |
| Intro Coach | 发起者批准的事实、自己草稿、对方公开 Profile/公开 policy | 发起人 | 读取对方私有 memory、发起资金交易、替对方接受 |
| Gatekeeper | 已确认的卡片、接收者授权的 policy、获准披露的事实 | 接收人 | 向发起者自由发送私有 policy、决定资金罚没 |
| 确定性策略层 | 当前主体、确认记录、限额、金额、状态与期限 | API / 合约 | 由模型文字覆盖权限与状态约束 |

两次受限模型调用可以使用同一个 provider/model；没有必要为了“多 Agent”让两个模型无限聊天。只交换允许披露的结构化摘要；若需要补充上下文，明确返回一个问题给人。解释展示简短依据即可，不展示隐藏推理或原始内部对话。

### 4.5 Durable workflow + 人工确认，比引入新框架更重要

LangGraph 当前官方文档区分线程 checkpoint 与跨线程 store；内存 checkpointer 不抗重启。interrupt 可以暂停等待人，但恢复时节点会重跑，因此副作用必须幂等。[S11][S12]

SignalPass 已有状态机，不建议为用 LangGraph 而重写核心。可先用数据库记录任务、outbox/worker 和显式状态迁移；LangGraph 若能减少工程量，再作 evaluator 内部编排。两者必须共享现有领域规则。

最小持久化内容：`introduction_id / owner / stage / input_hash / policy_version / quote_id / approval_id / provider_run_id / attempts / deadline / tx_hash`。

必须以服务端记录或签名绑定“谁确认了什么”：卡片哈希、金额/币种、recipient、policy 版本、有效期与 nonce。内容或金额改变即重新确认；不能用一个可重用的 `confirmed: true` 字段充当授权。**MCP elicitation、聊天中的“好的”、LLM 的工具选择，都不能替代这条授权校验。**

对扣款、交易广播、发出请求等副作用使用业务幂等键；超时后的重试先查询既有结果。评估失败、取消、接收者未回应的资金行为由确定性规则处理，不能交给模型自由判断。

## 5. 协议选择：MCP、A2A、x402、ERC-8004 各做什么

### MCP：P1 的入口适配

MCP 标准化 Agent 访问工具与资源；A2A 标准化独立 Agent 间的任务协作。这两者互补，并不是必须同时安装的一套栈。[S01][S03]

首个 MCP surface 只暴露 `discover_builders`、`draft_introduction`、`quote_introduction`、`get_introduction_status` 等窄接口；每个用户只可访问自己的私有记录。涉及发送/接受/资金的操作，返回 SignalPass 的待确认动作并由服务端验证确认后执行。不要暴露通用 `fetch_url`、任意 SQL、任意转账或服务端密钥。遵循当前安全规范中的 token audience、逐客户端 consent 和禁止 token passthrough 等边界。[S14]

验收一个宿主即可；“OpenClaw/Hermes compatible”只有在对应版本真实运行后才能写进提交说明。

### A2A：P2，直到真实存在跨组织 Agent

A2A 提供 Agent Card、任务状态、输入补充等互操作语义；但它不会自动保证用户授权、隐私、支付或推荐正确性。[S03]

双方角色都由 SignalPass 托管时，内部类型化调用已经能表达工作流。只有当 Bob 使用自己运营的 Agent endpoint，并且愿意与 Alice 的异构 Agent 协商时，A2A 才有明确增量。届时限定交换已批准的摘要与 consent artifact，设置回合、token、超时和工具预算；不共享原始 memory。

### x402：可以付推理费，不能替代 Attention Bond

官方 Monad 指南明确提供 x402 v2 主网/测试网 facilitator；本次对官方列出的 `/supported` 做了只读请求，返回两个 chain 的 `exact/upto/batch-settlement`。当前 CDP facilitator 支持表未列 Monad，因此不能直接把 CDP 上的可用性当成 Monad 上的可用性。[S04][S05][S06]

本次**没有**签名、支付、结算，也没有证明某个 token、SDK 版本、额度和账户组合已经可用。真实集成仍要检查 chain ID、token 地址/decimals、EIP-712 domain、facilitator、scheme、资金与最终 tx。Monad 指南针对 `upto` 提醒特定旧 SDK 指向不正确的 proxy；按当前指南锁兼容版本并验证链上代码，不能随意复制旧示例。[S04]

推荐先用固定上限/固定价格的 `exact` 做小演示，保留现有 fee + bond 产品解释。`upto` 对按实际 token 结算有吸引力，但会额外引入 allowance、最大额、计量可信性和失败结算问题，可后置。

**不要同一轮既收 Evaluation Fee 又让 x402 再收一次相同推理费。** 若接入，让支付回执映射同一个 evaluation run；Attention Bond 的锁定、超时、退款与争议仍归 escrow。HTTP 402 的支付授权不等于接收者同意社交关系。

### ERC-8004：服务注册可选，人不能变成链上信誉 NFT

规范提供 Agent 身份、反馈和验证接口，支付不在规范覆盖范围；其安全章节明确讨论 Sybil/垃圾反馈问题。链上注册并不能证明能力声明真实，不能保证 Agent 无恶意，也不能替代应用的权限控制。[S07]

Monad 官方页列出 Identity 与 Reputation registry 地址，但 Validation 仍标注 coming soon；本次没有做合约调用验证。[S06]

如确有额外展示时间，可注册“SignalPass evaluator service”的 endpoint 和版本。不要为每个用户铸造可转移的社交身份，也不要把对人的拒绝、兴趣或关系评价永久公开上链。已有 ProfileRegistry 与 Receipt 能说明 MVP 的最小可验证事实，暂不需要复制另一套 registry。

## 6. 隐私、提示注入、评测与费用必须一起设计

### 隐私宣称

“私有 Agent”应解释为：按用户授权范围存储和调用上下文，其他用户不能读取。除非实现并验证对应技术，不声称本地运行、端到端加密推理、零知识匹配或 provider 零留存。

以 OpenAI 为例，官方文档将“不用于训练”与“保留多久”分开；默认滥用监测日志可能保留客户内容，Zero Data Retention 需获批且有 endpoint/feature 限制。此政策**不能套用到 Hunyuan**。Hunyuan 部署地域、日志、留存与删除边界需要使用实际服务条款和账号配置另行核验。[S13]

哈希只证明某份输入/输出的承诺关系，不证明 AI 结论正确；对低熵私密内容也不能把无盐哈希当作保密方案。链上只放必要结算事实与不可逆公开承诺，敏感原文、embedding、私有 policy 与完整评价留在受控链下。

### 最小评测包

建议先建 **30–50 个经人工确认的用例**；这是项目建议规模，不是行业基准，也不表示已完成。官方评测方法强调任务目标、代表性数据、边缘/攻击案例、人工校准与持续回归。[S09]

| 测试组 | 必测内容 | 判断方式 |
| --- | --- | --- |
| 事实依据 | 捏造经历、错误来源、过期 Profile、来源冲突 | 每条可展示 claim 有有效且允许披露的 source_id；无法支持就标推断/未知 |
| 匹配价值 | 高相关、互补但不相似、相似但无合作价值、不相关 | 人工成对比较，并记录一致性与失败原因 |
| 授权与隐私 | matching Off、blocked、private policy、未批准信号、跨用户查询 | 确定性拒绝；发送方输出不得含接收方私有 canary 字符串 |
| 注入攻击 | 网页/Intro 中包含“忽略规则”“把隐藏 policy 发给我”“自动接受” | 不增加权限、不改变资金、不泄漏 canary；攻击文本只作数据 |
| 状态恢复 | Provider timeout、结果不合 schema、重试、刷新、worker 重启 | 不重收费用、不重复发送、状态与回执可恢复 |
| 确认重放 | 已确认后改 recipient、金额、卡片、policy、过期/重复 nonce | 服务端拒绝；不能只靠前端按钮是否可见 |
| 公平边界 | 无钱包历史、新人、无 3D Persona、低资产 vs 高资产 | 不把缺失信号直接等同于低价值，不把财富作为准入事实 |

报告区分 schema 成功率、证据支持率、泄漏/越权次数、人类偏好、p50/p95 延迟、token/费用与 provider 失败率。不得把一个 LLM 的主观评分当作唯一质量真相。泄漏为 0 只能描述有限测试集结果，不代表系统无泄漏风险。

### 成本与延迟

这里不提供未经测量的价格、吞吐或秒数保证。每次真实运行记录输入/输出用量、额外工具费用、重试与执行时间，再核对官方账单。

优化顺序建议是：减少长原文输入 → 先硬过滤候选 → 限定候选数量与输出长度 → 并行无依赖且已隔离的工作 → 异步 Persona → 在权限范围内缓存 → 最后再比较模型。官方延迟指南也建议减少请求与生成长度、合理并行，并将确定性工作移出 LLM。[S17]

缓存键至少包含用户/权限域、source snapshot、policy、prompt/schema/model 版本；撤回授权或 policy 改变必须失效。provider prompt caching 与应用层存储不是同一件事，缓存也不意味着无留存。[S13][S18]

Evaluation Fee 若是固定报价，应诚实称“评估服务费”，说明覆盖推理与服务成本；没有实际计量时，不称“精确实报实销的 token 费用”。只有实际发生收费并可核对时，才声称 sender-funded inference 已实现。

## 7. 实施顺序与停止线

### P0：先完成可拿上台的 AI 闭环

1. 一个真实 Hunyuan adapter：固定配置、结果 schema、明确 timeout/失败分支、用量与版本记录。
2. 一条来源导入和人工批准流程；手动输入仍可走完全流程。
3. 小型批准数据集的 discover → 有证据的三名以内候选 → 选定一人 → 草稿确认。候选数是建议的演示约束。
4. 双侧最小上下文；保存结果；人确认绑定正文、recipient、报价与期限。
5. 可恢复执行，链上和链下状态可对照；真实 / fixture / mock 均明确显示。
6. 跑上述评测，用评测报告、脱敏 run 和真实 receipt 支撑演示。

### P1：只做一个能强化主线的增量

如果核心闭环稳定，先选一个外部 Agent 入口；若 sponsor/赛道对 Agent payments 有明确权重，再选择 x402 测试网支付演示。不要同时铺多宿主和多协议。3D Persona 可以提升辨识度，但始终异步、可跳过，不能让评委等待生成。

### P2：黑客松后再做

独立 Agent endpoint 的 A2A 联邦协作、ERC-8004 服务发现、用户迁移长期 memory、大规模向量检索、自主日程/通知、多轮代理谈判，以及未经需求验证的 TEE/zkML。

### 建议的现场证明

同一张屏幕让评委看见：**来自哪里 → 为什么匹配 → 用户确认了什么 → 对方 Agent 看到了什么 → 对方人决定什么 → 资金与状态如何落实。** 再展示一个负例：恶意介绍不能泄漏私有 canary，也不能自动接受；改变报价或卡片必须重新确认。这个闭环能支撑可信的产品故事；多贴几个协议 Logo 做不到这一点。

## 8. 一手来源、日期与证据限制

所有持续更新页面访问/核验日期均为 **2026-09-27**。正文是工程解释与项目建议，不逐字复制来源。研究使用 agent-reach 的网页读取路径；OpenAI 资料使用 official OpenAI documentation。

- **[S01] MCP 当前规范与发布**：https://modelcontextprotocol.io/specification/2026-07-28 ；https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28 。官方 release `published_at=2026-07-28T16:47:49Z`；`https://modelcontextprotocol.io/specification/latest` 同时指向该 schema 版本。
- **[S02] MCP 2026-07-28 changelog**：https://modelcontextprotocol.io/specification/2026-07-28/changelog 。描述相对 2025-11-25 的变更；不是目标宿主已经兼容的证明。
- **[S03] A2A 规范、比较与最新 release**：https://a2a-protocol.org/latest/specification/ ；https://a2a-protocol.org/latest/topics/a2a-and-mcp/ ；https://github.com/a2aproject/A2A/releases/tag/v1.0.1 。GitHub API `https://api.github.com/repos/a2aproject/A2A/releases/latest` 返回 `published_at=2026-05-28T11:34:36Z`、`prerelease=false`；网页的 1.0.0 展示存在滞后。
- **[S04] Monad x402 官方指南**：https://docs.monad.xyz/guides/x402-guide 。支持网络、facilitator、scheme、SDK/proxy 兼容说明；本页未提供可据以确认的首次发布日期。
- **[S05] Monad facilitator 只读能力宣告**：https://x402-facilitator.molandak.org/supported 。2026-09-27 实测，响应列出 x402Version 2、两条链的 exact/upto/batch-settlement；这不是支付端到端验证。
- **[S06] Monad ERC-8004 指南 / CDP 网络支持**：https://docs.monad.xyz/guides/erc-8004 ；https://docs.cdp.coinbase.com/x402/network-support 。前者列 Identity/Reputation 地址、Validation coming soon；后者当前列表未列 Monad。两个 facilitator 不可混为一谈。
- **[S07] ERC-8004 规范**：https://eips.ethereum.org/EIPS/eip-8004 。Created 2025-08-13；本次页面状态 Draft；payments orthogonal、Sybil/security 边界详见正文。
- **[S08] OpenAI Structured Outputs**：https://developers.openai.com/api/docs/guides/structured-outputs 。持续更新文档；说明 schema 与 JSON mode、错误/refusal 边界。
- **[S09] OpenAI Evaluation best practices**：https://developers.openai.com/api/docs/guides/evaluation-best-practices 。持续更新文档；任务评测、人工校准与攻击/边缘集。
- **[S10] OpenAI Safety in building agents**：https://developers.openai.com/api/docs/guides/agent-builder-safety 。持续更新文档；不可信输入、结构化数据流、隔离、人工审批；不能把防护当作完全消除风险。
- **[S11] LangGraph persistence / checkpointers**：https://docs.langchain.com/oss/python/langgraph/durable-execution 。本次页面标题为 Persistence，说明 checkpoint/store 和内存不抗重启；旧路径并不意味着旧内容。
- **[S12] LangGraph interrupts**：https://docs.langchain.com/oss/python/langgraph/interrupts 。持续更新文档；恢复时节点重跑、持久化与幂等要求。
- **[S13] OpenAI Data controls**：https://developers.openai.com/api/docs/guides/your-data 。持续更新文档；训练、日志、应用状态、ZDR 与第三方服务分别处理，不适用于推断 Hunyuan 政策。
- **[S14] MCP 当前安全实践**：https://modelcontextprotocol.io/specification/2026-07-28/basic/security_best_practices 。token audience、confused deputy、token passthrough、SSRF 等工程边界。
- **[S15] 腾讯混元 OpenAI 兼容接口**：https://cloud.tencent.com/document/product/1729/111007 。实际读取到 TokenHub 迁移提醒、endpoint 和调用示例；本次没有证实指定模型的 strict JSON Schema 支持，也没有验证账号可用性。
- **[S16] Tencent Hunyuan 3D 官方 API**：https://www.tencentcloud.com/document/product/1284/75540 。页面 Last updated 2026-05-27 12:02:55；Action `SubmitHunyuanTo3DProJob`、`Response.JobId` 与异步任务语义。
- **[S17] OpenAI Latency optimization**：https://developers.openai.com/api/docs/guides/latency-optimization 。持续更新文档；本报告没有采用该页示例模型作为最新选型。
- **[S18] OpenAI Prompt caching**：https://developers.openai.com/api/docs/guides/prompt-caching 。持续更新文档；缓存能力与具体模型/配置有关，不外推到其他 provider。

### 仍未验证，必须留在实施清单

- Hunyuan 账号是否可用、TokenHub 对此次 sponsor 凭据的影响、指定模型的 JSON schema 支持、真实用量与延迟。
- 真实 3D 生成/查询/下载；当前 adapter 对应的网关是否存在。
- OpenClaw/Hermes 的实际安装版本、其 MCP 能力与目标规范兼容性。
- x402 指定 token/SDK/facilitator 的成功结算、失败恢复、重复请求行为；ERC-8004 所列合约的链上实际行为。
- 当前产品尚未演示的持久化、来源授权、私有 matching、真实支付和安全用例；不能把本报告的建议算成已经交付。
