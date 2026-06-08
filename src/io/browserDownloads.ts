export function downloadFile(name: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  downloadBlob(name, blob);
}

export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
