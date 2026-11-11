import {
  ArrowRight,
  Download,
  ListPlus,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Callout, PageHeader, ProgressBar, SectionTitle, StatusBadge } from "../components/Ui";
import { STAGES, UNITS } from "../data";
import { useApp } from "../store";
import { downloadCsv, formatDateTime, getUnitStats } from "../utils";

export function AdminQuota() {
  const { state, generateSupplement, updateUnitQuota, notify } = useApp();
  const units = state.units?.length ? state.units : UNITS;
  const stage = STAGES.find((item) => item.key === state.stage) ?? STAGES[0];
  const frozen = Boolean(state.frozenAt);
  const supplementOpen = state.stage === "supplement" && !frozen;
  const [draftQuota, setDraftQuota] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraftQuota(Object.fromEntries(units.map((unit) => [unit.id, String(unit.quota)])));
  }, [units]);

  const totals = units.reduce(
    (sum, unit) => {
      const stats = getUnitStats(unit, state.offers);
      return { quota: sum.quota + unit.quota, confirmed: sum.confirmed + stats.confirmed, pending: sum.pending + stats.pending, remaining: sum.remaining + stats.remaining };
    },
    { quota: 0, confirmed: 0, pending: 0, remaining: 0 },
  );

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow={<>名额与补录 · 第 {stage.number} 阶段</>}
        title="名额要算准，补录才有意义。"
        description="已确认与待确认都占用名额。拟录取失效后，名额自动释放。"
        actions={
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              downloadCsv("2026-AUT-名额总览.csv", [
                ["代码", "实训室", "导师", "计划", "已确认", "待确认", "剩余", "使用率"],
                ...units.map((unit) => {
                  const stats = getUnitStats(unit, state.offers);
                  return [unit.code, unit.name, unit.mentor, unit.quota, stats.confirmed, stats.pending, stats.remaining, `${stats.fillRate}%`];
                }),
              ]);
              notify("名额总览已导出。", "success");
            }}
          >
            <Download aria-hidden="true" /> 导出
          </button>
        }
      />

      {frozen && (
        <Callout tone="info" title="正式名单已冻结">
          名额进入只读状态。后续更正必须走审批流程，系统会记录修改前后值。
        </Callout>
      )}

      <section className="quota-total-bar">
        <div><span>计划名额</span><strong>{totals.quota}</strong></div>
        <div><span>已确认</span><strong>{totals.confirmed}</strong></div>
        <div><span>待确认</span><strong>{totals.pending}</strong></div>
        <div><span>剩余</span><strong>{totals.remaining}</strong></div>
        <ProgressBar value={Math.round(((totals.confirmed + totals.pending) / totals.quota) * 100)} tone="sage" label="总体名额使用率" />
      </section>

      <section className="section-block">
        <SectionTitle title="各实训室名额" description="使用率按“已确认 + 待确认”计算，上限为计划名额。" />
        <div className="table-card">
          <table className="data-table quota-table">
            <thead>
              <tr><th>实训室</th><th>导师</th><th>计划</th><th>已确认</th><th>待确认</th><th>剩余</th><th>使用率</th></tr>
            </thead>
            <tbody>
              {units.map((unit) => {
                const stats = getUnitStats(unit, state.offers);
                const value = Number(draftQuota[unit.id] ?? unit.quota);
                const used = stats.confirmed + stats.pending;
                const invalid = !Number.isInteger(value) || value < used || value > 30;
                return (
                  <tr key={unit.id}>
                    <td><strong>{unit.name}</strong><small className="cell-sub">{unit.code} · {unit.direction}</small></td>
                    <td>{unit.mentor}</td>
                    <td>
                      <div className="quota-editor">
                        <input
                          className="quota-input"
                          type="number"
                          min={used}
                          max={30}
                          value={draftQuota[unit.id] ?? String(unit.quota)}
                          disabled={frozen}
                          aria-label={`${unit.name}计划名额`}
                          onChange={(event) => setDraftQuota((current) => ({ ...current, [unit.id]: event.target.value }))}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          disabled={frozen || invalid || value === unit.quota}
                          onClick={() => void updateUnitQuota(unit.id, value)}
                        >
                          保存
                        </button>
                      </div>
                      {invalid && <small className="cell-sub quota-warning">不得低于已占 {used} 人，且不超过 30</small>}
                    </td>
                    <td>{stats.confirmed}</td>
                    <td>{stats.pending}</td>
                    <td><span className={stats.remaining === 0 ? "value-alert" : "value-good"}>{stats.remaining}</span></td>
                    <td>
                      <div className="inline-progress">
                        <ProgressBar value={stats.fillRate} tone={stats.remaining === 0 ? "coral" : "sage"} label={`${unit.name}使用率`} />
                        <span>{stats.fillRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-grid section-grid--sidebar">
        <div className="supplement-card">
          <div className="supplement-head">
            <span className="supplement-icon"><RefreshCw aria-hidden="true" /></span>
            <div>
              <span className="eyebrow">分轮补录</span>
              <h2>按剩余名额重新开放</h2>
              <p>补录沿用面试、拟录取与候补规则。每轮生成独立名单，不覆盖前一轮记录。</p>
            </div>
          </div>
          <div className="round-track">
            {[1, 2, 3].map((round) => {
              const generated = round === 1 || state.supplementRound >= round - 1;
              return (
                <div className={generated ? "is-done" : ""} key={round}>
                  <span>{generated ? "✓" : round}</span>
                  <strong>第 {round} 轮</strong>
                  <small>{round === 1 ? "首轮选拔" : generated ? "已生成" : "待生成"}</small>
                </div>
              );
            })}
          </div>
          <div className="supplement-foot">
            <span>{state.supplementGeneratedAt ? `最近生成：${formatDateTime(state.supplementGeneratedAt)}` : "尚未生成补录轮次"}</span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!supplementOpen || state.supplementRound >= 2}
              onClick={() => void generateSupplement()}
            >
              {frozen ? <><LockKeyhole aria-hidden="true" /> 已冻结</> : state.stage !== "supplement" ? <><LockKeyhole aria-hidden="true" /> 补录阶段开放</> : <><ListPlus aria-hidden="true" /> 生成下一轮补录</>}
            </button>
          </div>
        </div>

        <aside className="stack-24">
          <SectionTitle title="补录触发条件" description="满足任一条件时开放下一轮。" />
          <div className="info-list">
            <div><RefreshCw aria-hidden="true" /><span><strong>确认后释放名额</strong><small>多个拟录取只保留一个去向。</small></span></div>
            <div><RefreshCw aria-hidden="true" /><span><strong>候补依次递补</strong><small>候补名单按面试评分排序。</small></span></div>
            <div><RefreshCw aria-hidden="true" /><span><strong>仍有剩余名额</strong><small>第二轮、第三轮沿用相同规则。</small></span></div>
          </div>
          <Link to="/admin/adjustment" className="text-link">
            查看调剂队列 <ArrowRight aria-hidden="true" />
          </Link>
        </aside>
      </section>
    </div>
  );
}
