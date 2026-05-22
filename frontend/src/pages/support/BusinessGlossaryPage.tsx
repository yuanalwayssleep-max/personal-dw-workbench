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
import type { EntityHistoryEntry, BusinessGlossary, WorkspaceProject } from "../../types/api";
import { withDefaultOption } from "../../utils/formOptions";
import { parseImportFile } from "../../utils/importSheet";
import { downloadXlsx } from "../../utils/simpleXlsx";

interface BusinessGlossaryPageProps {
  companyOptions: string[];
  projects: WorkspaceProject[];
  glossaries: BusinessGlossary[];
  onCreateGlossary: (payload: BusinessGlossary) => Promise<boolean>;
  onImportGlossary: (payload: BusinessGlossary) => Promise<void>;
  onImportUpdateGlossary: (glossaryId: number, payload: BusinessGlossary) => Promise<void>;
  onReloadGlossaries: () => Promise<void>;
  onUpdateGlossary: (glossaryId: number, payload: BusinessGlossary) => Promise<boolean>;
  onDeleteGlossary: (glossaryId: number) => Promise<boolean>;
}

type GlossaryRow = {
  id: number;
  glossaryName: string;
  businessDomain: string;
  companyName: string;
  definition: string;
  statisticalScope: string;
  dataSource: string;
  note: string;
  projectIds: string[];
  projectNames: string[];
  updatedAt: string;
};

type ImportIssue = {
  rowNo: number;
  glossaryName: string;
  businessDomain: string;
  reason: string;
};

type ImportPayloadItem = {
  rowNo: number;
  payload: BusinessGlossary;
  existingGlossaryId?: number;
};

type PreparedImport = {
  fileName: string;
  payloads: ImportPayloadItem[];
  validationIssues: ImportIssue[];
};

const businessDomainOptions = ["线索", "用户", "交易", "投放", "内容", "经营", "其他"];
const templateHeaders = ["口径名称", "业务域", "口径定义", "统计范围", "数据来源", "备注"];

export function BusinessGlossaryPage(props: BusinessGlossaryPageProps) {
  const {
    companyOptions,
    projects,
    glossaries,
    onCreateGlossary,
    onImportGlossary,
    onImportUpdateGlossary,
    onReloadGlossaries,
    onUpdateGlossary,
    onDeleteGlossary,
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

  const rows = useMemo<GlossaryRow[]>(
    () =>
      glossaries.map((item) => ({
        id: item.id,
        glossaryName: item.glossary_name,
        businessDomain: item.business_domain,
        companyName: item.company_name ?? "通用",
        definition: item.definition,
        statisticalScope: item.statistical_scope ?? "",
        dataSource: item.data_source ?? "",
        note: item.note ?? "",
        projectIds: item.project_ids,
        projectNames: item.project_names,
        updatedAt: item.updated_at,
      })),
    [glossaries],
  );

  const initialFormValues = useMemo(
    () => ({
      glossaryName: "",
      businessDomain: "线索",
      companyName: "",
      definition: "",
      statisticalScope: "",
      dataSource: "",
      note: "",
      projectIds: [] as string[],
    }),
    [],
  );

  const { draftFilters, filteredRows, pagedRows, pagination, setDraftFilters, applySearch, resetSearch } = useManagementList({
    rows,
    initialFilters: {
      glossaryName: "",
      businessDomain: "",
      companyName: "",
    },
    filterRows: (rows, filters) => {
      const glossaryName = filters.glossaryName.trim().toLowerCase();
      const businessDomain = filters.businessDomain.trim().toLowerCase();
      const companyName = filters.companyName.trim().toLowerCase();
      return rows.filter(
        (item) =>
          (!glossaryName || item.glossaryName.toLowerCase().includes(glossaryName)) &&
          (!businessDomain || item.businessDomain.toLowerCase() === businessDomain) &&
          (!companyName || item.companyName.toLowerCase() === companyName),
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
      glossaryName: row.glossaryName,
      businessDomain: row.businessDomain,
      companyName: row.companyName === "通用" ? "" : row.companyName,
      definition: row.definition,
      statisticalScope: row.statisticalScope,
      dataSource: row.dataSource,
      note: row.note,
      projectIds: row.projectIds,
    }),
  });
  const scopedProjects = useMemo(
    () => projects.filter((item) => item.companyName === formValues.companyName),
    [formValues.companyName, projects],
  );

  const businessDomainFilterOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.businessDomain).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [rows],
  );
  const companyFilterOptions = useMemo(
    () => Array.from(new Set(rows.map((item) => item.companyName).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [rows],
  );

  function getHistoryPath(row: any) {
    return `/business-glossaries/${row.id}/history`;
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
    setKeyword(draftFilters.glossaryName);
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
    const glossaryName = formValues.glossaryName.trim();
    const definition = formValues.definition.trim();
    if (!glossaryName) {
      return "口径名称不能为空";
    }
    if (!definition) {
      return "口径定义不能为空";
    }
    const duplicate = glossaries.some(
      (item) =>
        item.glossary_name === glossaryName &&
        (item.company_name ?? "") === formValues.companyName.trim() &&
        item.id !== selectedRowId,
    );
    if (duplicate) {
      return "同范围下口径名称已存在";
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
    const success = await onCreateGlossary({
      id: Date.now(),
      glossary_name: formValues.glossaryName.trim(),
      business_domain: formValues.businessDomain.trim(),
      company_name: formValues.companyName.trim() || null,
      definition: formValues.definition.trim(),
      statistical_scope: formValues.statisticalScope.trim() || null,
      data_source: formValues.dataSource.trim() || null,
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
    const target = glossaries.find((item) => item.id === selectedRow.id);
    if (!target) {
      return;
    }
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    setSubmitting(true);
    const success = await onUpdateGlossary(selectedRow.id, {
      ...target,
      glossary_name: formValues.glossaryName.trim(),
      business_domain: formValues.businessDomain.trim(),
      company_name: formValues.companyName.trim() || null,
      definition: formValues.definition.trim(),
      statistical_scope: formValues.statisticalScope.trim() || null,
      data_source: formValues.dataSource.trim() || null,
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

  function handleDelete(row: GlossaryRow) {
    if (!window.confirm(`确认删除业务口径“${row.glossaryName}”吗？`)) {
      return;
    }
    void onDeleteGlossary(row.id);
  }

  function getExportRows() {
    return [
      templateHeaders,
      ...filteredRows.map((row) => [
        row.glossaryName,
        row.businessDomain,
        row.definition,
        row.statisticalScope,
        row.dataSource,
        row.note,
      ]),
    ];
  }

  async function handleDownloadTemplate() {
    const rowsToExport = [
      templateHeaders,
      [
        "支付用户",
        "交易",
        "统计周期内至少发生一次有效支付的去重用户",
        "仅包含有效支付订单，按自然日统计",
        "交易事实表 / 支付流水表",
        "用于交易经营分析",
      ],
    ];
    try {
      setExporting(true);
      setImportError(null);
      await downloadXlsx("业务口径导入模板.xlsx", rowsToExport);
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
      await downloadXlsx("业务口径列表.xlsx", getExportRows());
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

      const glossaryByName = new Map(glossaries.map((item) => [item.glossary_name, item] as const));
      const payloads: ImportPayloadItem[] = [];
      const validationIssues: ImportIssue[] = [];
      const seenNames = new Set<string>();

      for (let lineIndex = 1; lineIndex < rows.length; lineIndex += 1) {
        const cells = [...rows[lineIndex]];
        if (!cells.some((cell) => cell.trim())) {
          continue;
        }
        while (cells.length < templateHeaders.length) {
          cells.push("");
        }
        const [glossaryName, rawBusinessDomain, definition, statisticalScope, dataSource, note] = cells.map((cell) => cell.trim());
        const businessDomain = rawBusinessDomain || "其他";
        const existingGlossary = glossaryByName.get(glossaryName);
        const nameKey = glossaryName;

        if (!glossaryName || !definition) {
          validationIssues.push({
            rowNo: lineIndex + 1,
            glossaryName,
            businessDomain,
            reason: "必填字段为空",
          });
          continue;
        }
        if (!existingGlossary && seenNames.has(nameKey)) {
          validationIssues.push({
            rowNo: lineIndex + 1,
            glossaryName,
            businessDomain,
            reason: `导入文件内口径名称重复：${glossaryName}`,
          });
          continue;
        }

        seenNames.add(nameKey);
        const now = new Date().toISOString();
        payloads.push({
          rowNo: lineIndex + 1,
          existingGlossaryId: existingGlossary?.id,
          payload: {
            id: existingGlossary?.id ?? Date.now() + lineIndex,
            glossary_name: glossaryName,
            business_domain: businessDomain,
            company_name: existingGlossary?.company_name ?? null,
            definition,
            statistical_scope: statisticalScope || null,
            data_source: dataSource || null,
            note: note || null,
            project_ids: existingGlossary?.project_ids ?? [],
            project_names: existingGlossary?.project_names ?? [],
            created_at: existingGlossary?.created_at ?? now,
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
        `已解析文件：${file.name}。待确认导入 ${payloads.length} 条，其中新增 ${payloads.filter((item) => !item.existingGlossaryId).length} 条，更新 ${payloads.filter((item) => item.existingGlossaryId).length} 条，失败 ${validationIssues.length} 条。`,
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
          if (item.existingGlossaryId) {
            await onImportUpdateGlossary(item.existingGlossaryId, item.payload);
            updatedCount += 1;
          } else {
            await onImportGlossary(item.payload);
            createdCount += 1;
          }
          successCount += 1;
        } catch (error) {
          executionIssues.push({
            rowNo: item.rowNo,
            glossaryName: item.payload.glossary_name,
            businessDomain: item.payload.business_domain,
            reason: error instanceof Error ? error.message : "接口保存失败",
          });
        }
      }

      if (successCount > 0) {
        await onReloadGlossaries();
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
    { key: "glossaryName", label: "口径名称", type: "text", value: formValues.glossaryName, disabled: true },
    { key: "businessDomain", label: "业务域", type: "text", value: formValues.businessDomain, disabled: true },
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
      )) : <div className="empty-box">当前口径适用于全部项目或未指定项目。</div>,
    },
    { key: "definition", label: "口径定义", type: "readonly-text", value: formValues.definition, fullWidth: true },
    { key: "statisticalScope", label: "统计范围", type: "readonly-text", value: formValues.statisticalScope, fullWidth: true },
    { key: "dataSource", label: "数据来源", type: "readonly-text", value: formValues.dataSource, fullWidth: true },
    { key: "note", label: "备注", type: "readonly-text", value: formValues.note, fullWidth: true },
  ], [formValues.businessDomain, formValues.companyName, formValues.dataSource, formValues.definition, formValues.glossaryName, formValues.note, formValues.statisticalScope, selectedRow?.projectNames]);

  const formFields = useMemo<EntityFieldSchema[]>(() => [
    {
      key: "glossaryName",
      label: "口径名称 *",
      type: "text",
      value: formValues.glossaryName,
      placeholder: "请输入口径名称",
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, glossaryName: value })); },
    },
    {
      key: "businessDomain",
      label: "业务域 *",
      type: "select",
      value: formValues.businessDomain,
      options: businessDomainOptions.map((item) => ({ label: item, value: item })),
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, businessDomain: value })); },
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
      )) : <div className="empty-box">{formValues.companyName ? "当前公司暂无项目。" : "未选择公司时默认为通用口径。"}</div>,
    },
    {
      key: "definition",
      label: "口径定义 *",
      type: "textarea",
      value: formValues.definition,
      placeholder: "请输入口径定义",
      fullWidth: true,
      onChange: (value) => { setFormError(null); setFormValues((current) => ({ ...current, definition: value })); },
    },
    {
      key: "statisticalScope",
      label: "统计范围",
      type: "textarea",
      value: formValues.statisticalScope,
      placeholder: "选填",
      fullWidth: true,
      onChange: (value) => setFormValues((current) => ({ ...current, statisticalScope: value })),
    },
    {
      key: "dataSource",
      label: "数据来源",
      type: "textarea",
      value: formValues.dataSource,
      placeholder: "选填",
      fullWidth: true,
      onChange: (value) => setFormValues((current) => ({ ...current, dataSource: value })),
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
  ], [businessDomainOptions, companyOptions, formValues.businessDomain, formValues.companyName, formValues.dataSource, formValues.definition, formValues.glossaryName, formValues.note, formValues.projectIds, formValues.statisticalScope, scopedProjects]);

  return (
    <>
      <EntityManagementPage
        columns={[
          textColumn<GlossaryRow>("口径名称", (row) => row.glossaryName),
          textColumn<GlossaryRow>("业务域", (row) => row.businessDomain),
          textColumn<GlossaryRow>("所属公司", (row) => row.companyName),
          textColumn<GlossaryRow>("适用项目", (row) => (row.projectNames.length ? row.projectNames.join("、") : "全部项目")),
          textColumn<GlossaryRow>("数据来源", (row) => row.dataSource || "-"),
        ]}
        detailTitle="口径详情"
        emptyText="未查询到匹配的业务口径。"
        formError={formError}
        historyTitle="更新记录"
        detailMeta={`修改时间：${selectedRow?.updatedAt ?? "-"}`}
        keyword={keyword}
        listTitle="业务口径列表"
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
              key: "glossaryName",
              type: "text",
              placeholder: "请输入口径名称",
              value: draftFilters.glossaryName,
              onChange: (value) => {
                setKeyword(value);
                setDraftFilters((current) => ({ ...current, glossaryName: value }));
              },
            },
            {
              key: "businessDomain",
              type: "select",
              value: draftFilters.businessDomain,
              options: withDefaultOption("全部业务域", businessDomainFilterOptions),
              onChange: (value) => setDraftFilters((current) => ({ ...current, businessDomain: value })),
            },
            {
              key: "companyName",
              type: "select",
              value: draftFilters.companyName,
              options: withDefaultOption("全部所属公司", companyFilterOptions),
              onChange: (value) => setDraftFilters((current) => ({ ...current, companyName: value })),
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
        searchPlaceholder="请输入口径名称"
        submitDisabled={!formValues.glossaryName.trim() || !formValues.definition.trim()}
        submitting={submitting}
      />

      <ImportExportDialog
        createCount={preparedImport ? preparedImport.payloads.filter((item) => !item.existingGlossaryId).length : 0}
        description="支持导入 XLSX 或 CSV 文件，导入时按口径名称自动识别新增或更新。"
        exporting={exporting}
        failCount={preparedImport ? preparedImport.validationIssues.length : importIssues.length}
        importError={importError}
        importIssues={importIssues}
        importing={importing}
        importResult={importResult}
        issueKey={(issue) => `${issue.rowNo}-${issue.glossaryName}-${issue.reason}`}
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
          { key: "glossaryName", header: "口径名称", render: (item) => item.payload.glossary_name },
          { key: "businessDomain", header: "业务域", render: (item) => item.payload.business_domain },
          { key: "definition", header: "口径定义", render: (item) => item.payload.definition },
          { key: "action", header: "操作类型", render: (item) => (item.existingGlossaryId ? "更新" : "新增") },
        ]}
        previewRowKey={(item) => `${item.rowNo}-${item.payload.glossary_name}`}
        previewRows={preparedImport?.payloads.slice(0, 6) ?? []}
        renderIssue={(issue) => (
          <>
            <span>第 {issue.rowNo} 行</span>
            <strong>{issue.glossaryName || "-"}</strong>
            <em>{issue.reason}</em>
          </>
        )}
        templateHeaders={templateHeaders}
        title="导入业务口径"
        updateCount={preparedImport ? preparedImport.payloads.filter((item) => item.existingGlossaryId).length : 0}
        visible={showImportDialog}
      />

    </>
  );
}
