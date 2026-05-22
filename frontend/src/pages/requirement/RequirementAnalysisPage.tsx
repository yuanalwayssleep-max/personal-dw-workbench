import { SectionCard } from "../../components/SectionCard";

export function RequirementAnalysisPage() {
  return (
    <div className="content-grid">
      <SectionCard
        title="需求分析"
        subtitle="这一层先承接需求理解、范围拆解、指标口径和交付路径，后续再补需求池和分析模版。"
        className="col-8"
      >
        <div className="dual-summary">
          <div className="list-item">
            <strong>需求输入</strong>
            <div className="muted">记录业务背景、目标、核心问题、时间要求和交付方式。</div>
          </div>
          <div className="list-item">
            <strong>分析拆解</strong>
            <div className="muted">把需求拆成主题域、指标口径、数据来源和实现路径。</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="当前定位"
        subtitle="先提供结构占位，保证菜单和标签体系完整。"
        className="col-4"
      >
        <div className="stack">
          <div className="spotlight-box">
            <div className="section-title">后续可补</div>
            <div className="muted">需求池、需求模板、口径确认清单、输出物模板。</div>
          </div>
          <div className="spotlight-box">
            <div className="section-title">当前状态</div>
            <div className="muted">已完成一级菜单接入，页面先作为需求分析工作区占位。</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
