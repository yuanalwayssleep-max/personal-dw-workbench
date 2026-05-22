import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

export function SectionCard(props: SectionCardProps) {
  const { title, subtitle, className = "col-12", children } = props;
  return (
    <section className={`card ${className}`}>
      <h2>{title}</h2>
      {subtitle ? <div className="muted" style={{ marginBottom: 14 }}>{subtitle}</div> : null}
      {children}
    </section>
  );
}
