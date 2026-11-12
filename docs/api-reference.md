# 同路 MVP API Reference

同路实训室双向选择系统的 HTTP API。所有业务接口返回 JSON，写入操作直接落 SQLite，并与审计日志在同一事务提交。

- Base URL：`http://127.0.0.1:4176`
- API 版本：`2026-11`（演示周期 `2026-AUT`）
- 字符编码：`UTF-8`
- 请求体上限：1 MiB

## 鉴权

除 `POST /api/auth/login`、`POST /api/auth/demo`、`POST /api/auth/logout` 和 `GET /api/health` 外，所有接口都需要 Bearer 会话令牌。

```http
Authorization: Bearer <token>
```

令牌由登录接口签发，有效期 12 小时。账号被停用后，该账号的全部会话立即失效。

```bash
curl http://127.0.0.1:4176/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"account\":\"college\",\"password\":\"demo123\"}"
```

## 响应信封

成功：

```json
{
  "ok": true,
  "data": {}
}
```

失败：

```json
{
  "ok": false,
  "error": {
    "code": "STAGE_LOCKED",
    "message": "当前业务阶段不允许此操作，请切换到正确阶段。"
  }
}
```

业务接口的 `data.state` 是当前用户的完整工作台快照，前端用它整体替换本地状态。快照字段见[状态快照](#状态快照)。

所有响应带 `Cache-Control: no-store` 与 `X-Content-Type-Options: nosniff`。允许 `127.0.0.1`、`localhost` 跨域，方法为 `GET, POST, PATCH, OPTIONS`，预检请求返回 `204`。

## 角色与权限

| 角色 | 值 | 权限 |
| --- | --- | --- |
| 学生 | `student` | `application:write`、`offer:confirm`、`appeal:write`、`self:read` |
| 导师 | `mentor` | `candidate:score`、`candidate:decide`、`candidate:submit`、`unit:read` |
| 面试官 | `interviewer` | `candidate:score`、`unit:read` |
| 实验室负责人 | `lab_manager` | `unit:read`、`candidate:read`、`export:read` |
| 学院管理员 | `college_admin` | `cycle:admin`、`quota:write`、`supplement:write`、`adjustment:approve`、`publicity:publish`、`appeal:resolve`、`audit:read`、`unit:read` |
| 学院负责人 | `college_leader` | `adjustment:approve:exception`、`publicity:freeze`、`appeal:resolve`、`audit:read`、`unit:read` |
| 系统管理员 | `sys_admin` | `user:admin`、`audit:read`、`system:reset`、`system:read` |

## 业务阶段

`intent`（意向填报）→ `interview`（面试）→ `offer`（拟录取确认）→ `supplement`（补录）→ `adjustment`（调剂）→ `publicity`（公示）。

阶段由服务端 `cycle.stage` 控制。阶段不符的写操作返回 `409 STAGE_LOCKED`。正式名单冻结后，除公示阶段内操作外，其余写操作返回 `409 RESULT_FROZEN`。

---

## 健康检查

### 获取服务状态

`GET /api/health`

无需鉴权。用于探活与确认数据库类型、当前阶段。

```bash
curl http://127.0.0.1:4176/api/health
```

```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "database": "sqlite",
    "stage": "offer",
    "time": "2026-11-12T00:15:11.428Z"
  }
}
```

---

## 认证

### 账号登录

`POST /api/auth/login`

用账号密码换取 Bearer 令牌，同时返回该角色的工作台快照。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account` | string | 是 | 账号，前后空白自动去除 |
| `password` | string | 是 | 明文密码，服务端用 scrypt 校验 |

```json
{
  "ok": true,
  "data": {
    "token": "7c1f0b47-4a3e-4f1a-9a6c-6a4f1f0b47aa",
    "user": {
      "id": "usr-college",
      "account": "college",
      "name": "周明",
      "role": "college_admin",
      "unitId": null,
      "studentNo": null,
      "active": true
    },
    "state": {}
  }
}
```

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 401 | `INVALID_CREDENTIALS` | 账号或密码错误 |
| 400 | `INVALID_JSON` | 请求体不是合法 JSON |
| 413 | `PAYLOAD_TOO_LARGE` | 请求体超过 1 MiB |

### 切换演示身份

`POST /api/auth/demo`

按角色直接签发对应演示账号的会话，供验收使用。七个演示账号密码统一为 `demo123`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `role` | string | 是 | 七个角色值之一 |

响应结构与登录接口一致，并写入一条“演示身份切换”审计日志。

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 422 | `INVALID_ROLE` | `role` 不在角色枚举内 |
| 404 | `DEMO_ROLE_NOT_FOUND` | 演示账号被停用或删除 |

### 退出登录

`POST /api/auth/logout`

删除当前令牌对应的会话。令牌缺失或已失效时同样返回成功。

```json
{
  "ok": true,
  "data": {
    "loggedOut": true
  }
}
```

---

## 工作台

### 获取工作台状态

`GET /api/bootstrap`

按当前用户角色返回可见的业务数据。

| 角色 | 候选人 | 调剂队列 | 用户列表 | 数据库统计 | 审计日志 |
| --- | --- | --- | --- | --- | --- |
| `student` | 空 | 空 | 空 | `null` | 仅本人 40 条 |
| `mentor`、`interviewer`、`lab_manager` | 本实训室 | 空 | 空 | `null` | 仅本人 40 条 |
| `college_admin`、`college_leader` | 全部 | 全部 | 空 | `null` | 最近 200 条 |
| `sys_admin` | 全部 | 空 | 全部 | 有值 | 最近 200 条 |

```json
{
  "ok": true,
  "data": {
    "state": {}
  }
}
```

### 切换业务阶段

`POST /api/demo/stage`

演示用阶段切换。正式环境由服务器时间控制，不开放此接口。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `stage` | string | 是 | `intent`、`interview`、`offer`、`supplement`、`adjustment`、`publicity` |

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 422 | `INVALID_STAGE` | 阶段值无效 |
| 409 | `RESULT_FROZEN` | 名单已冻结，尝试切到公示以外的阶段 |

---

## 学生申请

### 保存意向草稿

`PATCH /api/student/draft`

仅 `student`。仅在 `intent` 阶段可用，可反复保存。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `selectedUnitIds` | string[] | 是 | 最多 3 个，不允许重复，必须存在于 `units` |
| `adjustments.internal` | boolean | 否 | 是否授权实训室内调剂，默认 `false` |
| `adjustments.cross` | boolean | 否 | 是否授权跨实训室调剂，默认 `false` |
| `commitment` | boolean | 否 | 是否确认材料真实性与承诺声明 |

```json
{
  "selectedUnitIds": ["unit-ai", "unit-data"],
  "adjustments": { "internal": true, "cross": false },
  "commitment": true
}
```

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 422 | `TOO_MANY_UNITS` | 超过 3 个平行意向 |
| 422 | `DUPLICATE_UNITS` | 意向重复 |
| 422 | `UNKNOWN_UNIT` | 存在无效实训室 ID |
| 403 | `FORBIDDEN` | 非学生角色 |
| 409 | `STAGE_LOCKED` | 不在意向填报阶段 |

### 提交申请

`POST /api/applications`

仅 `student`，仅 `intent` 阶段。先按需更新草稿，再生成新版本申请记录。提交必须至少 1 个意向并已确认承诺声明。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `selectedUnitIds` | string[] | 否 | 传入时先覆盖草稿 |
| `adjustments` | object | 否 | 传入时先覆盖草稿的调剂授权 |
| `commitment` | boolean | 否 | 传入时先覆盖草稿的承诺声明 |
| `idempotencyKey` | string | 否 | 相同键重复提交直接返回成功，不新增版本 |

每次提交把 `version` 加 1，并记录 `round`、`selected_units`、`adjustments`、`commitment` 与审计日志。

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 422 | `NO_UNITS` | 未选择任何意向 |
| 422 | `COMMITMENT_REQUIRED` | 未确认承诺声明 |
| 409 | `STAGE_LOCKED` | 不在意向填报阶段 |
| 409 | `RESULT_FROZEN` | 名单已冻结 |

---

## 拟录取

### 确认拟录取

`POST /api/offers/{offerId}/confirm`

仅 `student`，仅 `offer` 阶段。确认唯一去向；同周期其他待确认拟录取自动置为 `superseded` 并释放名额。重复确认同一 offer 幂等返回成功。

| 路径参数 | 类型 | 说明 |
| --- | --- | --- |
| `offerId` | string | 拟录取 ID |

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 404 | `OFFER_NOT_FOUND` | offer 不存在或不属于当前学生 |
| 409 | `ALREADY_CONFIRMED` | 本周期已确认其他去向 |
| 409 | `OFFER_INVALID` | offer 已失效（非 `pending`） |
| 409 | `STAGE_LOCKED` | 不在拟录取确认阶段 |

---

## 面试与候选名单

### 保存面试评分

`PATCH /api/candidates/{candidateId}/score`

`mentor` 或 `interviewer`，仅 `interview` 阶段。只能给本实训室候选人评分。评分四舍五入取整后落库。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `score` | number | 是 | 0 到 100 |
| `comment` | string | 否 | 评语，首尾空白去除 |

```json
{
  "score": 88,
  "comment": "项目经历扎实，沟通清晰。"
}
```

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 422 | `INVALID_SCORE` | 非数字或超出 0 到 100 |
| 404 | `CANDIDATE_NOT_FOUND` | 候选人不存在 |
| 403 | `OUT_OF_SCOPE` | 候选人不属于本人实训室 |
| 409 | `LIST_LOCKED` | 候选名单已提交，评分锁定 |
| 409 | `STAGE_LOCKED` | 不在面试阶段 |

### 设置候选结论

`PATCH /api/candidates/{candidateId}/decision`

仅 `mentor`，仅 `interview` 阶段，名单未提交前可改。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `decision` | string \| null | 是 | `offer`、`waitlist`、`reject` 或 `null` |

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 422 | `INVALID_DECISION` | 结论不在枚举内 |
| 404 | `CANDIDATE_NOT_FOUND` | 候选人不存在 |
| 403 | `OUT_OF_SCOPE` | 候选人不属于本人实训室 |
| 409 | `LIST_LOCKED` | 候选名单已提交，结论锁定 |

### 提交候选名单

`POST /api/candidates/submit`

仅 `mentor`，仅 `interview` 阶段。要求本实训室所有候选人已评分，提交后锁定评分与结论。重复提交幂等返回成功。

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 422 | `SCORE_INCOMPLETE` | 存在未评分候选人，消息带未评人数 |
| 409 | `STAGE_LOCKED` | 不在面试阶段 |

---

## 补录

### 生成补录任务

`POST /api/supplements`

仅 `college_admin`，仅 `supplement` 阶段。按剩余名额重新开放填报，最多生成两轮（第 2、3 轮）。

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 409 | `ROUND_LIMIT` | 两轮补录均已生成 |
| 409 | `STAGE_LOCKED` | 不在补录阶段 |

---

## 调剂

### 审批并生成调剂

`POST /api/adjustments/{adjustmentId}/approve`

`adjustment` 或 `publicity` 阶段。权限按记录是否已获学生授权区分：

| 记录 `authorized` | 允许角色 |
| --- | --- |
| `true` | `college_admin` |
| `false` | `college_leader` |

处理成功后记录状态改为 `已生成`。重复审批幂等返回成功。

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 404 | `ADJUSTMENT_NOT_FOUND` | 调剂记录不存在 |
| 403 | `FORBIDDEN` | 角色与授权状态不匹配 |
| 409 | `STAGE_LOCKED` | 不在调剂或公示阶段 |
| 409 | `RESULT_FROZEN` | 名单已冻结 |

---

## 公示

### 生成公示名单

`POST /api/publications/publish`

仅 `college_admin`，仅 `publicity` 阶段。生成前逐项校验：已确认去向、全部评分完成、未授权调剂已核对、导师名单已提交、无实训室名额超限。通过后写入公示快照，`publication_version` 加 1。

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 422 | `NO_CONFIRMED_OFFER` | 缺少已确认拟录取 |
| 422 | `SCORE_INCOMPLETE` | 仍有候选人未评分 |
| 422 | `AUTH_PENDING` | 未授权调剂尚未核对 |
| 422 | `LIST_NOT_SUBMITTED` | 导师候选名单未提交 |
| 422 | `QUOTA_EXCEEDED` | 存在名额超限的实训室 |
| 409 | `STAGE_LOCKED` | 不在公示阶段 |

### 冻结正式名单

`POST /api/publications/freeze`

`college_admin` 或 `college_leader`，仅 `publicity` 阶段。冻结后正式名单只读，非公示阶段写操作全部拒绝。

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 409 | `NOT_PUBLISHED` | 尚未生成公示名单 |
| 409 | `ALREADY_FROZEN` | 名单已冻结 |

---

## 异议

### 提交异议

`POST /api/appeals`

仅 `student`。公示生成后才可提交。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `content` | string | 是 | 至少 8 个字，首尾空白去除 |

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 409 | `NOT_PUBLISHED` | 公示尚未开始 |
| 422 | `CONTENT_TOO_SHORT` | 说明不足 8 个字 |

### 办结异议

`POST /api/appeals/{appealId}/resolve`

`college_admin` 或 `college_leader`。已办结的异议再次提交幂等返回成功。

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 404 | `APPEAL_NOT_FOUND` | 异议不存在 |
| 403 | `FORBIDDEN` | 角色无处理权限 |

---

## 名额

### 调整计划名额

`PATCH /api/units/{unitId}/quota`

仅 `college_admin`。不受业务阶段限制，但名单冻结后拒绝。新名额不得低于已确认人数与待确认人数之和。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `quota` | integer | 是 | 1 到 30 |

```json
{
  "quota": 8
}
```

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 422 | `INVALID_QUOTA` | 非 1 到 30 的整数 |
| 422 | `QUOTA_BELOW_USED` | 低于已确认与待确认人数 |
| 404 | `UNIT_NOT_FOUND` | 实训室不存在 |
| 409 | `RESULT_FROZEN` | 名单已冻结 |

---

## 账号与系统

### 更新账号权限

`PATCH /api/admin/users/{userId}`

仅 `sys_admin`。可改角色与启用状态；停用账号会立即删除其全部会话。不能停用自己、不能移除自己的系统管理员角色，且系统必须保留至少一个启用的系统管理员。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `role` | string | 否 | 角色枚举之一，缺省保持原值 |
| `active` | boolean | 否 | 缺省保持原值 |

```json
{
  "role": "interviewer",
  "active": false
}
```

| 状态码 | 错误码 | 场景 |
| --- | --- | --- |
| 404 | `USER_NOT_FOUND` | 账号不存在 |
| 422 | `INVALID_ROLE` | 角色无效 |
| 409 | `SELF_LOCKOUT` | 停用自己或移除自己的管理员角色 |
| 409 | `LAST_ADMIN` | 会导致没有启用的系统管理员 |

### 恢复演示数据

`POST /api/admin/reset`

仅 `sys_admin`。清理业务数据并重新写入种子，保留账号与会话，随后写一条审计日志。

```json
{
  "ok": true,
  "data": {
    "state": {}
  }
}
```

---

## 状态快照

`/api/bootstrap`、登录、演示切换以及所有写操作的响应都带同一个 `state` 结构。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `role` | string | 当前角色 |
| `units` | object[] | 全部实训室，含名额与实时统计 |
| `currentUser` | object | `id`、`account`、`name`、`role`、`unitId`、`studentNo`、`active` |
| `permissions` | string[] | 当前角色权限码 |
| `stage` | string | 当前业务阶段 |
| `selectedUnitIds` | string[] | 学生意向方向 |
| `adjustments` | object | `{ internal, cross }` |
| `commitment` | boolean | 承诺声明 |
| `application` | object \| null | `submittedAt`、`version`、`round`、`idempotencyKey` |
| `offers` | object[] | `id`、`unitId`、`status`、`issuedAt`、`deadline`、`score`、`note` |
| `confirmedOfferId` | string \| null | 已确认拟录取 |
| `finalUnitId` | string \| null | 最终去向实训室 |
| `interviews` | object[] | `id`、`unitId`、`dateLabel`、`time`、`location`、`interviewer`、`status`、`score` |
| `candidates` | object[] | `id`、`name`、`studentNo`、`major`、`interviewAt`、`score`、`comment`、`decision` |
| `candidateListSubmitted` | boolean | 候选名单是否已提交 |
| `adjustmentQueue` | object[] | `id`、`studentName`、`studentNo`、`source`、`target`、`priority`、`authorized`、`status`、`note` |
| `published` | boolean | 是否已公示 |
| `publishedAt` | string \| null | 公示时间 |
| `frozenAt` | string \| null | 冻结时间 |
| `appeals` | object[] | `id`、`studentName`、`content`、`createdAt`、`status` |
| `supplementRound` | number | 已生成补录轮次 |
| `supplementGeneratedAt` | string \| null | 最近补录生成时间 |
| `audit` | object[] | `id`、`at`、`actor`、`action`、`object`、`detail` |
| `users` | object[] | 仅 `sys_admin` 有值 |
| `dbStats` | object \| null | 仅 `sys_admin` 有值：`path`、`users`、`activeSessions`、`auditEvents`、`candidates`、`offers` |

实训室对象字段：`id`、`code`、`name`、`direction`、`mentor`、`mentorTitle`、`quota`、`confirmed`、`pending`、`tags`、`summary`、`training`、`assessment`、`materials`、`schedule`、`location`、`tone`、`glyph`、`heat`、`stats`（`confirmed`、`pending`、`remaining`、`fillRate`）。

## 通用错误

| 状态码 | 错误码 | 说明 |
| --- | --- | --- |
| 400 | `INVALID_JSON` | 请求体不是合法 JSON |
| 401 | `UNAUTHENTICATED` | 令牌缺失、过期或账号停用 |
| 403 | `FORBIDDEN` | 角色无该操作权限 |
| 404 | `NOT_FOUND` | 接口或资源不存在 |
| 409 | `STAGE_LOCKED` | 当前业务阶段不允许此操作 |
| 409 | `RESULT_FROZEN` | 正式名单已冻结 |
| 413 | `PAYLOAD_TOO_LARGE` | 请求体超过 1 MiB |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |

## 静态资源

非 `/api/` 的 `GET` 请求由后端从 `frontend/dist` 提供。未命中的路径回落到 `index.html`，支持前端路由直接刷新。`frontend/dist` 不存在时，未知路径返回 `404 NOT_FOUND`。
