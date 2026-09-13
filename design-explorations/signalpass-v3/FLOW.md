# SignalPass V3 流转图说明

可视化入口：[flow-v3.html](./flow-v3.html)  
可编辑规格：[flow-v3.workflow.json](./flow-v3.workflow.json)

这张图是 V3 的“页面连接骨架”：横向列表示进度，泳道表示动作归属。主路径从左到右；同一列的上下连接表示跨责任边界的交接，而不是额外的页面跳转。

## 页面与节点映射

| 节点 ID | 责任方 | 对应页面/设计稿 | 进入条件 | 用户动作 | 下一状态 |
| --- | --- | --- | --- | --- | --- |
| `onboard` | 用户 | 登录入口（首页 Hero） | 首次进入 | 社交登录；可连接自己的 Agent | `profile_draft` |
| `profile_draft` | Personal Agent | `01-profile-source-import.png` | 有 GitHub、Twitter/X、网站或 Agent 来源 | 查看来源、生成 Profile 草稿 | `profile_review` |
| `profile_review` | 用户 | `01-profile-source-import.png` + `02-personal-agent-privacy.png` | 草稿已生成 | 编辑字段；选择 Public / Limited / Private；打开或关闭 matching | `matching_opt_in` |
| `widget_snapshot` | Profile | `04-profile-widget.png` | 有已批准的公开字段 | 生成并复制 Widget；仅包含公开名片信息 | 独立支线，不阻塞匹配 |
| `matching_opt_in` | SignalPass 网络 | `02-personal-agent-privacy.png` | 用户打开 Agent matching | 允许系统在授权边界内比较兴趣与目标 | `candidate_shortlist` |
| `candidate_shortlist` | SignalPass 网络 | `03-people-discovery.png` | matching 已打开 | Agent 返回少量候选和可读的匹配理由 | `user_select` |
| `user_select` | 用户 | `03-people-discovery.png` | 看过候选解释 | 选择想 Chat / Collaborate / Learn 的人；此时不发送任何内容 | `intro_draft` |
| `intro_draft` | Personal Agent | `05-introduction-composer.png` | 用户选定候选 | Agent 起草介绍；用户可以改写目的、语气和共享上下文 | `consent_lock` |
| `consent_lock` | SignalPass 网络 | `05-introduction-composer.png` | 草稿完成 | 明确确认发送；如启用费用/押金，在此锁定并展示 | `recipient_review` |
| `recipient_review` | 接收者 Agent | `06-recipient-inbox.png` | 对方已收到受限介绍 | 仅向本人生成共同点、目的和风险提示摘要 | `recipient_decision` |
| `recipient_decision` | 接收者本人 | `06-recipient-inbox.png` | 摘要可读 | Accept / Ask for context / Decline | `outcomes` |
| `outcomes` | 结果分支 | `06-recipient-inbox.png` 或后续会话页 | 对方完成决定 | 交接会话、补充上下文或退回；写入 receipt | 流程结束或重新起草 |

## 页面连接建议

后续实现时可以直接把节点 ID 当成稳定的路由/埋点 key：

```text
onboard                 → /
profile_draft           → /profile/import
profile_review          → /profile/review
widget_snapshot         → /widget/create
matching_opt_in         → /discover/settings
candidate_shortlist     → /discover
user_select             → /discover/:candidateId
intro_draft              → /introductions/new/:candidateId
consent_lock             → /introductions/:id/confirm
recipient_review         → /inbox/:id
recipient_decision      → /inbox/:id/decision
outcomes                → /introductions/:id/receipt
```

## 两个必须保持独立的开关

- **Profile visibility**：控制公开页面、搜索展示和 Widget 能看到什么。
- **Allow Agent matching**：控制是否允许系统在双方授权后做私有比较。

因此 `Private Profile + matching On` 是合法状态：服务器只返回抽象的共同点或互补点，不泄漏原始兴趣、Agent memory 或 Gate Policy。

## 发送前后的权限边界

1. Agent 可以建议和起草，但不能自动发送、私信、发帖或接受关系。
2. `consent_lock` 是唯一的发送确认门；费用、refundable bond 和共享字段在这里一次展示。
3. 接收者 Agent 只能总结收到的受限上下文；最终决定始终在 `recipient_decision`。
4. `widget_snapshot` 是公开名片支线，不依赖对方接受，也不改变匹配权限。

图中没有把 Accept / Ask / Decline 画成三条长回线：三种结果收敛到 `outcomes`，具体状态由 receipt 承载，避免主流程被分支线缠绕；页面实现时再在 `recipient_decision` 内展开三个按钮状态。

