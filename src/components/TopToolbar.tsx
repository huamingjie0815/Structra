import { useState, useRef, useEffect } from "react";
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignHorizontalSpaceBetween,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalSpaceBetween,
  Braces,
  BringToFront,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Eye,
  FileInput,
  FileJson,
  FileText,
  FolderOpen,
  Grid3X3,
  Group,
  Hand,
  History,
  LayoutDashboard,
  Lock,
  Monitor,
  MousePointer2,
  Network,
  Paintbrush,
  Plus,
  Printer,
  Redo2,
  Ruler,
  Save,
  Scissors,
  SendToBack,
  Settings,
  Trash2,
  Undo2,
  Ungroup,
  Unlock,
  UserRound,
  Waypoints,
  ChevronDown,
  Download,
  Zap
} from "lucide-react";

import type { DefaultExportFormat } from "../domain/preferences";
import type { AlignAction, AutoLayoutMode, FormatSnapshot, MatchSizeAction } from "../domain/types";
import { IconButton } from "./IconButton";

export type EditorTool = "select" | "pan" | "connect";

function Dropdown({
  label,
  icon: Icon,
  children,
  active
}: {
  label: string;
  icon: any;
  children: React.ReactNode;
  active?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="toolbar-dropdown-container">
      <button
        ref={triggerRef}
        type="button"
        className={`toolbar-dropdown-trigger${isOpen || active ? " active" : ""}`}
        onClick={toggle}
        title={label}
      >
        <Icon size={15} className="dropdown-trigger-icon" />
        <span className="dropdown-trigger-label">{label}</span>
        <ChevronDown size={12} className="dropdown-trigger-arrow" />
      </button>
      {isOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div
            ref={menuRef}
            className="toolbar-dropdown-menu"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={() => setIsOpen(false)}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

// 下拉菜单项组件
function DropdownItem({
  label,
  icon: Icon,
  disabled,
  active,
  onClick
}: {
  label: string;
  icon: any;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`toolbar-dropdown-item${active ? " active" : ""}`}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation(); // 阻止冒泡
        if (!disabled) onClick();
      }}
    >
      <Icon size={14} className="dropdown-item-icon" />
      <span className="dropdown-item-label">{label}</span>
    </button>
  );
}

export function TopToolbar({
  tool,
  previewMode,
  showGrid,
  showRulers,
  canUndo,
  canRedo,
  canPaste,
  canApplyFormat,
  formatTarget,
  hasSelectedNode,
  hasSelectedEdge,
  hasSelection,
  selectedNodeCount,
  selectedNodeIdCount,
  selectedEdgeIdCount,
  selectedNodeHasGroup,
  selectedNodesAllLocked,
  selectedNodesAllUnlocked,
  nodeCount,
  mindNodeCount,
  orgNodeCount,
  canAddStructuredChild,
  canAddStructuredSibling,
  zoom,
  documentDirty,
  defaultExportFormat,
  onToolChange,
  onTogglePreview,
  onOpenPresentation,
  onOpenPreferences,
  onOpenWorkspace,
  onToggleGrid,
  onToggleRulers,
  onUndo,
  onRedo,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onCopyFormat,
  onApplyFormat,
  onDelete,
  onAlign,
  onMatchSize,
  onAutoLayout,
  onAddStructuredNode,
  onReorder,
  onGroup,
  onUngroup,
  onSetLocked,
  onNewDocument,
  onOpenDocument,
  onSaveDocument,
  onSaveDocumentAs,
  onSaveCache,
  onSaveVersion,
  onImportJson,
  onImportMermaid,
  onExportDefault,
  onExportJson,
  onExportMermaid,
  onExportSvg,
  onExportPng,
  onExportPdf,
  onExportDocumentPdf,
  onPrint
}: {
  tool: EditorTool;
  previewMode: boolean;
  showGrid: boolean;
  showRulers: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canPaste: boolean;
  canApplyFormat: boolean;
  formatTarget: FormatSnapshot["target"] | null;
  hasSelectedNode: boolean;
  hasSelectedEdge: boolean;
  hasSelection: boolean;
  selectedNodeCount: number;
  selectedNodeIdCount: number;
  selectedEdgeIdCount: number;
  selectedNodeHasGroup: boolean;
  selectedNodesAllLocked: boolean;
  selectedNodesAllUnlocked: boolean;
  nodeCount: number;
  mindNodeCount: number;
  orgNodeCount: number;
  canAddStructuredChild: boolean;
  canAddStructuredSibling: boolean;
  zoom: number;
  documentDirty: boolean;
  defaultExportFormat: DefaultExportFormat;
  onToolChange: (tool: EditorTool) => void;
  onTogglePreview: () => void;
  onOpenPresentation: () => void;
  onOpenPreferences: () => void;
  onOpenWorkspace: () => void;
  onToggleGrid: () => void;
  onToggleRulers: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onCopyFormat: () => void;
  onApplyFormat: () => void;
  onDelete: () => void;
  onAlign: (action: AlignAction) => void;
  onMatchSize: (action: MatchSizeAction) => void;
  onAutoLayout: (direction: AutoLayoutMode) => void;
  onAddStructuredNode: (mode: "child" | "sibling") => void;
  onReorder: (direction: "front" | "back") => void;
  onGroup: () => void;
  onUngroup: () => void;
  onSetLocked: (locked: boolean) => void;
  onNewDocument: () => void;
  onOpenDocument: () => void;
  onSaveDocument: () => void;
  onSaveDocumentAs: () => void;
  onSaveCache: () => void;
  onSaveVersion: () => void;
  onImportJson: () => void;
  onImportMermaid: () => void;
  onExportDefault: () => void;
  onExportJson: () => void;
  onExportMermaid: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onExportDocumentPdf: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="command-strip" role="toolbar" aria-label="常用命令">
      {/* 核心基础工具组 */}
      <IconButton label="选择" active={tool === "select"} onClick={() => onToolChange("select")} icon={MousePointer2} />
      <IconButton label="平移" active={tool === "pan"} onClick={() => onToolChange("pan")} icon={Hand} />
      <IconButton label="连线" active={tool === "connect"} onClick={() => onToolChange("connect")} icon={Waypoints} />

      <span className="toolbar-divider" />

      {/* 历史撤销重做 */}
      <IconButton label="撤销" disabled={!canUndo} onClick={onUndo} icon={Undo2} />
      <IconButton label="重做" disabled={!canRedo} onClick={onRedo} icon={Redo2} />

      <span className="toolbar-divider" />

      {/* 1. 📁 文件与导出下拉菜单 */}
      <Dropdown label="文件与导出" icon={FolderOpen}>
        <DropdownItem label="新建文档" icon={Plus} onClick={onNewDocument} />
        <DropdownItem label="打开文档" icon={FileInput} onClick={onOpenDocument} />
        <DropdownItem label={documentDirty ? "保存文档 (有修改)" : "保存文档"} icon={Save} onClick={onSaveDocument} />
        <DropdownItem label="另存为文档" icon={FileJson} onClick={onSaveDocumentAs} />
        <DropdownItem label="保存版本历史" icon={History} onClick={onSaveVersion} />

        <div className="dropdown-divider" />
        <div className="dropdown-divider-text">导入</div>
        <DropdownItem label="导入 JSON" icon={FileInput} onClick={onImportJson} />
        <DropdownItem label="导入 Mermaid" icon={Braces} onClick={onImportMermaid} />

        <div className="dropdown-divider" />
        <div className="dropdown-divider-text">导出当前页</div>
        <DropdownItem label={`按默认格式导出 (${defaultExportFormat.toUpperCase()})`} icon={Zap} onClick={onExportDefault} />
        <DropdownItem label="导出 SVG" icon={Download} onClick={onExportSvg} />
        <DropdownItem label="导出 PNG" icon={Download} onClick={onExportPng} />
        <DropdownItem label="导出 PDF" icon={Download} onClick={onExportPdf} />

        <div className="dropdown-divider" />
        <div className="dropdown-divider-text">导出全文档</div>
        <DropdownItem label="导出 JSON" icon={FileJson} onClick={onExportJson} />
        <DropdownItem label="导出 Mermaid" icon={Braces} onClick={onExportMermaid} />
        <DropdownItem label="导出全文档 PDF" icon={FileText} onClick={onExportDocumentPdf} />

        <div className="dropdown-divider" />
        <DropdownItem label="打印当前页" icon={Printer} onClick={onPrint} />
      </Dropdown>

      {/* 2. 📝 编辑与样式下拉菜单 */}
      <Dropdown
        label="编辑与样式"
        icon={Scissors}
        active={selectedNodeCount > 0 || canPaste || canApplyFormat || (hasSelectedNode || hasSelectedEdge)}
      >
        <DropdownItem label="复制" disabled={selectedNodeCount === 0} icon={Copy} onClick={onCopy} />
        <DropdownItem label="剪切" disabled={selectedNodeCount === 0} icon={Scissors} onClick={onCut} />
        <DropdownItem label="粘贴" disabled={!canPaste} icon={ClipboardPaste} onClick={onPaste} />
        <DropdownItem label="快速复制" disabled={selectedNodeCount === 0} icon={CopyPlus} onClick={onDuplicate} />
        <div className="dropdown-divider" />
        <DropdownItem label="复制样式" disabled={!hasSelectedNode && !hasSelectedEdge} icon={Paintbrush} onClick={onCopyFormat} />
        <DropdownItem
          label="应用样式"
          disabled={!canApplyFormat || (formatTarget === "node" ? selectedNodeIdCount === 0 : selectedEdgeIdCount === 0)}
          icon={Paintbrush}
          onClick={onApplyFormat}
        />
        <div className="dropdown-divider" />
        <DropdownItem label="删除" disabled={!hasSelection && selectedNodeCount === 0 && selectedEdgeIdCount === 0} icon={Trash2} onClick={onDelete} />
      </Dropdown>

      {/* 3. 📐 排版与排列下拉菜单 */}
      <Dropdown
        label="排版与排列"
        icon={AlignHorizontalJustifyCenter}
        active={selectedNodeCount > 0 || nodeCount > 1 || canAddStructuredChild || canAddStructuredSibling}
      >
        {/* 对齐快捷面板（网格排布，极致美观直观） */}
        <div className="dropdown-divider-text">对齐方向</div>
        <div className="toolbar-align-grid" onClick={(e) => e.stopPropagation()}>
          <IconButton label="左对齐" disabled={selectedNodeCount < 2} onClick={() => onAlign("left")} icon={AlignHorizontalJustifyStart} />
          <IconButton label="水平居中" disabled={selectedNodeCount < 2} onClick={() => onAlign("center")} icon={AlignHorizontalJustifyCenter} />
          <IconButton label="右对齐" disabled={selectedNodeCount < 2} onClick={() => onAlign("right")} icon={AlignHorizontalJustifyEnd} />
          <IconButton label="等宽" disabled={selectedNodeCount < 2} onClick={() => onMatchSize("width")} icon={AlignHorizontalJustifyCenter} />

          <IconButton label="顶对齐" disabled={selectedNodeCount < 2} onClick={() => onAlign("top")} icon={AlignVerticalJustifyStart} />
          <IconButton label="垂直居中" disabled={selectedNodeCount < 2} onClick={() => onAlign("middle")} icon={AlignVerticalJustifyCenter} />
          <IconButton label="底对齐" disabled={selectedNodeCount < 2} onClick={() => onAlign("bottom")} icon={AlignVerticalJustifyEnd} />
          <IconButton label="等高" disabled={selectedNodeCount < 2} onClick={() => onMatchSize("height")} icon={AlignVerticalJustifyCenter} />
        </div>

        <div className="dropdown-divider" />
        <div className="dropdown-divider-text">分布与大小</div>
        <DropdownItem label="水平分布" disabled={selectedNodeCount < 3} icon={AlignHorizontalSpaceBetween} onClick={() => onAlign("distributeX")} />
        <DropdownItem label="垂直分布" disabled={selectedNodeCount < 3} icon={AlignVerticalSpaceBetween} onClick={() => onAlign("distributeY")} />
        <DropdownItem label="等尺寸" disabled={selectedNodeCount < 2} icon={AlignHorizontalSpaceBetween} onClick={() => onMatchSize("both")} />

        <div className="dropdown-divider" />
        <div className="dropdown-divider-text">自动排版布局</div>
        <DropdownItem label="横向自动排版" disabled={nodeCount < 2} icon={Grid3X3} onClick={() => onAutoLayout("horizontal")} />
        <DropdownItem label="纵向自动排版" disabled={nodeCount < 2} icon={Waypoints} onClick={() => onAutoLayout("vertical")} />
        <DropdownItem label="导图自动排版" disabled={mindNodeCount < 2} icon={Network} onClick={() => onAutoLayout("mind")} />
        <DropdownItem label="组织自动排版" disabled={orgNodeCount < 2} icon={UserRound} onClick={() => onAutoLayout("org")} />

        <div className="dropdown-divider" />
        <div className="dropdown-divider-text">结构树节点</div>
        <DropdownItem label="添加子级节点" disabled={!canAddStructuredChild} icon={Network} onClick={() => onAddStructuredNode("child")} />
        <DropdownItem label="添加同级节点" disabled={!canAddStructuredSibling} icon={Plus} onClick={() => onAddStructuredNode("sibling")} />

        <div className="dropdown-divider" />
        <div className="dropdown-divider-text">组合与锁定</div>
        <DropdownItem label="组合" disabled={selectedNodeCount < 2} icon={Group} onClick={onGroup} />
        <DropdownItem label="取消组合" disabled={!selectedNodeHasGroup} icon={Ungroup} onClick={onUngroup} />
        <DropdownItem label="锁定" disabled={selectedNodeCount === 0 || selectedNodesAllLocked} icon={Lock} onClick={() => onSetLocked(true)} />
        <DropdownItem label="解锁" disabled={selectedNodeCount === 0 || selectedNodesAllUnlocked} icon={Unlock} onClick={() => onSetLocked(false)} />

        <div className="dropdown-divider" />
        <div className="dropdown-divider-text">图层顺序</div>
        <DropdownItem label="置于顶层" disabled={selectedNodeIdCount === 0} icon={BringToFront} onClick={() => onReorder("front")} />
        <DropdownItem label="置于底层" disabled={selectedNodeIdCount === 0} icon={SendToBack} onClick={() => onReorder("back")} />
      </Dropdown>

      {/* 4. 👁️ 视图与设置下拉菜单 */}
      <Dropdown label="视图与设置" icon={Settings}>
        <DropdownItem label="显示网格" active={showGrid} icon={Grid3X3} onClick={onToggleGrid} />
        <DropdownItem label="显示标尺" active={showRulers} icon={Ruler} onClick={onToggleRulers} />
        <DropdownItem label="本地缓存文档" icon={Save} onClick={onSaveCache} />
        <DropdownItem label="系统偏好设置" icon={Settings} onClick={onOpenPreferences} />
      </Dropdown>

      <span className="toolbar-divider" />

      {/* 缩放比例 */}
      <span className="zoom-readout">{zoom}%</span>

      <span className="toolbar-divider" />

      {/* 预览与演示模式 */}
      <IconButton label="预览模式" active={previewMode} onClick={onTogglePreview} icon={Eye} />
      <IconButton label="演示模式" onClick={onOpenPresentation} icon={Monitor} />
    </div>
  );
}
