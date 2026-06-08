import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ViewportPortal,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnNodeDrag,
  type ReactFlowInstance
} from "@xyflow/react";
import { Focus, Maximize2, MessageSquare, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type Dispatch, type DragEvent, type RefObject, type SetStateAction } from "react";

import { DEFAULT_CANVAS_SETTINGS, GRID_BACKGROUND_VARIANTS } from "../domain/diagramDefaults";
import { getFontFamily, getNodeOpacity, getNodeStrokeStyle, getNodeStrokeWidth } from "../domain/nodeSemantics";
import type {
  AlignmentGuides,
  CanvasPoint,
  CanvasSize,
  CanvasViewport,
  ContextMenuState,
  DiagramComment,
  DiagramEdge,
  DiagramNode,
  EdgeLabelDraft,
  GridVariant,
  MatchSizeAction,
  NodeLabelDraft,
  PagePreset,
  Selection
} from "../domain/types";
import { getEdgeLabelColor, getEdgeLabelFontSize, getEdgeLabelPosition, getEdgeStroke } from "../editor/edgeGeometry";
import { IconButton } from "./IconButton";
import { CanvasRulers, edgeTypes, nodeTypes } from "./CanvasPrimitives";
import { SelectionQuickToolbar } from "./SelectionQuickToolbar";

type CanvasTool = "select" | "pan" | "connect";
type PageFrame = { label: string; width: number; height: number } | null;

type CanvasWorkspaceProps = {
  canvasRegionRef: RefObject<HTMLElement>;
  nodeEditorRef: RefObject<HTMLTextAreaElement>;
  edgeEditorRef: RefObject<HTMLTextAreaElement>;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selectedNodes: DiagramNode[];
  selectedEdges: DiagramEdge[];
  openComments: DiagramComment[];
  activeCommentId: string | null;
  reactFlow: ReactFlowInstance<DiagramNode, DiagramEdge> | null;
  tool: CanvasTool;
  previewMode: boolean;
  canvasBackground: string;
  canvasSize: CanvasSize;
  viewport: CanvasViewport;
  showRulers: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  gridVariant: GridVariant;
  pagePreset: PagePreset;
  pageFrame: PageFrame;
  alignmentGuides: AlignmentGuides;
  editingNode: DiagramNode | undefined;
  editingNodeLabel: NodeLabelDraft;
  editingEdge: DiagramEdge | undefined;
  editingEdgeLabel: EdgeLabelDraft;
  editingEdgePosition: CanvasPoint | null;
  onReactFlowChange: Dispatch<SetStateAction<ReactFlowInstance<DiagramNode, DiagramEdge> | null>>;
  onViewportChange: Dispatch<SetStateAction<CanvasViewport>>;
  onZoomChange: Dispatch<SetStateAction<number>>;
  onCursorPositionChange: (position: CanvasPoint | null) => void;
  onNodesChange: (changes: NodeChange<DiagramNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<DiagramEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  onReconnect: (oldEdge: DiagramEdge, connection: Connection) => void;
  onDrop: (event: DragEvent<Element>) => void;
  onNodeDrag: OnNodeDrag<DiagramNode>;
  onNodeDragStop: () => void;
  onSetNodes: Dispatch<SetStateAction<DiagramNode[]>>;
  onSetEdges: Dispatch<SetStateAction<DiagramEdge[]>>;
  onSelectionChange: Dispatch<SetStateAction<Selection>>;
  onContextMenuChange: Dispatch<SetStateAction<ContextMenuState>>;
  onStartNodeLabelEdit: (id: string) => void;
  onStartEdgeLabelEdit: (id: string) => void;
  onCopySelection: () => void;
  onDuplicateSelection: () => void;
  onDeleteSelection: () => void;
  onGroupSelection: () => void;
  onUngroupSelection: () => void;
  onSetSelectedNodesLocked: (locked: boolean) => void;
  onMatchSelectedNodeSize: (action: MatchSizeAction) => void;
  onAutoRouteSelectedEdge: () => void;
  onNodeLabelDraftChange: Dispatch<SetStateAction<NodeLabelDraft>>;
  onEdgeLabelDraftChange: Dispatch<SetStateAction<EdgeLabelDraft>>;
  onCommitNodeLabelEdit: () => void;
  onCancelNodeLabelEdit: () => void;
  onCommitEdgeLabelEdit: () => void;
  onCancelEdgeLabelEdit: () => void;
  onFocusComment: (comment: DiagramComment) => void;
  onGetGroupSelectionIds: (nodes: DiagramNode[], id: string) => Set<string>;
  onClearAlignmentGuides: () => void;
  onResetZoom: () => void;
  onFitSelection: () => void;
  onFitCanvas: () => void;
  onSnapToGridChange: (value: boolean) => void;
  onShowRulersChange: (value: boolean) => void;
  onGridSizeChange: (value: number) => void;
  onGridVariantChange: (value: GridVariant) => void;
  onPagePresetChange: (value: PagePreset) => void;
  onCanvasBackgroundChange: (value: string) => void;
};

export function CanvasWorkspace({
  canvasRegionRef,
  nodeEditorRef,
  edgeEditorRef,
  nodes,
  edges,
  selectedNodes,
  selectedEdges,
  openComments,
  activeCommentId,
  reactFlow,
  tool,
  previewMode,
  canvasBackground,
  canvasSize,
  viewport,
  showRulers,
  showGrid,
  snapToGrid,
  gridSize,
  gridVariant,
  pagePreset,
  pageFrame,
  alignmentGuides,
  editingNode,
  editingNodeLabel,
  editingEdge,
  editingEdgeLabel,
  editingEdgePosition,
  onReactFlowChange,
  onViewportChange,
  onZoomChange,
  onCursorPositionChange,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onReconnect,
  onDrop,
  onNodeDrag,
  onNodeDragStop,
  onSetNodes,
  onSetEdges,
  onSelectionChange,
  onContextMenuChange,
  onStartNodeLabelEdit,
  onStartEdgeLabelEdit,
  onCopySelection,
  onDuplicateSelection,
  onDeleteSelection,
  onGroupSelection,
  onUngroupSelection,
  onSetSelectedNodesLocked,
  onMatchSelectedNodeSize,
  onAutoRouteSelectedEdge,
  onNodeLabelDraftChange,
  onEdgeLabelDraftChange,
  onCommitNodeLabelEdit,
  onCancelNodeLabelEdit,
  onCommitEdgeLabelEdit,
  onCancelEdgeLabelEdit,
  onFocusComment,
  onGetGroupSelectionIds,
  onResetZoom,
  onFitSelection,
  onFitCanvas,
  onSnapToGridChange,
  onShowRulersChange,
  onGridSizeChange,
  onGridVariantChange,
  onPagePresetChange,
  onCanvasBackgroundChange,
  onClearAlignmentGuides
}: CanvasWorkspaceProps) {
  const [cursorPosition, setCursorPosition] = useState<CanvasPoint | null>(null);
  const pendingCursorPositionRef = useRef<CanvasPoint | null>(null);
  const cursorFrameRef = useRef<number | null>(null);

  const scheduleCursorPosition = useCallback(
    (position: CanvasPoint | null) => {
      pendingCursorPositionRef.current = position;
      if (cursorFrameRef.current !== null) return;
      cursorFrameRef.current = window.requestAnimationFrame(() => {
        cursorFrameRef.current = null;
        const nextPosition = pendingCursorPositionRef.current;
        setCursorPosition(nextPosition);
        onCursorPositionChange(nextPosition);
      });
    },
    [onCursorPositionChange]
  );

  useEffect(() => {
    return () => {
      if (cursorFrameRef.current !== null) {
        window.cancelAnimationFrame(cursorFrameRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={canvasRegionRef}
      className="canvas-region"
      aria-label="图表画布编辑区"
      style={{ "--canvas-background": canvasBackground } as CSSProperties}
      onMouseMove={(event) => {
        if (!reactFlow) return;
        const position = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
        scheduleCursorPosition({ x: Math.round(position.x), y: Math.round(position.y) });
      }}
      onMouseLeave={() => scheduleCursorPosition(null)}
    >
      <ReactFlow
        aria-label="图表对象画布"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={(instance) => {
          onReactFlowChange(instance);
          const nextViewport = instance.getViewport();
          onViewportChange(nextViewport);
          onZoomChange(Math.round(nextViewport.zoom * 100));
        }}
        onMoveEnd={(_, nextViewport) => {
          onViewportChange(nextViewport);
          onZoomChange(Math.round(nextViewport.zoom * 100));
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onDrop={onDrop}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onNodeDoubleClick={(event, node) => {
          event.stopPropagation();
          onStartNodeLabelEdit(node.id);
        }}
        onEdgeDoubleClick={(event, edge) => {
          event.stopPropagation();
          onStartEdgeLabelEdit(edge.id);
        }}
        onNodeContextMenu={(event, node) => {
          event.preventDefault();
          const selectedIds = onGetGroupSelectionIds(nodes, node.id);
          onSetNodes((current) => current.map((item) => ({ ...item, selected: selectedIds.has(item.id) })));
          onSetEdges((current) => current.map((item) => ({ ...item, selected: false })));
          onSelectionChange({ type: "node", id: node.id });
          onContextMenuChange({ x: event.clientX, y: event.clientY, target: "node", id: node.id });
        }}
        onEdgeContextMenu={(event, edge) => {
          event.preventDefault();
          onSetEdges((current) => current.map((item) => ({ ...item, selected: item.id === edge.id })));
          onSetNodes((current) => current.map((item) => ({ ...item, selected: false })));
          onSelectionChange({ type: "edge", id: edge.id });
          onContextMenuChange({ x: event.clientX, y: event.clientY, target: "edge", id: edge.id });
        }}
        onPaneContextMenu={(event) => {
          event.preventDefault();
          onContextMenuChange({
            x: event.clientX,
            y: event.clientY,
            target: "pane",
            flowPosition: reactFlow?.screenToFlowPosition({ x: event.clientX, y: event.clientY })
          });
        }}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={() => {
          onClearAlignmentGuides();
          window.setTimeout(onNodeDragStop, 0);
        }}
        onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
          if (selectedNodes.length === 1 && selectedNodes[0].data.groupId) {
            const selectedIds = onGetGroupSelectionIds(nodes, selectedNodes[0].id);
            if (selectedIds.size > 1) {
              onSetNodes((current) => current.map((item) => ({ ...item, selected: selectedIds.has(item.id) })));
              onSetEdges((current) => current.map((item) => ({ ...item, selected: false })));
              onSelectionChange({ type: "node", id: selectedNodes[0].id });
              return;
            }
          }
          if (selectedNodes[0]) {
            onSelectionChange({ type: "node", id: selectedNodes[0].id });
          } else if (selectedEdges[0]) {
            onSelectionChange({ type: "edge", id: selectedEdges[0].id });
          } else {
            onSelectionChange(null);
          }
        }}
        onPaneClick={() => {
          onSelectionChange(null);
          onContextMenuChange(null);
        }}
        panOnDrag={tool === "pan" ? [0, 1, 2] : [1, 2]}
        nodesConnectable={!previewMode && tool !== "pan"}
        elementsSelectable={!previewMode && tool !== "pan"}
        nodesDraggable={!previewMode}
        edgesReconnectable={!previewMode}
        selectionOnDrag={tool === "select"}
        deleteKeyCode={null}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        fitView
      >
        {showRulers ? <CanvasRulers viewport={viewport} size={canvasSize} /> : null}
        {showGrid ? <Background variant={GRID_BACKGROUND_VARIANTS[gridVariant]} gap={gridSize * 2} color="#d9dee8" /> : null}
        {pageFrame ? (
          <ViewportPortal>
            <div
              className="page-frame"
              aria-hidden="true"
              style={{ "--page-width": `${pageFrame.width}px`, "--page-height": `${pageFrame.height}px` } as CSSProperties}
            />
          </ViewportPortal>
        ) : null}
        <MiniMap nodeStrokeWidth={3} nodeColor={(node) => String((node as DiagramNode).data.fill)} pannable zoomable />
        <Controls showInteractive={false} />
        {alignmentGuides.x.length || alignmentGuides.y.length ? (
          <ViewportPortal>
            <div className="alignment-guides" aria-hidden="true">
              {alignmentGuides.x.map((x) => (
                <span key={`x-${x}`} className="alignment-guide vertical" style={{ "--guide-x": `${x}px` } as CSSProperties} />
              ))}
              {alignmentGuides.y.map((y) => (
                <span key={`y-${y}`} className="alignment-guide horizontal" style={{ "--guide-y": `${y}px` } as CSSProperties} />
              ))}
            </div>
          </ViewportPortal>
        ) : null}
        {openComments.length ? (
          <ViewportPortal>
            <div className="comment-markers" aria-label="画布批注">
              {openComments.map((comment) => {
                const position = getCommentMarkerPosition(comment, nodes, edges);
                if (!position) return null;
                return (
                  <button
                    key={comment.id}
                    className={`comment-marker nodrag nopan${comment.id === activeCommentId ? " active" : ""}`}
                    aria-label={`打开批注: ${comment.text}`}
                    aria-current={comment.id === activeCommentId ? "true" : undefined}
                    style={{ "--comment-x": `${position.x}px`, "--comment-y": `${position.y}px` } as CSSProperties}
                    onClick={(event) => {
                      event.stopPropagation();
                      onFocusComment(comment);
                    }}
                    title={comment.text}
                  >
                    <MessageSquare size={13} />
                  </button>
                );
              })}
            </div>
          </ViewportPortal>
        ) : null}
        {!previewMode && !editingNode && !editingEdge && (selectedNodes.length > 0 || selectedEdges.length === 1) ? (
          <ViewportPortal>
            <SelectionQuickToolbar
              nodes={nodes}
              selectedNodes={selectedNodes}
              selectedEdges={selectedEdges}
              onEdit={() => {
                if (selectedNodes.length === 1) onStartNodeLabelEdit(selectedNodes[0].id);
                if (selectedEdges.length === 1) onStartEdgeLabelEdit(selectedEdges[0].id);
              }}
              onCopy={onCopySelection}
              onDuplicate={onDuplicateSelection}
              onDelete={onDeleteSelection}
              onGroup={onGroupSelection}
              onUngroup={onUngroupSelection}
              onSetLocked={onSetSelectedNodesLocked}
              onMatchSize={onMatchSelectedNodeSize}
              onAutoRouteEdge={onAutoRouteSelectedEdge}
              onFitSelection={onFitSelection}
            />
          </ViewportPortal>
        ) : null}
        {editingNode && editingNodeLabel ? (
          <ViewportPortal>
            <textarea
              ref={nodeEditorRef}
              className="inline-node-editor nodrag nopan"
              aria-label="节点文本编辑"
              value={editingNodeLabel.value}
              style={
                {
                  "--editor-x": `${editingNode.position.x}px`,
                  "--editor-y": `${editingNode.position.y}px`,
                  "--editor-width": `${editingNode.data.width}px`,
                  "--editor-height": `${editingNode.data.height}px`,
                  "--editor-fill": editingNode.data.shape === "text" ? "#ffffff" : editingNode.data.fill,
                  "--editor-stroke": editingNode.data.stroke,
                  "--editor-border-width": `${getNodeStrokeWidth(editingNode.data)}px`,
                  "--editor-border-style": getNodeStrokeStyle(editingNode.data),
                  "--editor-opacity": `${getNodeOpacity(editingNode.data)}`,
                  "--editor-text": editingNode.data.text,
                  "--editor-font": `${editingNode.data.fontSize}px`,
                  "--editor-align": editingNode.data.textAlign ?? "center",
                  "--editor-family": getFontFamily(editingNode.data.fontFamily),
                  "--editor-weight": (editingNode.data.bold ?? true) ? "700" : "400",
                  "--editor-style": editingNode.data.italic ? "italic" : "normal",
                  "--editor-decoration": editingNode.data.underline ? "underline" : "none"
                } as CSSProperties
              }
              onChange={(event) => onNodeLabelDraftChange({ id: editingNodeLabel.id, value: event.target.value })}
              onBlur={onCommitNodeLabelEdit}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancelNodeLabelEdit();
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onCommitNodeLabelEdit();
                }
              }}
            />
          </ViewportPortal>
        ) : null}
        {editingEdge && editingEdgeLabel && editingEdgePosition ? (
          <ViewportPortal>
            <textarea
              ref={edgeEditorRef}
              className="inline-edge-editor nodrag nopan"
              aria-label="连线文本编辑"
              value={editingEdgeLabel.value}
              rows={Math.min(4, Math.max(1, editingEdgeLabel.value.split(/\r?\n/).length))}
              style={
                {
                  "--edge-editor-x": `${editingEdgePosition.x}px`,
                  "--edge-editor-y": `${editingEdgePosition.y}px`,
                  "--edge-editor-stroke": getEdgeStroke(editingEdge),
                  "--edge-editor-text": getEdgeLabelColor(editingEdge),
                  "--edge-editor-font": `${getEdgeLabelFontSize(editingEdge)}px`
                } as CSSProperties
              }
              onChange={(event) => onEdgeLabelDraftChange({ id: editingEdgeLabel.id, value: event.target.value })}
              onBlur={onCommitEdgeLabelEdit}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancelEdgeLabelEdit();
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onCommitEdgeLabelEdit();
                }
              }}
            />
          </ViewportPortal>
        ) : null}
        <Panel position="bottom-center" className="floating-zoom">
          <IconButton label="缩小" onClick={() => reactFlow?.zoomOut()} icon={ZoomOut} />
          <IconButton label="实际大小" onClick={onResetZoom} icon={RotateCcw} />
          <IconButton label="放大" onClick={() => reactFlow?.zoomIn()} icon={ZoomIn} />
          <IconButton label="适应选中" disabled={selectedNodes.length === 0} onClick={onFitSelection} icon={Focus} />
          <IconButton label="适应画布" onClick={onFitCanvas} icon={Maximize2} />
        </Panel>
        <Panel position="top-right" className="canvas-settings">
          <label className="mini-check">
            <input type="checkbox" checked={snapToGrid} onChange={(event) => onSnapToGridChange(event.target.checked)} />
            <span>吸附</span>
          </label>
          <label className="mini-check">
            <input type="checkbox" checked={showRulers} onChange={(event) => onShowRulersChange(event.target.checked)} />
            <span>标尺</span>
          </label>
          <label className="grid-size-control">
            <span>网格</span>
            <input
              type="number"
              aria-label="网格步长"
              min={4}
              max={48}
              step={2}
              value={gridSize}
              onChange={(event) => {
                const value = Number(event.target.value);
                onGridSizeChange(Number.isFinite(value) ? Math.min(48, Math.max(4, Math.round(value))) : DEFAULT_CANVAS_SETTINGS.gridSize);
              }}
            />
          </label>
          <label className="grid-variant-control">
            <span>样式</span>
            <select aria-label="网格样式" value={gridVariant} onChange={(event) => onGridVariantChange(event.target.value as GridVariant)}>
              <option value="lines">线</option>
              <option value="dots">点</option>
              <option value="cross">十字</option>
            </select>
          </label>
          <label className="page-size-control">
            <span>页面</span>
            <select aria-label="页面尺寸" value={pagePreset} onChange={(event) => onPagePresetChange(event.target.value as PagePreset)}>
              <option value="content">内容</option>
              <option value="a4Portrait">A4竖</option>
              <option value="a4Landscape">A4横</option>
              <option value="wide">16:9</option>
            </select>
          </label>
          <label className="canvas-background-control">
            <span>背景</span>
            <input type="color" aria-label="画布背景" value={canvasBackground} onChange={(event) => onCanvasBackgroundChange(event.target.value)} />
          </label>
          <span className="coordinate-readout" aria-label="画布坐标">
            X {cursorPosition ? cursorPosition.x : "--"} Y {cursorPosition ? cursorPosition.y : "--"}
          </span>
        </Panel>
      </ReactFlow>
    </section>
  );
}

function getCommentMarkerPosition(comment: DiagramComment, nodes: DiagramNode[], edges: DiagramEdge[]) {
  if (comment.target === "node" && comment.targetId) {
    const node = nodes.find((item) => item.id === comment.targetId);
    if (!node) return null;
    return { x: node.position.x + node.data.width + 10, y: node.position.y - 10 };
  }
  if (comment.target === "edge" && comment.targetId) {
    const edge = edges.find((item) => item.id === comment.targetId);
    if (!edge) return null;
    return getEdgeLabelPosition(edge, nodes);
  }
  return { x: comment.x, y: comment.y };
}
