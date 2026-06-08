import { PanelRight } from "lucide-react";

import type { CanvasSettings, DiagramComment, DiagramEdge, DiagramNode, DiagramNodeData, DiagramVersion } from "../domain/types";
import { CommentsPanel, VersionHistoryPanel } from "./ReviewPanels";
import { BatchEdgeInspector, BatchInspector, DocumentInspector, EdgeInspector, NodeInspector } from "./Inspectors";

type PropertySidebarProps = {
  selectedNodes: DiagramNode[];
  selectedNode?: DiagramNode;
  selectedEdges: DiagramEdge[];
  selectedEdge?: DiagramEdge;
  pageName: string;
  pageCount: number;
  nodeCount: number;
  edgeCount: number;
  canvasSettings: CanvasSettings;
  versions: DiagramVersion[];
  comments: DiagramComment[];
  activeCommentId: string | null;
  commentDraft: string;
  commentReplyDrafts: Record<string, string>;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  formatVersionTime: (value: string) => string;
  onSelectedNodesChange: (patch: Partial<DiagramNodeData>) => void;
  onNodeChange: (patch: Partial<DiagramNodeData>) => void;
  onNodePositionChange: (patch: Partial<{ x: number; y: number }>) => void;
  onSelectedEdgesChange: (patch: Partial<DiagramEdge>) => void;
  onEdgeChange: (patch: Partial<DiagramEdge>) => void;
  onAutoRouteEdge: () => void;
  onCanvasSettingsChange: (patch: Partial<CanvasSettings>) => void;
  onSaveVersion: () => void;
  onRestoreVersion: (version: DiagramVersion) => void;
  onDeleteVersion: (id: string) => void;
  onCommentDraftChange: (value: string) => void;
  onCommentReplyDraftChange: (id: string, value: string) => void;
  onAddComment: () => void;
  onAddCommentReply: (id: string) => void;
  onFocusComment: (comment: DiagramComment) => void;
  onResolveComment: (id: string, resolved: boolean) => void;
  onDeleteComment: (id: string) => void;
};

export function PropertySidebar({
  selectedNodes,
  selectedNode,
  selectedEdges,
  selectedEdge,
  pageName,
  pageCount,
  nodeCount,
  edgeCount,
  canvasSettings,
  versions,
  comments,
  activeCommentId,
  commentDraft,
  commentReplyDrafts,
  nodes,
  edges,
  formatVersionTime,
  onSelectedNodesChange,
  onNodeChange,
  onNodePositionChange,
  onSelectedEdgesChange,
  onEdgeChange,
  onAutoRouteEdge,
  onCanvasSettingsChange,
  onSaveVersion,
  onRestoreVersion,
  onDeleteVersion,
  onCommentDraftChange,
  onCommentReplyDraftChange,
  onAddComment,
  onAddCommentReply,
  onFocusComment,
  onResolveComment,
  onDeleteComment
}: PropertySidebarProps) {
  return (
    <aside className="property-panel">
      <div className="panel-title">
        <PanelRight size={16} />
        <span>属性</span>
      </div>
      {selectedNodes.length > 1 ? (
        <BatchInspector nodes={selectedNodes} onChange={onSelectedNodesChange} />
      ) : selectedNode ? (
        <NodeInspector node={selectedNode} onChange={onNodeChange} onPositionChange={onNodePositionChange} />
      ) : selectedEdges.length > 1 ? (
        <BatchEdgeInspector count={selectedEdges.length} sample={selectedEdges[0]} onChange={onSelectedEdgesChange} />
      ) : selectedEdge ? (
        <EdgeInspector edge={selectedEdge} onChange={onEdgeChange} onAutoRoute={onAutoRouteEdge} />
      ) : (
        <DocumentInspector
          pageName={pageName}
          pageCount={pageCount}
          nodeCount={nodeCount}
          edgeCount={edgeCount}
          settings={canvasSettings}
          onChange={onCanvasSettingsChange}
        />
      )}
      <VersionHistoryPanel versions={versions} onSave={onSaveVersion} onRestore={onRestoreVersion} onDelete={onDeleteVersion} formatVersionTime={formatVersionTime} />
      <CommentsPanel
        comments={comments}
        activeCommentId={activeCommentId}
        draft={commentDraft}
        replyDrafts={commentReplyDrafts}
        targetLabel={getCommentDraftTargetLabel(selectedNode, selectedEdge)}
        nodes={nodes}
        edges={edges}
        onDraftChange={onCommentDraftChange}
        onReplyDraftChange={onCommentReplyDraftChange}
        onAdd={onAddComment}
        onAddReply={onAddCommentReply}
        onFocus={onFocusComment}
        onResolve={onResolveComment}
        onDelete={onDeleteComment}
      />
    </aside>
  );
}

function getCommentDraftTargetLabel(selectedNode: DiagramNode | undefined, selectedEdge: DiagramEdge | undefined) {
  if (selectedNode) return `添加到节点：${selectedNode.data.label}`;
  if (selectedEdge) return `添加到连线：${String(selectedEdge.label || selectedEdge.id)}`;
  return "添加到画布当前位置";
}
