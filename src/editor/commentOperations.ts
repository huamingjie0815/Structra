import type { DiagramComment, DiagramCommentReply } from "../domain/types";

export type CommentAnchor = Pick<DiagramComment, "target" | "targetId" | "x" | "y">;

export type AddCommentResult = {
  comments: DiagramComment[];
  comment: DiagramComment;
  commentDraft: string;
  activeCommentId: string;
};

export type DeleteCommentResult = {
  comments: DiagramComment[];
  commentReplyDrafts: Record<string, string>;
  activeCommentId: string | null;
};

export type AddCommentReplyResult = {
  comments: DiagramComment[];
  reply: DiagramCommentReply;
  commentReplyDrafts: Record<string, string>;
  activeCommentId: string;
};

export function addComment(
  comments: readonly DiagramComment[],
  draft: string,
  anchor: CommentAnchor,
  commentId: string,
  createdAt: string
): AddCommentResult | null {
  const text = draft.trim();
  if (!text) return null;

  const comment: DiagramComment = {
    id: commentId,
    ...anchor,
    text,
    createdAt,
    replies: []
  };

  return {
    comments: [comment, ...comments],
    comment,
    commentDraft: "",
    activeCommentId: comment.id
  };
}

export function setCommentResolved(comments: readonly DiagramComment[], id: string, resolved: boolean): DiagramComment[] {
  return comments.map((comment) => (comment.id === id ? { ...comment, resolved } : comment));
}

export function deleteComment(
  comments: readonly DiagramComment[],
  commentReplyDrafts: Readonly<Record<string, string>>,
  id: string,
  activeCommentId: string | null
): DeleteCommentResult {
  const nextDrafts = { ...commentReplyDrafts };
  delete nextDrafts[id];

  return {
    comments: comments.filter((comment) => comment.id !== id),
    commentReplyDrafts: nextDrafts,
    activeCommentId: activeCommentId === id ? null : activeCommentId
  };
}

export function addCommentReply(
  comments: readonly DiagramComment[],
  commentReplyDrafts: Readonly<Record<string, string>>,
  id: string,
  replyId: string,
  createdAt: string
): AddCommentReplyResult | null {
  const text = commentReplyDrafts[id]?.trim();
  if (!text) return null;

  const reply: DiagramCommentReply = { id: replyId, text, createdAt };

  return {
    comments: comments.map((comment) => (comment.id === id ? { ...comment, replies: [...(comment.replies ?? []), reply] } : comment)),
    reply,
    commentReplyDrafts: { ...commentReplyDrafts, [id]: "" },
    activeCommentId: id
  };
}
