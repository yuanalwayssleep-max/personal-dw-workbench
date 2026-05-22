import type { ReactNode } from "react";

import {
  ReadonlyContentField,
  ReadonlyRelationField,
  ReadonlyTextBlockField,
  RelationCheckboxField,
  SelectField,
  TextField,
  TextareaField,
} from "./EntityFieldBlocks";

export type FormOption = {
  label: string;
  value: string;
};

type BaseSchema = {
  key: string;
  label: string;
  fullWidth?: boolean;
};

export type EntityFieldSchema =
  | (BaseSchema & {
      type: "text";
      value: string;
      placeholder?: string;
      disabled?: boolean;
      onChange?: (value: string) => void;
    })
  | (BaseSchema & {
      type: "select";
      value: string;
      options: FormOption[];
      disabled?: boolean;
      onChange: (value: string) => void;
    })
  | (BaseSchema & {
      type: "textarea";
      value: string;
      placeholder?: string;
      disabled?: boolean;
      onChange?: (value: string) => void;
    })
  | (BaseSchema & {
      type: "readonly-text";
      value: string;
    })
  | (BaseSchema & {
      type: "readonly-content";
      content: ReactNode;
    })
  | (BaseSchema & {
      type: "relation";
      children: ReactNode;
    })
  | (BaseSchema & {
      type: "readonly-relation";
      children: ReactNode;
    });

interface EntityFormRendererProps {
  fields: EntityFieldSchema[];
}

export function EntityFormRenderer(props: EntityFormRendererProps) {
  const { fields } = props;

  return (
    <div className="form-grid">
      {fields.map((field) => {
        switch (field.type) {
          case "text":
            return (
              <TextField
                disabled={field.disabled}
                fullWidth={field.fullWidth}
                key={field.key}
                label={field.label}
                onChange={field.onChange}
                placeholder={field.placeholder}
                value={field.value}
              />
            );
          case "select":
            return (
              <SelectField
                disabled={field.disabled}
                fullWidth={field.fullWidth}
                key={field.key}
                label={field.label}
                onChange={field.onChange}
                options={field.options}
                value={field.value}
              />
            );
          case "textarea":
            return (
              <TextareaField
                disabled={field.disabled}
                fullWidth={field.fullWidth}
                key={field.key}
                label={field.label}
                onChange={field.onChange}
                placeholder={field.placeholder}
                value={field.value}
              />
            );
          case "readonly-text":
            return (
              <ReadonlyTextBlockField
                fullWidth={field.fullWidth}
                key={field.key}
                label={field.label}
                value={field.value}
              />
            );
          case "readonly-content":
            return (
              <ReadonlyContentField
                content={field.content}
                fullWidth={field.fullWidth}
                key={field.key}
                label={field.label}
              />
            );
          case "relation":
            return (
              <RelationCheckboxField fullWidth={field.fullWidth} key={field.key} label={field.label}>
                {field.children}
              </RelationCheckboxField>
            );
          case "readonly-relation":
            return (
              <ReadonlyRelationField fullWidth={field.fullWidth} key={field.key} label={field.label}>
                {field.children}
              </ReadonlyRelationField>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
