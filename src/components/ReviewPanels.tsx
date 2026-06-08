import { CheckCircle2, History, MessageSquare } from "lucide-react";

import type { DiagramComment, DiagramEdge, DiagramNode, DiagramVersion } from "../domain/types";

export function VersionHistoryPanel({
  versions,
  onSave,
  onRestore,
  onDelete,
  formatVersionTime
}: {
  versions: DiagramVersion[];
  onSave: () => void;
  onRestore: (version: DiagramVersion) => void;
  onDelete: (id: string) => void;
  formatVersionTime: (value: string) => string;
}) {
  return (
    <section className="version-panel" aria-label="本地版本历史">
      <div className="version-title">
        <span>
          <History size={15} />
          本地版本
        </span>
        <button onClick={onSave}>保存版本</button>
      </div>
      <div className="version-list">
        {versions.length === 0 ? (
          <div className="version-empty">暂无本地版本</div>
        ) : (
          versions.map((version) => (
            <article key={version.id} className="version-item">
              <button className="version-body" onClick={() => onRestore(version)}>
                <strong>{version.name}</strong>
                <span>
                  {version.pages.length} 页 · {version.pages.reduce((sum, page) => sum + page.nodes.length, 0)} 节点
                </span>
                <em>{formatVersionTime(version.createdAt)}</em>
              </button>
              <button className="version-delete" onClick={() => onDelete(version.id)}>
                删除
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function CommentsPanel({
  comments,
  activeCommentId,
  draft,
  replyDrafts,
  targetLabel,
  nodes,
  edges,
  onDraftChange,
  onReplyDraftChange,
  onAdd,
  onAddReply,
  onFocus,
  onResolve,
  onDelete
}: {
  comments: DiagramComment[];
  activeCommentId: string | null;
  draft: string;
  replyDrafts: Record<string, string>;
  targetLabel: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  onDraftChange: (value: string) => void;
  onReplyDraftChange: (id: string, value: string) => void;
  onAdd: () => void;
  onAddReply: (id: string) => void;
  onFocus: (comment: DiagramComment) => void;
  onResolve: (id: string, resolved: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const openComments = comments.filter((comment) => !comment.resolved);
  const resolvedComments = comments.filter((comment) => comment.resolved);

  return (
    <section className="comments-panel" aria-label="本地审阅批注">
      <div className="comments-title">
        <span>
          <MessageSquare size={15} />
          审阅批注
        </span>
        <em>{openComments.length} 未解决</em>
      </div>
      <div className="comment-compose">
        <span>{targetLabel}</span>
        <textarea value={draft} rows={3} placeholder="记录问题、改动建议或评审结论" onChange={(event) => onDraftChange(event.target.value)} />
        <button disabled={!draft.trim()} onClick={onAdd}>
          添加批注
        </button>
      </div>
      <div className="comment-list">
        {comments.length === 0 ? (
          <div className="comment-empty">暂无批注</div>
        ) : (
          [...openComments, ...resolvedComments].map((comment) => (
            <article key={comment.id} className={`comment-item${comment.id === activeCommentId ? " active" : ""}${comment.resolved ? " resolved" : ""}`}>
              <button className="comment-body" onClick={() => onFocus(comment)}>
                <strong>{getCommentTargetLabel(comment, nodes, edges)}</strong>
                <span>{comment.text}</span>
                <em>{formatCommentTime(comment.createdAt)}</em>
              </button>
              {comment.replies?.length ? (
                <div className="comment-replies">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="comment-reply">
                      <span>{reply.text}</span>
                      <em>{formatCommentTime(reply.createdAt)}</em>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="comment-reply-compose">
                <textarea
                  aria-label={`回复批注 ${comment.id}`}
                  rows={2}
                  value={replyDrafts[comment.id] ?? ""}
                  placeholder="回复讨论"
                  onChange={(event) => onReplyDraftChange(comment.id, event.target.value)}
                />
                <button disabled={!replyDrafts[comment.id]?.trim()} onClick={() => onAddReply(comment.id)}>
                  回复
                </button>
              </div>
              <div className="comment-actions">
                <button onClick={() => onResolve(comment.id, !comment.resolved)}>
                  <CheckCircle2 size={13} />
                  {comment.resolved ? "重开" : "解决"}
                </button>
                <button onClick={() => onDelete(comment.id)}>删除</button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function getCommentTargetLabel(comment: DiagramComment, nodes: DiagramNode[], edges: DiagramEdge[]) {
  if (comment.target === "node" && comment.targetId) {
    const node = nodes.find((item) => item.id === comment.targetId);
    return node ? `节点：${node.data.label}` : "节点：已删除";
  }
  if (comment.target === "edge" && comment.targetId) {
    const edge = edges.find((item) => item.id === comment.targetId);
    return edge ? `连线：${String(edge.label || edge.id)}` : "连线：已删除";
  }
  return `画布：X ${Math.round(comment.x)} / Y ${Math.round(comment.y)}`;
}

function formatCommentTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
