import { useEffect, useMemo, useState } from "react";

import { EntityHistoryList } from "../../components/EntityHistoryList";
import { EntityFormRenderer, type EntityFieldSchema } from "../../components/EntityFormRenderer";
import { EntityManagementPage } from "../../components/EntityManagementPage";
import { EntitySearchRenderer, type SearchFieldSchema } from "../../components/EntitySearchRenderer";
import { textColumn } from "../../components/EntityTableColumns";
import { useEntityForm } from "../../hooks/useEntityForm";
import { apiGet } from "../../services/api";
import { useManagementList } from "../../hooks/useManagementList";
import type { EntityHistoryEntry, Environment, WorkspaceProject } from "../../types/api";
import { withDefaultOption } from "../../utils/formOptions";

interface ProjectManagementPageProps {
  companyOptions: string[];
  projects: WorkspaceProject[];
  environments: Environment[];
  onCreateProject: (row: WorkspaceProject) => Promise<boolean>;
  onUpdateProject: (projectId: string, row: WorkspaceProject) => Promise<boolean>;
  onDeleteProject: (projectId: string) => Promise<boolean>;
}

type ProjectRow = {
  id: string;
  projectName: string;
  companyName: string;
  environmentCount: number;
  environmentNames: string[];
  networkModes: string[];
  description: string;
  environmentIds: number[];
  updatedAt: string;
};

export function ProjectManagementPage(props: ProjectManagementPageProps) {
  const { companyOptions, projects, environments, onCreateProject, onUpdateProject, onDeleteProject } = props;
  const [keyword, setKeyword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [historyItems, setHistoryItems] = useState<EntityHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const projectRows = useMemo<ProjectRow[]>(() => projects.map((project) => {
    const linkedEnvironments = environments.filter(
      (item) => item.company_name === project.companyName && project.environmentIds.includes(item.id),
    );

    return {
      id: project.id,
      projectName: project.name,
      companyName: project.companyName,
      environmentCount: linkedEnvironments.length,
      environmentNames: linkedEnvironments.map((item) => item.environment_name),
      networkModes: [...new Set(linkedEnvironments.map((item) => item.network_mode))],
      description: project.description,
      environmentIds: project.environmentIds,
      updatedAt: project.updatedAt,
    };
  }), [environments, projects]);

  const { draftFilters, pagedRows, pagination, setDraftFilters, applySearch, resetSearch } = useManagementList({
    rows: projectRows,
    initialFilters: {
      projectName: "",
      companyName: "",
    },
    filterRows: (rows, filters) => {
      const projectName = filters.projectName.trim().toLowerCase();
      const companyName = filters.companyName.trim().toLowerCase();
      return rows.filter(
        (item) =>
          (!projectName || item.projectName.toLowerCase().includes(projectName)) &&
          (!companyName || item.companyName.toLowerCase() === companyName),
      );
    },
  });

  const initialFormValues = useMemo(
    () => ({
      projectName: "",
      companyName: companyOptions[0] ?? "",
      description: "",
      environmentIds: [] as number[],
    }),
    [companyOptions],
  );

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
    rows: projectRows,
    initialValues: initialFormValues,
    getRowId: (row) => row.id,
    mapRowToForm: (row) => ({
      projectName: row.projectName,
      companyName: row.companyName,
      description: row.description,
      environmentIds: row.environmentIds,
    }),
  });

  const scopedEnvironmentOptions = useMemo(
    () => environments.filter((item) => item.company_name === formValues.companyName),
    [environments, formValues.companyName],
  );

  const companyFilterOptions = useMemo(
    () => Array.from(new Set(projectRows.map((item) => item.companyName).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [projectRows],
  );

  function getHistoryPath(row: any) {
    return `/projects/${encodeURIComponent(row.id)}/history`;
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
    setKeyword(draftFilters.projectName);
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

  function toggleEnvironment(environmentId: number) {
    setFormError(null);
    setFormValues((current) => ({
      ...current,
      environmentIds: current.environmentIds.includes(environmentId)
        ? current.environmentIds.filter((id) => id !== environmentId)
        : [...current.environmentIds, environmentId],
    }));
  }

  function handleCompanyChange(companyName: string) {
    setFormError(null);
    setFormValues((current) => ({
      ...current,
      companyName,
      environmentIds: current.environmentIds.filter((environmentId) =>
        environments.some((environment) => environment.id === environmentId && environment.company_name === companyName),
      ),
    }));
  }

  function validateForm() {
    const projectName = formValues.projectName.trim();
    const companyName = formValues.companyName.trim();
    if (!projectName) {
      return "项目名称不能为空";
    }
    if (!companyName) {
      return "所属公司不能为空";
    }
    const duplicate = projects.some(
      (item) =>
        item.companyName === companyName &&
        item.name === projectName &&
        item.id !== selectedRowId,
    );
    if (duplicate) {
      return "同公司下项目名称已存在";
    }
    return null;
  }

  async function handleCreateSubmit() {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    const projectName = formValues.projectName.trim();
    setSubmitting(true);
    const success = await onCreateProject({
      id: `proj-${Date.now()}`,
      name: projectName,
      companyName: formValues.companyName.trim(),
      description: formValues.description.trim(),
      environmentIds: formValues.environmentIds,
      updatedAt: new Date().toISOString(),
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
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    const projectName = formValues.projectName.trim();
    setSubmitting(true);
    const success = await onUpdateProject(selectedRow.id, {
      id: selectedRow.id,
      name: projectName,
      companyName: formValues.companyName.trim(),
      description: formValues.description.trim(),
      environmentIds: formValues.environmentIds,
      updatedAt: selectedRow.updatedAt,
    });
    setSubmitting(false);
    if (!success) {
      return;
    }
    resetListView();
  }

  function handleDelete(row: ProjectRow) {
    const relationTip = row.environmentCount
      ? `该项目当前关联 ${row.environmentCount} 个环境，删除后会一并解绑这些关联。`
      : "该项目当前没有关联环境。";

    if (!window.confirm(`确认删除项目“${row.projectName}”吗？

${relationTip}`)) {
      return;
    }

    void onDeleteProject(row.id);
  }

  const readonlyFields = useMemo<EntityFieldSchema[]>(() => [
    { key: "projectName", label: "项目名称", type: "text", value: formValues.projectName, disabled: true },
    { key: "companyName", label: "所属公司", type: "text", value: formValues.companyName, disabled: true },
    {
      key: "environments",
      label: "关联环境",
      type: "readonly-relation",
      fullWidth: true,
      children: scopedEnvironmentOptions.length ? scopedEnvironmentOptions.map((environment) => (
        <label className="relation-option" key={environment.id}>
          <input checked={formValues.environmentIds.includes(environment.id)} disabled type="checkbox" />
          <span>{environment.environment_name}</span>
        </label>
      )) : <div className="empty-box">当前公司暂无环境。</div>,
    },
    { key: "description", label: "项目说明", type: "readonly-text", value: formValues.description, fullWidth: true },
  ], [formValues.companyName, formValues.description, formValues.environmentIds, formValues.projectName, scopedEnvironmentOptions]);

  const formFields = useMemo<EntityFieldSchema[]>(() => [
    {
      key: "projectName",
      label: "项目名称 *",
      type: "text",
      value: formValues.projectName,
      placeholder: "请输入项目名称",
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, projectName: value }));
      },
    },
    {
      key: "companyName",
      label: "所属公司 *",
      type: "select",
      value: formValues.companyName,
      options: companyOptions.map((companyName) => ({ label: companyName, value: companyName })),
      onChange: handleCompanyChange,
    },
    {
      key: "environments",
      label: "关联环境",
      type: "relation",
      fullWidth: true,
      children: scopedEnvironmentOptions.length ? scopedEnvironmentOptions.map((environment) => (
        <label className="relation-option" key={environment.id}>
          <input
            checked={formValues.environmentIds.includes(environment.id)}
            onChange={() => toggleEnvironment(environment.id)}
            type="checkbox"
          />
          <span>{environment.environment_name}</span>
        </label>
      )) : <div className="empty-box">当前公司暂无环境，请先去环境管理新增。</div>,
    },
    {
      key: "description",
      label: "项目说明",
      type: "textarea",
      value: formValues.description,
      placeholder: "选填",
      fullWidth: true,
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, description: value }));
      },
    },
  ], [companyOptions, formValues.companyName, formValues.description, formValues.environmentIds, formValues.projectName, scopedEnvironmentOptions]);

  return (
    <EntityManagementPage
      columns={[
        textColumn<ProjectRow>("项目名称", (row) => row.projectName),
        textColumn<ProjectRow>("所属公司", (row) => row.companyName),
        textColumn<ProjectRow>("关联环境", (row) => row.environmentCount),
        textColumn<ProjectRow>("网络方式", (row) => (row.networkModes.length ? row.networkModes.join(" / ") : "未关联")),
        textColumn<ProjectRow>("项目说明", (row) => row.description || "-"),
      ]}
      detailTitle="项目详情"
      emptyText="未查询到匹配的项目数据。"
      formError={formError}
      historyTitle="更新记录"
      detailMeta={`修改时间：${selectedRow?.updatedAt ?? "-"}`}
      submitting={submitting}
      keyword={keyword}
      listTitle="项目数据列表"
      mode={mode}
      onBack={resetListView}
      onCreate={() => openCreateMode(initialFormValues)}
      onDelete={handleDelete}
      getDeleteDisabledReason={(row) => row.environmentCount ? `该项目当前关联 ${row.environmentCount} 个环境，删除后会自动解绑。` : "该项目当前没有关联环境，可直接删除。"}
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
            key: "projectName",
            type: "text",
            placeholder: "请输入项目名称",
            value: draftFilters.projectName,
            onChange: (value) => {
              setKeyword(value);
              setDraftFilters((current) => ({ ...current, projectName: value }));
            },
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
      renderHistory={() => (
        historyLoading ? (
          <div className="loading-box">正在加载更新记录...</div>
        ) : (
          <EntityHistoryList
            items={historyItems.length ? historyItems.map((item) => ({ title: item.title, description: item.description })) : [{ title: "暂无记录", description: "当前实体还没有更新记录。" }]}
          />
        )
      )}
      rowKey={(row) => row.id}
      rows={pagedRows}
      searchPlaceholder="请输入项目名称"
      submitDisabled={!formValues.projectName.trim() || !formValues.companyName.trim()}
    />
  );
}
