interface EntityFormActionsProps {
  disabled?: boolean;
  loading?: boolean;
  submitText?: string;
  loadingText?: string;
  onSubmit: () => Promise<void> | void;
}

export function EntityFormActions(props: EntityFormActionsProps) {
  const { disabled = false, loading = false, submitText = "提交", loadingText = "提交中...", onSubmit } = props;

  return (
    <div className="action-row">
      <button className="primary-button" disabled={disabled || loading} onClick={() => void onSubmit()} type="button">
        {loading ? loadingText : submitText}
      </button>
    </div>
  );
}
