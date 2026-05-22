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
import type { EntityHistoryEntry, KnowledgeStandard, WorkspaceProject } from "../../types/api";
import { withDefaultOption } from "../../utils/formOptions";
import { parseImportFile } from "../../utils/importSheet";
import { downloadXlsx } from "../../utils/simpleXlsx";

interface KnowledgeStandardPageProps {
  companyOptions: string[];
  projects: WorkspaceProject[];
  standards: KnowledgeStandard[];
  onCreateStandard: (payload: KnowledgeStandard) => Promise<boolean>;
  onImportStandard: (payload: KnowledgeStandard) => Promise<void>;
  onImportUpdateStandard: (standardId: number, payload: KnowledgeStandard) => Promise<void>;
  onReloadStandards: () => Promise<void>;
  onUpdateStandard: (standardId: number, payload: KnowledgeStandard) => Promise<boolean>;
  onDeleteStandard: (standardId: number) => Promise<boolean>;
}

type StandardRow = {
  id: number;
  standardName: string;
  standardType: string;
  companyName: string;
  status: string;
  ruleContent: string;
  positiveExample: string;
  negativeExample: string;
  note: string;
  projectIds: string[];
  projectNames: string[];
  updatedAt: string;
};

type ImportIssue = {
  rowNo: number;
  standardName: string;
  standardType: string;
  reason: string;
};

type ImportPayloadItem = {
  rowNo: number;
  payload: KnowledgeStandard;
  existingStandardId?: number;
};

type PreparedImport = {
  fileName: string;
  payloads: ImportPayloadItem[];
  validationIssues: ImportIssue[];
};

const standardTypeOptions = ["命名规范", "分层规范", "建模规范", "建表规范", "字段规范", "开发流程规范", "发布规范", "其他"];
const statusOptions = ["生效中", "已废弃"];
const templateHeaders = ["标准名称", "规范类型", "状态", "规则内容", "正确示例", "错误示例", "备注"];

export function KnowledgeStandardPage(props: KnowledgeStandardPageProps) {
  const {
    companyOptions,
    projects,
    standards,
    onCreateStandard,
    onImportStandard,
    onImportUpdateStandard,
    onReloadStandards,
    onUpdateStandard,
    onDeleteStandard,
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

  const rows = useMemo<StandardRow[]>(
    () =>
      standards.map((item) => ({
        id: item.id,
        standardName: item.standard_name,
        standardType: item.standard_type,
        companyName: item.company_name ?? "通用",
        status: item.status,
        ruleContent: item.rule_content,
        positiveExample: item.positive_example ?? "",
        negativeExample: item.negative_example ?? "",
        note: item.note ?? "",
        projectIds: item.project_ids,
        projectNames: item.project_names,
        updatedAt: item.updated_at,
      })),
    [standards],
  );

  const initialFormValues = useMemo(
    () => ({
      standardName: "",
      standardType: "命名规范",
      companyName: "",
      status: "生效中",
      ruleContent: "",
      positiveExample: "",
      negativeExample: "",
      note: "",
      projectIds: [] as string[],
    }),
    [],
  );

  const { draftFilters, filteredRows, pagedRows, pagination, setDraftFilters, applySearch, resetSearch } = useManagementList({
    rows,
    initialFilters: {
      standardName: "",
      standardType: "",
      status: "",
    },
    filterRows: (rows, filters) => {
      const standardName = filters.standardName.trim().toLowerCase();
      const standardType = filters.standardType.trim().toLowerCase();
      const status = filters.status.trim().toLowerCase();
      return rows.filter(
        (item) =>
          (!standardName || item.standardName.toLowerCase().includes(standardName)) &&
          (!standardType || item.standardType.toLowerCase() === standardType) &&
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
      standardName: row.standardName,
      standardType: row.standardType,
      companyName: row.companyName === "通用" ? "" : row.companyName,
      status: row.status,
      ruleContent: row.ruleContent,
      positiveExample: row.positiveExample,
      negativeExample: row.negativeExample,
      note: row.note,
      projectIds: row.projectIds,
    }),
  });
  const scopedProjects = useMemo(
    () => projects.filter((item) => item.companyName === formValues.companyName),
    [formValues.companyName, projects],
  );

  const standardTypeFilterOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.standardType).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [rows],
  );
  const statusFilterOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.status).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [rows],
  );

  function getHistoryPath(row: any) {
    return `/knowledge-standards/${row.id}/history`;
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
    setKeyword(draftFilters.standardName);
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
    const standardName = formValues.standardName.trim();
    const standardType = formValues.standardType.trim();
    const ruleContent = formValues.ruleContent.trim();
    if (!standardName) {
      return "标准名称不能为空";
    }
    if (!standardType) {
      return "规范类型不能为空";
    }
    if (!ruleContent) {
      return "规则内容不能为空";
    }
    const duplicate = standards.some(
      (item) =>
        item.standard_name === standardName &&
        item.standard_type === standardType &&
        (item.company_name ?? "") === formValues.companyName.trim() &&
        item.id !== selectedRowId,
    );
    if (duplicate) {
      return "同范围下标准名称和规范类型已存在";
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
    const success = await onCreateStandard({
      id: Date.now(),
      standard_name: formValues.standardName.trim(),
      standard_type: formValues.standardType.trim(),
      company_name: formValues.companyName.trim() || null,
      status: formValues.status,
      rule_content: formValues.ruleContent.trim(),
      positive_example: formValues.positiveExample.trim() || null,
      negative_example: formValues.negativeExample.trim() || null,
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
    const target = standards.find((item) => item.id === selectedRow.id);
    if (!target) {
      return;
    }
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    setSubmitting(true);
    const success = await onUpdateStandard(selectedRow.id, {
      ...target,
      standard_name: formValues.standardName.trim(),
      standard_type: formValues.standardType.trim(),
      company_name: formValues.companyName.trim() || null,
      status: formValues.status,
      rule_content: formValues.ruleContent.trim(),
      positive_example: formValues.positiveExample.trim() || null,
      negative_example: formValues.negativeExample.trim() || null,
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

  function handleDelete(row: StandardRow) {
    if (!window.confirm(`确认删除规范标准“${row.standardName}”吗？`)) {
      return;
    }
    void onDeleteStandard(row.id);
  }

  function getExportRows() {
    return [
      templateHeaders,
      ...filteredRows.map((row) => [
        row.standardName,
        row.standardType,
        row.status,
        row.ruleContent,
        row.positiveExample,
        row.negativeExample,
        row.note,
      ]),
    ];
  }

  async function handleDownloadTemplate() {
    const rowsToExport = [
      templateHeaders,
      [
        "DWD 层命名规范",
        "命名规范",
        "生效中",
        "DWD 层表名统一采用 dwd_业务域_主题 结构",
        "dwd_trade_order_detail_di",
        "table1",
        "用于建表命名统一",
      ],
    ];
    try {
      setExporting(true);
      setImportError(null);
      await downloadXlsx("规范标准导入模板.xlsx", rowsToExport);
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
      await downloadXlsx("规范标准列表.xlsx", getExportRows());
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
      if (headers.length !== templateHeaders.length || headers.some((header, index) => header !== templateHeaders[index])) {
        setImportError("导入模板表头不匹配，请先下载最新模板。");
        setPreparingImport(false);
        return;
      }

      const standardByKey = new Map<string, KnowledgeStandard>(standards.map((item) => [`${item.standard_name}__${item.standard_type}`, item]));
      const payloads: ImportPayloadItem[] = [];
      const validationIssues: ImportIssue[] = [];
      const seenKeys = new Set<string>();

      for (let lineIndex = 1; lineIndex < rows.length; lineIndex += 1) {
        const cells = [...rows[lineIndex]];
        if (!cells.some((cell) => cell.trim())) {
          continue;
        }
        while (cells.length < templateHeaders.length) {
          cells.push("");
        }
        const [standardName, rawStandardType, rawStatus, ruleContent, positiveExample, negativeExample, note] = cells.map((cell) => cell.trim());
        const standardType = rawStandardType || "其他";
        const status = rawStatus || "生效中";
        const uniqueKey = `${standardName}__${standardType}`;
        const existingStandard = standardByKey.get(uniqueKey);

        if (!standardName || !standardType || !ruleContent) {
          validationIssues.push({
            rowNo: lineIndex + 1,
            standardName,
            standardType,
            reason: "必填字段为空",
          });
          continue;
        }
        if (!existingStandard && seenKeys.has(uniqueKey)) {
          validationIssues.push({
            rowNo: lineIndex + 1,
            standardName,
            standardType,
            reason: `导入文件内标准重复：${standardName}/${standardType}`,
          });
          continue;
        }

        seenKeys.add(uniqueKey);
        const now = new Date().toISOString();
        payloads.push({
          rowNo: lineIndex + 1,
          existingStandardId: existingStandard?.id,
          payload: {
            id: existingStandard?.id ?? Date.now() + lineIndex,
            standard_name: standardName,
            standard_type: standardType,
            company_name: existingStandard?.company_name ?? null,
            status,
            rule_content: ruleContent,
            positive_example: positiveExample || null,
            negative_example: negativeExample || null,
            note: note || null,
            project_ids: existingStandard?.project_ids ?? [],
            project_names: existingStandard?.project_names ?? [],
            created_at: existingStandard?.created_at ?? now,
            updated_at: now,
          },
        });
      }

      if (!payloads.length && !validationIssues.length) {
        setImportError("未识别到可导入的数据行。");
        setPreparingImport(false);
        return;
      }

      setPreparedImport({ fileName: file.name, payloads, validationIssues });
      setImportIssues(validationIssues);
      setImportResult(
        `已解析文件：${file.name}。待确认导入 ${payloads.length} 条，其中新增 ${payloads.filter((item) => !item.existingStandardId).length} 条，更新 ${payloads.filter((item) => item.existingStandardId).length} 条，失败 ${validationIssues.length} 条。`,
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
      let createdCount = 0;
      let updatedCount = 0;
      let successCount = 0;
      const executionIssues = [...preparedImport.validationIssues];

      for (const item of preparedImport.payloads) {
        try {
          if (item.existingStandardId) {
            await onImportUpdateStandard(item.existingStandardId, item.payload);
            updatedCount += 1;
          } else {
            await onImportStandard(item.payload);
            createdCount += 1;
          }
          successCount += 1;
        } catch (error) {
          executionIssues.push({
            rowNo: item.rowNo,
            standardName: item.payload.standard_name,
            standardType: item.payload.standard_type,
            reason: error instanceof Error ? error.message : "接口保存失败",
          });
        }
      }

      if (successCount > 0) {
        await onReloadStandards();
      }
      setImporting(false);
      setImportIssues(executionIssues);
      setImportResult(
        executionIssues.length
          ? `导入完成，新增 ${createdCount} 条，更新 ${updatedCount} 条，失败 ${executionIssues.length} 条。`
          : `导入完成，新增 ${createdCount} 条，更新 ${updatedCount} 条，失败 0 条。`,
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
    { key: "standardName", label: "标准名称", type: "text", value: formValues.standardName, disabled: true },
    { key: "standardType", label: "规范类型", type: "text", value: formValues.standardType, disabled: true },
    { key: "companyName", label: "所属公司", type: "text", value: formValues.companyName || "通用", disabled: true },
    { key: "status", label: "状态", type: "text", value: formValues.status, disabled: true },
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
      )) : <div className="empty-box">当前标准适用于全部项目或未指定项目。</div>,
    },
    { key: "ruleContent", label: "规则内容", type: "readonly-text", value: formValues.ruleContent, fullWidth: true },
    { key: "positiveExample", label: "正确示例", type: "readonly-text", value: formValues.positiveExample, fullWidth: true },
    { key: "negativeExample", label: "错误示例", type: "readonly-text", value: formValues.negativeExample, fullWidth: true },
    { key: "note", label: "备注", type: "readonly-text", value: formValues.note, fullWidth: true },
  ], [formValues.companyName, formValues.negativeExample, formValues.note, formValues.positiveExample, formValues.ruleContent, formValues.standardName, formValues.standardType, formValues.status, selectedRow?.projectNames]);

  const formFields = useMemo<EntityFieldSchema[]>(() => [
    {
      key: "standardName",
      label: "标准名称 *",
      type: "text",
      value: formValues.standardName,
      placeholder: "请输入标准名称",
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, standardName: value })); },
    },
    {
      key: "standardType",
      label: "规范类型 *",
      type: "select",
      value: formValues.standardType,
      options: standardTypeOptions.map((item) => ({ label: item, value: item })),
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, standardType: value })); },
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
      key: "status",
      label: "状态 *",
      type: "select",
      value: formValues.status,
      options: statusOptions.map((item) => ({ label: item, value: item })),
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, status: value })); },
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
      )) : <div className="empty-box">{formValues.companyName ? "当前公司暂无项目。" : "未选择公司时默认为通用标准。"}</div>,
    },
    {
      key: "ruleContent",
      label: "规则内容 *",
      type: "textarea",
      value: formValues.ruleContent,
      placeholder: "请输入规则内容",
      fullWidth: true,
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, ruleContent: value })); },
    },
    {
      key: "positiveExample",
      label: "正确示例",
      type: "textarea",
      value: formValues.positiveExample,
      placeholder: "选填",
      fullWidth: true,
      onChange: (value) => setFormValues((current) => ({ ...current, positiveExample: value })),
    },
    {
      key: "negativeExample",
      label: "错误示例",
      type: "textarea",
      value: formValues.negativeExample,
      placeholder: "选填",
      fullWidth: true,
      onChange: (value) => setFormValues((current) => ({ ...current, negativeExample: value })),
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
  ], [companyOptions, formValues.companyName, formValues.negativeExample, formValues.note, formValues.positiveExample, formValues.projectIds, formValues.ruleContent, formValues.standardName, formValues.standardType, formValues.status, scopedProjects]);

  return (
    <>
      <EntityManagementPage
        columns={[
          textColumn<StandardRow>("标准名称", (row) => row.standardName),
          textColumn<StandardRow>("规范类型", (row) => row.standardType),
          textColumn<StandardRow>("所属公司", (row) => row.companyName),
          textColumn<StandardRow>("适用项目", (row) => (row.projectNames.length ? row.projectNames.join("、") : "全部项目")),
          textColumn<StandardRow>("状态", (row) => row.status),
        ]}
        detailTitle="标准详情"
        emptyText="未查询到匹配的规范标准。"
        formError={formError}
        historyTitle="更新记录"
        detailMeta={`修改时间：${selectedRow?.updatedAt ?? "-"}`}
        keyword={keyword}
        listTitle="规范数据列表"
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
              key: "standardName",
              type: "text",
              placeholder: "请输入标准名称",
              value: draftFilters.standardName,
              onChange: (value) => {
                setKeyword(value);
                setDraftFilters((current) => ({ ...current, standardName: value }));
              },
            },
            {
              key: "standardType",
              type: "select",
              value: draftFilters.standardType,
              options: withDefaultOption("全部规范类型", standardTypeFilterOptions),
              onChange: (value) => setDraftFilters((current) => ({ ...current, standardType: value })),
            },
            {
              key: "status",
              type: "select",
              value: draftFilters.status,
              options: withDefaultOption("全部状态", statusFilterOptions),
              onChange: (value) => setDraftFilters((current) => ({ ...current, status: value })),
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
        searchPlaceholder="请输入标准名称"
        submitDisabled={!formValues.standardName.trim() || !formValues.standardType.trim() || !formValues.ruleContent.trim()}
        submitting={submitting}
      />

      <ImportExportDialog
        createCount={preparedImport ? preparedImport.payloads.filter((item) => !item.existingStandardId).length : 0}
        description="支持导入 XLSX 或 CSV 文件，导入时按标准名称 + 规范类型自动识别新增或更新。"
        exporting={exporting}
        failCount={preparedImport ? preparedImport.validationIssues.length : importIssues.length}
        importError={importError}
        importIssues={importIssues}
        importing={importing}
        importResult={importResult}
        issueKey={(issue) => `${issue.rowNo}-${issue.standardName}-${issue.reason}`}
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
          { key: "standardName", header: "标准名称", render: (item) => item.payload.standard_name },
          { key: "standardType", header: "规范类型", render: (item) => item.payload.standard_type },
          { key: "status", header: "状态", render: (item) => item.payload.status },
          { key: "action", header: "操作类型", render: (item) => (item.existingStandardId ? "更新" : "新增") },
        ]}
        previewRowKey={(item) => `${item.rowNo}-${item.payload.standard_name}-${item.payload.standard_type}`}
        previewRows={preparedImport?.payloads.slice(0, 6) ?? []}
        renderIssue={(issue) => (
          <>
            <span>第 {issue.rowNo} 行</span>
            <strong>{issue.standardName || "-"}</strong>
            <em>{issue.reason}</em>
          </>
        )}
        templateHeaders={templateHeaders}
        title="导入规范标准"
        updateCount={preparedImport ? preparedImport.payloads.filter((item) => item.existingStandardId).length : 0}
        visible={showImportDialog}
      />

    </>
  );
}
