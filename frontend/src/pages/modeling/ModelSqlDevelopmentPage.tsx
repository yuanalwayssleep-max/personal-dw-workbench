import { useEffect, useMemo, useState } from "react";

import { SectionCard } from "../../components/SectionCard";
import type { Environment, ModelSqlDraft, WarehouseModel, WorkspaceProject } from "../../types/api";

interface ModelSqlDevelopmentPageProps {
  models: WarehouseModel[];
  sqlDrafts: ModelSqlDraft[];
  environments: Environment[];
  activeCompanyName: string;
  activeProject: WorkspaceProject | null;
  onCreateDraft: (payload: ModelSqlDraft) => Promise<boolean>;
  onUpdateDraft: (draftId: number, payload: ModelSqlDraft) => Promise<boolean>;
  onDeleteDraft: (draftId: number) => Promise<boolean>;
}

const sqlTypeOptions = ["建表 SQL", "主逻辑 SQL", "回填 SQL", "核对 SQL", "排查 SQL"];

const templateMap: Record<string, string> = {
  "建表 SQL": `create table if not exists ${"${table_name}"} (\n  id bigint comment '主键',\n  metric_value decimal(20, 4) comment '指标值'\n)\npartitioned by (dt string)\nstored as parquet;`,
  "主逻辑 SQL": `insert overwrite table ${"${table_name}"} partition (dt='${"${biz_date}"}')\nselect\n  dt,\n  channel_id,\n  count(1) as lead_cnt\nfrom ${"${source_table}"}\nwhere dt='${"${biz_date}"}'\ngroup by dt, channel_id;`,
  "回填 SQL": `insert overwrite table ${"${table_name}"} partition (dt)\nselect\n  *\nfrom ${"${source_table}"}\nwhere dt between '${"${start_date}"}' and '${"${end_date}"}';`,
  "核对 SQL": `select\n  dt,\n  count(1) as row_cnt,\n  sum(metric_value) as metric_value\nfrom ${"${table_name}"}\nwhere dt='${"${biz_date}"}'\ngroup by dt;`,
  "排查 SQL": `select\n  *\nfrom ${"${table_name}"}\nwhere dt='${"${biz_date}"}'\nlimit 100;`,
};

export function ModelSqlDevelopmentPage(props: ModelSqlDevelopmentPageProps) {
  const { models, sqlDrafts, environments, activeCompanyName, activeProject, onCreateDraft, onUpdateDraft, onDeleteDraft } = props;
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draftForm, setDraftForm] = useState({
    modelId: "",
    environmentId: "",
    title: "",
    sqlType: "主逻辑 SQL",
    versionNo: "v1.0.0",
    status: "草稿",
    isActive: true,
    description: "",
    content: "",
  });

  const scopedModels = useMemo(
    () =>
      models.filter(
        (item) =>
          item.company_name === activeCompanyName &&
          (!activeProject || item.project_ids.includes(activeProject.id)),
      ),
    [activeCompanyName, activeProject, models],
  );

  useEffect(() => {
    const nextModelId = scopedModels[0]?.id ?? null;
    setSelectedModelId((current) => (current && scopedModels.some((item) => item.id === current) ? current : nextModelId));
  }, [scopedModels]);

  const modelDrafts = useMemo(
    () => sqlDrafts.filter((item) => item.model_id === selectedModelId).sort((left, right) => right.updated_at.localeCompare(left.updated_at)),
    [selectedModelId, sqlDrafts],
  );

  useEffect(() => {
    const nextDraft = modelDrafts[0] ?? null;
    setSelectedDraftId((current) => (current && modelDrafts.some((item) => item.id === current) ? current : nextDraft?.id ?? null));
  }, [modelDrafts]);

  const selectedModel = scopedModels.find((item) => item.id === selectedModelId) ?? null;
  const selectedDraft = modelDrafts.find((item) => item.id === selectedDraftId) ?? null;
  const companyEnvironments = environments.filter((item) => item.company_name === activeCompanyName);

  useEffect(() => {
    if (!selectedDraft) {
      if (!selectedModel) {
        return;
      }
      setDraftForm({
        modelId: String(selectedModel.id),
        environmentId: companyEnvironments[0] ? String(companyEnvironments[0].id) : "",
        title: `${selectedModel.model_name} - 主逻辑 SQL`,
        sqlType: "主逻辑 SQL",
        versionNo: "v1.0.0",
        status: "草稿",
        isActive: true,
        description: "",
        content: templateMap["主逻辑 SQL"],
      });
      return;
    }

    setDraftForm({
      modelId: String(selectedDraft.model_id),
      environmentId: selectedDraft.environment_id === null ? "" : String(selectedDraft.environment_id),
      title: selectedDraft.title,
      sqlType: selectedDraft.sql_type,
      versionNo: selectedDraft.version_no,
      status: selectedDraft.status,
      isActive: selectedDraft.is_active,
      description: selectedDraft.description ?? "",
      content: selectedDraft.content,
    });
  }, [companyEnvironments, selectedDraft, selectedModel]);

  function applyTemplate(templateType: string) {
    setDraftForm((current) => ({
      ...current,
      sqlType: templateType,
      content: templateMap[templateType],
      title: selectedModel ? `${selectedModel.model_name} - ${templateType}` : current.title,
    }));
    setMessage(null);
  }

  function buildPayload(draftId: number, createdAt?: string): ModelSqlDraft {
    const now = new Date().toISOString();
    return {
      id: draftId,
      model_id: Number(draftForm.modelId),
      environment_id: draftForm.environmentId ? Number(draftForm.environmentId) : null,
      title: draftForm.title.trim(),
      sql_type: draftForm.sqlType,
      version_no: draftForm.versionNo.trim(),
      description: draftForm.description.trim() || null,
      content: draftForm.content,
      status: draftForm.status,
      is_active: draftForm.isActive,
      created_at: createdAt ?? now,
      updated_at: now,
    };
  }

  async function handleSave() {
    if (!draftForm.modelId) {
      setMessage("请先选择所属模型。");
      return;
    }
    if (!draftForm.title.trim()) {
      setMessage("SQL 标题不能为空。");
      return;
    }
    if (!draftForm.content.trim()) {
      setMessage("SQL 内容不能为空。");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    const success = selectedDraft
      ? await onUpdateDraft(selectedDraft.id, buildPayload(selectedDraft.id, selectedDraft.created_at))
      : await onCreateDraft(buildPayload(Date.now()));
    setSubmitting(false);
    if (success) {
      setMessage(selectedDraft ? "SQL 版本已保存。" : "SQL 版本已新建。");
    }
  }

  async function handleDelete() {
    if (!selectedDraft) {
      setMessage("当前没有可删除的 SQL 版本。");
      return;
    }
    const success = await onDeleteDraft(selectedDraft.id);
    if (success) {
      setMessage("SQL 版本已删除。");
      setSelectedDraftId(null);
    }
  }

  function handleCreateDraft() {
    if (!selectedModel) {
      return;
    }
    setSelectedDraftId(null);
    setDraftForm({
      modelId: String(selectedModel.id),
      environmentId: companyEnvironments[0] ? String(companyEnvironments[0].id) : "",
      title: `${selectedModel.model_name} - 主逻辑 SQL`,
      sqlType: "主逻辑 SQL",
      versionNo: "v1.0.0",
      status: "草稿",
      isActive: true,
      description: "",
      content: templateMap["主逻辑 SQL"],
    });
    setMessage("已切换到新建 SQL 版本。");
  }

  return (
    <div className="workspace-grid">
      <SectionCard title="模型选择" subtitle="先选模型，再维护这个模型下的 SQL 版本。">
        <div className="list">
          {scopedModels.map((item) => (
            <button
              className="list-item"
              key={item.id}
              onClick={() => setSelectedModelId(item.id)}
              style={{ textAlign: "left", outline: selectedModelId === item.id ? "2px solid var(--accent)" : "none" }}
              type="button"
            >
              <strong>{item.model_name}</strong>
              <div className="meta-line">
                <span>{item.model_data_domain}</span>
                <span>{item.model_business_domain}</span>
                <span>{item.status}</span>
              </div>
              <div className="muted">{item.model_database_name}.{item.model_table_name}</div>
            </button>
          ))}
          {!scopedModels.length ? <div className="empty-box">当前项目下暂无模型。</div> : null}
        </div>
      </SectionCard>

      <SectionCard title={selectedDraft ? "SQL 编辑" : "新建 SQL"} subtitle="这一页先做版本沉淀、模板生成和环境绑定，不直接耦合公司执行平台。">
        <div className="workspace-header-meta">
          <div className="workspace-meta-box">
            <div className="section-title">所属模型</div>
            <strong>{selectedModel?.model_name ?? "未选择"}</strong>
          </div>
          <div className="workspace-meta-box">
            <div className="section-title">版本状态</div>
            <strong>{draftForm.status}</strong>
          </div>
          <div className="workspace-meta-box">
            <div className="section-title">执行环境</div>
            <strong>{companyEnvironments.find((item) => String(item.id) === draftForm.environmentId)?.environment_name ?? "未选择"}</strong>
          </div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>所属模型</span>
            <select
              value={draftForm.modelId}
              onChange={(event) => {
                const nextId = event.target.value;
                setSelectedModelId(nextId ? Number(nextId) : null);
                setDraftForm((current) => ({ ...current, modelId: nextId }));
              }}
            >
              {scopedModels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.model_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>环境</span>
            <select value={draftForm.environmentId} onChange={(event) => setDraftForm((current) => ({ ...current, environmentId: event.target.value }))}>
              <option value="">未绑定环境</option>
              {companyEnvironments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.environment_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field form-grid-full">
            <span>SQL 标题</span>
            <input value={draftForm.title} onChange={(event) => setDraftForm((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label className="field">
            <span>SQL 类型</span>
            <select value={draftForm.sqlType} onChange={(event) => setDraftForm((current) => ({ ...current, sqlType: event.target.value }))}>
              {sqlTypeOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>版本号</span>
            <input value={draftForm.versionNo} onChange={(event) => setDraftForm((current) => ({ ...current, versionNo: event.target.value }))} />
          </label>
          <label className="field">
            <span>状态</span>
            <select value={draftForm.status} onChange={(event) => setDraftForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="草稿">草稿</option>
              <option value="待验证">待验证</option>
              <option value="生效中">生效中</option>
              <option value="已归档">已归档</option>
            </select>
          </label>
          <label className="field">
            <span>当前生效</span>
            <select
              value={draftForm.isActive ? "yes" : "no"}
              onChange={(event) => setDraftForm((current) => ({ ...current, isActive: event.target.value === "yes" }))}
            >
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
          </label>
          <label className="field form-grid-full">
            <span>说明</span>
            <input value={draftForm.description} onChange={(event) => setDraftForm((current) => ({ ...current, description: event.target.value }))} placeholder="例如：用于日级线索汇总主逻辑" />
          </label>
          <label className="field form-grid-full">
            <span>SQL 内容</span>
            <textarea className="sql-editor compact" value={draftForm.content} onChange={(event) => setDraftForm((current) => ({ ...current, content: event.target.value }))} />
          </label>
        </div>

        <div className="action-row">
          <button className="secondary-button" onClick={handleCreateDraft} type="button">
            新建版本
          </button>
          <button className="primary-button" disabled={submitting} onClick={() => void handleSave()} type="button">
            {submitting ? "保存中..." : selectedDraft ? "保存版本" : "提交版本"}
          </button>
          <button className="secondary-button" onClick={() => void handleDelete()} type="button">
            删除版本
          </button>
        </div>
        {message ? <div className="action-row compact"><div className="muted">{message}</div></div> : null}
      </SectionCard>

      <SectionCard title="版本与模板" subtitle="右侧放模型上下文、模板和已有版本，保证开发动作尽量少跳转。">
        <div className="stack">
          <div>
            <div className="section-title">版本列表</div>
            <div className="list">
              {modelDrafts.map((item) => (
                <button
                  className="list-item"
                  key={item.id}
                  onClick={() => setSelectedDraftId(item.id)}
                  style={{ textAlign: "left", outline: selectedDraftId === item.id ? "2px solid var(--accent)" : "none" }}
                  type="button"
                >
                  <strong>{item.version_no}</strong>
                  <div className="meta-line">
                    <span>{item.sql_type}</span>
                    <span>{item.status}</span>
                    <span>{item.is_active ? "生效中" : "非生效"}</span>
                  </div>
                  <div className="muted">{item.title}</div>
                </button>
              ))}
              {!modelDrafts.length ? <div className="empty-box">当前模型下还没有 SQL 版本。</div> : null}
            </div>
          </div>

          <div>
            <div className="section-title">快捷模板</div>
            <div className="pill-row">
              {sqlTypeOptions.map((item) => (
                <button className="secondary-button accent" key={item} onClick={() => applyTemplate(item)} type="button">
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="section-title">模型上下文</div>
            <div className="list">
              <div className="list-item">
                <strong>表名</strong>
                <div className="muted">
                  {selectedModel ? `${selectedModel.model_database_name}.${selectedModel.model_table_name}` : "-"}
                </div>
              </div>
              <div className="list-item">
                <strong>表描述</strong>
                <div className="muted">{selectedModel?.table_description ?? "-"}</div>
              </div>
              <div className="list-item">
                <strong>核心指标</strong>
                <div className="muted">{selectedModel?.core_metric ?? "当前未填写"}</div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
