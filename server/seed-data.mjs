export const DEMO_PASSWORD = "demo123";

export const CYCLE = {
  name: "2026 秋季实训室选拔",
  code: "2026-AUT",
  college: "软件学院",
  timezone: "Asia/Shanghai",
};

export const STUDENT = {
  id: "stu-sy",
  name: "孙悦",
  studentNo: "2024010826",
  major: "软件工程",
};

export const USERS = [
  { id: "stu-sy", account: "student", name: "孙悦", role: "student", unitId: null, studentNo: "2024010826" },
  { id: "usr-mentor", account: "mentor", name: "周明远", role: "mentor", unitId: "u1", studentNo: null },
  { id: "usr-interviewer", account: "interviewer", name: "陈拓", role: "interviewer", unitId: "u1", studentNo: null },
  { id: "usr-lab", account: "lab", name: "赵启航", role: "lab_manager", unitId: "u1", studentNo: null },
  { id: "usr-college", account: "college", name: "学院管理员", role: "college_admin", unitId: null, studentNo: null },
  { id: "usr-leader", account: "leader", name: "学院负责人", role: "college_leader", unitId: null, studentNo: null },
  { id: "usr-system", account: "system", name: "系统管理员", role: "sys_admin", unitId: null, studentNo: null },
];

export const UNITS = [
  {
    id: "u1",
    code: "IIL",
    name: "智能交互实验室",
    direction: "AI Agent 与多模态交互",
    mentor: "周明远",
    mentorTitle: "副教授 · 实验室负责人",
    quota: 6,
    confirmed: 3,
    pending: 2,
    location: "信息楼 A302",
    schedule: "周二 18:30",
  },
  {
    id: "u2",
    code: "DSL",
    name: "数据系统实验室",
    direction: "实时数据平台与可观测性",
    mentor: "林知夏",
    mentorTitle: "讲师 · 数据平台负责人",
    quota: 5,
    confirmed: 2,
    pending: 1,
    location: "信息楼 B208",
    schedule: "周五 19:00",
  },
  {
    id: "u3",
    code: "VCL",
    name: "视觉计算实验室",
    direction: "多模态视觉理解与生成",
    mentor: "陈拓",
    mentorTitle: "副教授 · 视觉计算组",
    quota: 4,
    confirmed: 3,
    pending: 0,
    location: "信息楼 C105",
    schedule: "周四 18:00",
  },
  {
    id: "u4",
    code: "SEL",
    name: "软件工程实验室",
    direction: "AI 辅助研发与工程质量",
    mentor: "何雨桐",
    mentorTitle: "讲师 · 工程效能负责人",
    quota: 6,
    confirmed: 2,
    pending: 1,
    location: "信息楼 A108",
    schedule: "周三 19:00",
  },
  {
    id: "u5",
    code: "ESL",
    name: "嵌入式系统实验室",
    direction: "边缘智能与低功耗硬件",
    mentor: "赵启航",
    mentorTitle: "高级工程师 · 嵌入式组",
    quota: 4,
    confirmed: 4,
    pending: 0,
    location: "工程楼 E201",
    schedule: "周一 18:30",
  },
  {
    id: "u6",
    code: "PIL",
    name: "产品创新实验室",
    direction: "人机协作产品与体验研究",
    mentor: "江岚",
    mentorTitle: "讲师 · 产品研究方向",
    quota: 3,
    confirmed: 1,
    pending: 0,
    location: "文科楼 D310",
    schedule: "周四 19:00",
  },
];

export const OFFERS = [
  {
    id: "offer-1",
    studentId: "stu-sy",
    unitId: "u1",
    status: "pending",
    issuedAt: "2026-11-04T08:10:00+08:00",
    deadline: "2026-11-04T12:00:00+08:00",
    score: 92,
    note: "面试评分排名第 1，建议进入智能体工程方向。",
  },
  {
    id: "offer-2",
    studentId: "stu-sy",
    unitId: "u2",
    status: "pending",
    issuedAt: "2026-11-04T08:26:00+08:00",
    deadline: "2026-11-04T12:00:00+08:00",
    score: 88,
    note: "工程基础扎实，可参与实时数据链路建设。",
  },
];

export const INTERVIEWS = [
  { id: "int-1", studentId: "stu-sy", unitId: "u1", dateLabel: "11 月 3 日", time: "09:00 - 09:30", location: "信息楼 A302", interviewer: "周明远", status: "done", score: 92 },
  { id: "int-2", studentId: "stu-sy", unitId: "u2", dateLabel: "11 月 3 日", time: "14:30 - 15:00", location: "信息楼 B208", interviewer: "林知夏", status: "done", score: 88 },
  { id: "int-3", studentId: "stu-sy", unitId: "u3", dateLabel: "11 月 3 日", time: "16:00 - 16:30", location: "信息楼 C105", interviewer: "陈拓", status: "done", score: 84 },
];

export const CANDIDATES = [
  { id: "cand-1", unitId: "u1", name: "孙悦", studentNo: "2024010826", major: "软件工程", interviewAt: "11.03 09:00", score: 92, comment: "项目表达清楚，能解释取舍。", decision: "offer" },
  { id: "cand-2", unitId: "u1", name: "陈星河", studentNo: "2024010912", major: "人工智能", interviewAt: "11.03 09:30", score: 89, comment: "基础扎实，工程经验完整。", decision: "offer" },
  { id: "cand-3", unitId: "u1", name: "何若曦", studentNo: "2024010731", major: "软件工程", interviewAt: "11.03 10:00", score: 86, comment: "研究兴趣明确，补充项目细节。", decision: "waitlist" },
  { id: "cand-4", unitId: "u1", name: "李泽宇", studentNo: "2024010618", major: "计算机科学", interviewAt: "11.03 10:30", score: 84, comment: "逻辑清晰，项目规模偏小。", decision: "waitlist" },
  { id: "cand-5", unitId: "u1", name: "王安然", studentNo: "2024011104", major: "数据科学", interviewAt: "11.03 11:00", score: 81, comment: "投入时间需要进一步确认。", decision: null },
  { id: "cand-6", unitId: "u1", name: "周可", studentNo: "2024010527", major: "软件工程", interviewAt: "11.03 11:30", score: null, comment: "", decision: null },
];

export const ADJUSTMENTS = [
  { id: "adj-1", studentName: "李梓萌", studentNo: "2024010421", source: "智能交互实验室 · 多模态方向", target: "智能交互实验室 · Agent 方向", priority: 1, authorized: 1, status: "待处理", note: "原方向候补第 1，已授权实训室内调剂。" },
  { id: "adj-2", studentName: "王一鸣", studentNo: "2024010316", source: "数据系统实验室", target: "产品创新实验室", priority: 2, authorized: 1, status: "待处理", note: "已授权跨实训室调剂，符合产品研究方向。" },
  { id: "adj-3", studentName: "周可", studentNo: "2024010527", source: "产品创新实验室", target: "视觉计算实验室", priority: 3, authorized: 0, status: "需审批", note: "未授权跨实训室调剂，需学院负责人审批。" },
  { id: "adj-4", studentName: "赵天", studentNo: "2024010249", source: "嵌入式系统实验室", target: "视觉计算实验室", priority: 2, authorized: 1, status: "已生成", note: "已生成调剂记录，等待学生再次确认。" },
];

export const PUBLIC_RESULTS = [
  { name: "张清越", studentNo: "2024010103", unitId: "u1", source: "第一轮" },
  { name: "陈星河", studentNo: "2024010912", unitId: "u1", source: "第一轮" },
  { name: "林一诺", studentNo: "2024010417", unitId: "u2", source: "第一轮" },
  { name: "何若曦", studentNo: "2024010731", unitId: "u4", source: "第二轮补录" },
  { name: "王一鸣", studentNo: "2024010316", unitId: "u6", source: "统筹调剂" },
  { name: "李梓萌", studentNo: "2024010421", unitId: "u1", source: "统筹调剂" },
];

export const AUDIT = [
  { id: "aud-1", at: "2026-11-03T17:02:00+08:00", actor: "系统", action: "阶段关闭", object: "2026-AUT / 第 4 阶段", detail: "面试考核阶段按期关闭，提交入口已冻结。" },
  { id: "aud-2", at: "2026-11-03T16:48:00+08:00", actor: "周明远", action: "提交候选名单", object: "智能交互实验室 / 第 1 版", detail: "拟录取 2 人，候补 2 人，内部调剂候选 1 人。" },
  { id: "aud-3", at: "2026-11-03T16:20:00+08:00", actor: "林知夏", action: "退回修改", object: "数据系统实验室 / 面试记录", detail: "补充 2 名学生的面试评语后重新提交。" },
  { id: "aud-4", at: "2026-11-02T10:16:00+08:00", actor: "孙悦", action: "提交申请", object: "2026-AUT / 申请 v1", detail: "提交 3 个平行意向，实训室内调剂已授权。" },
  { id: "aud-5", at: "2026-11-02T08:00:00+08:00", actor: "系统", action: "阶段开启", object: "2026-AUT / 第 3 阶段", detail: "意向填报开放，服务器时间校验已启用。" },
];
