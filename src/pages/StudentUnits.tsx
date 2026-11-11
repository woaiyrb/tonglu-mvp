import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Callout,
  EmptyState,
  Modal,
  PageHeader,
  ProgressBar,
  StatusBadge,
  UnitGlyph,
} from "../components/Ui";
import { STAGES, UNITS } from "../data";
import { useApp } from "../store";
import type { Unit } from "../types";
import { cn, getUnitStats } from "../utils";

const filters = [
  { key: "all", label: "全部方向", test: (_unit: Unit) => true },
  {
    key: "ai",
    label: "人工智能",
    test: (unit: Unit) => ["u1", "u3", "u5"].includes(unit.id),
  },
  { key: "data", label: "数据平台", test: (unit: Unit) => unit.id === "u2" },
  { key: "software", label: "软件工程", test: (unit: Unit) => unit.id === "u4" },
  { key: "product", label: "产品研究", test: (unit: Unit) => unit.id === "u6" },
];

export function StudentUnits() {
  const { state, toggleUnit } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const locked = state.stage !== "intent";
  const detailUnit = UNITS.find((unit) => unit.id === detailId) ?? null;

  const visibleUnits = useMemo(() => {
    const activeFilter = filters.find((item) => item.key === filter) ?? filters[0];
    const normalized = query.trim().toLowerCase();
    return UNITS.filter((unit) => {
      const matchesFilter = activeFilter.test(unit);
      const haystack = [unit.name, unit.direction, unit.mentor, ...unit.tags]
        .join(" ")
        .toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [filter, query]);

  const selectedUnits = state.selectedUnitIds
    .map((id) => UNITS.find((unit) => unit.id === id))
    .filter((unit): unit is Unit => Boolean(unit));

  const handleToggle = (unit: Unit) => {
    const stats = getUnitStats(unit, state.offers);
    if (!state.selectedUnitIds.includes(unit.id) && stats.remaining === 0) return;
    toggleUnit(unit.id);
  };

  return (
    <div className="units-page">
      <PageHeader
        eyebrow={<>招生方向 · 第 {stage.number} 阶段</>}
        title="先看方向，再看自己。"
        description="每轮最多选择 3 个平行意向。它们同等有效，不记录第一、第二、第三志愿顺序。"
        actions={
          <div className="selection-count">
            <span>已选意向</span>
            <strong>{state.selectedUnitIds.length} / 3</strong>
          </div>
        }
      />

      {locked && (
        <Callout
          tone="warning"
          title={`当前演示阶段为“${stage.label}”，招生方向为只读`}
          action={
            <span className="callout-hint">
              使用顶部“演示旅程”切换到第 3 阶段即可修改意向。
            </span>
          }
        >
          已提交的意向不会被此处操作改变。
        </Callout>
      )}

      <div className="catalog-layout">
        <div className="catalog-main">
          <div className="catalog-tools">
            <label className="search-field">
              <Search aria-hidden="true" />
              <span className="sr-only">搜索招生方向</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索实训室、导师或关键词"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="清空搜索">
                  <X aria-hidden="true" />
                </button>
              )}
            </label>
            <div className="filter-chips" role="group" aria-label="方向筛选">
              {filters.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={cn("filter-chip", filter === item.key && "is-active")}
                  onClick={() => setFilter(item.key)}
                  aria-pressed={filter === item.key}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {visibleUnits.length === 0 ? (
            <EmptyState
              icon={<SlidersHorizontal aria-hidden="true" />}
              title="没有找到匹配的方向"
              description="换一个关键词，或清除当前筛选条件。"
              action={
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  清除筛选
                </button>
              }
            />
          ) : (
            <div className="unit-grid">
              {visibleUnits.map((unit) => {
                const stats = getUnitStats(unit, state.offers);
                const selected = state.selectedUnitIds.includes(unit.id);
                const full = stats.remaining === 0;
                return (
                  <article className={cn("unit-card", selected && "is-selected")} key={unit.id}>
                    <div className="unit-card-head">
                      <UnitGlyph glyph={unit.glyph} tone={unit.tone} />
                      <StatusBadge tone={full ? "neutral" : selected ? "sage" : "sky"} dot>
                        {full ? "已满额" : selected ? "已加入" : "招募中"}
                      </StatusBadge>
                    </div>

                    <div className="unit-card-title">
                      <span>{unit.code}</span>
                      <h2>{unit.name}</h2>
                      <p>{unit.direction}</p>
                    </div>

                    <div className="mentor-line">
                      <span className="mentor-avatar">{unit.mentor.slice(0, 1)}</span>
                      <span>
                        <strong>{unit.mentor}</strong>
                        <small>{unit.mentorTitle}</small>
                      </span>
                    </div>

                    <p className="unit-summary">{unit.summary}</p>

                    <div className="tag-row">
                      {unit.tags.map((tag) => (
                        <span className="tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="unit-card-meta">
                      <span>
                        <CalendarClock aria-hidden="true" /> {unit.schedule}
                      </span>
                      <span>
                        <MapPin aria-hidden="true" /> {unit.location.split(" ")[0]}
                      </span>
                    </div>

                    <div className="quota-line">
                      <div>
                        <span>剩余名额</span>
                        <strong>{stats.remaining}</strong>
                        <small>/ {unit.quota}</small>
                      </div>
                      <ProgressBar value={stats.fillRate} tone={unit.tone === "gold" ? "coral" : "sage"} label={`${unit.name}名额使用率`} />
                    </div>

                    <div className="unit-card-actions">
                      <button type="button" className="btn btn-ghost" onClick={() => setDetailId(unit.id)}>
                        查看详情
                      </button>
                      <button
                        type="button"
                        className={cn("btn", selected ? "btn-secondary" : "btn-primary")}
                        onClick={() => handleToggle(unit)}
                        disabled={locked || (!selected && (full || state.selectedUnitIds.length >= 3))}
                        title={
                          locked
                            ? "请先切换到意向填报阶段"
                            : !selected && state.selectedUnitIds.length >= 3
                              ? "已选满 3 个意向"
                              : undefined
                        }
                      >
                        {selected ? (
                          <>
                            <Check aria-hidden="true" />
                            已加入
                          </>
                        ) : full ? (
                          "已满额"
                        ) : (
                          "加入意向"
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="selection-panel">
          <div className="selection-panel-head">
            <div>
              <span className="eyebrow">本轮选择</span>
              <h2>我的平行意向</h2>
            </div>
            <span className="selection-badge">{state.selectedUnitIds.length} / 3</span>
          </div>

          <div className="selection-slots">
            {[0, 1, 2].map((index) => {
              const unit = selectedUnits[index];
              if (!unit) {
                return (
                  <div className="selection-slot selection-slot--empty" key={`empty-${index}`}>
                    <span>0{index + 1}</span>
                    <p>还可以选择一个方向</p>
                  </div>
                );
              }
              return (
                <div className="selection-slot" key={unit.id}>
                  <span className="slot-index">0{index + 1}</span>
                  <UnitGlyph glyph={unit.glyph} tone={unit.tone} size="sm" />
                  <div className="slot-copy">
                    <strong>{unit.name}</strong>
                    <span>{unit.direction}</span>
                  </div>
                  <button
                    type="button"
                    className="icon-button icon-button--small"
                    onClick={() => toggleUnit(unit.id)}
                    disabled={locked}
                    aria-label={`移除 ${unit.name}`}
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="selection-auth">
            <div>
              <strong>实训室内调剂</strong>
              <span>{state.adjustments.internal ? "已授权" : "未授权"}</span>
            </div>
            <div>
              <strong>跨实训室调剂</strong>
              <span>{state.adjustments.cross ? "已授权" : "未授权"}</span>
            </div>
          </div>

          <Link to="/student/application" className="btn btn-primary btn-block">
            查看并提交申请
            <ArrowRight aria-hidden="true" />
          </Link>
          <p className="selection-footnote">
            提交后可在本轮截止前修改。系统会保存每次提交版本。
          </p>
        </aside>
      </div>

      <Modal
        open={Boolean(detailUnit)}
        onClose={() => setDetailId(null)}
        title={detailUnit?.name ?? "方向详情"}
        description={detailUnit ? `${detailUnit.code} · ${detailUnit.direction}` : undefined}
        size="lg"
        footer={
          detailUnit ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setDetailId(null)}>
                关闭
              </button>
              <button
                type="button"
                className={cn(
                  "btn",
                  state.selectedUnitIds.includes(detailUnit.id) ? "btn-secondary" : "btn-primary",
                )}
                onClick={() => handleToggle(detailUnit)}
                disabled={
                  locked ||
                  (!state.selectedUnitIds.includes(detailUnit.id) &&
                    (getUnitStats(detailUnit, state.offers).remaining === 0 ||
                      state.selectedUnitIds.length >= 3))
                }
              >
                {state.selectedUnitIds.includes(detailUnit.id) ? (
                  <>
                    <Check aria-hidden="true" />
                    已加入意向
                  </>
                ) : (
                  "加入意向"
                )}
              </button>
            </>
          ) : undefined
        }
      >
        {detailUnit && (
          <div className="unit-detail">
            <div className={cn("unit-detail-banner", `unit-detail-banner--${detailUnit.tone}`)}>
              <UnitGlyph glyph={detailUnit.glyph} tone={detailUnit.tone} size="lg" />
              <div>
                <h3>{detailUnit.direction}</h3>
                <p>{detailUnit.mentor} · {detailUnit.mentorTitle}</p>
              </div>
              <div className="detail-quota">
                <strong>{getUnitStats(detailUnit, state.offers).remaining}</strong>
                <span>剩余 / {detailUnit.quota}</span>
              </div>
            </div>

            <p className="detail-lead">{detailUnit.summary}</p>

            <div className="detail-grid">
              <div>
                <span className="detail-label">培养安排</span>
                <p>{detailUnit.training}</p>
              </div>
              <div>
                <span className="detail-label">考核要求</span>
                <p>{detailUnit.assessment}</p>
              </div>
              <div>
                <span className="detail-label">材料要求</span>
                <p>{detailUnit.materials}</p>
              </div>
              <div>
                <span className="detail-label">时间与地点</span>
                <p>{detailUnit.schedule} · {detailUnit.location}</p>
              </div>
            </div>

            <div className="detail-footnote">
              <Users aria-hidden="true" />
              组内计划招收 {detailUnit.quota} 人，已确认 {getUnitStats(detailUnit, state.offers).confirmed} 人，待确认 {getUnitStats(detailUnit, state.offers).pending} 人。
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
