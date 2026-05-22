import type { ReactNode } from "react";

import { TruncatedCell } from "./TruncatedCell";

export type ManagementColumn<Row> = {
  header: string;
  render: (row: Row) => ReactNode;
};

export function textColumn<Row>(header: string, getValue: (row: Row) => string | number | null | undefined): ManagementColumn<Row> {
  return {
    header,
    render: (row) => <TruncatedCell value={getValue(row)} />,
  };
}

export function customColumn<Row>(header: string, render: (row: Row) => ReactNode): ManagementColumn<Row> {
  return { header, render };
}
