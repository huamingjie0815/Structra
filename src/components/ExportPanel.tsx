import { Braces, Download, FileJson, FileText, Zap } from "lucide-react";

import type { DefaultExportFormat } from "../domain/preferences";
import { IconButton } from "./IconButton";

const DEFAULT_FORMAT_LABELS: Record<DefaultExportFormat, string> = {
  json: "JSON",
  svg: "SVG",
  png: "PNG",
  pdf: "PDF"
};

export function ExportPanel({
  defaultExportFormat,
  onExportDefault,
  onExportJson,
  onExportMermaid,
  onExportSvg,
  onExportPng,
  onExportPdf,
  onExportDocumentPdf
}: {
  defaultExportFormat: DefaultExportFormat;
  onExportDefault: () => void;
  onExportJson: () => void;
  onExportMermaid: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onExportDocumentPdf: () => void;
}) {
  const defaultLabel = DEFAULT_FORMAT_LABELS[defaultExportFormat];

  return (
    <section className="toolbar-export-panel" aria-label="导出">
      <button className="toolbar-export-primary" type="button" onClick={onExportDefault} aria-label={`按默认格式导出 ${defaultLabel}`}>
        <Zap size={15} aria-hidden="true" />
        <span>导出 {defaultLabel}</span>
      </button>
      <div className="toolbar-export-group" aria-label="当前页导出">
        <span className="toolbar-export-scope">当前页</span>
        <IconButton label="导出当前页 SVG" onClick={onExportSvg} icon={Download} />
        <IconButton label="导出当前页 PNG" onClick={onExportPng} icon={Download} />
        <IconButton label="导出当前页 PDF" onClick={onExportPdf} icon={Download} />
      </div>
      <div className="toolbar-export-group" aria-label="全文档导出">
        <span className="toolbar-export-scope">全文档</span>
        <IconButton label="导出文档 JSON" onClick={onExportJson} icon={FileJson} />
        <IconButton label="导出 Mermaid" onClick={onExportMermaid} icon={Braces} />
        <IconButton label="导出文档 PDF" onClick={onExportDocumentPdf} icon={FileText} />
      </div>
    </section>
  );
}
