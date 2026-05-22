import type { ReactNode } from "react";

import type { Environment, WorkspaceProject } from "../types/api";

type ViewKey = "requirement" | "home" | "sql" | "incident" | "support" | "settings";
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

type SectionItem = {
  key: TabKey;
  label: string;
};

type Section = {
  key: ViewKey;
  label: string;
  icon: ReactNode;
  items: SectionItem[];
};

type TabItem = {
  key: TabKey;
  label: string;
};

interface AppShellProps {
  activeView: ViewKey;
  activeTab: TabKey;
  expandedView: ViewKey | null;
  onToggleView: (view: ViewKey) => void;
  onSelectTab: (tab: TabKey) => void;
  openTabs: TabItem[];
  onCloseTab: (tab: TabKey) => void;
  onToggleCollapse: () => void;
  sidebarCollapsed: boolean;
  companies: string[];
  activeCompanyName: string;
  onSelectCompany: (companyName: string) => void;
  projects: WorkspaceProject[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  environments: Environment[];
  children: ReactNode;
}

const sections: Section[] = [
  {
    key: "home",
    label: "工作台",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4.5 10.5 12 4l7.5 6.5" />
        <path d="M6.5 9.5V20h11V9.5" />
        <path d="M10 20v-5h4v5" />
      </svg>
    ),
    items: [],
  },
  {
    key: "requirement",
    label: "需求分析",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 5.5h12" />
        <path d="M6 10.5h8" />
        <path d="M6 15.5h6" />
        <circle cx="17.5" cy="15.5" r="2.5" />
      </svg>
    ),
    items: [],
  },
  {
    key: "sql",
    label: "模型开发",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 7 4 12l4 5" />
        <path d="M16 7 20 12l-4 5" />
        <path d="M13.5 5 10.5 19" />
      </svg>
    ),
    items: [
      { key: "model_catalog", label: "模型管理" },
      { key: "model_sql", label: "SQL管理" },
    ],
  },
  {
    key: "incident",
    label: "问题溯源",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 18h14" />
        <path d="M7.5 15.5 11 12l2.5 2.5 4-5" />
        <circle cx="7.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="11" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="13.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    items: [
      { key: "cards", label: "问题卡片" },
      { key: "timeline", label: "回溯时间线" },
    ],
  },
  {
    key: "support",
    label: "知识库",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3.5 19 7.5v9L12 20.5 5 16.5v-9L12 3.5Z" />
        <path d="M12 3.5v17" />
        <path d="M5 7.5 12 12l7-4.5" />
      </svg>
    ),
    items: [
      { key: "standard", label: "规范标准" },
      { key: "business", label: "业务口径" },
      { key: "metric", label: "指标体系" },
    ],
  },
  {
    key: "settings",
    label: "系统设置",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5Z" />
        <path d="M19 12a7.8 7.8 0 0 0-.08-1l2.03-1.58-1.92-3.32-2.42.74a8.3 8.3 0 0 0-1.72-1l-.4-2.5h-3.84l-.4 2.5a8.3 8.3 0 0 0-1.72 1l-2.42-.74-1.92 3.32L5.08 11A7.8 7.8 0 0 0 5 12c0 .34.03.67.08 1l-2.03 1.58 1.92 3.32 2.42-.74c.53.42 1.11.76 1.72 1l.4 2.5h3.84l.4-2.5c.61-.24 1.19-.58 1.72-1l2.42.74 1.92-3.32L18.92 13c.05-.33.08-.66.08-1Z" />
      </svg>
    ),
    items: [
      { key: "settings", label: "公司管理" },
      { key: "routing", label: "环境管理" },
      { key: "project_management", label: "项目管理" },
    ],
  },
];

export function AppShell(props: AppShellProps) {
  const {
    activeView,
    activeTab,
    expandedView,
    onToggleView,
    onSelectTab,
    openTabs,
    onCloseTab,
    onToggleCollapse,
    sidebarCollapsed,
    companies,
    activeCompanyName,
    onSelectCompany,
    projects,
    activeProjectId,
    onSelectProject,
    children,
  } = props;

  return (
    <div className="app-shell">
      <div className="shell-stack">
        <section className="workbench-toolbar full-width">
          <strong className="studio-title">仙女数仓工作室</strong>
          <div className="project-switcher project-switcher-cascade">
            <label className="switch-field">
              <span>公司</span>
              <select value={activeCompanyName} onChange={(event) => onSelectCompany(event.target.value)}>
                {companies.map((companyName) => (
                  <option key={companyName} value={companyName}>
                    {companyName}
                  </option>
                ))}
              </select>
            </label>
            <label className="switch-field">
              <span>项目</span>
              <select
                disabled={!projects.length}
                value={activeProjectId ?? ""}
                onChange={(event) => onSelectProject(event.target.value || null)}
              >
                {!projects.length ? <option value="">当前公司暂无项目</option> : null}
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
        <div className={`app-grid workspace-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <aside className="accordion-sidebar">
            <nav className="accordion-menu">
              {sections.map((section) => {
                const isExpanded = section.key === "home" || expandedView === section.key;
                const isActiveSection = activeView === section.key;

                return (
                  <div className={`accordion-group ${isExpanded ? "expanded" : ""}`} key={section.key}>
                    <button
                      className={`accordion-trigger ${isActiveSection ? "active" : ""}`}
                      onClick={() => onToggleView(section.key)}
                      type="button"
                      title={section.label}
                    >
                      <span className="accordion-trigger-main">
                        <span className="menu-icon" aria-hidden="true">
                          {section.icon}
                        </span>
                        {!sidebarCollapsed ? <span>{section.label}</span> : null}
                      </span>
                      {!sidebarCollapsed && section.items.length ? (
                        <span className={`accordion-arrow ${isExpanded ? "expanded" : ""}`}>^</span>
                      ) : null}
                    </button>

                    {!sidebarCollapsed && isExpanded && section.items.length ? (
                      <div className="accordion-children">
                        {section.items.map((item) => (
                          <button
                            key={item.key}
                            className={`accordion-child ${activeTab === item.key ? "active" : ""}`}
                            onClick={() => onSelectTab(item.key)}
                            type="button"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <div className="sidebar-bottom">
              <button
                aria-label={sidebarCollapsed ? "展开菜单" : "收起菜单"}
                className="sidebar-toggle-button"
                onClick={onToggleCollapse}
                type="button"
              >
                <span className={`sidebar-toggle-icon ${sidebarCollapsed ? "collapsed" : ""}`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="5" width="16" height="14" rx="2" />
                    <path d="M9 5v14" />
                    <path d="m13 12 3-3" />
                    <path d="m13 12 3 3" />
                  </svg>
                </span>
                {!sidebarCollapsed ? <span>收起菜单</span> : null}
              </button>
            </div>
          </aside>

          <main className="main-panel">
            <section className="tab-strip">
              {openTabs.map((tab) => (
                <div className={`tab-chip ${activeTab === tab.key ? "active" : ""}`} key={tab.key}>
                  <button className="tab-chip-main" onClick={() => onSelectTab(tab.key)} type="button">
                    {tab.label}
                  </button>
                  {tab.key !== "home" && tab.key !== "requirement" ? (
                    <button
                      className="tab-chip-close"
                      onClick={() => onCloseTab(tab.key)}
                      type="button"
                      aria-label={`关闭${tab.label}`}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
            </section>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
