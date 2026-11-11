export type Role =
  | "student"
  | "mentor"
  | "interviewer"
  | "lab_manager"
  | "college_admin"
  | "college_leader"
  | "sys_admin";

export type StageKey =
  | "intent"
  | "interview"
  | "offer"
  | "supplement"
  | "adjustment"
  | "publicity";

export type OfferStatus =
  | "pending"
  | "confirmed"
  | "superseded"
  | "declined"
  | "expired";

export type CandidateDecision = "offer" | "waitlist" | "reject" | null;

export interface Stage {
  key: StageKey;
  number: number;
  label: string;
  short: string;
  window: string;
  description: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  direction: string;
  mentor: string;
  mentorTitle: string;
  quota: number;
  confirmed: number;
  pending: number;
  tags: string[];
  summary: string;
  training: string;
  assessment: string;
  materials: string;
  schedule: string;
  location: string;
  tone: "sage" | "sky" | "coral" | "rose" | "leaf" | "gold";
  glyph: "spark" | "database" | "eye" | "code" | "chip" | "compass";
  heat: number;
  stats?: {
    confirmed: number;
    pending: number;
    remaining: number;
    fillRate: number;
  };
}

export interface Offer {
  id: string;
  unitId: string;
  status: OfferStatus;
  issuedAt: string;
  deadline: string;
  score: number;
  note: string;
}

export interface Interview {
  id: string;
  unitId: string;
  dateLabel: string;
  time: string;
  location: string;
  interviewer: string;
  status: "done" | "upcoming" | "absent";
  score: number | null;
}

export interface Candidate {
  id: string;
  name: string;
  studentNo: string;
  major: string;
  interviewAt: string;
  score: number | null;
  comment: string;
  decision: CandidateDecision;
}

export interface AdjustmentItem {
  id: string;
  studentName: string;
  studentNo: string;
  source: string;
  target: string;
  priority: 1 | 2 | 3;
  authorized: boolean;
  status: "待处理" | "已生成" | "需审批";
  note: string;
}

export interface Appeal {
  id: string;
  studentName: string;
  content: string;
  createdAt: string;
  status: "待处理" | "已办结";
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  object: string;
  detail: string;
}

export interface Application {
  submittedAt: string;
  version: number;
  round: number;
  idempotencyKey: string;
}

export interface AppState {
  role: Role;
  units?: Unit[];
  currentUser?: UserAccount | null;
  permissions?: string[];
  users?: UserAccount[];
  dbStats?: {
    path: string;
    users: number;
    activeSessions: number;
    auditEvents: number;
    candidates: number;
    offers: number;
  } | null;
  stage: StageKey;
  selectedUnitIds: string[];
  adjustments: {
    internal: boolean;
    cross: boolean;
  };
  commitment: boolean;
  application: Application | null;
  offers: Offer[];
  confirmedOfferId: string | null;
  finalUnitId: string | null;
  interviews: Interview[];
  candidates: Candidate[];
  candidateListSubmitted: boolean;
  adjustmentQueue: AdjustmentItem[];
  published: boolean;
  publishedAt: string | null;
  frozenAt: string | null;
  appeals: Appeal[];
  supplementRound: number;
  supplementGeneratedAt: string | null;
  audit: AuditEvent[];
}

export interface UserAccount {
  id: string;
  account: string;
  name: string;
  role: Role;
  unitId: string | null;
  studentNo: string | null;
  active: boolean;
}

export interface ToastMessage {
  id: number;
  message: string;
  tone: "success" | "info" | "warning" | "danger";
}
