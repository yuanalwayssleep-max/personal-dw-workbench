interface ImportExportActionsProps {
  exporting: boolean;
  onOpenImport: () => void;
  onDownloadData: () => void;
}

export function ImportExportActions(props: ImportExportActionsProps) {
  const { exporting, onOpenImport, onDownloadData } = props;

  return (
    <>
      <button className="secondary-button accent" disabled={exporting} onClick={onOpenImport} type="button">
        导入
      </button>
      <button className="secondary-button accent" disabled={exporting} onClick={onDownloadData} type="button">
        {exporting ? "下载中..." : "下载"}
      </button>
    </>
  );
}
