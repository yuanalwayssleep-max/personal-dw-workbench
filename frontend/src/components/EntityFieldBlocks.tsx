import type { ReactNode } from "react";

interface BaseFieldProps {
  label: string;
  fullWidth?: boolean;
}

interface TextFieldProps extends BaseFieldProps {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  options: SelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

interface ReadonlyContentFieldProps extends BaseFieldProps {
  content: ReactNode;
}

export function TextField(props: TextFieldProps) {
  const { label, fullWidth = false, value, placeholder, disabled = false, onChange } = props;

  return (
    <label className={`field ${fullWidth ? "form-grid-full" : ""}`.trim()}>
      <span>{label}</span>
      <input
        disabled={disabled}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

export function SelectField(props: SelectFieldProps) {
  const { label, fullWidth = false, value, options, disabled = false, onChange } = props;

  return (
    <label className={`field ${fullWidth ? "form-grid-full" : ""}`.trim()}>
      <span>{label}</span>
      <select disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextareaField(props: TextareaFieldProps) {
  const { label, fullWidth = false, value, placeholder, disabled = false, onChange } = props;

  return (
    <label className={`field ${fullWidth ? "form-grid-full" : ""}`.trim()}>
      <span>{label}</span>
      <textarea
        className="form-textarea"
        disabled={disabled}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

export function ReadonlyTextBlockField(props: BaseFieldProps & { value: string }) {
  const { label, fullWidth = false, value } = props;

  return (
    <label className={`field ${fullWidth ? "form-grid-full" : ""}`.trim()}>
      <span>{label}</span>
      <div className="readonly-text-block">{value || "-"}</div>
    </label>
  );
}

export function ReadonlyContentField(props: ReadonlyContentFieldProps) {
  const { label, fullWidth = false, content } = props;

  return (
    <label className={`field ${fullWidth ? "form-grid-full" : ""}`.trim()}>
      <span>{label}</span>
      {content}
    </label>
  );
}

export function RelationCheckboxField(props: BaseFieldProps & { children: ReactNode }) {
  const { label, fullWidth = false, children } = props;

  return (
    <label className={`field ${fullWidth ? "form-grid-full" : ""}`.trim()}>
      <span>{label}</span>
      <div className="relation-picker">{children}</div>
    </label>
  );
}

export function ReadonlyRelationField(props: BaseFieldProps & { children: ReactNode }) {
  const { label, fullWidth = false, children } = props;

  return (
    <label className={`field ${fullWidth ? "form-grid-full" : ""}`.trim()}>
      <span>{label}</span>
      <div className="relation-picker readonly-block">{children}</div>
    </label>
  );
}
