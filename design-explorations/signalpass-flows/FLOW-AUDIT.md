# SignalPass 全流程逻辑审查

审查日期：2026-09-13  
审查范围：`DESIGN-FLOW.md`、同目录 9 张设计稿、当前 Next.js 页面、API 和领域状态机。  
审查方式：在隔离预览中实际走过 Homepage → Builders → Profile → Composer → Receipt → Inbox，并分别触发了 accepted、needs_context 和 Hero 的 Not now。

## 结论

产品叙事是成立的：先展示 Builder，再写结构化 Introduction，由 Agent 评估，最后由接收者决定。

但是，当前设计稿和实现不是同一条可执行流程。最大的断点有四个：

1. Hero 的 `Your call` 在设计稿中打开 Review Drawer，代码实际跳到 `/introduce/bob` 写卡片。
2. Hero 的 `Not now` 在设计稿中是可恢复的 Later，代码只显示一条 toast，卡片没有变化，也没有 `Undo`。
3. `Ask for context` 在设计稿中会把问题发回发送者，代码只有 `needs_context` 状态，没有提问、修改、重新评估的入口，而且该状态不会进入收件箱。
4. `Accept introduction` 在设计稿中打开私密介绍空间，当前代码只把状态改为 `accepted`，没有 private introduction 路由或入口。

因此，设计稿可以作为目标体验，但不能直接宣称它已经是当前 demo 的真实流程。

## 实际走过的步骤

| 步骤 | 实际结果 | 健康度 |
| --- | --- | --- |
| 1. Homepage → Builders | `Explore introductions` 正确跳到 `/builders`。 | 正常 |
| 2. Builders → Profile | Alice/Bob 卡片正确跳到 `/builders/:handle`，但视觉是旧版文档式页面，不是 `01-builders-directory.png` 的目录稿。 | 部分一致 |
| 3. Profile → Composer | `Write an introduction` 正确跳到 `/introduce/bob`。当前页面是四问表单，符合结构化 Introduction 思路。 | 正常 |
| 4. Composer → Evaluation | 填完四问后点击 `Lock the introduction`，代码立即锁定并自动评估，然后跳到 Receipt；没有设计稿里的独立 `Preview introduction` 步骤。 | 部分一致 |
| 5. Review recommendation | 完整上下文会得到 `ready_for_review`；短上下文会得到 `needs_context`。这与领域状态机一致。 | 正常 |
| 6. Receipt → Inbox | `ready_for_review` 会显示 `Open the recipient’s inbox`，收件箱能看到请求。 | 正常 |
| 7. Recipient decision | 收件箱实际按钮是 `Meet them` 和 `Not now`，分别调用 accepted/declined。没有 `Ask for context`。 | 部分一致 |
| 8. Accepted / needs_context | Accepted 停在 Receipt；needs_context 停在“可撤回”页面，均没有设计稿描述的后续空间或回传问题。 | 断链 |

## 关键逻辑问题

### P0 — Hero `Your call` 的入口与设计稿冲突

设计目标是：Hero → Review Drawer → Accept / Ask for context / Not now。  
代码位置：`apps/web/app/page.tsx:143-148` 和移动端 `apps/web/app/page.tsx:228-233`。  
当前行为：`Your call` 是一个普通链接，直接进入 `/introduce/bob`，页面标题是填写四个答案的 Composer。

这不是文案差异，而是两个不同任务：一个是“审核收到的介绍”，另一个是“发送一张新介绍”。

修正建议：二选一并统一所有稿件：

- 保留当前 demo：把 Hero 按钮文案改成 `Write an introduction`，视觉稿 04 改为 Composer 入口。
- 采用设计目标：增加 review drawer 状态，并让 Hero 的 `Your call` 只打开该状态；真正的 Composer 仍从 Profile 进入。

### P0 — `Not now` 同名但语义相反

Hero 设计稿把 `Not now` 定义为“暂存，可 Undo”；代码只调用 `handleNotNow()`，设置 3.5 秒 toast，Introduction Card 仍留在原位，也没有 Later 状态。  
代码位置：`apps/web/app/page.tsx:136-142`、`apps/web/app/page.tsx:221-227`。

收件箱中的 `Not now` 则是真正的 `declined`：它会关闭请求、退回 bond，并增加该 sender → recipient 的 decline 计数。  
代码位置：`apps/web/app/inbox/[handle]/page.tsx:245-251`、`services/api/src/index.ts:326-329`。

修正建议：不要让同一个标签承载两种状态。

- Hero：`Save for later`，本地或持久化为 snoozed，并提供 `Undo`。
- 收件箱：`Decline introduction`，明确这是最终决定，会记录 decline。

### P0 — `needs_context` 没有可完成的闭环

API 会把 `ask_for_context` 映射为 `needs_context`：`services/api/src/index.ts:282-283`。  
但 `reviewQueue()` 只筛选 `ready_for_review`：`services/api/src/store.ts:71-77`，所以 needs_context 请求不会出现在 Bob 的收件箱。

实际测试得到的 Receipt 同时显示“Sent back for one more piece of context”和“Waiting in the recipient’s queue”，但直接打开 `/inbox/bob` 时队列是 0。这是同一状态在两个页面里的直接矛盾。

领域状态机已经暗示正确方向：`needs_context` 应该回到发送者侧，允许补充内容后再次进入 `evaluating`。  
代码位置：`packages/core/src/domain.ts:100-102`。

修正建议：明确一种模型：

- Agent 请求发送者补充：进入 sender 的 `NeedsContext` 编辑页；提交补充后 `needs_context → evaluating`，重新评估，只有 `ready_for_review` 才进入收件箱。
- 如果确实要让收件人提问：增加独立的 context request 数据和发送者回复入口，不要只复用 `needs_context` 状态。

### P0 — Accepted 后没有私密介绍空间

设计稿 06 描述 `Introduction accepted → Private space unlocked → Open private introduction`。  
当前收件箱点击 `Meet them` 只调用 `transitionIntroduction(..., 'accepted')`，然后从本地列表移除请求。  
代码位置：`apps/web/app/inbox/[handle]/page.tsx:48-58`、`apps/web/app/inbox/[handle]/page.tsx:236-244`。

当前路由只有 `/introductions/[id]` Receipt，没有 `/private/...` 或等价的私密空间路由。接受后的 Receipt 也没有下一步按钮。  
路由清单：`apps/web/app/**/page.tsx`。

修正建议：在实现 private room 前，把稿件文案改成 `Introduction accepted` + `Receipt available`；实现后再增加 `Open private introduction`，并明确这是双方 opt in 后才出现的下一步。

## 视觉稿与当前 demo 的内容差异

- `01-builders-directory.png` 展示 8 个 Builder；当前 API 只 seed Alice 和 Bob。若页面继续使用 seed 数据，应标注“concept”或只展示两人。
- `02-builder-profile-alice.png` 展示大型 3D Persona、`Optional verified context` 和 `Start an introduction`；当前 Profile 页面是旧版信息布局，3D presence 显示为 `not generated`，verified context 在 Composer 才出现。
- `03-introductions-inbox.png` 展示 All / Needs your look / Waiting / Closed 筛选；当前 Inbox 只有一个 ready queue，没有筛选和已关闭历史。
- `04-hero-your-call-review.png` 的主按钮是 `Accept introduction`；当前 Inbox 使用 `Meet them`，Hero 则跳 Composer。
- `08-introduction-composer.png` 的主按钮是 `Preview introduction`；当前 Composer 主按钮是 `Lock the introduction`，并在提交后立即自动评估。
- `06-introduction-accepted.png` 的 `Private space unlocked` 在当前 demo 中不存在，应标为 future state。

这些差异不一定是问题，但必须在“设计目标”和“当前可运行 demo”之间明确分层，否则评审者会以为点击后能到达图片展示的状态。

## 建议采用的单一流转

如果目标是同时保留当前 MVP 和设计稿的产品逻辑，推荐把主线收敛成下面这样：

```text
Homepage
  → Explore introductions
Builders directory
  → View profile
Builder profile
  → Write an introduction
Composer
  → Preview card
  → Lock fee + refundable bond
Agent evaluation
  ├─ needs_context
  │    → Sender edits the missing answer
  │    → Re-evaluate
  │
  └─ ready_for_review
       → Recipient inbox
          ├─ Accept introduction
          │    → Accepted receipt
          │    → Private introduction (future / when implemented)
          ├─ Ask for context (optional future branch)
          │    → Sender question / pending state
          └─ Decline introduction
               → Bond refunded, decline recorded
```

Hero 的静态示例建议独立标记为“preview interaction”：

```text
Your call       → Review Drawer（目标状态；当前可替代为 Composer）
Save for later  → Snoozed + Undo（当前未实现）
```

## 审查限制

本次确认了浏览器可见页面、路由、API 响应和状态转换；没有验证真实 Dynamic 登录、真实 Monad 结算、Envio 索引器、Hunyuan 生产评估或真正的私密聊天空间。当前 API 仍是隔离预览中的内存 store，因此重启服务会清空本次测试数据。

