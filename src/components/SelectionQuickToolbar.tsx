import { Copy, CopyPlus, Edit3, Focus, Group, Lock, Route, Trash2, Ungroup, Unlock } from "lucide-react";
import type { CSSProperties } from "react";

import type { DiagramEdge, DiagramNode, MatchSizeAction } from "../domain/types";
import { getEdgeLabelPosition } from "../editor/edgeGeometry";
import { IconButton } from "./IconButton";

type QuickToolbarPosition = {
  x: number;
  y: number;
};

export function SelectionQuickToolbar({
  nodes,
  selectedNodes,
  selectedEdges,
  onEdit,
  onCopy,
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
  onSetLocked,
  onMatchSize,
  onAutoRouteEdge,
  onFitSelection
}: {
  nodes: DiagramNode[];
  selectedNodes: DiagramNode[];
  selectedEdges: DiagramEdge[];
  onEdit: () => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onSetLocked: (locked: boolean) => void;
  onMatchSize: (action: MatchSizeAction) => void;
  onAutoRouteEdge: () => void;
  onFitSelection: () => void;
}) {
  const selectedEdge = selectedEdges.length === 1 ? selectedEdges[0] : null;
  const position = selectedNodes.length > 0 ? getNodeToolbarPosition(selectedNodes) : selectedEdge ? getEdgeLabelPosition(selectedEdge, nodes) : null;
  if (!position) return null;

  const hasNodeSelection = selectedNodes.length > 0;
  const hasSingleSelection = selectedNodes.length === 1 || selectedEdges.length === 1;
  const hasGroup = selectedNodes.some((node) => node.data.groupId);
  const allLocked = hasNodeSelection && selectedNodes.every((node) => node.data.locked);
  const allUnlocked = hasNodeSelection && selectedNodes.every((node) => !node.data.locked);

  return (
    <div
      className="selection-quick-toolbar nodrag nopan"
      role="toolbar"
      aria-label="选区快捷操作"
      style={{ "--selection-toolbar-x": `${position.x}px`, "--selection-toolbar-y": `${position.y}px` } as CSSProperties}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {hasSingleSelection ? <IconButton label={selectedEdge ? "快捷编辑连线文本" : "快捷编辑文本"} onClick={onEdit} icon={Edit3} /> : null}
      {hasNodeSelection ? (
        <>
          <IconButton label="选区复制到剪贴板" onClick={onCopy} icon={Copy} />
          <IconButton label="选区快速复制" onClick={onDuplicate} icon={CopyPlus} />
          <IconButton label="选区适应视图" onClick={onFitSelection} icon={Focus} />
          <IconButton label="选区等宽" disabled={selectedNodes.length < 2} onClick={() => onMatchSize("width")} icon={Focus} />
          <IconButton label="快捷组合" disabled={selectedNodes.length < 2} onClick={onGroup} icon={Group} />
          <IconButton label="快捷取消组合" disabled={!hasGroup} onClick={onUngroup} icon={Ungroup} />
          <IconButton label="快捷锁定" disabled={allLocked} onClick={() => onSetLocked(true)} icon={Lock} />
          <IconButton label="快捷解锁" disabled={allUnlocked} onClick={() => onSetLocked(false)} icon={Unlock} />
        </>
      ) : null}
      {selectedEdge ? <IconButton label="连线自动布线" onClick={onAutoRouteEdge} icon={Route} /> : null}
      <IconButton label="选区删除" onClick={onDelete} icon={Trash2} />
    </div>
  );
}

function getNodeToolbarPosition(selectedNodes: DiagramNode[]): QuickToolbarPosition {
  const left = Math.min(...selectedNodes.map((node) => node.position.x));
  const right = Math.max(...selectedNodes.map((node) => node.position.x + node.data.width));
  const top = Math.min(...selectedNodes.map((node) => node.position.y));
  return {
    x: left + (right - left) / 2,
    y: top - 48
  };
}
