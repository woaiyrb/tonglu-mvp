import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CYCLE, initialState } from "./data";
import type {
  AppState,
  CandidateDecision,
  Role,
  StageKey,
  ToastMessage,
  UserAccount,
} from "./types";

const TOKEN_KEY = "tonglu-backend-token-v1";
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";

const routeRoleMap: Record<string, Role> = {
  student: "student",
  mentor: "mentor",
  interviewer: "interviewer",
  lab: "lab_manager",
  admin: "college_admin",
  leader: "college_leader",
  system: "sys_admin",
};

export class ApiRequestError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiRequestError(0, "NETWORK_ERROR", "无法连接后端，请确认 API 服务已启动。");
  }
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.ok) {
    throw new ApiRequestError(
      response.status,
      payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.message ?? "请求失败。",
    );
  }
  return payload.data as T;
}

interface LoginResult {
  token: string;
  user: UserAccount;
  state: AppState;
}

interface AppContextValue {
  state: AppState;
  loading: boolean;
  authError: string | null;
  toast: ToastMessage | null;
  notify: (message: string, tone?: ToastMessage["tone"]) => void;
  dismissToast: () => void;
  setRole: (role: Role) => Promise<boolean>;
  setStage: (stage: StageKey) => Promise<boolean>;
  toggleUnit: (unitId: string) => void;
  setAdjustment: (key: "internal" | "cross", value: boolean) => void;
  setCommitment: (value: boolean) => void;
  submitApplication: () => Promise<boolean>;
  confirmOffer: (offerId: string) => Promise<boolean>;
  updateCandidateScore: (id: string, score: number, comment: string) => Promise<boolean>;
  updateCandidateDecision: (id: string, decision: CandidateDecision) => Promise<boolean>;
  submitCandidateList: () => Promise<boolean>;
  generateSupplement: () => Promise<boolean>;
  approveAdjustment: (id: string) => Promise<boolean>;
  publishResults: () => Promise<boolean>;
  freezeResults: () => Promise<boolean>;
  submitAppeal: (content: string) => Promise<boolean>;
  resolveAppeal: (id: string) => Promise<boolean>;
  updateUserAccess: (id: string, patch: { role?: Role; active?: boolean }) => Promise<boolean>;
  updateUnitQuota: (unitId: string, quota: number) => Promise<boolean>;
  resetDemo: () => Promise<boolean>;
}

const AppContext = createContext<AppContextValue | null>(null);

function initialRoleFromUrl(): Role {
  const segment = window.location.pathname.split("/")[1] ?? "student";
  return routeRoleMap[segment] ?? "student";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({ ...initialState }));
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(token);
  const stateRef = useRef(state);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    window.localStorage.removeItem("tonglu-ghibli-mvp-v1");
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const notify = useCallback((message: string, tone: ToastMessage["tone"] = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 4400);
  }, []);

  const saveSession = useCallback((result: LoginResult) => {
    window.localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    tokenRef.current = result.token;
    setState(result.state);
    setAuthError(null);
  }, []);

  const demoLogin = useCallback(async (role: Role): Promise<LoginResult> => {
    const result = await request<LoginResult>("/auth/demo", {
      method: "POST",
      body: JSON.stringify({ role }),
    });
    saveSession(result);
    return result;
  }, [saveSession]);

  const recoverSession = useCallback(async () => {
    const existing = tokenRef.current;
    if (existing) {
      try {
        const result = await request<{ state: AppState }>("/bootstrap", {}, existing);
        setState(result.state);
        setAuthError(null);
        setLoading(false);
        return;
      } catch (error) {
        if (!(error instanceof ApiRequestError) || error.status !== 401) {
          setAuthError(error instanceof Error ? error.message : "后端连接失败。");
          setLoading(false);
          return;
        }
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        tokenRef.current = null;
      }
    }
    try {
      await demoLogin(initialRoleFromUrl());
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "无法建立演示会话。");
    } finally {
      setLoading(false);
    }
  }, [demoLogin]);

  useEffect(() => {
    void recoverSession();
  }, [recoverSession]);

  const applyMutation = useCallback(async (
    path: string,
    method: "POST" | "PATCH",
    body?: unknown,
    successMessage?: string,
  ): Promise<boolean> => {
    try {
      const result = await request<{ state: AppState }>(path, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
      }, tokenRef.current);
      setState(result.state);
      if (successMessage) notify(successMessage, "success");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "操作失败。";
      notify(message, "danger");
      if (error instanceof ApiRequestError && error.status === 401) {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        tokenRef.current = null;
        void demoLogin(initialRoleFromUrl());
      }
      return false;
    }
  }, [demoLogin, notify]);

  const setRole = useCallback(async (role: Role) => {
    if (role === stateRef.current.role && tokenRef.current) return true;
    try {
      await demoLogin(role);
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "角色切换失败。", "danger");
      return false;
    }
  }, [demoLogin, notify]);

  const setStage = useCallback((stage: StageKey) => {
    if (stage === stateRef.current.stage) return Promise.resolve(true);
    return applyMutation("/demo/stage", "POST", { stage });
  }, [applyMutation]);

  const syncDraft = useCallback((next: AppState) => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(async () => {
      try {
        const result = await request<{ state: AppState }>("/student/draft", {
          method: "PATCH",
          body: JSON.stringify({
            selectedUnitIds: next.selectedUnitIds,
            adjustments: next.adjustments,
            commitment: next.commitment,
          }),
        }, tokenRef.current);
        setState(result.state);
      } catch (error) {
        notify(error instanceof Error ? error.message : "草稿保存失败。", "warning");
      }
    }, 260);
  }, [notify]);

  const toggleUnit = useCallback((unitId: string) => {
    const current = stateRef.current;
    if (current.stage !== "intent") {
      notify("当前阶段为只读，请先切换到“意向填报”。", "warning");
      return;
    }
    let selectedUnitIds: string[];
    if (current.selectedUnitIds.includes(unitId)) {
      selectedUnitIds = current.selectedUnitIds.filter((id) => id !== unitId);
    } else {
      if (current.selectedUnitIds.length >= 3) {
        notify("每轮最多选择 3 个平行意向。请先移除一个方向。", "warning");
        return;
      }
      selectedUnitIds = [...current.selectedUnitIds, unitId];
      notify("已加入意向，提交前仍可调整。", "info");
    }
    const next = { ...current, selectedUnitIds };
    setState(next);
    syncDraft(next);
  }, [notify, syncDraft]);

  const setAdjustment = useCallback((key: "internal" | "cross", value: boolean) => {
    const current = stateRef.current;
    if (current.stage !== "intent") {
      notify("当前阶段不能修改调剂授权。", "warning");
      return;
    }
    const next = { ...current, adjustments: { ...current.adjustments, [key]: value } };
    setState(next);
    syncDraft(next);
  }, [notify, syncDraft]);

  const setCommitment = useCallback((value: boolean) => {
    const current = stateRef.current;
    if (current.stage !== "intent") {
      notify("当前阶段不能修改承诺声明。", "warning");
      return;
    }
    const next = { ...current, commitment: value };
    setState(next);
    syncDraft(next);
  }, [notify, syncDraft]);

  const submitApplication = useCallback(() => {
    const version = (stateRef.current.application?.version ?? 0) + 1;
    return applyMutation(
      "/applications",
      "POST",
      { idempotencyKey: `${CYCLE.code}-${stateRef.current.currentUser?.id ?? "student"}-${version}-${Date.now()}` },
      "申请已提交，服务器已生成新版本并写入审计日志。",
    );
  }, [applyMutation]);

  const confirmOffer = useCallback((offerId: string) => applyMutation(
    `/offers/${offerId}/confirm`,
    "POST",
    undefined,
    "去向已由服务器事务确认。其他拟录取已失效，名额已释放。",
  ), [applyMutation]);

  const updateCandidateScore = useCallback((id: string, score: number, comment: string) => applyMutation(
    `/candidates/${id}/score`,
    "PATCH",
    { score, comment },
    "评分已保存到数据库。",
  ), [applyMutation]);

  const updateCandidateDecision = useCallback((id: string, decision: CandidateDecision) => applyMutation(
    `/candidates/${id}/decision`,
    "PATCH",
    { decision },
  ), [applyMutation]);

  const submitCandidateList = useCallback(() => applyMutation(
    "/candidates/submit",
    "POST",
    undefined,
    "候选名单已提交并锁定，操作已写入审计日志。",
  ), [applyMutation]);

  const generateSupplement = useCallback(() => applyMutation(
    "/supplements",
    "POST",
    undefined,
    "补录任务已生成。",
  ), [applyMutation]);

  const approveAdjustment = useCallback((id: string) => applyMutation(
    `/adjustments/${id}/approve`,
    "POST",
    undefined,
    "调剂记录已生成，授权与名额校验通过。",
  ), [applyMutation]);

  const publishResults = useCallback(() => applyMutation(
    "/publications/publish",
    "POST",
    undefined,
    "公示名单已生成，学生端可查看。",
  ), [applyMutation]);

  const freezeResults = useCallback(() => applyMutation(
    "/publications/freeze",
    "POST",
    undefined,
    "正式名单已冻结，后续修改需要更正流程。",
  ), [applyMutation]);

  const submitAppeal = useCallback((content: string) => applyMutation(
    "/appeals",
    "POST",
    { content },
    "异议已登记，学院将在公示结束前处理。",
  ), [applyMutation]);

  const resolveAppeal = useCallback((id: string) => applyMutation(
    `/appeals/${id}/resolve`,
    "POST",
    undefined,
    "异议已办结。",
  ), [applyMutation]);

  const updateUserAccess = useCallback((id: string, patch: { role?: Role; active?: boolean }) => applyMutation(
    `/admin/users/${id}`,
    "PATCH",
    patch,
    "账号角色与状态已更新。",
  ), [applyMutation]);

  const updateUnitQuota = useCallback((unitId: string, quota: number) => applyMutation(
    `/units/${unitId}/quota`,
    "PATCH",
    { quota },
    "计划名额已写入数据库，并记录审计日志。",
  ), [applyMutation]);

  const resetDemo = useCallback(() => applyMutation(
    "/admin/reset",
    "POST",
    undefined,
    "业务数据已恢复初始状态，账号保留。",
  ), [applyMutation]);

  const value = useMemo<AppContextValue>(() => ({
    state,
    loading,
    authError,
    toast,
    notify,
    dismissToast,
    setRole,
    setStage,
    toggleUnit,
    setAdjustment,
    setCommitment,
    submitApplication,
    confirmOffer,
    updateCandidateScore,
    updateCandidateDecision,
    submitCandidateList,
    generateSupplement,
    approveAdjustment,
    publishResults,
    freezeResults,
    submitAppeal,
    resolveAppeal,
    updateUserAccess,
    updateUnitQuota,
    resetDemo,
  }), [
    state, loading, authError, toast, notify, dismissToast, setRole, setStage,
    toggleUnit, setAdjustment, setCommitment, submitApplication, confirmOffer,
    updateCandidateScore, updateCandidateDecision, submitCandidateList,
    generateSupplement, approveAdjustment, publishResults, freezeResults,
    submitAppeal, resolveAppeal, updateUserAccess, updateUnitQuota, resetDemo,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
