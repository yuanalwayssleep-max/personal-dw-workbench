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

interface EnvironmentRoutingPageProps {
  companyOptions: string[];
  environments: Environment[];
  projects: WorkspaceProject[];
  loading: boolean;
  onCreateEnvironment: (row: Environment, projectIds: string[]) => Promise<boolean>;
  onUpdateEnvironment: (environmentId: number, row: Environment, projectIds: string[]) => Promise<boolean>;
  onDeleteEnvironment: (environmentId: number) => Promise<boolean>;
}

type EnvironmentRow = {
  id: number;
  companyName: string;
  environmentName: string;
  environmentType: string;
  accountName: string;
  accountPassword: string;
  queryPortalUrl: string;
  dialect: string;
  networkMode: string;
  timezone: string;
  description: string;
  projectCount: number;
  projectNames: string[];
  environmentCode: string;
  updatedAt: string;
};

export function EnvironmentRoutingPage(props: EnvironmentRoutingPageProps) {
  const { companyOptions, environments, projects, loading, onCreateEnvironment, onUpdateEnvironment, onDeleteEnvironment } = props;
  const [keyword, setKeyword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [historyItems, setHistoryItems] = useState<EntityHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const environmentRows = useMemo<EnvironmentRow[]>(() => environments.map((item) => {
    const linkedProjects = projects.filter(
      (project) => project.companyName === item.company_name && project.environmentIds.includes(item.id),
    );

    return {
      id: item.id,
      companyName: item.company_name,
      environmentName: item.environment_name,
      environmentType: item.environment_type,
      accountName: item.account_name ?? "",
      accountPassword: item.account_password ?? "",
      queryPortalUrl: item.query_portal_url ?? "",
      dialect: item.dialect,
      networkMode: item.network_mode,
      timezone: item.timezone,
      description: item.description ?? "",
      projectCount: linkedProjects.length,
      projectNames: linkedProjects.map((project) => project.name),
      environmentCode: item.environment_code,
      updatedAt: item.updated_at,
    };
  }), [environments, projects]);

  const { draftFilters, pagedRows, pagination, setDraftFilters, applySearch, resetSearch } = useManagementList({
    rows: environmentRows,
    initialFilters: {
      companyName: "",
      environmentName: "",
      environmentType: "",
      networkMode: "",
    },
    filterRows: (rows, filters) => {
      const companyName = filters.companyName.trim().toLowerCase();
      const environmentName = filters.environmentName.trim().toLowerCase();
      const environmentType = filters.environmentType.trim().toLowerCase();
      const networkMode = filters.networkMode.trim().toLowerCase();
      return rows.filter(
        (item) =>
          (!companyName || item.companyName.toLowerCase() === companyName) &&
          (!environmentName || item.environmentName.toLowerCase().includes(environmentName)) &&
          (!environmentType || item.environmentType.toLowerCase() === environmentType) &&
          (!networkMode || item.networkMode.toLowerCase() === networkMode),
      );
    },
  });

  const initialFormValues = useMemo(
    () => ({
      companyName: companyOptions[0] ?? "",
      environmentCode: "",
      environmentName: "",
      environmentType: "系统",
      accountName: "",
      accountPassword: "",
      queryPortalUrl: "",
      dialect: "Hive",
      networkMode: "内网访问",
      timezone: "Asia/Shanghai",
      description: "",
      projectIds: [] as string[],
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
    rows: environmentRows,
    initialValues: initialFormValues,
    getRowId: (row) => row.id,
    mapRowToForm: (row) => ({
      companyName: row.companyName,
      environmentCode: row.environmentCode,
      environmentName: row.environmentName,
      environmentType: row.environmentType,
      accountName: row.accountName,
      accountPassword: row.accountPassword,
      queryPortalUrl: row.queryPortalUrl,
      dialect: row.dialect,
      networkMode: row.networkMode,
      timezone: row.timezone,
      description: row.description,
      projectIds: projects
        .filter((item) => item.companyName === row.companyName && item.environmentIds.includes(row.id))
        .map((item) => item.id),
    }),
  });

  const scopedProjectOptions = useMemo(
    () => projects.filter((item) => item.companyName === formValues.companyName),
    [formValues.companyName, projects],
  );

  const companyFilterOptions = useMemo(
    () => Array.from(new Set(environmentRows.map((item) => item.companyName).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [environmentRows],
  );
  const environmentTypeFilterOptions = useMemo(
    () => Array.from(new Set(environmentRows.map((item) => item.environmentType).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [environmentRows],
  );
  const networkModeFilterOptions = useMemo(
    () => Array.from(new Set(environmentRows.map((item) => item.networkMode).filter(Boolean))).sort((left, right) => left.localeCompare(right, "zh-CN")),
    [environmentRows],
  );

  function getHistoryPath(row: any) {
    return `/environments/${row.id}/history`;
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
    setKeyword(draftFilters.environmentName);
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
        projects.some((project) => project.id === projectId && project.companyName === companyName),
      ),
    }));
  }

  function validateForm() {
    const companyName = formValues.companyName.trim();
    const environmentCode = formValues.environmentCode.trim();
    const environmentName = formValues.environmentName.trim();
    const environmentType = formValues.environmentType.trim();
    if (!companyName) {
      return "所属公司不能为空";
    }
    if (!environmentCode) {
      return "环境编码不能为空";
    }
    if (!environmentName) {
      return "环境名称不能为空";
    }
    if (!environmentType) {
      return "环境类型不能为空";
    }
    const duplicateCode = environments.some(
      (item) => item.environment_code === environmentCode && item.id !== selectedRowId,
    );
    if (duplicateCode) {
      return "环境编码已存在";
    }
    const duplicateName = environments.some(
      (item) => item.company_name === companyName && item.environment_name === environmentName && item.id !== selectedRowId,
    );
    if (duplicateName) {
      return "同公司下环境名称已存在";
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
    const success = await onCreateEnvironment(
      {
        id: Date.now(),
        environment_code: formValues.environmentCode.trim(),
        company_name: formValues.companyName.trim(),
        environment_name: formValues.environmentName.trim(),
        environment_type: formValues.environmentType.trim(),
        account_name: formValues.accountName.trim() || null,
        account_password: formValues.accountPassword.trim() || null,
        query_portal_url: formValues.queryPortalUrl.trim() || null,
        network_mode: formValues.networkMode,
        dialect: formValues.dialect,
        timezone: formValues.timezone.trim(),
        description: formValues.description.trim() || null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      formValues.projectIds,
    );
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

    const targetEnvironment = environments.find((item) => item.id === selectedRow.id);
    if (!targetEnvironment) {
      return;
    }

    setSubmitting(true);
    const success = await onUpdateEnvironment(
      selectedRow.id,
      {
        ...targetEnvironment,
        company_name: formValues.companyName.trim(),
        environment_name: formValues.environmentName.trim(),
        environment_type: formValues.environmentType.trim(),
        account_name: formValues.accountName.trim() || null,
        account_password: formValues.accountPassword.trim() || null,
        query_portal_url: formValues.queryPortalUrl.trim() || null,
        network_mode: formValues.networkMode,
        dialect: formValues.dialect,
        timezone: formValues.timezone.trim(),
        description: formValues.description.trim() || null,
        updated_at: new Date().toISOString(),
      },
      formValues.projectIds,
    );
    setSubmitting(false);
    if (!success) {
      return;
    }
    resetListView();
  }

  function handleDelete(row: EnvironmentRow) {
    const relationTip = row.projectCount
      ? `该环境当前关联 ${row.projectCount} 个项目，删除后会一并解绑这些关联。`
      : "该环境当前没有关联项目。";
    const riskTip = "如果该环境下仍有 SQL 资产、运行记录、问题单或知识记录，系统会禁止删除。";

    if (!window.confirm(`确认删除环境“${row.environmentName}”吗？

${relationTip}
${riskTip}`)) {
      return;
    }

    void onDeleteEnvironment(row.id);
  }

  const readonlyFields = useMemo<EntityFieldSchema[]>(() => {
    const maskedPassword = formValues.accountPassword ? "********" : "-";

    return [
      { key: "companyName", label: "公司名称", type: "text", value: formValues.companyName, disabled: true },
      { key: "environmentCode", label: "环境编码", type: "text", value: formValues.environmentCode, disabled: true },
      { key: "environmentName", label: "环境名称", type: "text", value: formValues.environmentName, disabled: true },
      { key: "environmentType", label: "环境类型", type: "text", value: formValues.environmentType, disabled: true },
      { key: "accountName", label: "账号", type: "text", value: formValues.accountName || "-", disabled: true },
      { key: "accountPassword", label: "密码", type: "text", value: maskedPassword, disabled: true },
      {
        key: "queryPortalUrl",
        label: "查询入口",
        type: "readonly-content",
        fullWidth: true,
        content: formValues.queryPortalUrl ? (
          <a className="inline-link" href={formValues.queryPortalUrl} rel="noreferrer" target="_blank">
            {formValues.queryPortalUrl}
          </a>
        ) : (
          <input disabled value="-" />
        ),
      },
      { key: "dialect", label: "数据库", type: "text", value: formValues.dialect, disabled: true },
      { key: "networkMode", label: "网络方式", type: "text", value: formValues.networkMode, disabled: true },
      { key: "timezone", label: "时区", type: "text", value: formValues.timezone, disabled: true },
      {
        key: "projects",
        label: "关联项目",
        type: "readonly-relation",
        fullWidth: true,
        children: scopedProjectOptions.length ? scopedProjectOptions.map((project) => (
          <label className="relation-option" key={project.id}>
            <input checked={formValues.projectIds.includes(project.id)} disabled type="checkbox" />
            <span>{project.name}</span>
          </label>
        )) : <div className="empty-box">当前公司暂无项目。</div>,
      },
      { key: "description", label: "说明", type: "readonly-text", value: formValues.description, fullWidth: true },
    ];
  }, [formValues.accountName, formValues.accountPassword, formValues.companyName, formValues.description, formValues.dialect, formValues.environmentCode, formValues.environmentName, formValues.environmentType, formValues.networkMode, formValues.projectIds, formValues.queryPortalUrl, formValues.timezone, scopedProjectOptions]);

  const formFields = useMemo<EntityFieldSchema[]>(() => [
    {
      key: "companyName",
      label: "公司名称 *",
      type: "select",
      value: formValues.companyName,
      options: companyOptions.map((companyName) => ({ label: companyName, value: companyName })),
      onChange: handleCompanyChange,
    },
    {
      key: "environmentCode",
      label: "环境编码 *",
      type: "text",
      value: formValues.environmentCode,
      placeholder: "请输入环境编码",
      disabled: mode === "edit",
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, environmentCode: value }));
      },
    },
    {
      key: "environmentName",
      label: "环境名称 *",
      type: "text",
      value: formValues.environmentName,
      placeholder: "请输入环境名称",
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, environmentName: value }));
      },
    },
    {
      key: "environmentType",
      label: "环境类型 *",
      type: "select",
      value: formValues.environmentType,
      options: [
        { label: "系统", value: "系统" },
        { label: "数据库连接", value: "数据库连接" },
      ],
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, environmentType: value }));
      },
    },
    {
      key: "accountName",
      label: "账号",
      type: "text",
      value: formValues.accountName,
      placeholder: "请输入账号",
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, accountName: value }));
      },
    },
    {
      key: "accountPassword",
      label: "密码",
      type: "text",
      value: formValues.accountPassword,
      placeholder: "请输入密码",
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, accountPassword: value }));
      },
    },
    {
      key: "queryPortalUrl",
      label: "查询入口 URL",
      type: "text",
      value: formValues.queryPortalUrl,
      placeholder: "请输入环境查询页面地址",
      fullWidth: true,
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, queryPortalUrl: value }));
      },
    },
    {
      key: "dialect",
      label: "数据库 *",
      type: "select",
      value: formValues.dialect,
      options: [
        { label: "Hive", value: "Hive" },
        { label: "Doris", value: "Doris" },
        { label: "MySQL", value: "MySQL" },
        { label: "ClickHouse", value: "ClickHouse" },
      ],
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, dialect: value }));
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
      key: "timezone",
      label: "时区 *",
      type: "text",
      value: formValues.timezone,
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, timezone: value }));
      },
    },
    {
      key: "projects",
      label: "关联项目",
      type: "relation",
      fullWidth: true,
      children: scopedProjectOptions.length ? scopedProjectOptions.map((project) => (
        <label className="relation-option" key={project.id}>
          <input checked={formValues.projectIds.includes(project.id)} onChange={() => toggleProject(project.id)} type="checkbox" />
          <span>{project.name}</span>
        </label>
      )) : <div className="empty-box">当前公司暂无项目，请先去项目管理新增。</div>,
    },
    {
      key: "description",
      label: "说明",
      type: "textarea",
      value: formValues.description,
      placeholder: "选填",
      fullWidth: true,
      onChange: (value) => {
        setFormError(null);
        setFormValues((current) => ({ ...current, description: value }));
      },
    },
  ], [companyOptions, formValues.accountName, formValues.accountPassword, formValues.companyName, formValues.description, formValues.dialect, formValues.environmentCode, formValues.environmentName, formValues.environmentType, formValues.networkMode, formValues.projectIds, formValues.queryPortalUrl, formValues.timezone, mode, scopedProjectOptions]);

  if (loading && !environments.length) {
    return <div className="loading-box">正在加载环境数据...</div>;
  }

  return (
    <EntityManagementPage
      columns={[
        textColumn<EnvironmentRow>("公司名称", (row) => row.companyName),
        textColumn<EnvironmentRow>("环境名称", (row) => row.environmentName),
        textColumn<EnvironmentRow>("环境类型", (row) => row.environmentType),
        textColumn<EnvironmentRow>("数据库", (row) => row.dialect),
        textColumn<EnvironmentRow>("网络方式", (row) => row.networkMode),
      ]}
      detailTitle="环境详情"
      emptyText="未查询到匹配的环境数据。"
      formError={formError}
      historyTitle="更新记录"
      detailMeta={`修改时间：${selectedRow?.updatedAt ?? "-"}`}
      submitting={submitting}
      keyword={keyword}
      listTitle="环境数据列表"
      mode={mode}
      onBack={resetListView}
      onCreate={() => openCreateMode(initialFormValues)}
      onDelete={handleDelete}
      getDeleteDisabledReason={(row) => row.projectCount ? `该环境当前关联 ${row.projectCount} 个项目，删除后会自动解绑；若仍有 SQL/问题/知识数据，后端会禁止删除。` : "删除前系统仍会校验是否存在 SQL、问题单、知识等依赖数据。"}
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
            type: "select",
            value: draftFilters.companyName,
            options: withDefaultOption("全部所属公司", companyFilterOptions),
            onChange: (value) => setDraftFilters((current) => ({ ...current, companyName: value })),
          },
          {
            key: "environmentName",
            type: "text",
            placeholder: "请输入环境名称",
            value: draftFilters.environmentName,
            onChange: (value) => {
              setKeyword(value);
              setDraftFilters((current) => ({ ...current, environmentName: value }));
            },
          },
          {
            key: "environmentType",
            type: "select",
            value: draftFilters.environmentType,
            options: withDefaultOption("全部环境类型", environmentTypeFilterOptions),
            onChange: (value) => setDraftFilters((current) => ({ ...current, environmentType: value })),
          },
          {
            key: "networkMode",
            type: "select",
            value: draftFilters.networkMode,
            options: withDefaultOption("全部网络方式", networkModeFilterOptions),
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
      rowKey={(row) => row.id}
      rows={pagedRows}
      searchPlaceholder="请输入公司、环境、类型或网络方式"
      submitDisabled={!formValues.companyName.trim() || !formValues.environmentCode.trim() || !formValues.environmentName.trim() || !formValues.environmentType.trim() || !formValues.dialect.trim() || !formValues.networkMode.trim() || !formValues.timezone.trim()}
    />
  );
}
