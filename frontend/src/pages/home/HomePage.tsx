import { SectionCard } from "../../components/SectionCard";
import type { DashboardHomeData, Environment, Incident, KnowledgeNote, SqlAsset } from "../../types/api";

interface HomePageProps {
  dashboard: DashboardHomeData | null;
  environments: Environment[];
  incidents: Incident[];
  notes: KnowledgeNote[];
  sqlAssets: SqlAsset[];
  loading: boolean;
  onQuickJump: (target: "routing" | "model_catalog" | "cards" | "standard") => void;
}

export function HomePage(props: HomePageProps) {
  const { dashboard, environments, incidents, notes, sqlAssets, loading, onQuickJump } = props;
  const currentEnvironment = environments[0];
  const favoriteSqlAssets = sqlAssets.filter((item) => item.is_favorite);
  const highPriorityIncidents = incidents.filter((item) => item.severity === "high");
  const openIncidents = incidents.filter((item) => item.status !== "已关闭" && item.status !== "已解决");
  const recentAssets = sqlAssets.slice(0, 3);
  const recentNotes = notes.slice(0, 3);

  if (loading && !dashboard) {
    return <div className="loading-box">正在加载工作台快照...</div>;
  }

  return (
    <div className="content-grid">
      <section className="home-hero-card card col-12">
        <div className="home-hero-main">
          <div className="home-hero-copy">
            <div className="eyebrow">个人数仓总台</div>
            <h2>先看优先级，再进开发和排查。</h2>
            <p>
              首页只承接进入状态必须看到的信息：当前主环境、今天要处理的问题、可直接复用的 SQL，以及最近沉淀下来的知识资产。
            </p>
          </div>
          <div className="home-priority-panel">
            <div className="section-title">今日焦点</div>
            <div className="priority-number">{highPriorityIncidents.length}</div>
            <div className="muted">高优先级问题待跟进</div>
            <div className="priority-tags">
              <span className="priority-tag">环境 {environments.length}</span>
              <span className="priority-tag">收藏 SQL {favoriteSqlAssets.length}</span>
              <span className="priority-tag">知识笔记 {notes.length}</span>
            </div>
          </div>
        </div>

        <div className="home-kpi-strip">
          <div className="home-kpi-tile">
            <span>当前主环境</span>
            <strong>
              {currentEnvironment
                ? `${currentEnvironment.company_name} · ${currentEnvironment.environment_name}`
                : "暂无环境"}
            </strong>
            <div className="muted">
              {currentEnvironment
                ? `${currentEnvironment.dialect} · ${currentEnvironment.network_mode}`
                : "请先加载环境数据"}
            </div>
          </div>
          <div className="home-kpi-tile">
            <span>待跟进问题</span>
            <strong>{openIncidents.length}</strong>
            <div className="muted">未关闭的问题需要持续跟进</div>
          </div>
          <div className="home-kpi-tile">
            <span>可复用 SQL</span>
            <strong>{sqlAssets.length}</strong>
            <div className="muted">沉淀后的 SQL 可以直接支撑日常排查</div>
          </div>
          <div className="home-kpi-tile">
            <span>最近笔记</span>
            <strong>{dashboard?.recent_notes.length ?? recentNotes.length}</strong>
            <div className="muted">最近新增的知识沉淀和经验记录</div>
          </div>
        </div>
      </section>

      <SectionCard
        title="今日工作队列"
        subtitle="这一列只放需要你优先判断和推进的事情。"
        className="col-7"
      >
        <div className="focus-list">
          {incidents.slice(0, 4).map((item) => (
            <div className="focus-item" key={item.id}>
              <div className={`status-badge ${item.severity === "high" ? "warn" : ""}`}>
                {item.status}
              </div>
              <strong>{item.title}</strong>
              <div className="meta-line">
                <span>类型：{item.incident_type}</span>
                <span>优先级：{item.severity === "high" ? "高" : "中"}</span>
              </div>
              <div className="muted">{item.impact_scope ?? "暂未填写影响范围。"}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="快捷入口"
        subtitle="把最常用的动作收在一个面板里，不让首页变成信息堆。"
        className="col-5"
      >
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={() => onQuickJump("routing")} type="button">
            <strong>进入环境管理</strong>
            <div className="muted">先确认当前公司和连接方式，再开始开发。</div>
          </button>
          <button className="quick-action-card" onClick={() => onQuickJump("model_catalog")} type="button">
            <strong>进入模型开发</strong>
            <div className="muted">进入模型管理和 SQL 管理，继续你的建模工作。</div>
          </button>
          <button className="quick-action-card" onClick={() => onQuickJump("cards")} type="button">
            <strong>新建问题卡片</strong>
            <div className="muted">把问题现象、影响范围和回溯动作先记下来。</div>
          </button>
          <button className="quick-action-card" onClick={() => onQuickJump("standard")} type="button">
            <strong>进入知识库</strong>
            <div className="muted">快速查看规范标准、业务口径和指标体系沉淀。</div>
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="常用 SQL 资产"
        subtitle="收藏和最近使用的 SQL 应该优先露出，减少重复找脚本。"
        className="col-6"
      >
        <div className="asset-grid">
          {(favoriteSqlAssets.length ? favoriteSqlAssets : recentAssets).slice(0, 4).map((item) => (
            <div className="asset-card" key={item.id}>
              <div className="asset-head">
                <strong>{item.title}</strong>
                {item.is_favorite ? <span className="pill">收藏</span> : null}
              </div>
              <div className="meta-line">
                <span>{item.sql_type}</span>
                <span>{item.dialect}</span>
                <span>{item.status}</span>
              </div>
              <div className="muted">{item.summary ?? "暂未填写说明。"}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="知识沉淀"
        subtitle="把最近形成结论的笔记放在首页，方便持续复盘。"
        className="col-6"
      >
        <div className="asset-grid">
          {recentNotes.map((item) => (
            <div className="asset-card" key={item.id}>
              <div className="asset-head">
                <strong>{item.title}</strong>
                <span className="pill">{item.note_type}</span>
              </div>
              <div className="meta-line">
                <span>{item.source_type}</span>
              </div>
              <div className="muted">{item.summary ?? "暂未填写摘要。"}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="多公司工作环境"
        subtitle="首页需要直接体现你这套系统是跨公司复用的。"
        className="col-8"
      >
        <div className="environment-board">
          {environments.map((item) => (
            <div className="environment-pill-card" key={item.id}>
              <strong>
                {item.company_name} · {item.environment_name}
              </strong>
              <div className="pill-row">
                <span className="pill">{item.dialect}</span>
                <span className="pill">{item.network_mode}</span>
                <span className="pill">{item.timezone}</span>
              </div>
              <div className="muted">{item.description ?? "暂未填写环境说明。"}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="首页状态摘要"
        subtitle="这一块保留接口级摘要，用来确认首页聚合是否完整。"
        className="col-4"
      >
        <div className="snapshot-panel">
          <div className="snapshot-row">
            <span>当前环境 ID</span>
            <strong>{dashboard?.current_environment ?? "未选择"}</strong>
          </div>
          <div className="snapshot-row">
            <span>最近 SQL</span>
            <strong>{dashboard?.recent_sql_assets.length ?? 0}</strong>
          </div>
          <div className="snapshot-row">
            <span>待处理问题</span>
            <strong>{dashboard?.pending_incidents.length ?? 0}</strong>
          </div>
          <div className="snapshot-row">
            <span>最近笔记</span>
            <strong>{dashboard?.recent_notes.length ?? 0}</strong>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
