/** Serialize demo data without allowing user-entered spreadsheet formulas. */
export function serializeCSV(rows) {
  return rows.map((row) => row.map((value) => {
    let text = String(value == null ? "" : value);
    // Quoting CSV alone does not prevent Excel/LibreOffice formula execution.
    // Preserve actual numbers; treat potentially active text as a literal cell.
    if (typeof value !== "number" && /^(?:[\s\u0000-\u001f]*[=+@\-＝＋＠－]|[\t\r\n])/u.test(text)) {
      text = "'" + text;
    }
    return '"' + text.replace(/"/g, '""') + '"';
  }).join(";")).join("\r\n");
}
