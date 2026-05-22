interface TruncatedCellProps {
  value: string | number | null | undefined;
}

export function TruncatedCell(props: TruncatedCellProps) {
  const displayValue = props.value === null || props.value === undefined || props.value === "" ? "-" : String(props.value);

  return (
    <div className="truncate-cell" data-fulltext={displayValue}>
      <span>{displayValue}</span>
    </div>
  );
}
