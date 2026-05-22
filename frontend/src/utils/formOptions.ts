export type LabelValueOption = {
  label: string;
  value: string;
};

export function toOptions(values: string[]) {
  return values.map((value) => ({ label: value, value }));
}

export function withDefaultOption(label: string, values: string[]) {
  return [{ label, value: "" }, ...toOptions(values)];
}
