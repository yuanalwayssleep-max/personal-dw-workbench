import { useEffect, useMemo, useState } from "react";

import { EntityHistoryList } from "../../components/EntityHistoryList";
import { EntityFormRenderer, type EntityFieldSchema } from "../../components/EntityFormRenderer";
import { EntityManagementPage } from "../../components/EntityManagementPage";
import { EntitySearchRenderer, type SearchFieldSchema } from "../../components/EntitySearchRenderer";
import { textColumn } from "../../components/EntityTableColumns";
import { useEntityForm } from "../../hooks/useEntityForm";
import { apiGet } from "../../services/api";
import { useManagementList } from "../../hooks/useManagementList";
import type { EntityHistoryEntry, ManagedCompany } from "../../types/api";
import { withDefaultOption } from "../../utils/formOptions";

interface SystemSettingsPageProps {
  companyRows: ManagedCompany[];
  onCreateCompany: (row: ManagedCompany) => Promise<boolean>;
  onUpdateCompany: (previousCompanyName: string, row: ManagedCompany) => Promise<boolean>;
  onDeleteCompany: (companyName: string) => Promise<boolean>;
}

export function SystemSettingsPage(props: SystemSettingsPageProps) {
  const { companyRows, onCreateCompany, onUpdateCompany, onDeleteCompany } = props;
  const [keyword, setKeyword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [historyItems, setHistoryItems] = useState<EntityHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const initialFormValues = useMemo(
    () => ({
      companyName: "",
      networkMode: "内网访问",
      note: "",
    }),
    [],
  );

  const { draftFilters, pagedRows, pagination, setDraftFilters, applySearch, resetSearch } = useManagementList({
    rows: companyRows,
    initialFilters: {
      companyName: "",
      networkMode: "",
    },
    filterRows: (rows, filters) => {
      const companyName = filters.companyName.trim().toLowerCase();
      const networkMode = filters.networkMode.trim().toLowerCase();
      return rows.filter(
        (item) =>
          (!companyName || item.companyName.toLowerCase().includes(companyName)) &&
          (!networkMode || item.networkModes.some((mode) => mode.toLowerCase() === networkMode)),
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
    rows: companyRows,
    initialValues: initialFormValues,
    getRowId: (row) => row.companyName,
    mapRowToForm: (row) => ({
      companyName: row.companyName,
      networkMode: row.networkModes[0] ?? "内网访问",
      note: row.note ?? "",
    }),
  });

  const networkModeOptions = useMemo(
    () => Array.from(new Set(companyRows.flatMap((item) => item.networkModes).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [companyRows],
  );

  function getHistoryPath(row: any) {
    return `/companies/${encodeURIComponent(row.companyName)}/history`;
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
    setKeyword(draftFilters.companyName);
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

  function validateCompanyName() {
    const companyName = formValues.companyName.trim();
    if (!companyName) {
      return "公司名称不能为空";
    }

    const duplicate = companyRows.some(
      (item) => item.companyName === companyName && item.companyName !== selectedRowId,
    );
    if (duplicate) {
      return "公司名称已存在";
    }

    return null;
  }

  async function handleCreateSubmit() {
    const error = validateCompanyName();
    if (error) {
      setFormError(error);
      return;
    }

    const companyName = formValues.companyName.trim();
    setSubmitting(true);
    const success = await onCreateCompany({
      companyName,
      projectCount: 0,
      environmentCount: 0,
      networkModes: [formValues.networkMode.trim()],
      projectNames: [],
      note: formValues.note.trim(),
      updatedAt: new Date().toISOString(),
    });
    setSubmitting(false);
    if (!success) {
      return;
    }
    setFormError(null);
    resetListView();
  }

  async function handleEditSubmit() {
    if (!selectedRow) {
      return;
    }

    const error = validateCompanyName();
    if (error) {
      setFormError(error);
      return;
    }

    const companyName = formValues.companyName.trim();
    setSubmitting(true);
    const success = await onUpdateCompany(selectedRow.companyName, {
      ...selectedRow,
      companyName,
      networkModes: [formValues.networkMode.trim()],
      note: formValues.note.trim(),
    });
    setSubmitting(false);
    if (!success) {
      return;
    }
    setFormError(null);
    resetToList({ companyName: "", networkMode: "内网访问", note: "" });
    handleResetSearch();
  }

  function handleDelete(row: ManagedCompany) {
    if (!window.confirm(`确认删除公司“${row.companyName}”吗？`)) {
      return;
    }

    void onDeleteCompany(row.companyName);
  }

  const readonlyFields = useMemo<EntityFieldSchema[]>(() => [
    { key: "companyName", label: "公司名称", type: "text", value: formValues.companyName, disabled: true },
    { key: "networkMode", label: "网络方式", type: "text", value: formValues.networkMode, disabled: true },
    { key: "note", label: "备注", type: "readonly-text", value: formValues.note, fullWidth: true },
  ], [formValues.companyName, formValues.networkMode, formValues.note]);

  const formFields = useMemo<EntityFieldSchema[]>(() => [
    {
      key: "companyName",
      label: "公司名称 *",
      type: "text",
      value: formValues.companyName,
      placeholder: "请输入公司名称",
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, companyName: value }));
      },
    },
    {
      key: "networkMode",
      label: "网络方式 *",
      type: "select",
      value: formValues.networkMode,
      options: [
        { label: "内网访问", value: "内网访问" },
        { label: "平台访问", value: "平台访问" },
        { label: "代理访问", value: "代理访问" },
      ],
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, networkMode: value }));
      },
    },
    {
      key: "note",
      label: "备注",
      type: "textarea",
      value: formValues.note,
      placeholder: "选填",
      fullWidth: true,
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, note: value }));
      },
    },
  ], [formValues.companyName, formValues.networkMode, formValues.note]);

  return (
    <EntityManagementPage
      columns={[
        textColumn<ManagedCompany>("公司名称", (row) => row.companyName),
        textColumn<ManagedCompany>("项目数量", (row) => row.projectCount),
        textColumn<ManagedCompany>("环境数量", (row) => row.environmentCount),
        textColumn<ManagedCompany>("网络方式", (row) => (row.networkModes.length ? row.networkModes.join(" / ") : "未配置")),
        textColumn<ManagedCompany>("关联项目", (row) => (row.projectNames.length ? row.projectNames.join("、") : "暂无项目")),
      ]}
      detailTitle="公司详情"
      emptyText="未查询到匹配的公司数据。"
      formError={formError}
      historyTitle="更新记录"
      detailMeta={`修改时间：${selectedRow?.updatedAt ?? "-"}`}
      submitting={submitting}
      keyword={keyword}
      listTitle="公司数据列表"
      mode={mode}
      onBack={resetListView}
      onCreate={() => openCreateMode(initialFormValues)}
      onDelete={handleDelete}
      getDeleteDisabled={(row) => row.projectCount > 0 || row.environmentCount > 0}
      getDeleteDisabledReason={(row) => `公司“${row.companyName}”下仍有 ${row.projectCount} 个项目、${row.environmentCount} 个环境，不能删除。`}
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
            key: "companyName",
            type: "text",
            placeholder: "请输入公司名称",
            value: draftFilters.companyName,
            onChange: (value) => {
              setKeyword(value);
              setDraftFilters((current) => ({ ...current, companyName: value }));
            },
          },
          {
            key: "networkMode",
            type: "select",
            value: draftFilters.networkMode,
            options: withDefaultOption("全部网络方式", networkModeOptions),
            onChange: (value) => setDraftFilters((current) => ({ ...current, networkMode: value })),
          },
        ];
        return <EntitySearchRenderer fields={searchFields} />;
      }}
      onSubmit={mode === "create" ? handleCreateSubmit : handleEditSubmit}
      renderDetail={() => <EntityFormRenderer fields={readonlyFields} />}
      renderForm={() => <EntityFormRenderer fields={formFields} />}
      renderHistory={() => (
        historyLoading ? (
          <div className="loading-box">正在加载更新记录...</div>
        ) : (
          <EntityHistoryList
            items={historyItems.length ? historyItems.map((item) => ({ title: item.title, description: item.description })) : [{ title: "暂无记录", description: "当前实体还没有更新记录。" }]}
          />
        )
      )}
      rowKey={(row) => row.companyName}
      rows={pagedRows}
      searchPlaceholder="请输入公司名称"
      submitDisabled={!formValues.companyName.trim() || !formValues.networkMode.trim()}
    />
  );
}
