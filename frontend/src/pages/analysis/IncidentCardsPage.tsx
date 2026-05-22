import { useState } from "react";

import { SectionCard } from "../../components/SectionCard";
import { apiPost } from "../../services/api";
import type { Incident } from "../../types/api";

interface IncidentCardsPageProps {
  incidents: Incident[];
  loading: boolean;
  defaultEnvironmentId: number | null;
  onDataChanged: () => void;
}

export function IncidentCardsPage(props: IncidentCardsPageProps) {
  const { incidents, loading, defaultEnvironmentId, onDataChanged } = props;
  const [incidentForm, setIncidentForm] = useState({
    title: "",
    incident_type: "data_anomaly",
    severity: "medium",
    symptom_desc: "",
    impact_scope: "",
  });
  const [incidentMessage, setIncidentMessage] = useState<string | null>(null);
  const [submittingIncident, setSubmittingIncident] = useState(false);

  async function handleCreateIncident() {
    if (!defaultEnvironmentId) {
      setIncidentMessage("当前没有可用环境，无法创建问题卡片。");
      return;
    }
    if (!incidentForm.title.trim()) {
      setIncidentMessage("请填写问题标题。");
      return;
    }

    setSubmittingIncident(true);
    setIncidentMessage(null);
    try {
      await apiPost<Incident, Record<string, unknown>>("/incidents", {
        environment_id: defaultEnvironmentId,
        title: incidentForm.title,
        incident_type: incidentForm.incident_type,
        severity: incidentForm.severity,
        status: "open",
        symptom_desc: incidentForm.symptom_desc || null,
        impact_scope: incidentForm.impact_scope || null,
      });
      setIncidentForm({
        title: "",
        incident_type: "data_anomaly",
        severity: "medium",
        symptom_desc: "",
        impact_scope: "",
      });
      setIncidentMessage("问题卡片已创建。");
      onDataChanged();
    } catch (error) {
      setIncidentMessage(error instanceof Error ? error.message : "问题卡片创建失败。");
    } finally {
      setSubmittingIncident(false);
    }
  }

  if (loading && !incidents.length) {
    return <div className="loading-box">正在加载问题卡片...</div>;
  }

  return (
    <div className="content-grid">
      <SectionCard
        title="问题卡片"
        subtitle="这一页承接分析层里的问题对象，先把问题记录下来，再决定如何继续排查。"
        className="col-4"
      >
        <div className="form-grid">
          <label className="field form-grid-full">
            <span>问题标题</span>
            <input
              value={incidentForm.title}
              onChange={(event) => setIncidentForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="例如：订单汇总表数据异常"
            />
          </label>
          <label className="field">
            <span>问题类型</span>
            <select
              value={incidentForm.incident_type}
              onChange={(event) => setIncidentForm((prev) => ({ ...prev, incident_type: event.target.value }))}
            >
              <option value="data_anomaly">数据异常</option>
              <option value="task_failure">任务失败</option>
              <option value="metric_issue">指标问题</option>
              <option value="model_issue">模型问题</option>
            </select>
          </label>
          <label className="field">
            <span>优先级</span>
            <select
              value={incidentForm.severity}
              onChange={(event) => setIncidentForm((prev) => ({ ...prev, severity: event.target.value }))}
            >
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </label>
          <label className="field form-grid-full">
            <span>问题现象</span>
            <textarea
              className="form-textarea"
              value={incidentForm.symptom_desc}
              onChange={(event) => setIncidentForm((prev) => ({ ...prev, symptom_desc: event.target.value }))}
              placeholder="记录你观察到的问题现象"
            />
          </label>
          <label className="field form-grid-full">
            <span>影响范围</span>
            <textarea
              className="form-textarea"
              value={incidentForm.impact_scope}
              onChange={(event) => setIncidentForm((prev) => ({ ...prev, impact_scope: event.target.value }))}
              placeholder="说明影响了哪些表、任务或看板"
            />
          </label>
        </div>
        <div className="action-row">
          <button
            className="primary-button"
            disabled={submittingIncident}
            onClick={() => void handleCreateIncident()}
            type="button"
          >
            {submittingIncident ? "创建中..." : "新建问题卡片"}
          </button>
          {incidentMessage ? <div className="muted">{incidentMessage}</div> : null}
        </div>
      </SectionCard>

      <SectionCard
        title="问题清单"
        subtitle="问题清单负责承接分析侧的待办对象，后续可继续补筛选、标签和负责人。"
        className="col-8"
      >
        <div className="list">
          {incidents.map((item) => (
            <div className="list-item" key={item.id}>
              <div className={`status-badge ${item.severity === "high" ? "warn" : ""}`}>
                {item.status}
              </div>
              <strong>{item.title}</strong>
              <div className="meta-line">
                <span>环境 {item.environment_id}</span>
                <span>优先级：{item.severity === "high" ? "高" : "中"}</span>
                <span>类型：{item.incident_type}</span>
              </div>
              <div className="muted">{item.impact_scope ?? "暂未填写影响范围。"}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
