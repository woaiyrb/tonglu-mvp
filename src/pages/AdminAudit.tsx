import { Download, Search, ScrollText, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader, SectionTitle, StatusBadge } from "../components/Ui";
import { useApp } from "../store";
import { downloadCsv, formatDateTime } from "../utils";

export function AdminAudit() {
  const { state, notify } = useApp();
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState("all");
  const actors = Array.from(new Set(state.audit.map((event) => event.actor)));
  const events = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return state.audit.filter((event) => {
      const matchesActor = actor === "all" || event.actor === actor;
      const haystack = `${event.action} ${event.object} ${event.detail} ${event.actor}`.toLowerCase();
      return matchesActor && (!normalized || haystack.includes(normalized));
    });
  }, [actor, query, state.audit]);

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="审计日志"
        title="每一次改动，都能回到原处。"
        description="日志只追加，不修改、不覆盖。导出用于核对业务过程，不替代正式归档。"
        actions={<StatusBadge tone="sage">{state.audit.length} 条记录</StatusBadge>}
      />

      <div className="audit-toolbar">
        <label className="search-field">
          <Search aria-hidden="true" />
          <span className="sr-only">搜索审计日志</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索操作、对象、说明或操作人" />
        </label>
        <label className="select-field">
          <span>操作人</span>
          <select value={actor} onChange={(event) => setActor(event.target.value)}>
            <option value="all">全部</option>
            {actors.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            downloadCsv("2026-AUT-审计日志.csv", [
              ["时间", "操作人", "操作", "对象", "说明"],
              ...events.map((event) => [formatDateTime(event.at), event.actor, event.action, event.object, event.detail]),
            ]);
            notify("审计日志已导出。", "success");
          }}
        >
          <Download aria-hidden="true" /> 导出 CSV
        </button>
      </div>

      <section className="section-block">
        <SectionTitle title="操作记录" description={`当前显示 ${events.length} 条。按时间倒序。`} />
        {events.length === 0 ? (
          <div className="empty-mini">
            <ScrollText aria-hidden="true" />
            <strong>没有匹配记录</strong>
            <p>调整搜索词或操作人筛选。</p>
          </div>
        ) : (
          <div className="table-card">
            <table className="data-table audit-table">
              <thead><tr><th>时间</th><th>操作人</th><th>操作</th><th>对象</th><th>说明</th></tr></thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="mono-cell">{formatDateTime(event.at)}</td>
                    <td><strong>{event.actor}</strong></td>
                    <td><StatusBadge tone={event.actor === "系统" ? "sky" : "sage"} dot={false}>{event.action}</StatusBadge></td>
                    <td>{event.object}</td>
                    <td>{event.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="rule-note">
        <ShieldCheck aria-hidden="true" />
        <span><strong>追加写入。</strong> 每条日志包含操作人、对象、时间和说明；不提供页面内删除或改写入口。</span>
      </div>
    </div>
  );
}
