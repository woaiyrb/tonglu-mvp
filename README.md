# 同路 · 学生实训室进组选导师系统 MVP

学院实训室双向选择演示系统。前端使用 React 19、TypeScript、Vite 和 React Router，视觉采用吉卜力风格；后端使用 Node.js 内置 HTTP 与 Node 24 内置 SQLite，数据真实落库。

## 启动

```powershell
cd D:\505\mvp
npm install
npm run dev
```

启动后同时运行：

| 服务 | 地址 |
| --- | --- |
| 网页 | http://127.0.0.1:4175/ |
| API | http://127.0.0.1:4176/api/health |

数据库文件：`D:\505\mvp\data\tonglu.db`。首次启动自动建表并写入演示数据。

生产构建：

```powershell
npm run build
npm run start
```

构建后的网页与 API 由 `4176` 端口一起提供。

## 演示账号

七个角色统一密码：`demo123`

| 角色 | 账号 | 入口 |
| --- | --- | --- |
| 学生 | `student` | `/student` |
| 导师 | `mentor` | `/mentor` |
| 面试官 | `interviewer` | `/interviewer`、`/interviewer/scoring`、`/interviewer/records` |
| 实验室负责人 | `lab` | `/lab`、`/lab/quota`、`/lab/candidates` |
| 学院管理员 | `college` | `/admin` |
| 学院负责人 | `leader` | `/leader`、`/leader/exceptions`、`/leader/publicity` |
| 系统管理员 | `system` | `/system`、`/system/users`、`/system/database`、`/system/audit` |

右上角“切换演示身份”可切换角色。直接打开任意角色链接时，系统会按 URL 自动登录对应演示账号。

## 后端能力

- scrypt 密码哈希，Bearer 会话，停用账号即清理会话。
- SQLite 事务写入，业务操作与审计日志同一事务提交。
- 名额校验使用已确认人数与待确认人数，不能把名额改到已占人数以下。
- 评分、候选结论、拟录取确认、补录、调剂、公示、冻结、异议、账号权限均写入数据库。
- 重置演示数据只清理业务数据，保留账号与会话。

## PC 端布局

- 桌面端固定顶部栏、顶部横向导航、页标题条与六个固定阶段。
- 概览卡片用于模块跳转，不采用轮播或横向滑动。
- 窄屏自动切换为底部固定导航，阶段改为三列两行网格。

## 验证

```powershell
cd D:\505\mvp
npm run build
node scripts\verify-api.mjs
```

`verify-api.mjs` 覆盖七个角色登录、评分持久化、候选名单提交、拟录取确认、名额修改、调剂审批、公示、异议办结、正式名单冻结、账号状态修改和最终数据恢复。

## 主要文件

| 路径 | 用途 |
| --- | --- |
| `src/App.tsx` | 路由表 |
| `src/components/Layout.tsx` | PC 固定布局、角色导航、URL 角色同步、阶段切换 |
| `src/store.tsx` | 后端会话、业务状态、权限判断 |
| `src/data.ts` | 前端展示种子与静态文案 |
| `src/styles.css` | 吉卜力视觉、PC 工作台、响应式样式 |
| `src/pages/` | 七个角色的页面 |
| `server/index.mjs` | HTTP API、权限、业务事务 |
| `server/database.mjs` | SQLite 表结构、种子、会话、查询 |
| `server/seed-data.mjs` | 演示账号与业务种子 |

## 边界

这是交互验收用 MVP。演示身份接口为方便验收直接发放对应角色会话；正式上线前应关闭该接口，接入学校统一身份认证、HTTPS、限流、备份和正式数据库运维。
