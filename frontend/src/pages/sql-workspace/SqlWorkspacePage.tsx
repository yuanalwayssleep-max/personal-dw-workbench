import { useMemo, useState } from "react";

import { SectionCard } from "../../components/SectionCard";
import { apiPost } from "../../services/api";
import type { Incident, SqlAsset } from "../../types/api";

interface SqlWorkspacePageProps {
  sqlAssets: SqlAsset[];
  incidents: Incident[];
  loading: boolean;
  defaultEnvironmentId: number | null;
  onDataChanged: () => void;
}

export function SqlWorkspacePage(props: SqlWorkspacePageProps) {
  const { sqlAssets, incidents, loading, defaultEnvironmentId, onDataChanged } = props;
  const [selectedId, setSelectedId] = useState<number | null>(sqlAssets[0]?.id ?? null);
  const [formState, setFormState] = useState({
    title: "",
    sql_type: "analysis",
    summary: "",
    content: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const selectedSql = useMemo(
    () => sqlAssets.find((item) => item.id === selectedId) ?? sqlAssets[0] ?? null,
    [selectedId, sqlAssets],
  );

  if (loading && !sqlAssets.length) {
    return <div className="loading-box">正在加载 SQL 工作台...</div>;
  }

  if (!selectedSql) {
    return <div className="empty-box">当前还没有 SQL 资产。</div>;
  }

  const relatedIncidents = incidents.filter((item) => item.environment_id === selectedSql.environment_id);

  async function handleCreateSql() {
    if (!defaultEnvironmentId) {
      setFormMessage("当前没有可用环境，无法创建 SQL。");
      return;
    }

    if (!formState.title.trim() || !formState.content.trim()) {
      setFormMessage("请填写 SQL 标题和 SQL 内容。");
      return;
    }

    setSubmitting(true);
    setFormMessage(null);
    try {
      await apiPost<SqlAsset, Record<string, unknown>>("/sql-assets", {
        environment_id: defaultEnvironmentId,
        title: formState.title,
        sql_type: formState.sql_type,
        content: formState.content,
        dialect: "hive",
        summary: formState.summary || null,
        tags: {
          source: "frontend",
          scene: formState.sql_type,
        },
      });
      setFormState({
        title: "",
        sql_type: "analysis",
        summary: "",
        content: "",
      });
      setFormMessage("SQL 已创建。");
      onDataChanged();
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "SQL 创建失败。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="workspace-grid">
      <SectionCard
        title="开发资产"
        subtitle="开发页左侧应该像工作记忆区，快速切换分析 SQL、模型 SQL 和排障 SQL。"
      >
        <div className="list">
          {sqlAssets.map((item) => (
            <button
              className="list-item"
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              style={{
                textAlign: "left",
                outline: item.id === selectedSql.id ? "2px solid var(--accent)" : "none",
              }}
              type="button"
            >
              <strong>{item.title}</strong>
              <div className="meta-line">
                <span>{item.sql_type}</span>
                <span>{item.status}</span>
                <span>{item.dialect}</span>
              </div>
              <div className="pill-row">
                {item.is_favorite ? <span className="pill">收藏</span> : null}
                <span className="pill">环境 {item.environment_id}</span>
              </div>
              <div className="muted">{item.summary ?? "暂未填写说明。"}</div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="开发录入"
        subtitle="先把最基础的生产动作做起来：在开发页里直接沉淀新的 SQL 资产。"
      >
        <div className="form-grid">
          <label className="field">
            <span>SQL 标题</span>
            <input
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="例如：订单周趋势校验"
            />
          </label>
          <label className="field">
            <span>SQL 类型</span>
            <select
              value={formState.sql_type}
              onChange={(event) => setFormState((prev) => ({ ...prev, sql_type: event.target.value }))}
            >
              <option value="analysis">分析 SQL</option>
              <option value="model">模型 SQL</option>
              <option value="debug">排障 SQL</option>
              <option value="template">模板 SQL</option>
            </select>
          </label>
          <label className="field form-grid-full">
            <span>说明</span>
            <input
              value={formState.summary}
              onChange={(event) => setFormState((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="简单描述这条 SQL 的用途"
            />
          </label>
          <label className="field form-grid-full">
            <span>SQL 内容</span>
            <textarea
              className="sql-editor compact"
              value={formState.content}
              onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="在这里填写 SQL"
            />
          </label>
        </div>
        <div className="action-row">
          <button className="primary-button" disabled={submitting} onClick={() => void handleCreateSql()} type="button">
            {submitting ? "创建中..." : "新建 SQL"}
          </button>
          {formMessage ? <div className="muted">{formMessage}</div> : null}
        </div>
      </SectionCard>

      <SectionCard
        title={selectedSql.title}
        subtitle="开发主区不只是代码查看区，更应该承载执行上下文、环境差异和问题关联。"
      >
        <div className="workspace-header-meta">
          <div className="workspace-meta-box">
            <div className="section-title">环境</div>
            <strong>环境 {selectedSql.environment_id}</strong>
          </div>
          <div className="workspace-meta-box">
            <div className="section-title">来源</div>
            <strong>{selectedSql.source_type}</strong>
          </div>
          <div className="workspace-meta-box">
            <div className="section-title">最近状态</div>
            <strong>{selectedSql.status}</strong>
          </div>
        </div>
        <div className="pill-row" style={{ marginBottom: 14 }}>
          <span className="pill">{selectedSql.sql_type}</span>
          <span className="pill">{selectedSql.dialect}</span>
          <span className="pill">{selectedSql.status}</span>
          {selectedSql.is_favorite ? <span className="pill">收藏</span> : null}
        </div>
        <textarea className="sql-editor" readOnly value={selectedSql.content} />
      </SectionCard>

      <SectionCard
        title="开发上下文"
        subtitle="右侧应该始终告诉你：这条 SQL 为什么存在、服务哪个问题、还能复用到哪里。"
      >
        <div className="stack">
          <div>
            <div className="section-title">说明</div>
            <div className="muted">{selectedSql.summary ?? "暂未记录说明。"}</div>
          </div>

          <div>
            <div className="section-title">标签</div>
            <div className="pill-row">
              {selectedSql.tags
                ? Object.entries(selectedSql.tags).map(([key, value]) => (
                    <span className="pill" key={key}>
                      {key}: {value}
                    </span>
                  ))
                : <span className="muted">暂无标签。</span>}
            </div>
          </div>

          <div>
            <div className="section-title">相关问题候选</div>
            <div className="list">
              {relatedIncidents.map((item) => (
                <div className="list-item" key={item.id}>
                  <div className={`status-badge ${item.severity === "high" ? "warn" : ""}`}>
                    {item.status}
                  </div>
                  <strong>{item.title}</strong>
                  <div className="meta-line">
                    <span>优先级：{item.severity === "high" ? "高" : "中"}</span>
                    <span>类型：{item.incident_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
