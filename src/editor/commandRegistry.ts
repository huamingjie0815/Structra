import { SHAPE_SPECS } from "../domain/shapeSpecs";
import type { AutoLayoutMode, CommandItem, MatchSizeAction, ShapeKind } from "../domain/types";

export type CommandRegistryHandlers = {
  newDocument: () => void;
  openDocument: () => void;
  saveDocument: () => void;
  saveDocumentAs: () => void;
  setTool: (tool: "select" | "pan" | "connect") => void;
  addShape: (kind: ShapeKind) => void;
  addPage: () => void;
  duplicatePage: () => void;
  saveCache: () => void;
  saveVersion: () => void;
  importJson: () => void;
  importMermaid: () => void;
  exportDefault: () => void;
  exportJson: () => void;
  exportMermaid: () => void;
  exportSvg: () => void;
  exportPng: () => void;
  exportPdf: () => void;
  exportDocumentPdf: () => void;
  printCurrentPage: () => void;
  openPreferences: () => void;
  openPresentation: () => void;
  toggleSnapToGrid: () => void;
  fitCanvas: () => void;
  fitSelection: () => void;
  matchNodeSize: (action: MatchSizeAction) => void;
  autoLayout: (direction: AutoLayoutMode) => void;
  appendStructuredNode: (mode: "child" | "sibling") => void;
  startKeyboardConnector: () => void;
  completeKeyboardConnector: () => void;
  selectedNodeCount: number;
  nodeCount: number;
  mindNodeCount: number;
  orgNodeCount: number;
  canAddStructuredChild: boolean;
  canAddStructuredSibling: boolean;
  keyboardConnectorActive: boolean;
};

export function buildCommandItems(handlers: CommandRegistryHandlers): CommandItem[] {
  return [
    { id: "document-new", group: "文件", label: "新建文档", run: handlers.newDocument },
    { id: "document-open", group: "文件", label: "打开文档", run: handlers.openDocument },
    { id: "document-save", group: "文件", label: "保存文档", run: handlers.saveDocument },
    { id: "document-save-as", group: "文件", label: "另存为文档", run: handlers.saveDocumentAs },
    { id: "tool-select", group: "工具", label: "切换到选择工具", run: () => handlers.setTool("select") },
    { id: "tool-pan", group: "工具", label: "切换到平移工具", run: () => handlers.setTool("pan") },
    { id: "tool-connect", group: "工具", label: "切换到连线工具", run: () => handlers.setTool("connect") },
    { id: "keyboard-connect-start", group: "工具", label: "从选中节点开始键盘连线", run: handlers.startKeyboardConnector, disabled: handlers.selectedNodeCount !== 1 },
    {
      id: "keyboard-connect-complete",
      group: "工具",
      label: "连接到选中节点",
      run: handlers.completeKeyboardConnector,
      disabled: !handlers.keyboardConnectorActive || handlers.selectedNodeCount !== 1
    },
    ...SHAPE_SPECS.map((shape) => ({
      id: `add-${shape.kind}`,
      group: "图形",
      label: `添加${shape.label}`,
      run: () => handlers.addShape(shape.kind)
    })),
    { id: "page-new", group: "页面", label: "新建页面", run: handlers.addPage },
    { id: "page-copy", group: "页面", label: "复制当前页面", run: handlers.duplicatePage },
    { id: "save-cache", group: "文件", label: "保存到本机缓存", run: handlers.saveCache },
    { id: "save-version", group: "文件", label: "保存版本", run: handlers.saveVersion },
    { id: "import-json", group: "文件", label: "导入 JSON", run: handlers.importJson },
    { id: "import-mermaid", group: "文件", label: "导入 Mermaid", run: handlers.importMermaid },
    { id: "export-default", group: "导出", label: "按默认格式导出", run: handlers.exportDefault },
    { id: "export-json", group: "导出", label: "导出文档 JSON", run: handlers.exportJson },
    { id: "export-mermaid", group: "导出", label: "导出 Mermaid", run: handlers.exportMermaid },
    { id: "export-svg", group: "导出", label: "导出当前页 SVG", run: handlers.exportSvg },
    { id: "export-png", group: "导出", label: "导出当前页 PNG", run: handlers.exportPng },
    { id: "export-pdf", group: "导出", label: "导出当前页 PDF", run: handlers.exportPdf },
    { id: "export-document-pdf", group: "导出", label: "导出文档 PDF", run: handlers.exportDocumentPdf },
    { id: "print-current-page", group: "导出", label: "打印当前页", run: handlers.printCurrentPage },
    { id: "preferences", group: "应用", label: "打开偏好设置", run: handlers.openPreferences },
    { id: "toggle-snap-to-grid", group: "视图", label: "切换吸附网格", run: handlers.toggleSnapToGrid },
    { id: "presentation", group: "视图", label: "打开演示模式", run: handlers.openPresentation },
    { id: "fit-canvas", group: "视图", label: "适应画布", run: handlers.fitCanvas },
    { id: "fit-selection", group: "视图", label: "适应选中", run: handlers.fitSelection, disabled: handlers.selectedNodeCount === 0 },
    { id: "match-width", group: "布局", label: "选中节点等宽", run: () => handlers.matchNodeSize("width"), disabled: handlers.selectedNodeCount < 2 },
    { id: "match-height", group: "布局", label: "选中节点等高", run: () => handlers.matchNodeSize("height"), disabled: handlers.selectedNodeCount < 2 },
    { id: "match-size", group: "布局", label: "选中节点等尺寸", run: () => handlers.matchNodeSize("both"), disabled: handlers.selectedNodeCount < 2 },
    { id: "layout-horizontal", group: "布局", label: "横向自动排版", run: () => handlers.autoLayout("horizontal"), disabled: handlers.nodeCount < 2 },
    { id: "layout-vertical", group: "布局", label: "纵向自动排版", run: () => handlers.autoLayout("vertical"), disabled: handlers.nodeCount < 2 },
    { id: "layout-mind", group: "布局", label: "导图自动排版", run: () => handlers.autoLayout("mind"), disabled: handlers.mindNodeCount < 2 },
    { id: "layout-org", group: "布局", label: "组织自动排版", run: () => handlers.autoLayout("org"), disabled: handlers.orgNodeCount < 2 },
    {
      id: "structured-add-child",
      group: "布局",
      label: "为导图/组织图添加子级节点",
      run: () => handlers.appendStructuredNode("child"),
      disabled: !handlers.canAddStructuredChild
    },
    {
      id: "structured-add-sibling",
      group: "布局",
      label: "为导图/组织图添加同级节点",
      run: () => handlers.appendStructuredNode("sibling"),
      disabled: !handlers.canAddStructuredSibling
    }
  ];
}
