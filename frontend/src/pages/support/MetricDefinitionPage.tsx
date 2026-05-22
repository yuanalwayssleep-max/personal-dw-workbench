import { useEffect, useMemo, useState } from "react";

import { EntityHistoryList } from "../../components/EntityHistoryList";
import { EntityFormRenderer, type EntityFieldSchema } from "../../components/EntityFormRenderer";
import { EntityManagementPage } from "../../components/EntityManagementPage";
import { EntitySearchRenderer, type SearchFieldSchema } from "../../components/EntitySearchRenderer";
import { ImportExportActions } from "../../components/ImportExportActions";
import { ImportExportDialog } from "../../components/ImportExportDialog";
import { textColumn } from "../../components/EntityTableColumns";
import { useEntityForm } from "../../hooks/useEntityForm";
import { apiGet } from "../../services/api";
import { useManagementList } from "../../hooks/useManagementList";
import type { EntityHistoryEntry, MetricDefinition, WorkspaceProject } from "../../types/api";
import { withDefaultOption } from "../../utils/formOptions";
import { parseImportFile } from "../../utils/importSheet";
import { downloadXlsx } from "../../utils/simpleXlsx";

interface MetricDefinitionPageProps {
  companyOptions: string[];
  projects: WorkspaceProject[];
  metrics: MetricDefinition[];
  onCreateMetric: (payload: MetricDefinition) => Promise<boolean>;
  onImportMetric: (payload: MetricDefinition) => Promise<void>;
  onImportUpdateMetric: (metricId: number, payload: MetricDefinition) => Promise<void>;
  onReloadMetrics: () => Promise<void>;
  onUpdateMetric: (metricId: number, payload: MetricDefinition) => Promise<boolean>;
  onDeleteMetric: (metricId: number) => Promise<boolean>;
}

type MetricRow = {
  id: number;
  metricEnglishName: string;
  metricChineseName: string;
  fieldType: string;
  metricCategory: string;
  businessDescription: string;
  technicalCaliber: string;
  companyName: string;
  note: string;
  projectIds: string[];
  projectNames: string[];
  updatedAt: string;
};

type ImportIssue = {
  rowNo: number;
  metricEnglishName: string;
  metricChineseName: string;
  reason: string;
};

type ImportPayloadItem = {
  rowNo: number;
  payload: MetricDefinition;
  existingMetricId?: number;
};

type PreparedImport = {
  fileName: string;
  payloads: ImportPayloadItem[];
  validationIssues: ImportIssue[];
};

type ImportMode = "metric-template" | "dimension-compact";

const metricCategoryOptions = ["规模指标", "转化指标", "效率指标", "质量指标", "其他"];
const fieldAttributeOptions = ["指标", "维度"];

export function MetricDefinitionPage(props: MetricDefinitionPageProps) {
  const {
    companyOptions,
    projects,
    metrics,
    onCreateMetric,
    onImportMetric,
    onImportUpdateMetric,
    onReloadMetrics,
    onUpdateMetric,
    onDeleteMetric,
  } = props;
  const [keyword, setKeyword] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importIssues, setImportIssues] = useState<ImportIssue[]>([]);
  const [preparedImport, setPreparedImport] = useState<PreparedImport | null>(null);
  const [importing, setImporting] = useState(false);
  const [preparingImport, setPreparingImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [historyItems, setHistoryItems] = useState<EntityHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const rows = useMemo<MetricRow[]>(
    () =>
      metrics.map((item) => ({
        id: item.id,
        metricEnglishName: item.metric_code,
        metricChineseName: item.metric_name,
        fieldType: item.field_type,
        metricCategory: item.metric_category,
        businessDescription: item.definition,
        technicalCaliber: item.calculation_rule,
        companyName: item.company_name ?? "通用",
        note: item.note ?? "",
        projectIds: item.project_ids,
        projectNames: item.project_names,
        updatedAt: item.updated_at,
      })),
    [metrics],
  );

  const initialFormValues = useMemo(
    () => ({
      metricEnglishName: "",
      metricChineseName: "",
      fieldType: "指标",
      businessDomain: "交易",
      metricCategory: "规模指标",
      companyName: "",
      businessDescription: "",
      technicalCaliber: "",
      note: "",
      projectIds: [] as string[],
    }),
    [],
  );

  const { draftFilters, filteredRows, pagedRows, pagination, setDraftFilters, applySearch, resetSearch } = useManagementList({
    rows,
    initialFilters: {
      metricEnglishName: "",
      metricChineseName: "",
      fieldType: "",
      metricCategory: "",
    },
    filterRows: (rows, filters) => {
      const english = filters.metricEnglishName.trim().toLowerCase();
      const chinese = filters.metricChineseName.trim().toLowerCase();
      const fieldType = filters.fieldType.trim().toLowerCase();
      const metricCategory = filters.metricCategory.trim().toLowerCase();
      return rows.filter(
        (item) =>
          (!english || item.metricEnglishName.toLowerCase().includes(english)) &&
          (!chinese || item.metricChineseName.toLowerCase().includes(chinese)) &&
          (!fieldType || item.fieldType.toLowerCase() === fieldType) &&
          (!metricCategory || item.metricCategory.toLowerCase() === metricCategory),
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
      metricEnglishName: row.metricEnglishName,
      metricChineseName: row.metricChineseName,
      fieldType: row.fieldType,
      businessDomain: "其他",
      metricCategory: row.metricCategory,
      companyName: row.companyName === "通用" ? "" : row.companyName,
      businessDescription: row.businessDescription,
      technicalCaliber: row.technicalCaliber,
      note: row.note,
      projectIds: row.projectIds,
    }),
  });
  const scopedProjects = useMemo(
    () => projects.filter((item) => item.companyName === formValues.companyName),
    [formValues.companyName, projects],
  );
  const fieldTypeFilterOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.fieldType).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [rows],
  );
  const fieldAttributeFormOptions = useMemo(
    () => Array.from(new Set([...fieldAttributeOptions, ...rows.map((item) => item.fieldType).filter(Boolean)])).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [rows],
  );
  const metricCategoryFilterOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.metricCategory).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [rows],
  );

  const templateHeaders = ["指标英文名", "中文名", "字段属性", "指标大类", "业务描述", "技术口径", "备注"];
  const compatibleTemplateHeaders = [
    ["指标英文名", "中文名", "字段属性", "指标大类", "业务描述", "技术口径", "备注"],
    ["指标英文名", "中文名", "字段类型", "指标大类", "业务描述", "技术口径", "备注"],
  ];
  const compactDimensionHeaders = ["英文名", "中文名", "业务解释", "关键代码"];

  function getHistoryPath(row: any) {
    return `/metric-definitions/${row.id}/history`;
  }

  useEffect(() => {
    if (mode !== "history" || !selectedRow) {
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);
    apiGet<{ items: EntityHistoryEntry[] }>(getHistoryPath(selectedRow))
      .then((data) => {
        if (!cancelled) {
          setHistoryItems(data.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistoryItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, selectedRow]);

  function handleSearch() {
    setKeyword(draftFilters.metricEnglishName || draftFilters.metricChineseName);
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

  function toggleProject(projectId: string) {
    setFormError(null);
    setFormValues((current) => ({
      ...current,
      projectIds: current.projectIds.includes(projectId)
        ? current.projectIds.filter((id) => id !== projectId)
        : [...current.projectIds, projectId],
    }));
  }

  function validateForm() {
    const metricEnglishName = formValues.metricEnglishName.trim();
    const metricChineseName = formValues.metricChineseName.trim();
    const businessDescription = formValues.businessDescription.trim();
    const technicalCaliber = formValues.technicalCaliber.trim();
    if (!metricEnglishName) {
      return "指标英文名不能为空";
    }
    if (!metricChineseName) {
      return "中文名不能为空";
    }
    if (!businessDescription) {
      return "业务描述不能为空";
    }
    if (!technicalCaliber) {
      return "技术口径不能为空";
    }
    const duplicateCode = metrics.some((item) => item.metric_code === metricEnglishName && item.id !== selectedRowId);
    if (duplicateCode) {
      return "指标英文名已存在";
    }
    const duplicateName = metrics.some(
      (item) =>
        item.metric_name === metricChineseName &&
        (item.company_name ?? "") === formValues.companyName.trim() &&
        item.id !== selectedRowId,
    );
    if (duplicateName) {
      return "同范围下中文名已存在";
    }
    if (!formValues.companyName.trim() && formValues.projectIds.length) {
      return "选择项目时必须先选择所属公司";
    }
    return null;
  }

  async function handleCreateSubmit() {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    const now = new Date().toISOString();
    setSubmitting(true);
    const success = await onCreateMetric({
      id: Date.now(),
      metric_name: formValues.metricChineseName.trim(),
      metric_code: formValues.metricEnglishName.trim(),
      field_type: formValues.fieldType.trim(),
      business_domain: formValues.businessDomain.trim(),
      metric_category: formValues.metricCategory.trim(),
      company_name: formValues.companyName.trim() || null,
      definition: formValues.businessDescription.trim(),
      calculation_rule: formValues.technicalCaliber.trim(),
      time_granularity: "日",
      unit: null,
      note: formValues.note.trim() || null,
      project_ids: formValues.projectIds,
      project_names: [],
      created_at: now,
      updated_at: now,
    });
    setSubmitting(false);
    if (!success) {
      return;
    }
    resetListView();
  }

  async function handleEditSubmit() {
    if (!selectedRow) {
      return;
    }
    const target = metrics.find((item) => item.id === selectedRow.id);
    if (!target) {
      return;
    }
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    setSubmitting(true);
    const success = await onUpdateMetric(selectedRow.id, {
      ...target,
      metric_name: formValues.metricChineseName.trim(),
      metric_code: formValues.metricEnglishName.trim(),
      field_type: formValues.fieldType.trim(),
      business_domain: formValues.businessDomain.trim(),
      metric_category: formValues.metricCategory.trim(),
      company_name: formValues.companyName.trim() || null,
      definition: formValues.businessDescription.trim(),
      calculation_rule: formValues.technicalCaliber.trim(),
      time_granularity: target.time_granularity,
      unit: target.unit,
      note: formValues.note.trim() || null,
      project_ids: formValues.projectIds,
      updated_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (!success) {
      return;
    }
    resetListView();
  }

  function handleDelete(row: MetricRow) {
    if (!window.confirm(`确认删除指标“${row.metricChineseName}”吗？`)) {
      return;
    }
    void onDeleteMetric(row.id);
  }

  function getExportRows() {
    return [
      templateHeaders,
      ...filteredRows.map((row) => [
        row.metricEnglishName,
        row.metricChineseName,
        row.fieldType,
        row.metricCategory,
        row.businessDescription,
        row.technicalCaliber,
        row.note,
      ]),
    ];
  }

  async function handleDownloadTemplate() {
    const rowsToExport = [
      templateHeaders,
      [
        "metric_pay_user_cnt",
        "成交用户数",
        "指标",
        "规模指标",
        "统计周期内产生有效支付订单的去重用户数",
        "count(distinct pay_user_id)",
        "用于交易规模分析",
      ],
    ];
    try {
      setExporting(true);
      setImportError(null);
      await downloadXlsx("指标体系导入模板.xlsx", rowsToExport);
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
      await downloadXlsx("指标体系列表.xlsx", getExportRows());
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
      const rows = await parseImportFile(file);

      if (rows.length <= 1) {
        setImportError("导入文件为空，请先填写模板数据。");
        setPreparingImport(false);
        return;
      }

      const headers = rows[0].map((header) => header.trim());
      let importMode: ImportMode | null = null;
      if (
        compatibleTemplateHeaders.some(
          (candidate) => headers.length === candidate.length && headers.every((header, index) => header === candidate[index]),
        )
      ) {
        importMode = "metric-template";
      } else if (
        headers.length >= compactDimensionHeaders.length &&
        compactDimensionHeaders.every((header, index) => headers[index] === header)
      ) {
        importMode = "dimension-compact";
      }

      if (!importMode) {
        setImportError("导入模板表头不匹配，请先下载最新模板。");
        setPreparingImport(false);
        return;
      }

      const payloads: ImportPayloadItem[] = [];
      const validationIssues: ImportIssue[] = [];
      const seenCodes = new Set(metrics.map((item) => item.metric_code));
      const seenNames = new Set(metrics.map((item) => `${item.company_name ?? ""}__${item.metric_name}`));
      const metricByCode = new Map(metrics.map((item) => [item.metric_code, item] as const));

      for (let lineIndex = 1; lineIndex < rows.length; lineIndex += 1) {
        const cells = [...rows[lineIndex]];
        if (!cells.some((cell) => cell.trim())) {
          continue;
        }
        while (cells.length < templateHeaders.length) {
          cells.push("");
        }

        const normalizedCells = cells.map((cell) => cell.trim());
        const [
          metricEnglishName,
          metricChineseName,
          rawFieldType,
          rawMetricCategory,
          rawBusinessDescription,
          rawTechnicalCaliber,
          rawNote,
        ] =
          importMode === "metric-template"
            ? normalizedCells
            : [
                normalizedCells[0] ?? "",
                normalizedCells[1] ?? "",
                "维度",
                "--",
                normalizedCells[2] ?? "",
                normalizedCells[3] ?? "",
                "",
              ];

        const fieldType = rawFieldType || "指标";
        const metricCategory = rawMetricCategory || "--";
        const businessDescription =
          rawBusinessDescription || (metricChineseName ? `${metricChineseName}，定义待补充` : "");
        const technicalCaliber =
          rawTechnicalCaliber || (metricChineseName ? `${metricChineseName}，技术口径待补充` : "待补充");
        const note = rawNote;
        const existingMetric = metricByCode.get(metricEnglishName);

        if (!metricEnglishName || !metricChineseName || !fieldType || !metricCategory || !businessDescription || !technicalCaliber) {
          validationIssues.push({
            rowNo: lineIndex + 1,
            metricEnglishName,
            metricChineseName,
            reason: "必填字段为空",
          });
          continue;
        }
        if (!existingMetric && seenCodes.has(metricEnglishName)) {
          validationIssues.push({
            rowNo: lineIndex + 1,
            metricEnglishName,
            metricChineseName,
            reason: `指标英文名已存在：${metricEnglishName}`,
          });
          continue;
        }
        const nameKey = `__${metricChineseName}`;
        if (!existingMetric && seenNames.has(nameKey)) {
          validationIssues.push({
            rowNo: lineIndex + 1,
            metricEnglishName,
            metricChineseName,
            reason: `中文名已存在：${metricChineseName}`,
          });
          continue;
        }

        seenCodes.add(metricEnglishName);
        seenNames.add(nameKey);
        const now = new Date().toISOString();
        payloads.push({
          rowNo: lineIndex + 1,
          existingMetricId: existingMetric?.id,
          payload: {
            id: existingMetric?.id ?? Date.now() + lineIndex,
            metric_name: metricChineseName,
            metric_code: metricEnglishName,
            field_type: fieldType,
            business_domain: "其他",
            metric_category: metricCategory,
            company_name: null,
            definition: businessDescription,
            calculation_rule: technicalCaliber,
            time_granularity: existingMetric?.time_granularity ?? "日",
            unit: existingMetric?.unit ?? null,
            note: note || null,
            project_ids: existingMetric?.project_ids ?? [],
            project_names: existingMetric?.project_names ?? [],
            created_at: existingMetric?.created_at ?? now,
            updated_at: now,
          },
        });
        if (!existingMetric) {
          seenCodes.add(metricEnglishName);
          seenNames.add(nameKey);
        }
      }

      if (!payloads.length && !validationIssues.length) {
        setImportError("未识别到可导入的数据行。");
        setPreparingImport(false);
        return;
      }
      setPreparedImport({
        fileName: file.name,
        payloads,
        validationIssues,
      });
      setImportIssues(validationIssues);
      setImportResult(
        `已解析文件：${file.name}。待确认导入 ${payloads.length} 条，其中新增 ${payloads.filter((item) => !item.existingMetricId).length} 条，更新 ${payloads.filter((item) => item.existingMetricId).length} 条，失败 ${validationIssues.length} 条。`,
      );
      setPreparingImport(false);
    } catch (error) {
      setPreparingImport(false);
      setImportError(error instanceof Error ? error.message : "导入失败，请检查文件格式。");
    }
  }

  async function handleConfirmImport() {
    if (!preparedImport) {
      setImportError("请先选择并解析导入文件。");
      return;
    }
    try {
      setImportError(null);
      setImportResult(null);
      setImporting(true);
      let successCount = 0;
      let createdCount = 0;
      let updatedCount = 0;
      const executionIssues = [...preparedImport.validationIssues];
      for (const item of preparedImport.payloads) {
        try {
          if (item.existingMetricId) {
            await onImportUpdateMetric(item.existingMetricId, item.payload);
            updatedCount += 1;
          } else {
            await onImportMetric(item.payload);
            createdCount += 1;
          }
          successCount += 1;
        } catch (error) {
          executionIssues.push({
            rowNo: item.rowNo,
            metricEnglishName: item.payload.metric_code,
            metricChineseName: item.payload.metric_name,
            reason: error instanceof Error ? error.message : "接口保存失败",
          });
        }
      }
      if (successCount > 0) {
        await onReloadMetrics();
      }
      setImporting(false);
      setImportIssues(executionIssues);
      setImportResult(
        executionIssues.length
          ? `导入完成，新增 ${createdCount} 条，更新 ${updatedCount} 条，失败 ${executionIssues.length} 条。`
          : `导入完成，新增 ${createdCount} 条，更新 ${updatedCount} 条。`,
      );
      if (successCount > 0) {
        setPreparedImport(null);
        resetListView();
        setShowImportDialog(true);
      }
    } catch (error) {
      setImporting(false);
      setImportError(error instanceof Error ? error.message : "导入失败，请检查文件格式。");
    }
  }

  const readonlyFields = useMemo<EntityFieldSchema[]>(() => [
    { key: "metricEnglishName", label: "指标英文名", type: "text", value: formValues.metricEnglishName, disabled: true },
    { key: "metricChineseName", label: "中文名", type: "text", value: formValues.metricChineseName, disabled: true },
    { key: "fieldType", label: "字段属性", type: "text", value: formValues.fieldType, disabled: true },
    { key: "metricCategory", label: "指标大类", type: "text", value: formValues.metricCategory, disabled: true },
    { key: "companyName", label: "所属公司", type: "text", value: formValues.companyName || "通用", disabled: true },
    {
      key: "projects",
      label: "适用项目",
      type: "readonly-relation",
      fullWidth: true,
      children: selectedRow?.projectNames.length ? selectedRow.projectNames.map((name) => (
        <label className="relation-option" key={name}>
          <input checked disabled type="checkbox" />
          <span>{name}</span>
        </label>
      )) : <div className="empty-box">当前指标适用于全部项目或未指定项目。</div>,
    },
    { key: "businessDescription", label: "业务描述", type: "readonly-text", value: formValues.businessDescription, fullWidth: true },
    { key: "technicalCaliber", label: "技术口径", type: "readonly-text", value: formValues.technicalCaliber, fullWidth: true },
    { key: "note", label: "备注", type: "readonly-text", value: formValues.note, fullWidth: true },
  ], [formValues.businessDescription, formValues.companyName, formValues.fieldType, formValues.metricCategory, formValues.metricChineseName, formValues.metricEnglishName, formValues.note, formValues.technicalCaliber, selectedRow?.projectNames]);

  const formFields = useMemo<EntityFieldSchema[]>(() => [
    {
      key: "metricEnglishName",
      label: "指标英文名 *",
      type: "text",
      value: formValues.metricEnglishName,
      placeholder: "请输入指标英文名",
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, metricEnglishName: value })); },
    },
    {
      key: "metricChineseName",
      label: "中文名 *",
      type: "text",
      value: formValues.metricChineseName,
      placeholder: "请输入中文名",
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, metricChineseName: value })); },
    },
    {
      key: "fieldType",
      label: "字段属性 *",
      type: "select",
      value: formValues.fieldType,
      options: fieldAttributeFormOptions.map((item) => ({ label: item, value: item })),
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, fieldType: value })); },
    },
    {
      key: "metricCategory",
      label: "指标大类 *",
      type: "select",
      value: formValues.metricCategory,
      options: metricCategoryOptions.map((item) => ({ label: item, value: item })),
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, metricCategory: value })); },
    },
    {
      key: "companyName",
      label: "所属公司",
      type: "select",
      value: formValues.companyName,
      options: [{ label: "通用", value: "" }, ...companyOptions.map((item) => ({ label: item, value: item }))],
      onChange: handleCompanyChange,
    },
    {
      key: "projects",
      label: "适用项目",
      type: "relation",
      fullWidth: true,
      children: formValues.companyName && scopedProjects.length ? scopedProjects.map((project) => (
        <label className="relation-option" key={project.id}>
          <input checked={formValues.projectIds.includes(project.id)} onChange={() => toggleProject(project.id)} type="checkbox" />
          <span>{project.name}</span>
        </label>
      )) : <div className="empty-box">{formValues.companyName ? "当前公司暂无项目。" : "未选择公司时默认为通用指标。"}</div>,
    },
    {
      key: "businessDescription",
      label: "业务描述 *",
      type: "textarea",
      value: formValues.businessDescription,
      placeholder: "请输入业务描述",
      fullWidth: true,
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, businessDescription: value })); },
    },
    {
      key: "technicalCaliber",
      label: "技术口径 *",
      type: "textarea",
      value: formValues.technicalCaliber,
      placeholder: "请输入技术口径",
      fullWidth: true,
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, technicalCaliber: value })); },
    },
    {
      key: "note",
      label: "备注",
      type: "textarea",
      value: formValues.note,
      placeholder: "选填",
      fullWidth: true,
      onChange: (value) => setFormValues((current) => ({ ...current, note: value })),
    },
  ], [companyOptions, fieldAttributeFormOptions, formValues.businessDescription, formValues.companyName, formValues.fieldType, formValues.metricCategory, formValues.metricChineseName, formValues.metricEnglishName, formValues.note, formValues.projectIds, formValues.technicalCaliber, metricCategoryOptions, scopedProjects]);

  return (
    <>
      <EntityManagementPage
        columns={[
          textColumn<MetricRow>("指标英文名", (row) => row.metricEnglishName),
          textColumn<MetricRow>("中文名", (row) => row.metricChineseName),
          textColumn<MetricRow>("字段属性", (row) => row.fieldType),
          textColumn<MetricRow>("指标大类", (row) => row.metricCategory),
          textColumn<MetricRow>("业务描述", (row) => row.businessDescription),
          textColumn<MetricRow>("技术口径", (row) => row.technicalCaliber),
          textColumn<MetricRow>("备注", (row) => row.note),
        ]}
        detailTitle="指标详情"
        emptyText="未查询到匹配的指标定义。"
        formError={formError}
        historyTitle="更新记录"
        detailMeta={`修改时间：${selectedRow?.updatedAt ?? "-"}`}
        keyword={keyword}
        listTitle="指标体系列表"
        mode={mode}
        onBack={resetListView}
        onCreate={() => openCreateMode(initialFormValues)}
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
        onDelete={handleDelete}
        onDetail={(row) => openRow(row, "detail")}
        onEdit={(row) => openRow(row, "edit")}
        onHistory={(row) => openRow(row, "history")}
        onOpenHistory={() => {
          if (selectedRow) {
            openRow(selectedRow, "history");
          }
        }}
        onKeywordChange={setKeyword}
        onResetSearch={handleResetSearch}
        onSearch={handleSearch}
        pagination={pagination}
        renderSearchFields={() => {
          const searchFields: SearchFieldSchema[] = [
            {
              key: "metricEnglishName",
              type: "text",
              placeholder: "请输入指标英文名",
              value: draftFilters.metricEnglishName,
              onChange: (value) => setDraftFilters((current) => ({ ...current, metricEnglishName: value })),
            },
            {
              key: "metricChineseName",
              type: "text",
              placeholder: "请输入中文名",
              value: draftFilters.metricChineseName,
              onChange: (value) => setDraftFilters((current) => ({ ...current, metricChineseName: value })),
            },
            {
              key: "fieldType",
              type: "select",
              value: draftFilters.fieldType,
              options: withDefaultOption("全部字段属性", fieldTypeFilterOptions),
              onChange: (value) => setDraftFilters((current) => ({ ...current, fieldType: value })),
            },
            {
              key: "metricCategory",
              type: "select",
              value: draftFilters.metricCategory,
              options: withDefaultOption("全部指标大类", metricCategoryFilterOptions),
              onChange: (value) => setDraftFilters((current) => ({ ...current, metricCategory: value })),
            },
          ];
          return <EntitySearchRenderer fields={searchFields} />;
        }}
        onSubmit={mode === "create" ? handleCreateSubmit : handleEditSubmit}
        renderDetail={() => <EntityFormRenderer fields={readonlyFields} />}
        renderForm={() => <EntityFormRenderer fields={formFields} />}
        renderHistory={() =>
          historyLoading ? (
            <div className="loading-box">正在加载更新记录...</div>
          ) : (
            <EntityHistoryList
              items={
                historyItems.length
                  ? historyItems.map((item) => ({ title: item.title, description: item.description }))
                  : [{ title: "暂无记录", description: "当前实体还没有更新记录。" }]
              }
            />
          )
        }
        rowKey={(row) => row.id}
        rows={pagedRows}
        searchPlaceholder="请输入指标英文名、中文名、字段属性或指标大类"
        submitDisabled={!formValues.metricEnglishName.trim() || !formValues.metricChineseName.trim() || !formValues.fieldType.trim() || !formValues.metricCategory.trim() || !formValues.businessDescription.trim() || !formValues.technicalCaliber.trim()}
        submitting={submitting}
      />

      <ImportExportDialog
        createCount={preparedImport ? preparedImport.payloads.filter((item) => !item.existingMetricId).length : 0}
        description="支持导入 XLSX 或 CSV 文件，兼容标准指标模板和 4 列维度模板。"
        exporting={exporting}
        failCount={preparedImport ? preparedImport.validationIssues.length : importIssues.length}
        importError={importError}
        importIssues={importIssues}
        importing={importing}
        importResult={importResult}
        issueKey={(issue) => `${issue.rowNo}-${issue.metricEnglishName}-${issue.reason}`}
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
          { key: "metricCode", header: "指标英文名", render: (item) => item.payload.metric_code },
          { key: "metricName", header: "中文名", render: (item) => item.payload.metric_name },
          { key: "fieldType", header: "字段属性", render: (item) => item.payload.field_type },
          { key: "action", header: "操作类型", render: (item) => (item.existingMetricId ? "更新" : "新增") },
        ]}
        previewRowKey={(item) => `${item.rowNo}-${item.payload.metric_code}`}
        previewRows={preparedImport?.payloads.slice(0, 6) ?? []}
        renderIssue={(issue) => (
          <>
            <span>第 {issue.rowNo} 行</span>
            <strong>{issue.metricChineseName || issue.metricEnglishName || "-"}</strong>
            <em>{issue.reason}</em>
          </>
        )}
        templateHeaders={templateHeaders}
        title="导入指标体系"
        updateCount={preparedImport ? preparedImport.payloads.filter((item) => item.existingMetricId).length : 0}
        visible={showImportDialog}
      />

    </>
  );
}
