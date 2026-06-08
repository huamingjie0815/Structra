import type { ReactFlowInstance } from "@xyflow/react";
import { useCallback, useMemo, type RefObject } from "react";
import type { CanvasPoint, CanvasSize, DiagramComment, DiagramDocument, DiagramEdge, DiagramNode, Selection } from "../../domain/types";
import {
  addComment as addCommentOperation,
  addCommentReply as addCommentReplyOperation,
  deleteComment as deleteCommentOperation,
  setCommentResolved as setCommentResolvedOperation
} from "../../editor/commentOperations";
import { replaceActivePageSnapshotCommand } from "../../editor/commands";
import { getEdgeLabelPosition } from "../../editor/edgeGeometry";
import type { HistoryEntry } from "../../editor/history";

export function useCommentWorkflow({
  comments,
  commentDraft,
  commentReplyDrafts,
  activeCommentId,
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  getCursorPosition,
  canvasSize,
  canvasRegionRef,
  reactFlow,
  setCommentDraft,
  setCommentReplyDrafts,
  setActiveCommentId,
  focusCommentTarget,
  currentDocument,
  activePageId,
  selection,
  applyDocumentTransaction
}: {
  comments: DiagramComment[];
  commentDraft: string;
  commentReplyDrafts: Record<string, string>;
  activeCommentId: string | null;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selectedNode: DiagramNode | undefined;
  selectedEdge: DiagramEdge | undefined;
  getCursorPosition: () => CanvasPoint | null;
  canvasSize: CanvasSize;
  canvasRegionRef: RefObject<HTMLElement>;
  reactFlow: ReactFlowInstance<DiagramNode, DiagramEdge> | null;
  setCommentDraft: (draft: string) => void;
  setCommentReplyDrafts: (drafts: Record<string, string>) => void;
  setActiveCommentId: (commentId: string | null) => void;
  focusCommentTarget: (comment: DiagramComment) => void;
  currentDocument: DiagramDocument;
  activePageId: string;
  selection: Selection;
  applyDocumentTransaction: (entry: HistoryEntry, fitView?: boolean) => void;
}) {
  const openComments = useMemo(() => comments.filter((comment) => !comment.resolved), [comments]);

  const commitComments = useCallback(
    (nextComments: DiagramComment[]) => {
      const entry = replaceActivePageSnapshotCommand(currentDocument, activePageId, { nodes, edges, comments: nextComments }, selection);
      if (entry) {
        applyDocumentTransaction(entry);
      }
    },
    [activePageId, applyDocumentTransaction, currentDocument, edges, nodes, selection]
  );

  const getCommentAnchor = useCallback((): Pick<DiagramComment, "target" | "targetId" | "x" | "y"> => {
    if (selectedNode) {
      return {
        target: "node",
        targetId: selectedNode.id,
        x: selectedNode.position.x + selectedNode.data.width + 18,
        y: selectedNode.position.y - 14
      };
    }

    if (selectedEdge) {
      const position = getEdgeLabelPosition(selectedEdge, nodes);
      if (position) {
        return { target: "edge", targetId: selectedEdge.id, x: position.x + 18, y: position.y - 18 };
      }
    }

    const cursorPosition = getCursorPosition();
    if (cursorPosition) {
      return { target: "canvas", x: cursorPosition.x, y: cursorPosition.y };
    }

    const center = reactFlow?.screenToFlowPosition({
      x: (canvasRegionRef.current?.getBoundingClientRect().left ?? 0) + canvasSize.width / 2,
      y: (canvasRegionRef.current?.getBoundingClientRect().top ?? 0) + canvasSize.height / 2
    });
    return { target: "canvas", x: Math.round(center?.x ?? 0), y: Math.round(center?.y ?? 0) };
  }, [canvasRegionRef, canvasSize.height, canvasSize.width, getCursorPosition, nodes, reactFlow, selectedEdge, selectedNode]);

  const addComment = useCallback(() => {
    const result = addCommentOperation(comments, commentDraft, getCommentAnchor(), `comment-${Date.now()}`, new Date().toISOString());
    if (!result) return;
    setCommentDraft(result.commentDraft);
    commitComments(result.comments);
    setActiveCommentId(result.activeCommentId);
  }, [commentDraft, comments, commitComments, getCommentAnchor, setActiveCommentId, setCommentDraft]);

  const setCommentResolved = useCallback(
    (id: string, resolved: boolean) => {
      const nextComments = setCommentResolvedOperation(comments, id, resolved);
      commitComments(nextComments);
    },
    [comments, commitComments]
  );

  const deleteComment = useCallback(
    (id: string) => {
      const result = deleteCommentOperation(comments, commentReplyDrafts, id, activeCommentId);
      setActiveCommentId(result.activeCommentId);
      setCommentReplyDrafts(result.commentReplyDrafts);
      commitComments(result.comments);
    },
    [activeCommentId, commentReplyDrafts, comments, commitComments, setActiveCommentId, setCommentReplyDrafts]
  );

  const addCommentReply = useCallback(
    (id: string) => {
      const result = addCommentReplyOperation(comments, commentReplyDrafts, id, `reply-${Date.now()}`, new Date().toISOString());
      if (!result) return;
      setCommentReplyDrafts(result.commentReplyDrafts);
      commitComments(result.comments);
      setActiveCommentId(result.activeCommentId);
    },
    [commentReplyDrafts, comments, commitComments, setActiveCommentId, setCommentReplyDrafts]
  );

  const focusComment = useCallback(
    (comment: DiagramComment) => {
      setActiveCommentId(comment.id);
      focusCommentTarget(comment);
    },
    [focusCommentTarget, setActiveCommentId]
  );

  return {
    openComments,
    addComment,
    setCommentResolved,
    deleteComment,
    addCommentReply,
    focusComment
  };
}
