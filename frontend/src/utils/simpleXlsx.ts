async function loadXlsx() {
  return import("xlsx");
}

export async function downloadXlsx(filename: string, rows: string[][]) {
  const XLSX = await loadXlsx();
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export async function parseXlsx(file: File) {
  const XLSX = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("xlsx 文件中没有可读取的工作表。");
  }
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });
}
