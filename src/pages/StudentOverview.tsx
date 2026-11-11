import {
  ArrowRight,
  Bell,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Compass,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmOfferDialog } from "../components/ConfirmOfferDialog";
import { OfferCard } from "../components/OfferCard";
import { StageRail } from "../components/StageRail";
import {
  SectionTitle,
  StatCard,
  StatusBadge,
  UnitGlyph,
} from "../components/Ui";
import { CYCLE, NOTICE_ITEMS, STAGES, UNITS } from "../data";
import { useApp } from "../store";
import { cn, getUnitStats } from "../utils";

type OverviewModule = "overview" | "offers" | "progress" | "directions";

export function StudentOverview() {
  const { state, setStage } = useApp();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<OverviewModule>("overview");
  const selectedUnits = state.selectedUnitIds
    .map((id) => UNITS.find((unit) => unit.id === id))
    .filter((unit): unit is (typeof UNITS)[number] => Boolean(unit));
  const pendingOffers = state.offers.filter(
    (offer) => offer.status === "pending" && !state.confirmedOfferId,
  );
  const confirmedOffer = state.offers.find((offer) => offer.id === state.confirmedOfferId);
  const confirmedUnit = confirmedOffer
    ? UNITS.find((unit) => unit.id === confirmedOffer.unitId)
    : null;
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const nextStage = STAGES.find((item) => item.number === stage.number + 1);
  const doneInterviews = state.interviews.filter((item) => item.status === "done").length;
  const topScore = Math.max(...state.interviews.map((item) => item.score ?? 0));

  const headline = confirmedUnit
    ? "方向已落定，等一场公示。"
    : pendingOffers.length > 0
      ? "两个方向都在等你，做一次选择。"
      : "一步一步，走向你想去的地方。";

  const description = confirmedUnit
    ? `你已确认加入${confirmedUnit.name}。接下来，学院将完成唯一性、名额与授权校验，并生成公示名单。`
    : pendingOffers.length > 0
      ? "面试已经结束，结果已经抵达。请选择一个真正想投入的方向，其他拟录取会自动释放。"
      : "从平行意向到正式入组，每一次提交、每一场面试和每一个选择，都在这里留下清楚的记录。";

  const modules: Array<{
    id: OverviewModule;
    label: string;
    hint: string;
    icon: typeof Sparkles;
    badge?: number;
  }> = [
    { id: "overview", label: "今日概览", hint: "阶段与关键数据", icon: Sparkles },
    {
      id: "offers",
      label: "拟录取",
      hint: confirmedUnit ? "去向已确认" : pendingOffers.length > 0 ? "待你选择" : "暂无待确认",
      icon: ClipboardCheck,
      badge: pendingOffers.length,
    },
    { id: "progress", label: "选拔进度", hint: "六个业务阶段", icon: CalendarCheck2 },
    {
      id: "directions",
      label: "方向与通知",
      hint: `${selectedUnits.length} 个平行意向`,
      icon: Compass,
    },
  ];

  return (
    <div className="student-overview">
      <nav className="overview-tabs" role="tablist" aria-label="概览模块">
        {modules.map((module) => {
          const Icon = module.icon;
          const active = activeModule === module.id;
          return (
            <button
              key={module.id}
              id={`overview-tab-${module.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`overview-panel-${module.id}`}
              className={cn("overview-tab", active && "is-active")}
              onClick={() => setActiveModule(module.id)}
            >
              <span className="overview-tab-icon">
                <Icon aria-hidden="true" />
              </span>
              <span className="overview-tab-copy">
                <strong>{module.label}</strong>
                <small>{module.hint}</small>
              </span>
              {module.badge ? <span className="overview-tab-badge">{module.badge}</span> : null}
            </button>
          );
        })}
      </nav>

      <div
        id={`overview-panel-${activeModule}`}
        className="overview-stage"
        role="tabpanel"
        aria-labelledby={`overview-tab-${activeModule}`}
        tabIndex={0}
      >
        {activeModule === "overview" && (
          <div className="overview-module">
            <section className="hero-panel">
              <span className="hero-sky-arc" aria-hidden="true" />
              <span className="hero-ridge" aria-hidden="true" />
              <div className="hero-grid">
                <div className="hero-copy">
                  <p className="hero-kicker">
                    {CYCLE.name}
                    <span className="kicker-separator" aria-hidden="true" />
                    第 {stage.number} 阶段
                  </p>
                  <h1>
                    {headline.split("，").map((part, index, parts) => (
                      <span key={part} className="hero-line">
                        {part}
                        {index < parts.length - 1 ? "，" : ""}
                      </span>
                    ))}
                  </h1>
                  <p className="hero-lede">{description}</p>
                  <div className="hero-actions">
                    {confirmedUnit ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setActiveModule("offers")}
                      >
                        查看已确认去向
                        <ArrowRight aria-hidden="true" />
                      </button>
                    ) : pendingOffers.length > 0 ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setActiveModule("offers")}
                      >
                        查看 {pendingOffers.length} 个拟录取
                        <ArrowRight aria-hidden="true" />
                      </button>
                    ) : (
                      <Link to="/student/units" className="btn btn-primary">
                        看看招生方向
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    )}
                    <Link to="/student/application" className="hero-link">
                      查看我的申请
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <aside className="stage-card">
                  <div className="stage-card-head">
                    <span className="stage-state">
                      <span className="stage-live-dot" aria-hidden="true" />
                      {state.stage === "publicity" ? "等待公示" : "正在进行"}
                    </span>
                    <span className="stage-number">
                      {String(stage.number).padStart(2, "0")}
                      <small>/ 8</small>
                    </span>
                  </div>
                  <h2>{stage.label}</h2>
                  <div className="stage-mini-progress">
                    {STAGES.map((item) => (
                      <span
                        key={item.key}
                        className={cn(
                          item.number < stage.number && "is-done",
                          item.number === stage.number && "is-current",
                        )}
                      />
                    ))}
                  </div>
                </aside>
              </div>
            </section>

            <section className="stats-grid" aria-label="我的关键数据">
              <StatCard
                label="平行意向"
                value={`${state.selectedUnitIds.length} / 3`}
                hint="不分先后，同等有效"
                icon={<FileText aria-hidden="true" />}
                tone="sage"
              />
              <StatCard
                label="面试完成"
                value={`${doneInterviews} / ${state.interviews.length}`}
                hint="全部有效报名均已面试"
                icon={<CalendarCheck2 aria-hidden="true" />}
                tone="sky"
              />
              <StatCard
                label={confirmedUnit ? "已确认去向" : "待确认拟录取"}
                value={confirmedUnit ? "1" : pendingOffers.length}
                hint={confirmedUnit ? confirmedUnit.name : "只能选择一个去向"}
                icon={<ClipboardCheck aria-hidden="true" />}
                tone={confirmedUnit ? "leaf" : "coral"}
              />
              <StatCard
                label="面试最高分"
                value={topScore}
                hint="评分仅本人可见"
                icon={<Sparkles aria-hidden="true" />}
                tone="rose"
              />
            </section>
          </div>
        )}

        {activeModule === "offers" && (
          <div className="overview-module">
            <SectionTitle
              title={confirmedUnit ? "去向已经确认" : "此刻，方向在等你"}
              description={
                confirmedUnit
                  ? "确认结果已锁定。学院将继续完成唯一性、名额与授权校验。"
                  : "确认后，其他拟录取会立即失效。请以培养安排和考核要求为准做选择。"
              }
              action={
                confirmedUnit ? (
                  <StatusBadge tone="sage">已确认 1 个去向</StatusBadge>
                ) : pendingOffers.length > 0 ? (
                  <StatusBadge tone="coral">{pendingOffers.length} 个待确认</StatusBadge>
                ) : null
              }
            />

            {pendingOffers.length > 0 ? (
              <div className="offer-grid">
                {pendingOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} onConfirm={setConfirmId} />
                ))}
              </div>
            ) : confirmedUnit ? (
              <section className="confirmed-banner confirmed-banner--module">
                <span className="confirmed-mark">
                  <CheckCircle2 aria-hidden="true" />
                </span>
                <div>
                  <span className="eyebrow">去向已确认</span>
                  <h2>{confirmedUnit.name} · {confirmedUnit.direction}</h2>
                  <p>导师 {confirmedUnit.mentor} · 组会 {confirmedUnit.schedule} · {confirmedUnit.location}</p>
                </div>
                <Link to="/student/results" className="btn btn-secondary">
                  查看后续流程
                  <ChevronRight aria-hidden="true" />
                </Link>
              </section>
            ) : (
              <div className="overview-empty content-card">
                <span className="overview-empty-icon">
                  <ClipboardCheck aria-hidden="true" />
                </span>
                <div>
                  <h3>暂无待确认拟录取</h3>
                  <p>拟录取会在面试与调剂完成后出现在这里。先去查看招生方向，完善你的平行意向。</p>
                </div>
                <Link to="/student/units" className="btn btn-secondary">
                  查看招生方向
                  <ChevronRight aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        )}

        {activeModule === "progress" && (
          <div className="overview-module">
            <SectionTitle
              title="选拔进度"
              description="当前为演示阶段。真实系统会按服务器时间自动开放与关闭。"
              action={
                <button type="button" className="text-link" onClick={() => setStage("intent")}>
                  回到意向填报
                  <ArrowRight aria-hidden="true" />
                </button>
              }
            />
            <div className="content-card rail-card">
              <StageRail current={state.stage} onSelect={setStage} />
            </div>
            <div className="overview-progress-notes">
              <div className="content-card overview-progress-note">
                <span className="eyebrow">当前阶段</span>
                <strong>0{stage.number} · {stage.label}</strong>
                <p>{stage.description}</p>
              </div>
              <div className="content-card overview-progress-note">
                <span className="eyebrow">下一步</span>
                <strong>{nextStage ? nextStage.label : "等待正式入组"}</strong>
                <p>{nextStage ? nextStage.description : "公示完成后，系统将冻结正式名单。"}</p>
              </div>
              <div className="content-card overview-progress-note">
                <span className="eyebrow">我的进度</span>
                <strong>{doneInterviews} / {state.interviews.length} 场面试完成</strong>
                <p>{confirmedUnit ? `已确认 ${confirmedUnit.name}` : pendingOffers.length > 0 ? `还有 ${pendingOffers.length} 个拟录取待确认` : "暂未收到待确认拟录取"}</p>
                <small>评分与结果仅本人可见</small>
              </div>
            </div>
          </div>
        )}

        {activeModule === "directions" && (
          <div className="overview-module">
            <div className="section-grid section-grid--sidebar overview-directions">
              <div className="stack-24">
                <SectionTitle
                  title="你选择的方向"
                  description="3 个平行意向，不设第一志愿。"
                  action={
                    <Link to="/student/application" className="text-link">
                      查看申请
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  }
                />
                <div className="intent-preview-list">
                  {selectedUnits.map((unit, index) => {
                    const stats = getUnitStats(unit, state.offers);
                    return (
                      <Link to="/student/units" key={unit.id} className="intent-preview">
                        <span className="intent-index">0{index + 1}</span>
                        <UnitGlyph glyph={unit.glyph} tone={unit.tone} size="sm" />
                        <div className="intent-preview-copy">
                          <strong>{unit.name}</strong>
                          <span>{unit.direction} · {unit.mentor}</span>
                        </div>
                        <div className="intent-preview-meta">
                          <span>{stats.remaining} 个剩余名额</span>
                          <ChevronRight aria-hidden="true" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="soft-note">
                  <MapPin aria-hidden="true" />
                  <span>面试地点以信息楼为主，具体教室与线上链接可在“面试与结果”中查看。</span>
                </div>
              </div>

              <aside className="stack-24">
                <SectionTitle title="最近通知" description="与你的申请和面试有关。" />
                <div className="notice-card">
                  {NOTICE_ITEMS.map((notice) => (
                    <div className="notice-item" key={notice.id}>
                      <span className={cn("notice-icon", `notice-icon--${notice.tone}`)}>
                        {notice.tone === "success" ? (
                          <CheckCircle2 aria-hidden="true" />
                        ) : notice.tone === "important" ? (
                          <Bell aria-hidden="true" />
                        ) : (
                          <FileText aria-hidden="true" />
                        )}
                      </span>
                      <div>
                        <strong>{notice.title}</strong>
                        <p>{notice.detail}</p>
                        <small>{notice.time}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      <ConfirmOfferDialog
        offerId={confirmId}
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
      />
    </div>
  );
}
