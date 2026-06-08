import { FileClock, FilePlus2, FolderOpen, History, LayoutTemplate, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { shapeCategoryMap } from "../domain/diagramDefaults";
import {
  buildWorkspaceTemplateItems,
  filterWorkspaceTemplates,
  getLocalDocumentIdentity,
  getRecentDocumentDisplayPath,
  getRecentDocumentDirectory,
  getRecentDocumentFormat,
  getWorkspaceSummary,
  workspaceTemplateCategories,
  type WorkspaceTemplateFilterCategory
} from "../domain/localWorkspace";
import type { DiagramTemplate } from "../domain/types";
import type { RecentDocument } from "../io/recentDocuments";
import { DiagramThumbnail } from "./DiagramThumbnail";
import "./localWorkspacePanel.css";

type LocalWorkspacePanelProps = {
  open: boolean;
  documentName: string;
  documentDirty: boolean;
  documentPath: string | null;
  documentStatus: string;
  recentDocuments: RecentDocument[];
  templates: DiagramTemplate[];
  onClose: () => void;
  onNewDocument: () => void;
  onOpenDocument: () => void;
  onOpenRecentDocument: (path: string) => void | Promise<void | boolean>;
  onForgetRecentDocument: (path: string) => void;
  onClearRecentDocuments: () => void;
  onApplyTemplate: (template: DiagramTemplate) => void;
  onDeleteCustomTemplate: (templateId: string) => void;
  favoriteTemplateIds: ReadonlySet<string>;
  onToggleTemplateFavorite: (templateId: string) => void;
  formatVersionTime: (value: string) => string;
};

export function LocalWorkspacePanel({
  open,
  documentName,
  documentDirty,
  documentPath,
  documentStatus,
  recentDocuments,
  templates,
  onClose,
  onNewDocument,
  onOpenDocument,
  onOpenRecentDocument,
  onForgetRecentDocument,
  onClearRecentDocuments,
  onApplyTemplate,
  onDeleteCustomTemplate,
  favoriteTemplateIds,
  onToggleTemplateFavorite,
  formatVersionTime
}: LocalWorkspacePanelProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<WorkspaceTemplateFilterCategory>("all");
  const templateItems = useMemo(() => buildWorkspaceTemplateItems(templates, shapeCategoryMap), [templates]);
  const visibleTemplates = useMemo(
    () => filterWorkspaceTemplates(templateItems, query, category, favoriteTemplateIds),
    [category, favoriteTemplateIds, query, templateItems]
  );
  const summary = useMemo(
    () => getWorkspaceSummary(templateItems, recentDocuments.length, favoriteTemplateIds),
    [favoriteTemplateIds, recentDocuments.length, templateItems]
  );
  const documentIdentity = useMemo(
    () => getLocalDocumentIdentity({ documentPath, documentName, documentStatus, documentDirty }),
    [documentDirty, documentName, documentPath, documentStatus]
  );
  const deleteCustomTemplate = (template: DiagramTemplate) => {
    if (!template.custom) return;
    onDeleteCustomTemplate(template.id);
  };

  if (!open) return null;

  return (
    <section className="local-workspace" aria-label="本地工作台">
      <div className="local-workspace-header">
        <div>
          <span className="local-workspace-kicker">Structra / Local Desktop</span>
          <h1>本地工作台</h1>
          <p>
            {documentIdentity.title}{documentDirty ? " · 有未保存更改" : " · 已进入本地编辑状态"}
          </p>
        </div>
      </div>

      <div className="workspace-actions" aria-label="本地文件入口">
        <button type="button" onClick={onNewDocument}>
          <FilePlus2 size={19} />
          <strong>空白文档</strong>
          <span>从干净页面开始</span>
        </button>
        <button type="button" onClick={onOpenDocument}>
          <FolderOpen size={19} />
          <strong>打开本机文件</strong>
          <span>.structra / JSON</span>
        </button>
        <button type="button" onClick={onClose}>
          <LayoutTemplate size={19} />
          <strong>继续编辑</strong>
          <span>回到当前画布</span>
        </button>
      </div>

      <div className="workspace-stats" aria-label="本地资产统计">
        <span><strong>{summary.recentCount}</strong> 最近文档</span>
        <span><strong>{summary.templateCount}</strong> 模板</span>
        <span><strong>{summary.favoriteCount}</strong> 收藏</span>
        <span><strong>{summary.customCount}</strong> 本地模板</span>
        <span><strong>{summary.builtInCount}</strong> 内置模板</span>
      </div>

      <div className="workspace-content">
        <section className="workspace-recent" aria-label="最近打开">
          <div className="workspace-section-title">
            <span>
              <History size={16} />
              最近打开
            </span>
            {recentDocuments.length > 0 ? (
              <button type="button" className="workspace-section-action" onClick={onClearRecentDocuments}>
                清空
              </button>
            ) : null}
          </div>
          <div className="workspace-recent-list">
            {recentDocuments.length === 0 ? (
              <div className="workspace-empty">
                <FileClock size={18} />
                <strong>暂无最近文档</strong>
                <span>保存或打开本机文件后会显示在这里。</span>
              </div>
            ) : (
              recentDocuments.map((item) => {
                const format = getRecentDocumentFormat(item.path);
                const directory = getRecentDocumentDirectory(item.path);
                return (
                  <div className="workspace-recent-row" key={item.path}>
                    <button type="button" className="workspace-recent-open" onClick={() => void onOpenRecentDocument(item.path)} title={item.path}>
                      <span className={`workspace-recent-badge ${format.kind}`} title={format.title}>
                        {format.label}
                      </span>
                      <strong>{item.name}</strong>
                      <span>{getRecentDocumentDisplayPath(item.path)}</span>
                      <em>{directory ? `${directory} · ${formatVersionTime(item.openedAt)}` : formatVersionTime(item.openedAt)}</em>
                    </button>
                    <button type="button" className="workspace-recent-remove" aria-label={`移除最近文档 ${item.name}`} onClick={() => onForgetRecentDocument(item.path)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="workspace-templates" aria-label="模板中心">
          <div className="workspace-template-toolbar">
            <div className="workspace-section-title">
              <LayoutTemplate size={16} />
              <span>模板中心</span>
            </div>
            <label className="workspace-search">
              <Search size={15} />
              <input value={query} placeholder="搜索模板、图形、页面文本" aria-label="搜索模板" onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
          <div className="workspace-template-tabs" role="tablist" aria-label="模板分类">
            {workspaceTemplateCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={category === item.id}
                className={category === item.id ? "active" : ""}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="workspace-template-grid">
            {visibleTemplates.length === 0 ? (
              <div className="workspace-empty wide">
                <LayoutTemplate size={18} />
                <strong>无匹配模板</strong>
                <span>换一个关键词或分类继续查找。</span>
              </div>
            ) : (
              visibleTemplates.map((item) => {
                const favorite = favoriteTemplateIds.has(item.template.id);
                return (
                  <div key={item.template.id} className="workspace-template-entry">
                    <button
                      type="button"
                      className="template-button workspace-template-card"
                      onClick={() => onApplyTemplate(item.template)}
                      title={item.template.description}
                    >
                      <DiagramThumbnail nodes={item.template.nodes} edges={item.template.edges} className="template-thumbnail" />
                      <span className="workspace-template-meta">
                        <strong>{item.template.name}</strong>
                        <span>{item.template.description}</span>
                        <em>
                          {item.nodeCount} 节点 / {item.edgeCount} 连线 · {item.template.custom ? "本地模板" : "内置模板"}
                        </em>
                      </span>
                    </button>
                    <div className="workspace-template-actions">
                      <button
                        type="button"
                        className={`workspace-template-favorite${favorite ? " active" : ""}`}
                        aria-label={`${favorite ? "取消收藏模板" : "收藏模板"} ${item.template.name}`}
                        aria-pressed={favorite}
                        title={favorite ? "取消收藏" : "收藏"}
                        onClick={() => onToggleTemplateFavorite(item.template.id)}
                      >
                        <Star size={14} fill={favorite ? "currentColor" : "none"} />
                      </button>
                      {item.template.custom ? (
                        <button
                          type="button"
                          className="workspace-template-delete"
                          aria-label={`删除本地模板 ${item.template.name}`}
                          title="删除"
                          onClick={() => deleteCustomTemplate(item.template)}
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
