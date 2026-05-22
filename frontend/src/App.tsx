import { useEffect, useMemo, useState } from "react";

import { AppShell } from "./components/AppShell";
import { IncidentCardsPage } from "./pages/analysis/IncidentCardsPage";
import { BusinessGlossaryPage } from "./pages/support/BusinessGlossaryPage";
import { EnvironmentRoutingPage } from "./pages/development/EnvironmentRoutingPage";
import { HomePage } from "./pages/home/HomePage";
import { IncidentDetailPage } from "./pages/incident-detail/IncidentDetailPage";
import { KnowledgeStandardPage } from "./pages/support/KnowledgeStandardPage";
import { MetricDefinitionPage } from "./pages/support/MetricDefinitionPage";
import { ModelCatalogPage } from "./pages/modeling/ModelCatalogPage";
import { ModelSqlDevelopmentPage } from "./pages/modeling/ModelSqlDevelopmentPage";
import { createInitialModelSqlDrafts } from "./pages/modeling/mockModelData";
import { RequirementAnalysisPage } from "./pages/requirement/RequirementAnalysisPage";
import { ProjectManagementPage } from "./pages/settings/ProjectManagementPage";
import { SystemSettingsPage } from "./pages/settings/SystemSettingsPage";
import { apiDelete, apiGet, apiPost, apiPut } from "./services/api";
import type {
  BusinessGlossary,
  DashboardHomeData,
  Environment,
  Incident,
  KnowledgeNote,
  KnowledgeStandard,
  ManagedCompany,
  ModelSqlDraft,
  MetricDefinition,
  WorkspaceProject,
  WarehouseModel,
  SqlAsset,
} from "./types/api";

type ViewKey = "requirement" | "home" | "sql" | "incident" | "support" | "settings";
type AnalysisSubView = "cards" | "timeline";
type SupportSubView = "standard" | "business" | "metric";
type TabKey =
  | "requirement"
  | "home"
  | "routing"
  | "model_catalog"
  | "model_sql"
  | "cards"
  | "timeline"
  | "standard"
  | "business"
  | "metric"
  | "knowledge"
  | "settings"
  | "project_management";

const incidentStatusMap: Record<string, string> = {
  open: "新建",
  investigating: "排查中",
  pending_verify: "待验证",
  resolved: "已解决",
  closed: "已关闭",
};

const tabMeta: Record<
  TabKey,
  {
    label: string;
    view: ViewKey;
    analysisSubView?: AnalysisSubView;
    supportSubView?: SupportSubView;
  }
> = {
  requirement: { label: "需求分析", view: "requirement" },
  home: { label: "工作台", view: "home" },
  routing: { label: "环境管理", view: "settings" },
  model_catalog: { label: "模型管理", view: "sql" },
  model_sql: { label: "SQL管理", view: "sql" },
  cards: { label: "问题卡片", view: "incident", analysisSubView: "cards" },
  timeline: { label: "回溯时间线", view: "incident", analysisSubView: "timeline" },
  standard: { label: "规范标准", view: "support", supportSubView: "standard" },
  business: { label: "业务口径", view: "support", supportSubView: "business" },
  metric: { label: "指标体系", view: "support", supportSubView: "metric" },
  knowledge: { label: "知识库", view: "support", supportSubView: "standard" },
  settings: { label: "公司管理", view: "settings" },
  project_management: { label: "项目管理", view: "settings" },
};

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("requirement");
  const [openTabs, setOpenTabs] = useState<TabKey[]>(["requirement"]);
  const [expandedView, setExpandedView] = useState<ViewKey | null>("sql");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardHomeData | null>(null);
  const [managedCompanies, setManagedCompanies] = useState<ManagedCompany[]>([]);
  const [managedProjects, setManagedProjects] = useState<WorkspaceProject[]>([]);
  const [managedEnvironments, setManagedEnvironments] = useState<Environment[]>([]);
  const [activeCompanyName, setActiveCompanyName] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [sqlAssets, setSqlAssets] = useState<SqlAsset[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notes, setNotes] = useState<KnowledgeNote[]>([]);
  const [knowledgeStandards, setKnowledgeStandards] = useState<KnowledgeStandard[]>([]);
  const [businessGlossaries, setBusinessGlossaries] = useState<BusinessGlossary[]>([]);
  const [metricDefinitions, setMetricDefinitions] = useState<MetricDefinition[]>([]);
  const [warehouseModels, setWarehouseModels] = useState<WarehouseModel[]>([]);
  const [modelSqlDrafts, setModelSqlDrafts] = useState<ModelSqlDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeMeta = tabMeta[activeTab];
  const activeView = activeMeta.view;
  const analysisSubView = activeMeta.analysisSubView ?? "cards";
  const supportSubView = activeMeta.supportSubView ?? "standard";
  const companyOptions = useMemo(
    () => managedCompanies.map((item) => item.companyName),
    [managedCompanies],
  );
  const companyProjects = useMemo(
    () => managedProjects.filter((item) => item.companyName === activeCompanyName),
    [activeCompanyName, managedProjects],
  );
  const activeProject = useMemo(() => {
    if (!activeProjectId) {
      return null;
    }

    return companyProjects.find((item) => item.id === activeProjectId) ?? null;
  }, [activeProjectId, companyProjects]);
  const companyScopedEnvironments = useMemo(
    () => managedEnvironments.filter((item) => item.company_name === activeCompanyName),
    [activeCompanyName, managedEnvironments],
  );
  const scopedEnvironments = useMemo(() => {
    if (!activeProject || !activeProject.environmentIds.length) {
      return companyScopedEnvironments;
    }

    const allowedIds = new Set(activeProject.environmentIds);
    return companyScopedEnvironments.filter((item) => allowedIds.has(item.id));
  }, [activeProject, companyScopedEnvironments]);
  const scopedEnvironmentIds = useMemo(
    () => new Set(scopedEnvironments.map((item) => item.id)),
    [scopedEnvironments],
  );
  const scopedSqlAssets = useMemo(
    () => sqlAssets.filter((item) => scopedEnvironmentIds.has(item.environment_id)),
    [scopedEnvironmentIds, sqlAssets],
  );
  const scopedIncidents = useMemo(
    () => incidents.filter((item) => scopedEnvironmentIds.has(item.environment_id)),
    [incidents, scopedEnvironmentIds],
  );
  const scopedNotes = useMemo(
    () =>
      notes.filter(
        (item) => item.environment_id === null || scopedEnvironmentIds.has(item.environment_id),
      ),
    [notes, scopedEnvironmentIds],
  );
  const defaultEnvironmentId = scopedEnvironments[0]?.id ?? null;
  const scopedModels = useMemo(
    () =>
      warehouseModels.filter(
        (item) =>
          item.company_name === activeCompanyName &&
          (!activeProject || item.project_ids.includes(activeProject.id)),
      ),
    [activeCompanyName, activeProject, warehouseModels],
  );
  const scopedModelIds = useMemo(() => new Set(scopedModels.map((item) => item.id)), [scopedModels]);
  const scopedModelSqlDrafts = useMemo(
    () => modelSqlDrafts.filter((item) => scopedModelIds.has(item.model_id)),
    [modelSqlDrafts, scopedModelIds],
  );

  useEffect(() => {
    if (!companyOptions.length) {
      setActiveCompanyName("");
      return;
    }

    if (!companyOptions.includes(activeCompanyName)) {
      setActiveCompanyName(companyOptions[0]);
    }
  }, [activeCompanyName, companyOptions]);

  useEffect(() => {
    const nextProject = companyProjects.find((item) => item.id === activeProjectId) ?? companyProjects[0] ?? null;
    const nextProjectId = nextProject?.id ?? null;

    if (activeProjectId !== nextProjectId) {
      setActiveProjectId(nextProjectId);
    }
  }, [activeProjectId, companyProjects]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [
        dashboardData,
        companiesData,
        projectsData,
        environmentsData,
        sqlAssetData,
        incidentData,
        noteData,
        standardData,
        glossaryData,
        metricData,
        modelData,
      ] = await Promise.all([
        apiGet<DashboardHomeData>("/dashboard/home"),
        apiGet<{ items: ManagedCompany[] }>("/companies"),
        apiGet<{ items: WorkspaceProject[] }>("/projects"),
        apiGet<{ items: Environment[] }>("/environments"),
        apiGet<{ items: SqlAsset[] }>("/sql-assets"),
        apiGet<{ items: Incident[] }>("/incidents"),
        apiGet<{ items: KnowledgeNote[] }>("/knowledge-notes"),
        apiGet<{ items: KnowledgeStandard[] }>("/knowledge-standards"),
        apiGet<{ items: BusinessGlossary[] }>("/business-glossaries"),
        apiGet<{ items: MetricDefinition[] }>("/metric-definitions"),
        apiGet<{ items: WarehouseModel[] }>("/warehouse-models"),
      ]);

      setDashboard(dashboardData);
      setManagedCompanies(companiesData.items);
      setManagedProjects(projectsData.items);
      setManagedEnvironments(environmentsData.items);
      setSqlAssets(sqlAssetData.items);
      setIncidents(
        incidentData.items.map((item) => ({
          ...item,
          status: incidentStatusMap[item.status] ?? item.status,
        })),
      );
      setNotes(noteData.items);
      setKnowledgeStandards(standardData.items);
      setBusinessGlossaries(glossaryData.items);
      setMetricDefinitions(metricData.items);
      setWarehouseModels(modelData.items);
      setModelSqlDrafts((current) =>
        current.length
          ? current
          : createInitialModelSqlDrafts(
              modelData.items,
              environmentsData.items,
            ),
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "工作台数据加载失败。";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);
  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = window.setTimeout(() => setSuccessMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  async function runMutation(action: () => Promise<unknown>, successText: string, errorText: string): Promise<boolean> {
    try {
      setError(null);
      await action();
      await loadAll();
      setSuccessMessage(successText);
      return true;
    } catch (requestError) {
      setSuccessMessage(null);
      setError(requestError instanceof Error ? requestError.message : errorText);
      return false;
    }
  }


  function ensureTabOpen(tab: TabKey) {
    setOpenTabs((current) => (current.includes(tab) ? current : [...current, tab]));
  }

  function handleSelectTab(tab: TabKey) {
    ensureTabOpen(tab);
    setActiveTab(tab);
    const nextView = tabMeta[tab].view;
    setExpandedView((current) => (nextView === "home" ? current : nextView));
  }

  function handleCloseTab(tab: TabKey) {
    if (tab === "home" || tab === "requirement") {
      return;
    }

    setOpenTabs((current) => {
      const nextTabs = current.filter((item) => item !== tab);
      if (activeTab === tab) {
        const fallback = nextTabs[nextTabs.length - 1] ?? "home";
        setActiveTab(fallback);
        const fallbackView = tabMeta[fallback].view;
        setExpandedView((currentView) =>
          fallbackView === "home" ? currentView : fallbackView,
        );
      }
      return nextTabs;
    });
  }

  function handleToggleView(view: ViewKey) {
    if (view === "home") {
      handleSelectTab("home");
      return;
    }

    if (view === "requirement") {
      handleSelectTab("requirement");
      return;
    }

    setExpandedView((current) => (current === view ? null : view));
    if (activeView !== view) {
      const firstTab =
        view === "sql"
          ? "model_catalog"
          : view === "incident"
            ? "cards"
            : view === "support"
              ? "standard"
              : view === "settings"
                ? "settings"
                : ("requirement" as TabKey);
      handleSelectTab(firstTab);
    }
  }

  const renderedTabs = useMemo(
    () => openTabs.map((tab) => ({ key: tab, label: tabMeta[tab].label })),
    [openTabs],
  );

  function handleQuickJump(target: "routing" | "model_catalog" | "cards" | "standard") {
    handleSelectTab(target);
  }

  function handleCreateCompany(row: ManagedCompany): Promise<boolean> {
    return runMutation(
      () => apiPost<ManagedCompany, ManagedCompany>("/companies", row),
      "公司已新建",
      "公司创建失败",
    );
  }

  function handleUpdateCompany(previousCompanyName: string, row: ManagedCompany): Promise<boolean> {
    return runMutation(
      () => apiPut<ManagedCompany, ManagedCompany>(`/companies/${encodeURIComponent(previousCompanyName)}`, row),
      "公司已更新",
      "公司更新失败",
    );
  }


  function handleDeleteCompany(companyName: string): Promise<boolean> {
    return runMutation(
      () => apiDelete(`/companies/${encodeURIComponent(companyName)}`),
      "公司已删除",
      "公司删除失败",
    );
  }

  function handleCreateProject(row: WorkspaceProject): Promise<boolean> {
    return runMutation(
      () => apiPost<WorkspaceProject, WorkspaceProject>("/projects", row),
      "项目已新建",
      "项目创建失败",
    );
  }

  function handleUpdateProject(projectId: string, row: WorkspaceProject): Promise<boolean> {
    return runMutation(
      () =>
        apiPut<WorkspaceProject, Omit<WorkspaceProject, "id" | "updatedAt">>(`/projects/${encodeURIComponent(projectId)}`, {
          name: row.name,
          companyName: row.companyName,
          description: row.description,
          environmentIds: row.environmentIds,
        }),
      "项目已更新",
      "项目更新失败",
    );
  }


  function handleDeleteProject(projectId: string): Promise<boolean> {
    return runMutation(
      () => apiDelete(`/projects/${encodeURIComponent(projectId)}`),
      "项目已删除",
      "项目删除失败",
    );
  }

  function handleCreateEnvironment(row: Environment, projectIds: string[]): Promise<boolean> {
    return runMutation(
      () =>
        apiPost<Environment, Record<string, unknown>>("/environments", {
          ...row,
          project_ids: projectIds,
        }),
      "环境已新建",
      "环境创建失败",
    );
  }

  function handleUpdateEnvironment(environmentId: number, row: Environment, projectIds: string[]): Promise<boolean> {
    return runMutation(
      () =>
        apiPut<Environment, Record<string, unknown>>(`/environments/${environmentId}`, {
          company_name: row.company_name,
          environment_name: row.environment_name,
          environment_type: row.environment_type,
          account_name: row.account_name,
          account_password: row.account_password,
          query_portal_url: row.query_portal_url,
          network_mode: row.network_mode,
          dialect: row.dialect,
          timezone: row.timezone,
          description: row.description,
          is_active: row.is_active,
          project_ids: projectIds,
        }),
      "环境已更新",
      "环境更新失败",
    );
  }


  function handleDeleteEnvironment(environmentId: number): Promise<boolean> {
    return runMutation(
      () => apiDelete(`/environments/${environmentId}`),
      "环境已删除",
      "环境删除失败",
    );
  }

  function handleCreateKnowledgeStandard(row: KnowledgeStandard): Promise<boolean> {
    return runMutation(
      () =>
        apiPost<KnowledgeStandard, Record<string, unknown>>("/knowledge-standards", {
          ...row,
        }),
      "规范标准已新建",
      "规范标准创建失败",
    );
  }

  async function handleImportKnowledgeStandard(row: KnowledgeStandard): Promise<void> {
    await apiPost<KnowledgeStandard, Record<string, unknown>>("/knowledge-standards", { ...row });
  }

  async function handleImportUpdateKnowledgeStandard(standardId: number, row: KnowledgeStandard): Promise<void> {
    await apiPut<KnowledgeStandard, Record<string, unknown>>(`/knowledge-standards/${standardId}`, { ...row });
  }

  async function handleReloadKnowledgeStandards(): Promise<void> {
    await loadAll();
  }

  function handleUpdateKnowledgeStandard(standardId: number, row: KnowledgeStandard): Promise<boolean> {
    return runMutation(
      () =>
        apiPut<KnowledgeStandard, Record<string, unknown>>(`/knowledge-standards/${standardId}`, {
          ...row,
        }),
      "规范标准已更新",
      "规范标准更新失败",
    );
  }

  function handleDeleteKnowledgeStandard(standardId: number): Promise<boolean> {
    return runMutation(
      () => apiDelete(`/knowledge-standards/${standardId}`),
      "规范标准已删除",
      "规范标准删除失败",
    );
  }

  function handleCreateBusinessGlossary(row: BusinessGlossary): Promise<boolean> {
    return runMutation(
      () => apiPost<BusinessGlossary, Record<string, unknown>>("/business-glossaries", { ...row }),
      "业务口径已新建",
      "业务口径创建失败",
    );
  }

  async function handleImportBusinessGlossary(row: BusinessGlossary): Promise<void> {
    await apiPost<BusinessGlossary, Record<string, unknown>>("/business-glossaries", { ...row });
  }

  async function handleImportUpdateBusinessGlossary(glossaryId: number, row: BusinessGlossary): Promise<void> {
    await apiPut<BusinessGlossary, Record<string, unknown>>(`/business-glossaries/${glossaryId}`, { ...row });
  }

  async function handleReloadBusinessGlossaries(): Promise<void> {
    await loadAll();
  }

  function handleUpdateBusinessGlossary(glossaryId: number, row: BusinessGlossary): Promise<boolean> {
    return runMutation(
      () => apiPut<BusinessGlossary, Record<string, unknown>>(`/business-glossaries/${glossaryId}`, { ...row }),
      "业务口径已更新",
      "业务口径更新失败",
    );
  }

  function handleDeleteBusinessGlossary(glossaryId: number): Promise<boolean> {
    return runMutation(
      () => apiDelete(`/business-glossaries/${glossaryId}`),
      "业务口径已删除",
      "业务口径删除失败",
    );
  }

  function handleCreateMetricDefinition(row: MetricDefinition): Promise<boolean> {
    return runMutation(
      () => apiPost<MetricDefinition, Record<string, unknown>>("/metric-definitions", { ...row }),
      "指标定义已新建",
      "指标定义创建失败",
    );
  }

  async function handleImportMetricDefinition(row: MetricDefinition): Promise<void> {
    await apiPost<MetricDefinition, Record<string, unknown>>("/metric-definitions", { ...row });
  }

  async function handleImportUpdateMetricDefinition(metricId: number, row: MetricDefinition): Promise<void> {
    await apiPut<MetricDefinition, Record<string, unknown>>(`/metric-definitions/${metricId}`, { ...row });
  }

  async function handleReloadMetrics(): Promise<void> {
    await loadAll();
  }

  function handleUpdateMetricDefinition(metricId: number, row: MetricDefinition): Promise<boolean> {
    return runMutation(
      () => apiPut<MetricDefinition, Record<string, unknown>>(`/metric-definitions/${metricId}`, { ...row }),
      "指标定义已更新",
      "指标定义更新失败",
    );
  }

  function handleDeleteMetricDefinition(metricId: number): Promise<boolean> {
    return runMutation(
      () => apiDelete(`/metric-definitions/${metricId}`),
      "指标定义已删除",
      "指标定义删除失败",
    );
  }

  async function handleCreateModel(row: WarehouseModel): Promise<boolean> {
    return runMutation(
      () => apiPost<WarehouseModel, WarehouseModel>("/warehouse-models", row),
      "模型已新建",
      "模型创建失败",
    );
  }

  async function handleUpdateModel(modelId: number, row: WarehouseModel): Promise<boolean> {
    return runMutation(
      () => apiPut<WarehouseModel, Record<string, unknown>>(`/warehouse-models/${modelId}`, {
        company_name: row.company_name,
        project_ids: row.project_ids,
        model_code: row.model_code,
        model_name: row.model_name,
        model_database_name: row.model_database_name,
        model_table_name: row.model_table_name,
        model_business_domain: row.model_business_domain,
        model_data_domain: row.model_data_domain,
        model_layer: row.model_layer,
        layer: row.layer,
        subject_domain: row.subject_domain,
        model_type: row.model_type,
        storage_type: row.storage_type,
        table_name: row.table_name,
        table_description: row.table_description,
        partition_field: row.partition_field,
        owner: row.owner,
        status: row.status,
        tags: row.tags,
        schedule_cycle: row.schedule_cycle,
        refresh_mode: row.refresh_mode,
        core_metric: row.core_metric,
        remark: row.remark,
      }),
      "模型已更新",
      "模型更新失败",
    );
  }

  async function handleDeleteModel(modelId: number): Promise<boolean> {
    return runMutation(
      () => apiDelete(`/warehouse-models/${modelId}`),
      "模型已删除",
      "模型删除失败",
    );
  }

  async function handleCreateModelSqlDraft(row: ModelSqlDraft): Promise<boolean> {
    setModelSqlDrafts((current) => {
      const next = current.map((item) =>
        item.model_id === row.model_id && row.is_active ? { ...item, is_active: false } : item,
      );
      return [row, ...next];
    });
    setSuccessMessage("SQL 版本已新建");
    setError(null);
    return true;
  }

  async function handleUpdateModelSqlDraft(draftId: number, row: ModelSqlDraft): Promise<boolean> {
    setModelSqlDrafts((current) =>
      current.map((item) => {
        if (item.model_id === row.model_id && row.is_active && item.id !== draftId) {
          return { ...item, is_active: false };
        }
        return item.id === draftId ? row : item;
      }),
    );
    setSuccessMessage("SQL 版本已更新");
    setError(null);
    return true;
  }

  async function handleDeleteModelSqlDraft(draftId: number): Promise<boolean> {
    setModelSqlDrafts((current) => current.filter((item) => item.id !== draftId));
    setSuccessMessage("SQL 版本已删除");
    setError(null);
    return true;
  }

  return (
    <AppShell
      activeView={activeView}
      activeTab={activeTab}
      expandedView={expandedView}
      onToggleView={handleToggleView}
      onSelectTab={handleSelectTab}
      openTabs={renderedTabs}
      onCloseTab={handleCloseTab}
      onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
      sidebarCollapsed={sidebarCollapsed}
      companies={companyOptions}
      activeCompanyName={activeCompanyName}
      onSelectCompany={setActiveCompanyName}
      projects={companyProjects}
      activeProjectId={activeProjectId}
      onSelectProject={setActiveProjectId}
      environments={scopedEnvironments}
    >
      <div className="toast-stack">
        {successMessage ? <div className="toast-banner success">{successMessage}</div> : null}
        {error ? <div className="toast-banner error">{error}</div> : null}
      </div>
      {activeView === "requirement" ? <RequirementAnalysisPage /> : null}
      {activeView === "home" ? (
        <HomePage
          dashboard={dashboard}
          environments={scopedEnvironments}
          incidents={scopedIncidents}
          notes={scopedNotes}
          sqlAssets={scopedSqlAssets}
          loading={loading}
          onQuickJump={handleQuickJump}
        />
      ) : null}
      {activeView === "sql" ? (
        activeTab === "model_catalog" ? (
          <ModelCatalogPage
            activeCompanyName={activeCompanyName}
            activeProjectId={activeProjectId}
            companyOptions={companyOptions}
            models={warehouseModels}
            onCreateModel={handleCreateModel}
            onDeleteModel={handleDeleteModel}
            onUpdateModel={handleUpdateModel}
            projects={managedProjects}
          />
        ) : activeTab === "model_sql" ? (
          <ModelSqlDevelopmentPage
            activeCompanyName={activeCompanyName}
            activeProject={activeProject}
            environments={managedEnvironments}
            models={warehouseModels}
            onCreateDraft={handleCreateModelSqlDraft}
            onDeleteDraft={handleDeleteModelSqlDraft}
            onUpdateDraft={handleUpdateModelSqlDraft}
            sqlDrafts={modelSqlDrafts}
          />
        ) : null
      ) : null}
      {activeView === "incident" ? (
        analysisSubView === "cards" ? (
          <IncidentCardsPage
            incidents={scopedIncidents}
            loading={loading}
            defaultEnvironmentId={defaultEnvironmentId}
            onDataChanged={() => void loadAll()}
          />
        ) : (
          <IncidentDetailPage
            incidents={scopedIncidents}
            loading={loading}
            defaultEnvironmentId={defaultEnvironmentId}
            onDataChanged={() => void loadAll()}
          />
        )
      ) : null}
      {activeView === "support" ? (
        supportSubView === "standard" ? (
          <KnowledgeStandardPage
            companyOptions={companyOptions}
            onCreateStandard={handleCreateKnowledgeStandard}
            onImportStandard={handleImportKnowledgeStandard}
            onImportUpdateStandard={handleImportUpdateKnowledgeStandard}
            onReloadStandards={handleReloadKnowledgeStandards}
            onDeleteStandard={handleDeleteKnowledgeStandard}
            onUpdateStandard={handleUpdateKnowledgeStandard}
            projects={managedProjects}
            standards={knowledgeStandards}
          />
        ) : supportSubView === "business" ? (
          <BusinessGlossaryPage
            companyOptions={companyOptions}
            glossaries={businessGlossaries}
            onCreateGlossary={handleCreateBusinessGlossary}
            onImportGlossary={handleImportBusinessGlossary}
            onImportUpdateGlossary={handleImportUpdateBusinessGlossary}
            onReloadGlossaries={handleReloadBusinessGlossaries}
            onDeleteGlossary={handleDeleteBusinessGlossary}
            onUpdateGlossary={handleUpdateBusinessGlossary}
            projects={managedProjects}
          />
        ) : supportSubView === "metric" ? (
          <MetricDefinitionPage
            companyOptions={companyOptions}
            metrics={metricDefinitions}
            onCreateMetric={handleCreateMetricDefinition}
            onImportMetric={handleImportMetricDefinition}
            onImportUpdateMetric={handleImportUpdateMetricDefinition}
            onReloadMetrics={handleReloadMetrics}
            onDeleteMetric={handleDeleteMetricDefinition}
            onUpdateMetric={handleUpdateMetricDefinition}
            projects={managedProjects}
          />
        ) : null
      ) : null}
      {activeView === "settings" ? (
        activeTab === "routing" ? (
          <EnvironmentRoutingPage
            companyOptions={companyOptions}
            environments={managedEnvironments}
            projects={managedProjects}
            loading={loading}
            onCreateEnvironment={handleCreateEnvironment}
            onUpdateEnvironment={handleUpdateEnvironment}
            onDeleteEnvironment={handleDeleteEnvironment}
          />
        ) : activeTab === "project_management" ? (
          <ProjectManagementPage
            companyOptions={companyOptions}
            projects={managedProjects}
            environments={managedEnvironments}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <SystemSettingsPage
            companyRows={managedCompanies}
            onCreateCompany={handleCreateCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        )
      ) : null}
    </AppShell>
  );
}
