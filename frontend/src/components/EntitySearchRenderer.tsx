export type SearchFieldOption = {
  label: string;
  value: string;
};

export type SearchFieldSchema =
  | {
      key: string;
      type: "text";
      placeholder: string;
      value: string;
      onChange: (value: string) => void;
    }
  | {
      key: string;
      type: "select";
      value: string;
      options: SearchFieldOption[];
      onChange: (value: string) => void;
    };

interface EntitySearchRendererProps {
  fields: SearchFieldSchema[];
}

export function EntitySearchRenderer(props: EntitySearchRendererProps) {
  const { fields } = props;

  return (
    <div className="metric-search-grid">
      {fields.map((field) => {
        if (field.type === "text") {
          return (
            <input
              key={field.key}
              className="company-search-input"
              onChange={(event) => field.onChange(event.target.value)}
              placeholder={field.placeholder}
              value={field.value}
            />
          );
        }

        return (
          <select
            key={field.key}
            className="company-search-input"
            onChange={(event) => field.onChange(event.target.value)}
            value={field.value}
          >
            {field.options.map((option) => (
              <option key={option.value || option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      })}
    </div>
  );
}
