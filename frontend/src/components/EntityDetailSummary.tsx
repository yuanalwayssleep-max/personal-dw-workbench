import type { ReactNode } from "react";

type SummaryItem = {
  label: string;
  value: ReactNode;
};

interface EntityDetailSummaryProps {
  items: SummaryItem[];
}

export function EntityDetailSummary(props: EntityDetailSummaryProps) {
  const { items } = props;

  return (
    <div className="dual-summary">
      {items.map((item) => (
        <div className="list-item" key={item.label}>
          <strong>{item.label}</strong>
          <div className="muted">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
