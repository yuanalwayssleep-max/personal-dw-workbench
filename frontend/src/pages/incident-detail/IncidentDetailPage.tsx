import { useEffect, useMemo, useState } from "react";

import { SectionCard } from "../../components/SectionCard";
import { apiGet, apiPost } from "../../services/api";
import type { Incident, IncidentLink, TraceStep } from "../../types/api";

interface IncidentDetailPageProps {
  incidents: Incident[];
  loading: boolean;
  defaultEnvironmentId: number | null;
  onDataChanged: () => void;
}

export function IncidentDetailPage(props: IncidentDetailPageProps) {
  const { incidents, loading, defaultEnvironmentId, onDataChanged } = props;
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(incidents[0]?.id ?? null);
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [links, setLinks] = useState<IncidentLink[]>([]);
  const [incidentForm, setIncidentForm] = useState({
    title: "",
    incident_type: "data_anomaly",
    severity: "medium",
    symptom_desc: "",
    impact_scope: "",
  });
  const [traceForm, setTraceForm] = useState({
    action_type: "check_sql",
    action_desc: "",
    evidence_ref: "",
    intermediate_conclusion: "",
  });
  const [incidentMessage, setIncidentMessage] = useState<string | null>(null);
  const [traceMessage, setTraceMessage] = useState<string | null>(null);
  const [submittingIncident, setSubmittingIncident] = useState(false);
  const [submittingTrace, setSubmittingTrace] = useState(false);

  const selectedIncident = useMemo(
    () => incidents.find((item) => item.id === selectedIncidentId) ?? incidents[0] ?? null,
    [selectedIncidentId, incidents],
  );

  useEffect(() => {
    if (selectedIncident?.id) {
      void loadIncidentContext(selectedIncident.id);
    }
  }, [selectedIncident?.id]);

  async function loadIncidentContext(incidentId: number) {
    const [traceData, linkData] = await Promise.all([
      apiGet<{ items: TraceStep[] }>(`/incidents/${incidentId}/trace-steps`),
      apiGet<{ items: IncidentLink[] }>(`/incidents/${incidentId}/links`),
    ]);
    setTraceSteps(traceData.items);
    setLinks(linkData.items);
  }

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
      const created = await apiPost<Incident, Record<string, unknown>>("/incidents", {
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
      setSelectedIncidentId(created.id);
      onDataChanged();
    } catch (error) {
      setIncidentMessage(error instanceof Error ? error.message : "问题卡片创建失败。");
    } finally {
      setSubmittingIncident(false);
    }
  }

  async function handleCreateTraceStep() {
    if (!selectedIncident?.id) {
      setTraceMessage("请先选择问题卡片。");
      return;
    }
    if (!traceForm.action_desc.trim()) {
      setTraceMessage("请填写本次排查动作。");
      return;
    }

    setSubmittingTrace(true);
    setTraceMessage(null);
    try {
      await apiPost<TraceStep, Record<string, unknown>>(`/incidents/${selectedIncident.id}/trace-steps`, {
        action_type: traceForm.action_type,
        action_desc: traceForm.action_desc,
        evidence_ref: traceForm.evidence_ref || null,
        intermediate_conclusion: traceForm.intermediate_conclusion || null,
      });
      setTraceForm({
        action_type: "check_sql",
        action_desc: "",
        evidence_ref: "",
        intermediate_conclusion: "",
      });
      setTraceMessage("回溯步骤已新增。");
      await loadIncidentContext(selectedIncident.id);
    } catch (error) {
      setTraceMessage(error instanceof Error ? error.message : "回溯步骤创建失败。");
    } finally {
      setSubmittingTrace(false);
    }
  }

  if (loading && !incidents.length) {
    return <div className="loading-box">正在加载问题详情...</div>;
  }

  if (!selectedIncident) {
    return <div className="empty-box">当前还没有问题卡片。</div>;
  }

  return (
    <div className="detail-grid">
      <SectionCard
        title={selectedIncident.title}
        subtitle="分析页应该是问题回溯闭环中心，而不是一张只读备注卡。"
        className="col-12"
      >
        <div className="incident-hero-meta">
          <div className="workspace-meta-box">
            <div className="section-title">状态</div>
            <strong>{selectedIncident.status}</strong>
          </div>
          <div className="workspace-meta-box">
            <div className="section-title">优先级</div>
            <strong>{selectedIncident.severity === "high" ? "高" : "中"}</strong>
          </div>
          <div className="workspace-meta-box">
            <div className="section-title">所属环境</div>
            <strong>环境 {selectedIncident.environment_id}</strong>
          </div>
        </div>
        <div className="pill-row" style={{ marginBottom: 14 }}>
          <span className={`status-badge ${selectedIncident.severity === "high" ? "warn" : ""}`}>
            {selectedIncident.status}
          </span>
          <span className="pill">{selectedIncident.incident_type}</span>
          <span className="pill">{selectedIncident.severity}</span>
        </div>
        <div className="stack">
          <div>
            <div className="section-title">问题现象</div>
            <div>{selectedIncident.symptom_desc}</div>
          </div>
          <div>
            <div className="section-title">影响范围</div>
            <div>{selectedIncident.impact_scope}</div>
          </div>
          <div>
            <div className="section-title">根因判断</div>
            <div>{selectedIncident.root_cause}</div>
          </div>
          <div>
            <div className="section-title">修复动作</div>
            <div>{selectedIncident.fix_action}</div>
          </div>
          <div>
            <div className="section-title">复盘结论</div>
            <div>{selectedIncident.review_note}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="分析录入" className="col-4">
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

      <SectionCard title="分析事项" className="col-8">
        <div className="list">
          {incidents.map((item) => (
            <button
              className="list-item"
              key={item.id}
              onClick={() => setSelectedIncidentId(item.id)}
              style={{
                textAlign: "left",
                outline: item.id === selectedIncident.id ? "2px solid var(--accent)" : "none",
              }}
              type="button"
            >
              <strong>{item.title}</strong>
              <div className="meta-line">
                <span>{item.status}</span>
                <span>{item.severity}</span>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="分析时间线" className="col-7">
        <div className="timeline">
          {traceSteps.map((step) => (
            <div className="timeline-step" key={step.id}>
              <strong>
                步骤 {step.step_no} · {step.action_type}
              </strong>
              <div style={{ marginTop: 8 }}>{step.action_desc}</div>
              <div className="muted" style={{ marginTop: 8 }}>
                证据：{step.evidence_ref ?? "暂无"}
              </div>
              <div style={{ marginTop: 8 }}>{step.intermediate_conclusion ?? "暂未形成结论。"}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="分析补录" className="col-5">
        <div className="form-grid">
          <label className="field">
            <span>动作类型</span>
            <select
              value={traceForm.action_type}
              onChange={(event) => setTraceForm((prev) => ({ ...prev, action_type: event.target.value }))}
            >
              <option value="check_sql">查 SQL</option>
              <option value="check_table">查表</option>
              <option value="check_task">查任务</option>
              <option value="check_log">查日志</option>
              <option value="compare_result">对比结果</option>
            </select>
          </label>
          <label className="field form-grid-full">
            <span>排查动作</span>
            <textarea
              className="form-textarea"
              value={traceForm.action_desc}
              onChange={(event) => setTraceForm((prev) => ({ ...prev, action_desc: event.target.value }))}
              placeholder="描述你这一步做了什么"
            />
          </label>
          <label className="field form-grid-full">
            <span>证据引用</span>
            <input
              value={traceForm.evidence_ref}
              onChange={(event) => setTraceForm((prev) => ({ ...prev, evidence_ref: event.target.value }))}
              placeholder="例如日志链接、SQL 标识或页面地址"
            />
          </label>
          <label className="field form-grid-full">
            <span>中间结论</span>
            <textarea
              className="form-textarea"
              value={traceForm.intermediate_conclusion}
              onChange={(event) =>
                setTraceForm((prev) => ({ ...prev, intermediate_conclusion: event.target.value }))
              }
              placeholder="这一轮排查得出了什么"
            />
          </label>
        </div>
        <div className="action-row">
          <button
            className="primary-button"
            disabled={submittingTrace}
            onClick={() => void handleCreateTraceStep()}
            type="button"
          >
            {submittingTrace ? "提交中..." : "新增回溯步骤"}
          </button>
          {traceMessage ? <div className="muted">{traceMessage}</div> : null}
        </div>
      </SectionCard>

      <SectionCard title="分析证据" className="col-6">
        <div className="list">
          {links.map((link) => (
            <div className="list-item" key={link.id}>
              <strong>{link.target_type}</strong>
              <div className="meta-line">
                <span>{link.link_role ?? "关联"}</span>
                <span>目标 ID：{link.target_id ?? "-"}</span>
              </div>
              <div className="muted">{link.target_ref ?? "本地对象关联"}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="分析说明" className="col-6">
        <div className="stack">
          <div className="list-item">
            <strong>当前分析页已经具备什么</strong>
            <div className="muted">
              当前工作台已经能基于后端种子数据，展示一条从问题现象到证据链的完整回溯路径。
            </div>
          </div>
          <div className="list-item">
            <strong>分析页后续还缺什么</strong>
            <div className="muted">
              还缺编辑能力、更完整的详情聚合、资产检索面板，以及新增和修改动作。
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
