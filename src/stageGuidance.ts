import type { Role, StageKey } from "./types";

export interface RoleStageGuide {
  headline: string;
  description: string;
  focus: string;
  nextStep: string;
  available: string[];
  unavailable: string[];
}

type StageGuideMap = Record<StageKey, RoleStageGuide>;

const studentGuides: StageGuideMap = {
  intent: {
    headline: "先把方向选清楚，再提交申请。",
    description: "当前开放意向填报。最多选择 3 个平行方向，分别确认两类调剂授权，提交后等待面试安排。",
    focus: "平行意向与调剂授权",
    nextStep: "核对 3 个方向后提交申请",
    available: ["选择或调整平行意向", "确认内部与跨室调剂授权", "保存并提交申请"],
    unavailable: ["确认拟录取", "查看公示名单"],
  },
  interview: {
    headline: "面试正在进行，先看安排。",
    description: "当前处于面试考核。申请与意向已只读，学院和实训室正在完成评分并形成候选名单。",
    focus: "面试安排与本人进度",
    nextStep: "确认面试时间、地点，等待评分完成",
    available: ["查看面试时间与地点", "查看本人面试进度", "查看已归档评分"],
    unavailable: ["修改平行意向", "确认拟录取", "提交公示异议"],
  },
  offer: {
    headline: "结果抵达，做一个明确选择。",
    description: "当前开放拟录取确认。只有一个拟录取时自动确认；有多个时只能选择一个，其他拟录取会立即释放。",
    focus: "唯一去向确认",
    nextStep: "在截止前确认一个拟录取方向",
    available: ["查看拟录取结果", "确认唯一去向", "查看后续流程"],
    unavailable: ["修改申请与意向", "提交公示异议"],
  },
  supplement: {
    headline: "补录按轮推进，留意新结果。",
    description: "当前进入分轮补录。学院按剩余名额生成补录任务，已确认去向保持不变。",
    focus: "补录轮次与个人结果",
    nextStep: "查看是否有新的补录结果",
    available: ["查看补录进度", "查看面试与结果", "查看已确认去向"],
    unavailable: ["修改申请与意向", "重复确认拟录取"],
  },
  adjustment: {
    headline: "统筹调剂中，结果以最终匹配为准。",
    description: "当前进行内部、跨实训室和最终统筹三级调剂。调剂授权已在填报阶段确认，本阶段不可修改。",
    focus: "调剂匹配与最终去向",
    nextStep: "查看调剂结果，等待公示名单",
    available: ["查看调剂进度", "查看当前去向", "查看面试与结果"],
    unavailable: ["修改调剂授权", "确认新的拟录取"],
  },
  publicity: {
    headline: "名单进入公示，请核对你的信息。",
    description: "当前为公示与入组阶段。学院校验唯一性与名额后发布名单；公示期内可对本人结果提出异议。",
    focus: "公示名单与异议",
    nextStep: "核对公示信息，有异议及时提交",
    available: ["查看公示名单", "核对本人去向", "公示期提交异议"],
    unavailable: ["修改申请与意向", "确认或更换拟录取"],
  },
};

const mentorGuides: StageGuideMap = {
  intent: {
    headline: "意向填报中，评分尚未开放。",
    description: "学生正在选择平行方向。导师可查看候选人与名额，评分、结论和名单提交要等面试阶段开放。",
    focus: "意向分布与名额准备",
    nextStep: "核对待面试学生与计划名额",
    available: ["查看候选人", "查看名额与名单状态"],
    unavailable: ["录入评分与评语", "提交候选名单"],
  },
  interview: {
    headline: "评分、评语、结论，都在本阶段完成。",
    description: "当前开放面试考核。逐人完成评分和评语，再形成拟录取、候补或淘汰结论并提交名单。",
    focus: "评分完整性与候选名单",
    nextStep: "完成全部评分后提交候选名单",
    available: ["录入评分与评语", "修改候选结论", "提交并锁定候选名单"],
    unavailable: ["修改计划名额", "发布公示"],
  },
  offer: {
    headline: "名单已锁定，等待学生确认。",
    description: "当前进入拟录取确认。导师端评分与名单只读，学生将确认唯一去向，未确认名额会被释放。",
    focus: "学生确认与名额占用",
    nextStep: "查看确认结果与剩余名额",
    available: ["查看评分与名单", "查看确认与名额状态"],
    unavailable: ["修改评分", "重新提交候选名单"],
  },
  supplement: {
    headline: "补录窗口开启，名单保持锁定。",
    description: "当前按剩余名额分轮补录。导师可查看补录候选和名额变化，不能改写已提交的评分与名单。",
    focus: "补录候选与剩余名额",
    nextStep: "核对补录后名单与名额",
    available: ["查看补录候选", "查看名额占用"],
    unavailable: ["修改评分", "重新提交候选名单"],
  },
  adjustment: {
    headline: "统筹调剂中，导师端只读。",
    description: "当前按授权进行三级调剂。导师可查看本人实训室的最终候选与名额，不直接处理调剂审批。",
    focus: "调剂结果与名额",
    nextStep: "核对调剂后的候选名单",
    available: ["查看候选人", "查看名额与调剂结果"],
    unavailable: ["修改评分", "处理调剂审批"],
  },
  publicity: {
    headline: "名单进入公示，导师端只读。",
    description: "当前完成唯一性、名额与授权校验并公示。导师可核对最终名单，冻结后进入正式入组。",
    focus: "最终名单与公示状态",
    nextStep: "核对公示名单，等待正式冻结",
    available: ["查看最终名单", "查看公示状态"],
    unavailable: ["修改评分", "修改候选结论"],
  },
};

const interviewerGuides: StageGuideMap = {
  intent: {
    headline: "评分窗口尚未开启。",
    description: "当前为学生意向填报。可先查看面试安排与候选人，评分和评语要等面试考核阶段才能写入。",
    focus: "面试安排准备",
    nextStep: "确认本人面试安排",
    available: ["查看面试安排", "查看候选人信息"],
    unavailable: ["录入评分与评语", "修改候选结论"],
  },
  interview: {
    headline: "评分窗口已开启，逐份完成。",
    description: "当前开放面试评分。评分与评语保存后即时入库并写入审计；只处理本实训室候选人。",
    focus: "待评分队列",
    nextStep: "完成剩余评分并核对记录",
    available: ["录入评分与评语", "查看评分记录", "导出评分记录"],
    unavailable: ["提交候选名单", "修改候选结论"],
  },
  offer: {
    headline: "评分窗口已关闭，记录转为只读。",
    description: "当前进入拟录取确认。面试官可查看和导出已归档评分，不能继续修改分数或评语。",
    focus: "评分归档与只读核对",
    nextStep: "核对评分记录",
    available: ["查看评分记录", "导出评分记录"],
    unavailable: ["录入或修改评分", "修改候选结论"],
  },
  supplement: {
    headline: "补录进行中，评分记录只读。",
    description: "当前按剩余名额补录。面试官只查看已归档评分，不参与补录结论和名单调整。",
    focus: "评分归档",
    nextStep: "查看本轮补录状态",
    available: ["查看评分记录", "导出评分记录"],
    unavailable: ["录入或修改评分", "参与补录决策"],
  },
  adjustment: {
    headline: "调剂进行中，评分记录只读。",
    description: "当前进行统筹调剂。面试官可查看本人实训室的评分归档，调剂审批由学院负责。",
    focus: "评分归档与调剂状态",
    nextStep: "查看调剂结果",
    available: ["查看评分记录", "导出评分记录"],
    unavailable: ["修改评分", "处理调剂审批"],
  },
  publicity: {
    headline: "名单公示中，评分记录只读。",
    description: "当前进入公示与入组。评分已归档，面试官可查看最终名单与本人评分记录。",
    focus: "评分归档与公示名单",
    nextStep: "核对最终公示名单",
    available: ["查看评分记录", "查看公示名单"],
    unavailable: ["修改评分", "修改候选结论"],
  },
};

const labGuides: StageGuideMap = {
  intent: {
    headline: "方向热度与名额基线已就位。",
    description: "当前学生正在填报意向。实验室负责人可查看名额、候选人和方向热度，写操作仍由导师与学院完成。",
    focus: "名额基线与意向热度",
    nextStep: "核对待面试候选人与剩余名额",
    available: ["查看名额看板", "查看候选人", "导出名额数据"],
    unavailable: ["修改名额", "修改评分或候选结论"],
  },
  interview: {
    headline: "面试进行中，先盯评分与名额。",
    description: "当前开放面试考核。候选人结论尚未全部形成，已确认与待确认人数会继续影响剩余名额。",
    focus: "评分进度与名额占用",
    nextStep: "面试结束后核对候选名单",
    available: ["查看评分进度", "查看名额占用", "导出候选人数据"],
    unavailable: ["修改名额", "修改评分"],
  },
  offer: {
    headline: "拟录取确认中，名额正在落定。",
    description: "当前开放学生确认唯一去向。未确认拟录取会失效并释放名额，实验室只读查看实时占用。",
    focus: "确认进度与名额释放",
    nextStep: "核对确认后的名额占用",
    available: ["查看确认进度", "查看剩余名额", "导出名额数据"],
    unavailable: ["修改名额", "确认学生去向"],
  },
  supplement: {
    headline: "补录窗口开启，按轮核对名额。",
    description: "当前按剩余名额分轮补录。实验室可查看每轮候选与占用变化，不直接生成补录任务。",
    focus: "补录轮次与剩余名额",
    nextStep: "核对本轮补录后的名额",
    available: ["查看补录候选", "查看名额变化", "导出候选人数据"],
    unavailable: ["生成补录任务", "修改名额"],
  },
  adjustment: {
    headline: "统筹调剂中，重点看名额边界。",
    description: "当前按授权进行三级调剂。实验室可查看跨室匹配后的候选与名额，审批由学院完成。",
    focus: "调剂结果与名额边界",
    nextStep: "核对调剂后的最终候选",
    available: ["查看调剂结果", "查看名额占用", "导出候选人数据"],
    unavailable: ["审批调剂", "修改名额"],
  },
  publicity: {
    headline: "名单公示中，核对最终名额。",
    description: "当前完成唯一性、名额与授权校验。实验室可核对公示名单和冻结状态，业务数据只读。",
    focus: "最终名单与冻结状态",
    nextStep: "核对公示名单与名额",
    available: ["查看公示名单", "查看名额总览", "导出最终数据"],
    unavailable: ["修改名额", "修改任何业务结论"],
  },
};

const adminGuides: StageGuideMap = {
  intent: {
    headline: "先定名额基线，再等意向提交。",
    description: "当前开放意向填报。学院管理员可调整各实训室计划名额并查看审计；补录、调剂审批和公示尚未开放。",
    focus: "计划名额与填报进度",
    nextStep: "核对计划名额，等待申请提交",
    available: ["调整计划名额", "查看运营数据", "查看审计日志"],
    unavailable: ["生成补录任务", "审批调剂", "发布公示"],
  },
  interview: {
    headline: "面试进行中，盯评分与候选名单。",
    description: "当前开放面试考核。重点检查未评分学生、候选名单提交状态和名额占用，补录与公示仍未开放。",
    focus: "评分进度与候选名单",
    nextStep: "督促完成评分与名单提交",
    available: ["查看评分与候选进度", "调整计划名额", "查看审计日志"],
    unavailable: ["生成补录任务", "审批调剂", "发布公示"],
  },
  offer: {
    headline: "拟录取确认中，盯唯一去向与名额。",
    description: "当前开放学生确认。重点检查多拟录取学生是否完成唯一选择，以及失效拟录取是否释放名额。",
    focus: "唯一去向与名额释放",
    nextStep: "核对确认结果，准备补录",
    available: ["查看确认与名额", "调整计划名额", "查看审计日志"],
    unavailable: ["生成补录任务", "审批调剂", "发布公示"],
  },
  supplement: {
    headline: "补录窗口已开，按剩余名额推进。",
    description: "当前开放分轮补录。可按剩余名额生成补录任务，并继续核对名额占用和轮次状态。",
    focus: "补录轮次与剩余名额",
    nextStep: "生成下一轮补录任务",
    available: ["生成补录任务", "调整计划名额", "查看补录结果", "查看审计日志"],
    unavailable: ["审批调剂", "发布公示"],
  },
  adjustment: {
    headline: "调剂窗口已开，先处理授权例外。",
    description: "当前开放统筹调剂。已授权记录可直接生成，未授权记录需等待学院负责人审批后再处理。",
    focus: "授权状态与调剂队列",
    nextStep: "处理已授权调剂，跟进未授权例外",
    available: ["处理已授权调剂", "查看未授权例外", "调整计划名额", "查看审计日志"],
    unavailable: ["生成补录任务", "发布公示"],
  },
  publicity: {
    headline: "公示窗口已开，发布、办结、冻结。",
    description: "当前开放公示与入组。先确认名单校验通过，再发布公示、处理异议并冻结正式名单；冻结后业务只读。",
    focus: "公示发布与名单冻结",
    nextStep: "发布公示并处理异议，最后冻结名单",
    available: ["发布公示名单", "查看并办结异议", "冻结正式名单", "查看审计日志"],
    unavailable: ["生成补录任务", "审批调剂"],
  },
};

const leaderGuides: StageGuideMap = {
  intent: {
    headline: "填报阶段，终审尚未开放。",
    description: "当前学生正在填报意向。学院负责人可查看全局进度和名额，异常审批与公示终审要等对应阶段。",
    focus: "全局进度与名额基线",
    nextStep: "等待面试与候选名单形成",
    available: ["查看学院总览", "查看名额与进度"],
    unavailable: ["审批未授权调剂", "公示终审", "冻结名单"],
  },
  interview: {
    headline: "面试阶段，重点看评分与例外。",
    description: "当前开放面试考核。可提前查看未评分、未授权调剂等异常，但调剂审批与公示终审仍按阶段开放。",
    focus: "评分异常与授权例外",
    nextStep: "跟进异常，等待调剂阶段",
    available: ["查看全局进度", "查看异常与调剂队列"],
    unavailable: ["审批未授权调剂", "公示终审"],
  },
  offer: {
    headline: "确认阶段，关注唯一去向与名额。",
    description: "当前学生确认拟录取。重点核对唯一去向、失效释放和全局名额，异常审批仍未开放。",
    focus: "唯一去向与名额释放",
    nextStep: "核对确认结果，准备补录",
    available: ["查看确认进度", "查看名额与异常"],
    unavailable: ["审批未授权调剂", "公示终审"],
  },
  supplement: {
    headline: "补录阶段，关注轮次与名额。",
    description: "当前按剩余名额补录。可查看轮次结果和名额变化，调剂审批与公示终审尚未开放。",
    focus: "补录轮次与名额变化",
    nextStep: "核对补录后全局名额",
    available: ["查看补录进度", "查看名额与异常"],
    unavailable: ["审批未授权调剂", "公示终审"],
  },
  adjustment: {
    headline: "调剂阶段，审批未授权例外。",
    description: "当前开放统筹调剂。学院负责人处理未授权跨室调剂，审批结果写入审计并影响最终名单。",
    focus: "未授权调剂审批",
    nextStep: "逐条审批未授权调剂",
    available: ["审批未授权调剂", "查看调剂队列", "查看全局名额"],
    unavailable: ["发布公示", "冻结名单"],
  },
  publicity: {
    headline: "公示阶段，做最后一次终审。",
    description: "当前开放公示与入组。核对名单、办结公示异议并确认冻结状态，冻结后进入正式入组。",
    focus: "公示终审与异议办结",
    nextStep: "核对校验项并办结异议",
    available: ["公示终审", "办结公示异议", "查看正式名单", "查看全局名额"],
    unavailable: ["审批调剂", "修改评分与候选结论"],
  },
};

const systemGuides: StageGuideMap = {
  intent: {
    headline: "系统健康，业务处于意向填报。",
    description: "账号、角色、数据库和审计正常。业务阶段仅用于展示与约束写接口，系统管理员不直接改写业务结果。",
    focus: "账号与数据库健康",
    nextStep: "检查账号角色与数据库状态",
    available: ["管理账号与角色", "查看数据库状态", "查看全局审计"],
    unavailable: ["修改业务评分", "审批或发布业务结果"],
  },
  interview: {
    headline: "系统健康，业务处于面试考核。",
    description: "评分写接口在本阶段开放。系统管理员可查看数据库与审计，但不代替面试官录入评分。",
    focus: "会话、审计与数据库写入",
    nextStep: "检查账号状态与审计增长",
    available: ["管理账号与角色", "查看数据库状态", "查看全局审计"],
    unavailable: ["修改业务评分", "提交候选名单"],
  },
  offer: {
    headline: "系统健康，业务处于拟录取确认。",
    description: "学生确认写接口在本阶段开放。系统管理员只维护账号与基础设施，不直接确认学生去向。",
    focus: "账号状态与会话",
    nextStep: "检查账号状态与数据库状态",
    available: ["管理账号与角色", "查看数据库状态", "查看全局审计"],
    unavailable: ["确认学生去向", "修改拟录取结果"],
  },
  supplement: {
    headline: "系统健康，业务处于分轮补录。",
    description: "补录任务由学院管理员生成。系统管理员可查看数据增长和审计记录，不直接改写补录结果。",
    focus: "数据库容量与审计",
    nextStep: "检查业务记录增长",
    available: ["管理账号与角色", "查看数据库状态", "查看全局审计"],
    unavailable: ["生成补录任务", "修改名额"],
  },
  adjustment: {
    headline: "系统健康，业务处于统筹调剂。",
    description: "调剂审批由学院负责人完成。系统管理员可检查权限、会话与审计，不代替业务角色审批。",
    focus: "权限与会话安全",
    nextStep: "检查角色权限与审计事件",
    available: ["管理账号与角色", "查看数据库状态", "查看全局审计"],
    unavailable: ["审批调剂", "修改调剂结果"],
  },
  publicity: {
    headline: "系统健康，业务进入公示与入组。",
    description: "公示发布和冻结由学院完成。系统管理员可核对数据库、账号与审计，冻结后业务表转为只读。",
    focus: "数据一致性与冻结状态",
    nextStep: "核对数据库状态与最终审计",
    available: ["管理账号与角色", "查看数据库状态", "查看全局审计"],
    unavailable: ["发布公示", "冻结正式名单"],
  },
};

const guidesByRole: Record<Role, StageGuideMap> = {
  student: studentGuides,
  mentor: mentorGuides,
  interviewer: interviewerGuides,
  lab_manager: labGuides,
  college_admin: adminGuides,
  college_leader: leaderGuides,
  sys_admin: systemGuides,
};

export function getStageGuide(role: Role, stage: StageKey): RoleStageGuide {
  return guidesByRole[role][stage];
}

export function stageNotification(role: Role, stage: StageKey): string {
  const guide = getStageGuide(role, stage);
  return `第 ${stageNumber(stage)} 阶段 · ${guide.focus}：${guide.nextStep}。`;
}

export function isStageOpen(stage: StageKey, ...allowed: StageKey[]): boolean {
  return allowed.includes(stage);
}

export function stageLockReason(stage: StageKey, allowed: StageKey[], action: string): string {
  const labels: Record<StageKey, string> = {
    intent: "意向填报",
    interview: "面试考核",
    offer: "拟录取确认",
    supplement: "分轮补录",
    adjustment: "统筹调剂",
    publicity: "公示与入组",
  };
  const expected = allowed.map((key) => labels[key]).join("或");
  return `${action}仅在“${expected}”阶段开放。当前为“${labels[stage]}”阶段。`;
}

function stageNumber(stage: StageKey): number {
  return ["intent", "interview", "offer", "supplement", "adjustment", "publicity"].indexOf(stage) + 3;
}
