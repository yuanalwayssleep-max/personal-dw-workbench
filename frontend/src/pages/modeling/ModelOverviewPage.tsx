import { useMemo } from "react";

import { SectionCard } from "../../components/SectionCard";
import type { ModelSqlDraft, WarehouseModel, WorkspaceProject } from "../../types/api";

interface ModelOverviewPageProps {
  models: WarehouseModel[];
  sqlDrafts: ModelSqlDraft[];
  activeCompanyName: string;
  activeProject: WorkspaceProject | null;
}

export function ModelOverviewPage(props: ModelOverviewPageProps) {
  const { models, sqlDrafts, activeCompanyName, activeProject } = props;

  const scopedModels = useMemo(
    () =>
      models.filter(
        (item) =>
          item.company_name === activeCompanyName &&
          (!activeProject || item.project_ids.includes(activeProject.id)),
      ),
    [activeCompanyName, activeProject, models],
  );

  const scopedDrafts = useMemo(() => {
    const modelIds = new Set(scopedModels.map((item) => item.id));
    return sqlDrafts.filter((item) => modelIds.has(item.model_id));
  }, [scopedModels, sqlDrafts]);

  const layerSummary = useMemo(() => {
    const counter = new Map<string, number>();
    scopedModels.forEach((item) => {
      counter.set(item.layer, (counter.get(item.layer) ?? 0) + 1);
    });
    return Array.from(counter.entries()).sort((left, right) => left[0].localeCompare(right[0], "zh-CN"));
  }, [scopedModels]);

  const pendingModels = useMemo(
    () => scopedModels.filter((item) => item.status !== "已发布" || !item.core_metric || !item.partition_field),
    [scopedModels],
  );
  const recentModels = useMemo(
    () => [...scopedModels].sort((left, right) => right.updated_at.localeCompare(left.updated_at)).slice(0, 5),
    [scopedModels],
  );
  const activeSqlDrafts = useMemo(
    () => scopedDrafts.filter((item) => item.is_active).sort((left, right) => right.updated_at.localeCompare(left.updated_at)).slice(0, 6),
    [scopedDrafts],
  );

  return (
    <div className="content-grid">
      <SectionCard className="col-12" title="模型概览">
        <div className="workspace-header-meta">
          <div className="workspace-meta-box">
            <div className="section-title">当前公司</div>
            <strong>{activeCompanyName || "-"}</strong>
          </div>
          <div className="workspace-meta-box">
            <div className="section-title">当前项目</div>
            <strong>{activeProject?.name ?? "未选择项目"}</strong>
          </div>
          <div className="workspace-meta-box">
            <div className="section-title">开发焦点</div>
            <strong>{pendingModels.length ? `${pendingModels.length} 个待处理模型` : "当前无待处理项"}</strong>
          </div>
        </div>
        <div className="kpi-grid">
          <div className="kpi-box">
            <div className="kpi-label">模型总数</div>
            <div className="kpi-value">{scopedModels.length}</div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">生效 SQL</div>
            <div className="kpi-value">{scopedDrafts.filter((item) => item.is_active).length}</div>
          </div>
          <div className="kpi-box">
            <div className="kpi-label">待补信息</div>
            <div className="kpi-value">{pendingModels.length}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="col-4" title="分层分布">
        <div className="list">
          {layerSummary.length ? (
            layerSummary.map(([layer, count]) => (
              <div className="list-item" key={layer}>
                <strong>{layer}</strong>
                <div className="muted">模型数量 {count}</div>
              </div>
            ))
          ) : (
            <div className="empty-box">当前项目下还没有模型。</div>
          )}
        </div>
      </SectionCard>

      <SectionCard className="col-4" title="最近更新">
        <div className="list">
          {recentModels.length ? (
            recentModels.map((item) => (
              <div className="list-item" key={item.id}>
                <strong>{item.model_name}</strong>
                <div className="meta-line">
                  <span>{item.layer}</span>
                  <span>{item.subject_domain}</span>
                  <span>{item.status}</span>
                </div>
                <div className="muted">{item.table_name}</div>
              </div>
            ))
          ) : (
            <div className="empty-box">暂无最近更新模型。</div>
          )}
        </div>
      </SectionCard>

      <SectionCard className="col-4" title="待处理模型">
        <div className="list">
          {pendingModels.length ? (
            pendingModels.slice(0, 5).map((item) => (
              <div className="list-item" key={item.id}>
                <strong>{item.model_name}</strong>
                <div className="pill-row">
                  {item.status !== "已发布" ? <span className="pill">待发布</span> : null}
                  {!item.core_metric ? <span className="pill">缺核心指标</span> : null}
                  {!item.partition_field ? <span className="pill">缺分区字段</span> : null}
                </div>
                <div className="muted">{item.remark ?? "建议补充模型说明和开发约束。"}</div>
              </div>
            ))
          ) : (
            <div className="empty-box">当前没有待处理模型。</div>
          )}
        </div>
      </SectionCard>

      <SectionCard className="col-12" title="当前生效 SQL">
        <div className="list">
          {activeSqlDrafts.length ? (
            activeSqlDrafts.map((item) => (
              <div className="list-item" key={item.id}>
                <strong>{item.title}</strong>
                <div className="meta-line">
                  <span>{item.sql_type}</span>
                  <span>{item.version_no}</span>
                  <span>{item.status}</span>
                </div>
                <div className="muted">{item.description ?? "暂无说明。"}</div>
              </div>
            ))
          ) : (
            <div className="empty-box">当前项目下还没有生效 SQL。</div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
