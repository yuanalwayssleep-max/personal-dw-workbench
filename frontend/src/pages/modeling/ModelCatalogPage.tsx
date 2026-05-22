import { useMemo, useState } from "react";

import { EntityFormRenderer, type EntityFieldSchema } from "../../components/EntityFormRenderer";
import { EntityHistoryList } from "../../components/EntityHistoryList";
import { EntityManagementPage } from "../../components/EntityManagementPage";
import { EntitySearchRenderer, type SearchFieldSchema } from "../../components/EntitySearchRenderer";
import { ImportExportActions } from "../../components/ImportExportActions";
import { ImportExportDialog } from "../../components/ImportExportDialog";
import { textColumn } from "../../components/EntityTableColumns";
import { useEntityForm } from "../../hooks/useEntityForm";
import { useManagementList } from "../../hooks/useManagementList";
import { apiGet } from "../../services/api";
import type { EntityHistoryEntry, WarehouseModel, WorkspaceProject } from "../../types/api";
import { withDefaultOption } from "../../utils/formOptions";
import { parseImportFile } from "../../utils/importSheet";
import { downloadXlsx } from "../../utils/simpleXlsx";

interface ModelCatalogPageProps {
  activeCompanyName: string;
  activeProjectId: string | null;
  companyOptions: string[];
  projects: WorkspaceProject[];
  models: WarehouseModel[];
  onCreateModel: (payload: WarehouseModel) => Promise<boolean>;
  onUpdateModel: (modelId: number, payload: WarehouseModel) => Promise<boolean>;
  onDeleteModel: (modelId: number) => Promise<boolean>;
}

type ModelRow = {
  id: number;
  companyName: string;
  projectIds: string[];
  projectNames: string[];
  modelCode: string;
  modelName: string;
  modelDatabaseName: string;
  modelTableName: string;
  modelBusinessDomain: string;
  modelDataDomain: string;
  modelLayer: string;
  storageType: string;
  tableName: string;
  tableDescription: string;
  partitionField: string;
  owner: string;
  status: string;
  tags: string[];
  scheduleCycle: string;
  refreshMode: string;
  coreMetric: string;
  remark: string;
  updatedAt: string;
};

const layerOptions = ["ODS", "DWD", "DWS", "ADS", "DIM"];
const modelTypeOptions = ["明细表", "汇总表", "宽表", "指标表", "维表"];
const storageTypeOptions = ["Hive", "Doris", "MySQL", "接口"];
const statusOptions = ["草稿", "开发中", "已发布", "已停用"];
const scheduleOptions = ["实时", "小时", "天", "周"];
const refreshModeOptions = ["增量", "全量", "拉链"];

export function ModelCatalogPage(props: ModelCatalogPageProps) {
  const { activeCompanyName, activeProjectId, companyOptions, projects, models, onCreateModel, onUpdateModel, onDeleteModel } = props;
  const [keyword, setKeyword] = useState("");
  const [historyItems, setHistoryItems] = useState<Array<{ title: string; description: string }>>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [preparingImport, setPreparingImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importIssues, setImportIssues] = useState<ImportIssue[]>([]);
  const [preparedImport, setPreparedImport] = useState<PreparedImport | null>(null);

  const rows = useMemo<ModelRow[]>(
    () =>
      models.map((item) => ({
          id: item.id,
          companyName: item.company_name,
          projectIds: item.project_ids,
          projectNames: item.project_names,
          modelCode: item.model_code,
          modelName: item.model_name,
          modelDatabaseName: item.model_database_name || "-",
          modelTableName: item.model_table_name || item.table_name,
          modelBusinessDomain: item.model_business_domain,
          modelDataDomain: item.model_data_domain,
          modelLayer: item.model_layer,
          storageType: item.storage_type,
          tableName: item.table_name,
          tableDescription: item.table_description,
          partitionField: item.partition_field ?? "",
          owner: item.owner,
          status: item.status,
          tags: item.tags,
          scheduleCycle: item.schedule_cycle,
          refreshMode: item.refresh_mode,
          coreMetric: item.core_metric ?? "",
          remark: item.remark ?? "",
          updatedAt: item.updated_at,
      })),
    [models],
  );

  const initialFormValues = useMemo(
    () => ({
      companyName: companyOptions[0] ?? "",
      projectIds: [] as string[],
      modelCode: "",
      modelName: "",
      modelDatabaseName: "",
      modelTableName: "",
      modelBusinessDomain: "",
      modelDataDomain: "",
      modelLayer: "明细表",
      storageType: "Hive",
      tableName: "",
      tableDescription: "",
      partitionField: "dt",
      owner: "当前用户",
      status: "草稿",
      tags: "",
      scheduleCycle: "天",
      refreshMode: "增量",
      coreMetric: "",
      remark: "",
    }),
    [companyOptions],
  );

  const { draftFilters, filteredRows, pagedRows, pagination, setDraftFilters, applySearch, resetSearch } = useManagementList({
    rows,
    initialFilters: {
      modelKeyword: "",
      modelDataDomain: "",
      modelBusinessDomain: "",
      status: "",
    },
    filterRows: (list, filters) => {
      const modelKeyword = filters.modelKeyword.trim().toLowerCase();
      const modelDataDomain = filters.modelDataDomain.trim().toLowerCase();
      const modelBusinessDomain = filters.modelBusinessDomain.trim().toLowerCase();
      const status = filters.status.trim().toLowerCase();
      return list.filter(
        (item) =>
          (!modelKeyword ||
            item.modelCode.toLowerCase().includes(modelKeyword) ||
            item.modelName.toLowerCase().includes(modelKeyword)) &&
          (!modelDataDomain || item.modelDataDomain.toLowerCase() === modelDataDomain) &&
          (!modelBusinessDomain || item.modelBusinessDomain.toLowerCase().includes(modelBusinessDomain)) &&
          (!status || item.status.toLowerCase() === status),
      );
    },
  });

  const {
    formError,
    formValues,
    mode,
    selectedRow,
    selectedRowId,
    openCreateMode,
    openRow,
    resetToList,
    setFormError,
    setFormValues,
  } = useEntityForm({
    rows,
    initialValues: initialFormValues,
    getRowId: (row) => row.id,
    mapRowToForm: (row) => ({
      companyName: row.companyName,
      projectIds: row.projectIds,
      modelCode: row.modelCode,
      modelName: row.modelName,
      modelDatabaseName: row.modelDatabaseName,
      modelTableName: row.modelTableName,
      modelBusinessDomain: row.modelBusinessDomain,
      modelDataDomain: row.modelDataDomain,
      modelLayer: row.modelLayer,
      storageType: row.storageType,
      tableName: row.tableName,
      tableDescription: row.tableDescription,
      partitionField: row.partitionField,
      owner: row.owner,
      status: row.status,
      tags: row.tags.join("、"),
      scheduleCycle: row.scheduleCycle,
      refreshMode: row.refreshMode,
      coreMetric: row.coreMetric,
      remark: row.remark,
    }),
  });

  const scopedProjects = useMemo(
    () => projects.filter((item) => item.companyName === formValues.companyName),
    [formValues.companyName, projects],
  );
  const subjectDomainOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.modelBusinessDomain).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [rows],
  );
  const overview = useMemo(() => {
    const publishedCount = rows.filter((item) => item.status === "已发布").length;
    const developingCount = rows.filter((item) => item.status === "开发中").length;
    const layerCount = new Set(rows.map((item) => item.modelDataDomain).filter(Boolean)).size;
    const subjectCount = new Set(rows.map((item) => item.modelBusinessDomain).filter(Boolean)).size;
    const latestModel = [...rows].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ?? null;

    return {
      totalCount: rows.length,
      publishedCount,
      developingCount,
      layerCount,
      subjectCount,
      latestModel,
    };
  }, [rows]);
  const activeProject = useMemo(
    () => projects.find((item) => item.id === activeProjectId) ?? null,
    [activeProjectId, projects],
  );

  function buildModelPayloadFromImport(payload: ImportPayload) {
    const now = new Date().toISOString();
    return {
      id: payload.id ?? Date.now() + Math.floor(Math.random() * 1000),
      company_name: payload.companyName,
      project_ids: payload.projectIds,
      project_names: projects.filter((item) => payload.projectIds.includes(item.id)).map((item) => item.name),
      model_code: payload.modelCode,
      model_name: payload.modelName,
      model_database_name: payload.modelDatabaseName,
      model_table_name: payload.modelTableName,
      model_business_domain: payload.modelBusinessDomain,
      model_data_domain: payload.modelDataDomain,
      model_layer: payload.modelLayer,
      layer: payload.modelDataDomain,
      subject_domain: payload.modelBusinessDomain,
      model_type: payload.modelLayer,
      storage_type: payload.storageType,
      table_name: payload.tableName,
      table_description: payload.tableDescription,
      partition_field: payload.partitionField || null,
      owner: payload.owner,
      status: payload.status,
      tags: payload.tags,
      schedule_cycle: payload.scheduleCycle,
      refresh_mode: payload.refreshMode,
      core_metric: payload.coreMetric || null,
      remark: payload.remark || null,
      created_at: payload.createdAt ?? now,
      updated_at: now,
    } satisfies WarehouseModel;
  }

  function handleSearch() {
    setKeyword(draftFilters.modelKeyword);
    applySearch();
  }

  function handleResetSearch() {
    setKeyword("");
    resetSearch();
  }

  function resetListView() {
    handleResetSearch();
    setHistoryItems([]);
    resetToList(initialFormValues);
  }

  function toggleProject(projectId: string) {
    setFormError(null);
    setFormValues((current) => ({
      ...current,
      projectIds: current.projectIds.includes(projectId)
        ? current.projectIds.filter((id) => id !== projectId)
        : [...current.projectIds, projectId],
    }));
  }

  function handleCompanyChange(companyName: string) {
    setFormError(null);
    setFormValues((current) => ({
      ...current,
      companyName,
      projectIds: current.projectIds.filter((projectId) =>
        projects.some((item) => item.id === projectId && item.companyName === companyName),
      ),
    }));
  }

  function validateForm() {
    if (!formValues.modelCode.trim()) {
      return "模型英文名不能为空";
    }
    if (!formValues.modelName.trim()) {
      return "模型中文名不能为空";
    }
    if (!formValues.modelDatabaseName.trim()) {
      return "模型库名不能为空";
    }
    if (!formValues.modelTableName.trim()) {
      return "模型表名不能为空";
    }
    if (!formValues.modelBusinessDomain.trim()) {
      return "模型业务域不能为空";
    }
    if (!formValues.modelDataDomain.trim()) {
      return "模型数据域不能为空";
    }
    if (!formValues.modelLayer.trim()) {
      return "模型分层不能为空";
    }
    const duplicate = models.some(
      (item) => item.model_code === formValues.modelCode.trim() && item.id !== selectedRowId,
    );
    if (duplicate) {
      return "模型英文名已存在";
    }
    if (!formValues.companyName.trim()) {
      return "所属公司不能为空";
    }
    if (!formValues.projectIds.length) {
      return "至少选择一个所属项目";
    }
    return null;
  }

  function buildPayload(modelId: number, createdAt?: string): WarehouseModel {
    const now = new Date().toISOString();
    return {
      id: modelId,
      company_name: formValues.companyName.trim(),
      project_ids: formValues.projectIds,
      project_names: projects.filter((item) => formValues.projectIds.includes(item.id)).map((item) => item.name),
      model_code: formValues.modelCode.trim(),
      model_name: formValues.modelName.trim(),
      model_database_name: formValues.modelDatabaseName.trim(),
      model_table_name: formValues.modelTableName.trim(),
      model_business_domain: formValues.modelBusinessDomain.trim(),
      model_data_domain: formValues.modelDataDomain.trim(),
      model_layer: formValues.modelLayer,
      layer: formValues.modelDataDomain.trim(),
      subject_domain: formValues.modelBusinessDomain.trim(),
      model_type: formValues.modelLayer,
      storage_type: formValues.storageType,
      table_name: `${formValues.modelDatabaseName.trim()}.${formValues.modelTableName.trim()}`,
      table_description: formValues.tableDescription.trim(),
      partition_field: formValues.partitionField.trim() || null,
      owner: formValues.owner.trim() || "当前用户",
      status: formValues.status,
      tags: formValues.tags.split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
      schedule_cycle: formValues.scheduleCycle,
      refresh_mode: formValues.refreshMode,
      core_metric: formValues.coreMetric.trim() || null,
      remark: formValues.remark.trim() || null,
      created_at: createdAt ?? now,
      updated_at: now,
    };
  }

  async function handleCreateSubmit() {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    const success = await onCreateModel(buildPayload(Date.now()));
    if (success) {
      resetListView();
    }
  }

  async function handleEditSubmit() {
    if (!selectedRow) {
      return;
    }
    const target = models.find((item) => item.id === selectedRow.id);
    if (!target) {
      return;
    }
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    const success = await onUpdateModel(selectedRow.id, buildPayload(selectedRow.id, target.created_at));
    if (success) {
      resetListView();
    }
  }

  async function handleDelete(row: ModelRow) {
    const success = await onDeleteModel(row.id);
    if (success && selectedRow?.id === row.id) {
      resetListView();
    }
  }

  function getExportRows() {
    return [
      templateHeaders,
      ...filteredRows.map((row) => [
        row.modelName,
        row.modelDatabaseName,
        row.modelTableName,
        row.modelBusinessDomain,
        row.modelDataDomain,
        row.modelLayer,
        row.storageType,
      ]),
    ];
  }

  async function handleDownloadTemplate() {
    try {
      setExporting(true);
      setImportError(null);
      await downloadXlsx("模型管理导入模板.xlsx", [
        templateHeaders,
        [
          "订单明细模型",
          "dw_trade",
          "dwd_trade_order_detail_di",
          "交易",
          "DWD",
          "明细表",
          "Hive",
        ],
      ]);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "模板下载失败，请稍后重试。");
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadData() {
    try {
      setExporting(true);
      setImportError(null);
      await downloadXlsx("模型管理列表.xlsx", getExportRows());
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "数据下载失败，请稍后重试。");
    } finally {
      setExporting(false);
    }
  }

  async function handlePrepareImport(file: File) {
    try {
      setPreparingImport(true);
      setImportError(null);
      setImportResult(null);
      setImportIssues([]);
      setPreparedImport(null);
      const rowsToImport = await parseImportFile(file);
      if (rowsToImport.length <= 1) {
        setImportError("导入文件为空，请先填写模板数据。");
        return;
      }

      const [headerRow, ...dataRows] = rowsToImport;
      const headerMap = new Map(headerRow.map((header, index) => [header.trim(), index]));
      const payloads: ImportPreviewRow[] = [];
      const issues: ImportIssue[] = [];

      if (!activeCompanyName || !activeProject) {
        setImportError("请先在顶部选择当前公司和项目，再执行模型导入。");
        return;
      }

      dataRows.forEach((row, index) => {
        const rowNo = index + 2;
        const modelName = getCell(row, headerMap, "模型中文名");
        const databaseName = getCell(row, headerMap, "模型库名");
        const modelTableName = getCell(row, headerMap, "模型表名");
        const modelBusinessDomain = getCell(row, headerMap, "模型业务域");
        const modelDataDomain = getCell(row, headerMap, "模型数据域");
        const modelLayer = getCell(row, headerMap, "模型分层");
        const storageType = getCell(row, headerMap, "数据库类型");
        const tableName = databaseName && modelTableName ? `${databaseName}.${modelTableName}` : modelTableName;
        const modelCode = modelTableName;

        if (!modelName || !databaseName || !modelTableName) {
          issues.push({ rowNo, modelCode, modelName, reason: "模型中文名、模型库名、模型表名不能为空" });
          return;
        }
        if (!modelBusinessDomain || !modelDataDomain || !modelLayer || !storageType) {
          issues.push({ rowNo, modelCode, modelName, reason: "模型业务域、模型数据域、模型分层、数据库类型不能为空" });
          return;
        }

        const existing = models.find((item) => item.model_code === modelCode);
        payloads.push({
          rowNo,
          payload: {
            id: existing?.id,
            companyName: activeCompanyName,
            projectIds: [activeProject.id],
            modelCode,
            modelName,
            modelDatabaseName: databaseName,
            modelTableName,
            modelBusinessDomain,
            modelDataDomain,
            modelLayer,
            storageType,
            tableName,
            tableDescription: existing?.table_description ?? `${modelName}导入生成`,
            partitionField: existing?.partition_field ?? "dt",
            owner: existing?.owner ?? "当前用户",
            status: existing?.status ?? "草稿",
            tags: existing?.tags ?? [],
            scheduleCycle: existing?.schedule_cycle ?? "天",
            refreshMode: existing?.refresh_mode ?? "增量",
            coreMetric: existing?.core_metric ?? "",
            remark: existing?.remark ?? "",
            createdAt: existing?.created_at,
          },
          existingModelId: existing?.id,
        });
      });

      setImportIssues(issues);
      setPreparedImport({
        fileName: file.name,
        payloads,
        validationIssues: issues,
      });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "导入解析失败，请稍后重试。");
    } finally {
      setPreparingImport(false);
    }
  }

  async function handleConfirmImport() {
    if (!preparedImport) {
      return;
    }
    try {
      setImporting(true);
      setImportError(null);
      let successCount = 0;
      for (const item of preparedImport.payloads) {
        const payload = buildModelPayloadFromImport(item.payload);
        const success = item.existingModelId
          ? await onUpdateModel(item.existingModelId, payload)
          : await onCreateModel(payload);
        if (success) {
          successCount += 1;
        }
      }
      setImportResult(`导入完成，成功处理 ${successCount} 条记录。`);
      setPreparedImport(null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "导入失败，请稍后重试。");
    } finally {
      setImporting(false);
    }
  }

  async function openHistory(row: ModelRow) {
    try {
      const data = await apiGet<{ items: EntityHistoryEntry[] }>(`/warehouse-models/${row.id}/history`);
      setHistoryItems(
        data.items.length
          ? data.items.map((item) => ({ title: item.title, description: item.description }))
          : [{ title: "暂无记录", description: "当前模型还没有变更记录。" }],
      );
    } catch {
      setHistoryItems([{ title: "加载失败", description: "暂时无法获取模型变更记录。" }]);
    }
    openRow(row, "history");
  }

  const readonlyFields = useMemo<EntityFieldSchema[]>(
    () => [
      { key: "modelCode", label: "模型英文名", type: "readonly-text", value: selectedRow?.modelCode ?? "", fullWidth: true },
      { key: "modelName", label: "模型中文名", type: "readonly-text", value: selectedRow?.modelName ?? "", fullWidth: true },
      { key: "companyName", label: "所属公司", type: "readonly-text", value: selectedRow?.companyName ?? "-" },
      { key: "projectNames", label: "所属项目", type: "readonly-text", value: selectedRow?.projectNames.join("、") ?? "-" },
      { key: "modelDatabaseName", label: "模型库名", type: "readonly-text", value: selectedRow?.modelDatabaseName ?? "-" },
      { key: "modelTableName", label: "模型表名", type: "readonly-text", value: selectedRow?.modelTableName ?? "-" },
      { key: "modelBusinessDomain", label: "模型业务域", type: "readonly-text", value: selectedRow?.modelBusinessDomain ?? "-" },
      { key: "modelDataDomain", label: "模型数据域", type: "readonly-text", value: selectedRow?.modelDataDomain ?? "-" },
      { key: "modelLayer", label: "模型分层", type: "readonly-text", value: selectedRow?.modelLayer ?? "-" },
      { key: "storageType", label: "存储类型", type: "readonly-text", value: selectedRow?.storageType ?? "-" },
      { key: "tableName", label: "完整表名", type: "readonly-text", value: selectedRow?.tableName ?? "-", fullWidth: true },
      { key: "tableDescription", label: "表描述", type: "readonly-text", value: selectedRow?.tableDescription ?? "-", fullWidth: true },
      { key: "partitionField", label: "分区字段", type: "readonly-text", value: selectedRow?.partitionField || "-" },
      { key: "owner", label: "负责人", type: "readonly-text", value: selectedRow?.owner ?? "-" },
      { key: "status", label: "状态", type: "readonly-text", value: selectedRow?.status ?? "-" },
      { key: "scheduleCycle", label: "调度周期", type: "readonly-text", value: selectedRow?.scheduleCycle ?? "-" },
      { key: "refreshMode", label: "刷新方式", type: "readonly-text", value: selectedRow?.refreshMode ?? "-" },
      { key: "coreMetric", label: "核心指标", type: "readonly-text", value: selectedRow?.coreMetric || "-", fullWidth: true },
      { key: "remark", label: "备注", type: "readonly-text", value: selectedRow?.remark || "-", fullWidth: true },
    ],
    [selectedRow],
  );

  const formFields = useMemo<EntityFieldSchema[]>(
    () => [
      {
        key: "companyName",
        label: "所属公司 *",
        type: "select",
        value: formValues.companyName,
        options: companyOptions.map((item) => ({ label: item, value: item })),
        onChange: handleCompanyChange,
      },
      {
        key: "projectIds",
        label: "所属项目 *",
        type: "relation",
        fullWidth: true,
        children: scopedProjects.length ? (
          <>
            {scopedProjects.map((project) => (
              <label className="relation-option" key={project.id}>
                <input
                  checked={formValues.projectIds.includes(project.id)}
                  onChange={() => toggleProject(project.id)}
                  type="checkbox"
                />
                <span>{project.name}</span>
              </label>
            ))}
          </>
        ) : (
          <span className="muted">当前公司下暂无项目可选。</span>
        ),
      },
      { key: "modelCode", label: "模型英文名 *", type: "text", value: formValues.modelCode, onChange: (value) => setFormValues((current) => ({ ...current, modelCode: value })) },
      { key: "modelName", label: "模型中文名 *", type: "text", value: formValues.modelName, onChange: (value) => setFormValues((current) => ({ ...current, modelName: value })) },
      { key: "modelDatabaseName", label: "模型库名 *", type: "text", value: formValues.modelDatabaseName, onChange: (value) => setFormValues((current) => ({ ...current, modelDatabaseName: value })) },
      { key: "modelTableName", label: "模型表名 *", type: "text", value: formValues.modelTableName, onChange: (value) => setFormValues((current) => ({ ...current, modelTableName: value })) },
      { key: "modelBusinessDomain", label: "模型业务域", type: "text", value: formValues.modelBusinessDomain, onChange: (value) => setFormValues((current) => ({ ...current, modelBusinessDomain: value })) },
      { key: "modelDataDomain", label: "模型数据域", type: "select", value: formValues.modelDataDomain, options: layerOptions.map((item) => ({ label: item, value: item })), onChange: (value) => setFormValues((current) => ({ ...current, modelDataDomain: value })) },
      { key: "modelLayer", label: "模型分层", type: "select", value: formValues.modelLayer, options: modelTypeOptions.map((item) => ({ label: item, value: item })), onChange: (value) => setFormValues((current) => ({ ...current, modelLayer: value })) },
      { key: "storageType", label: "存储类型", type: "select", value: formValues.storageType, options: storageTypeOptions.map((item) => ({ label: item, value: item })), onChange: (value) => setFormValues((current) => ({ ...current, storageType: value })) },
      { key: "tableName", label: "完整表名", type: "readonly-text", value: `${formValues.modelDatabaseName || "-"}${formValues.modelTableName ? `.${formValues.modelTableName}` : ""}`, fullWidth: true },
      { key: "tableDescription", label: "表描述", type: "textarea", value: formValues.tableDescription, fullWidth: true, onChange: (value) => setFormValues((current) => ({ ...current, tableDescription: value })) },
      { key: "partitionField", label: "分区字段", type: "text", value: formValues.partitionField, onChange: (value) => setFormValues((current) => ({ ...current, partitionField: value })) },
      { key: "owner", label: "负责人", type: "text", value: formValues.owner, onChange: (value) => setFormValues((current) => ({ ...current, owner: value })) },
      { key: "status", label: "状态", type: "select", value: formValues.status, options: statusOptions.map((item) => ({ label: item, value: item })), onChange: (value) => setFormValues((current) => ({ ...current, status: value })) },
      { key: "scheduleCycle", label: "调度周期", type: "select", value: formValues.scheduleCycle, options: scheduleOptions.map((item) => ({ label: item, value: item })), onChange: (value) => setFormValues((current) => ({ ...current, scheduleCycle: value })) },
      { key: "refreshMode", label: "刷新方式", type: "select", value: formValues.refreshMode, options: refreshModeOptions.map((item) => ({ label: item, value: item })), onChange: (value) => setFormValues((current) => ({ ...current, refreshMode: value })) },
      { key: "coreMetric", label: "核心指标", type: "textarea", value: formValues.coreMetric, fullWidth: true, onChange: (value) => setFormValues((current) => ({ ...current, coreMetric: value })) },
      { key: "tags", label: "标签", type: "text", value: formValues.tags, fullWidth: true, placeholder: "多个标签用顿号或逗号分隔", onChange: (value) => setFormValues((current) => ({ ...current, tags: value })) },
      { key: "remark", label: "备注", type: "textarea", value: formValues.remark, fullWidth: true, onChange: (value) => setFormValues((current) => ({ ...current, remark: value })) },
    ],
    [companyOptions, formValues, scopedProjects, setFormValues],
  );

  return (
    <>
      <EntityManagementPage
        columns={[
          textColumn<ModelRow>("模型中文名", (row) => row.modelName),
          textColumn<ModelRow>("模型库名", (row) => row.modelDatabaseName),
          textColumn<ModelRow>("模型表名", (row) => row.modelTableName),
          textColumn<ModelRow>("模型业务域", (row) => row.modelBusinessDomain),
          textColumn<ModelRow>("模型数据域", (row) => row.modelDataDomain),
          textColumn<ModelRow>("模型分层", (row) => row.modelLayer),
          textColumn<ModelRow>("数据库类型", (row) => row.storageType),
        ]}
        detailTitle="模型详情"
        detailMeta={`修改时间：${selectedRow?.updatedAt ?? "-"}`}
        emptyText="未查询到匹配的模型。"
        formError={formError}
        historyTitle="变更记录"
        keyword={keyword}
        listTitle="模型列表"
        mode={mode}
        onBack={resetListView}
        onCreate={() => openCreateMode(initialFormValues)}
        onDelete={handleDelete}
        onDetail={(row) => openRow(row, "detail")}
        onEdit={(row) => openRow(row, "edit")}
        onHistory={(row) => void openHistory(row)}
        onOpenHistory={() => {
          if (selectedRow) {
            void openHistory(selectedRow);
          }
        }}
        onKeywordChange={setKeyword}
        onResetSearch={handleResetSearch}
        onSearch={handleSearch}
        onSubmit={mode === "create" ? handleCreateSubmit : handleEditSubmit}
        pagination={pagination}
        renderListActions={() => (
          <ImportExportActions
            exporting={exporting}
            onDownloadData={() => void handleDownloadData()}
            onOpenImport={() => {
              setImportError(null);
              setImportResult(null);
              setImportIssues([]);
              setPreparedImport(null);
              setShowImportDialog(true);
            }}
          />
        )}
        renderListSummary={() => (
          <section className="card col-12">
            <h2>模型概览</h2>
            <div className="workspace-header-meta">
              <div className="workspace-meta-box">
                <div className="section-title">模型总数</div>
                <strong>{overview.totalCount}</strong>
              </div>
              <div className="workspace-meta-box">
                <div className="section-title">已发布</div>
                <strong>{overview.publishedCount}</strong>
              </div>
              <div className="workspace-meta-box">
                <div className="section-title">开发中</div>
                <strong>{overview.developingCount}</strong>
              </div>
            </div>
            <div className="kpi-grid">
              <div className="kpi-box">
                <div className="kpi-label">分层数量</div>
                <div className="kpi-value">{overview.layerCount}</div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">主题域数量</div>
                <div className="kpi-value">{overview.subjectCount}</div>
              </div>
              <div className="kpi-box">
                <div className="kpi-label">最近更新</div>
                <div className="muted" style={{ marginTop: 10 }}>
                  {overview.latestModel ? `${overview.latestModel.modelName} · ${overview.latestModel.modelDataDomain}` : "暂无模型"}
                </div>
              </div>
            </div>
          </section>
        )}
        renderDetail={() => <EntityFormRenderer fields={readonlyFields} />}
        renderForm={() => <EntityFormRenderer fields={formFields} />}
        renderHistory={() => <EntityHistoryList items={historyItems.length ? historyItems : [{ title: "暂无记录", description: "当前模型还没有变更记录。" }]} />}
        renderSearchFields={() => {
          const fields: SearchFieldSchema[] = [
            {
              key: "modelKeyword",
              type: "text",
              placeholder: "请输入模型英文名或中文名",
              value: draftFilters.modelKeyword,
              onChange: (value) => {
                setKeyword(value);
                setDraftFilters((current) => ({ ...current, modelKeyword: value }));
              },
            },
            {
              key: "modelDataDomain",
              type: "select",
              value: draftFilters.modelDataDomain,
              options: withDefaultOption("全部分层", layerOptions),
              onChange: (value) => setDraftFilters((current) => ({ ...current, modelDataDomain: value })),
            },
            {
              key: "modelBusinessDomain",
              type: "select",
              value: draftFilters.modelBusinessDomain,
              options: withDefaultOption("全部主题域", subjectDomainOptions),
              onChange: (value) => setDraftFilters((current) => ({ ...current, modelBusinessDomain: value })),
            },
            {
              key: "status",
              type: "select",
              value: draftFilters.status,
              options: withDefaultOption("全部状态", statusOptions),
              onChange: (value) => setDraftFilters((current) => ({ ...current, status: value })),
            },
          ];
          return <EntitySearchRenderer fields={fields} />;
        }}
        rowKey={(row) => row.id}
        rows={pagedRows}
        searchPlaceholder="请输入模型名称"
        submitDisabled={!formValues.modelCode.trim() || !formValues.modelName.trim() || !formValues.modelDatabaseName.trim() || !formValues.modelTableName.trim()}
      />
      <ImportExportDialog
        createCount={preparedImport ? preparedImport.payloads.filter((item) => !item.existingModelId).length : 0}
        description="支持导入 XLSX 或 CSV 文件，按模型英文名自动识别新增或更新。"
        exporting={exporting}
        failCount={preparedImport ? preparedImport.validationIssues.length : importIssues.length}
        importError={importError}
        importIssues={importIssues}
        importing={importing}
        importResult={importResult}
        issueKey={(issue) => `${issue.rowNo}-${issue.modelCode}-${issue.reason}`}
        onCancelPrepared={() => {
          setPreparedImport(null);
          setImportResult(null);
          setImportIssues([]);
          setImportError(null);
        }}
        onClose={() => {
          if (importing || preparingImport) {
            return;
          }
          setPreparedImport(null);
          setShowImportDialog(false);
        }}
        onConfirmImport={() => void handleConfirmImport()}
        onDownloadTemplate={() => void handleDownloadTemplate()}
        onSelectFile={(file) => {
          void handlePrepareImport(file);
        }}
        pendingCount={preparedImport?.payloads.length ?? 0}
        preparedFileName={preparedImport?.fileName ?? null}
        preparingImport={preparingImport}
        previewColumns={[
          { key: "rowNo", header: "行号", render: (item) => item.rowNo },
          { key: "modelName", header: "模型中文名", render: (item) => item.payload.modelName },
          { key: "databaseName", header: "模型库名", render: (item) => item.payload.modelDatabaseName },
          { key: "tableName", header: "模型表名", render: (item) => item.payload.modelTableName },
          { key: "dataDomain", header: "模型数据域", render: (item) => item.payload.modelDataDomain },
          { key: "action", header: "操作类型", render: (item) => (item.existingModelId ? "更新" : "新增") },
        ]}
        previewRowKey={(item) => `${item.rowNo}-${item.payload.modelCode}`}
        previewRows={preparedImport?.payloads.slice(0, 6) ?? []}
        renderIssue={(issue) => (
          <>
            <span>第 {issue.rowNo} 行</span>
            <strong>{issue.modelName || issue.modelCode || "-"}</strong>
            <em>{issue.reason}</em>
          </>
        )}
        templateHeaders={templateHeaders}
        title="导入模型管理"
        updateCount={preparedImport ? preparedImport.payloads.filter((item) => item.existingModelId).length : 0}
        visible={showImportDialog}
      />
    </>
  );
}

type ImportIssue = {
  rowNo: number;
  modelCode: string;
  modelName: string;
  reason: string;
};

type ImportPayload = {
  id?: number;
  companyName: string;
  projectIds: string[];
  modelCode: string;
  modelName: string;
  modelDatabaseName: string;
  modelTableName: string;
  modelBusinessDomain: string;
  modelDataDomain: string;
  modelLayer: string;
  storageType: string;
  tableName: string;
  tableDescription: string;
  partitionField: string;
  owner: string;
  status: string;
  tags: string[];
  scheduleCycle: string;
  refreshMode: string;
  coreMetric: string;
  remark: string;
  createdAt?: string;
};

type ImportPreviewRow = {
  rowNo: number;
  payload: ImportPayload;
  existingModelId?: number;
};

type PreparedImport = {
  fileName: string;
  payloads: ImportPreviewRow[];
  validationIssues: ImportIssue[];
};

const templateHeaders = [
  "模型中文名",
  "模型库名",
  "模型表名",
  "模型业务域",
  "模型数据域",
  "模型分层",
  "数据库类型",
];

function getCell(row: string[], headerMap: Map<string, number>, header: string) {
  const index = headerMap.get(header);
  return index === undefined ? "" : String(row[index] ?? "").trim();
}

function splitMultiValue(value: string) {
  return value
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
