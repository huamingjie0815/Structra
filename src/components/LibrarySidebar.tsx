import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BringToFront,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Grid3X3,
  History,
  Lock,
  PanelLeft,
  Star,
  Unlock,
  Waypoints,
  X
} from "lucide-react";

import { shapeCategories } from "../domain/diagramDefaults";
import type { DiagramNode, DiagramPage, DiagramTemplate, ShapeCategory, ShapeKind } from "../domain/types";
import { shapeLibrary, type ShapeLibraryItem } from "../features/shapes/shapeLibrary";
import type { RecentDocument } from "../io/recentDocuments";
import { DiagramThumbnail, PageThumbnail } from "./DiagramThumbnail";

export type DocumentSearchResult = {
  type: "page" | "node";
  page: DiagramPage;
  pageIndex: number;
  node?: DiagramNode;
  nodeIndex?: number;
  shapeLabel?: string;
};

type IndexedNode = { node: DiagramNode; index: number };

type LibrarySidebarProps = {
  shapeQuery: string;
  shapeCategory: ShapeCategory;
  visibleShapes: ShapeLibraryItem[];
  pages: DiagramPage[];
  activePageId: string;
  activePageIndex: number;
  draggingPageId: string | null;
  pageDropTargetId: string | null;
  documentQuery: string;
  documentSearchResults: DocumentSearchResult[];
  recentDocuments: RecentDocument[];
  templates: DiagramTemplate[];
  nodes: DiagramNode[];
  outlineQuery: string;
  outlineSearchRef: React.RefObject<HTMLInputElement>;
  visibleOutlineNodes: IndexedNode[];
  layerNodes: IndexedNode[];
  onShapeQueryChange: (value: string) => void;
  onShapeCategoryChange: (value: ShapeCategory) => void;
  onAddShape: (kind: ShapeKind) => void;
  onOpenPage: (pageId: string) => void;
  onDraggingPageChange: (pageId: string | null) => void;
  onPageDropTargetChange: (pageId: string | null) => void;
  onReorderPage: (sourceId: string, targetId: string) => void;
  onAddPage: () => void;
  onDuplicatePage: () => void;
  onMovePage: (direction: "up" | "down") => void;
  onRenamePage: () => void;
  onDeletePage: () => void;
  onDocumentQueryChange: (value: string) => void;
  onOpenDocumentSearchResult: (pageId: string, nodeId?: string) => void;
  onOpenRecentDocument: (path: string) => void | Promise<void | boolean>;
  onForgetRecentDocument: (path: string) => void;
  formatVersionTime: (value: string) => string;
  onSaveCurrentPageAsTemplate: (name: string) => void;
  onApplyTemplate: (template: DiagramTemplate) => void;
  onDeleteCustomTemplate: (templateId: string) => void;
  favoriteTemplateIds: ReadonlySet<string>;
  onToggleTemplateFavorite: (templateId: string) => void;
  onOutlineQueryChange: (value: string) => void;
  onSetNodeHidden: (nodeId: string, hidden: boolean) => void;
  onSelectNode: (nodeId: string) => void;
  onSetNodeLocked: (nodeId: string, locked: boolean) => void;
  onMoveLayerNode: (nodeId: string, direction: "up" | "down") => void;
};

export function LibrarySidebar({
  shapeQuery,
  shapeCategory,
  visibleShapes,
  pages,
  activePageId,
  activePageIndex,
  draggingPageId,
  pageDropTargetId,
  documentQuery,
  documentSearchResults,
  recentDocuments,
  templates,
  nodes,
  outlineQuery,
  outlineSearchRef,
  visibleOutlineNodes,
  layerNodes,
  onShapeQueryChange,
  onShapeCategoryChange,
  onAddShape,
  onOpenPage,
  onDraggingPageChange,
  onPageDropTargetChange,
  onReorderPage,
  onAddPage,
  onDuplicatePage,
  onMovePage,
  onRenamePage,
  onDeletePage,
  onDocumentQueryChange,
  onOpenDocumentSearchResult,
  onOpenRecentDocument,
  onForgetRecentDocument,
  formatVersionTime,
  onSaveCurrentPageAsTemplate,
  onApplyTemplate,
  onDeleteCustomTemplate,
  favoriteTemplateIds,
  onToggleTemplateFavorite,
  onOutlineQueryChange,
  onSetNodeHidden,
  onSelectNode,
  onSetNodeLocked,
  onMoveLayerNode
}: LibrarySidebarProps) {
  const [templateTab, setTemplateTab] = useState<"custom" | "system">("custom");
  const customTemplates = useMemo(() => templates.filter((template) => template.custom), [templates]);
  const systemTemplates = useMemo(() => templates.filter((template) => !template.custom), [templates]);
  const visibleTemplates = templateTab === "custom" ? customTemplates : systemTemplates;
  const [templatePromptOpen, setTemplatePromptOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const templateInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!templatePromptOpen) return;
    const input = templateInputRef.current;
    input?.focus();
    input?.select();
  }, [templatePromptOpen]);
  const openTemplatePrompt = () => {
    const activePageName = pages.find((page) => page.id === activePageId)?.name;
    setTemplateName(activePageName || "自定义模板");
    setTemplatePromptOpen(true);
  };
  const confirmTemplatePrompt = () => {
    if (!templateName.trim()) return;
    onSaveCurrentPageAsTemplate(templateName);
    setTemplatePromptOpen(false);
    setTemplateTab("custom");
  };
  return (
    <aside className="shape-panel">
      <div className="panel-title">
        <PanelLeft size={16} />
        <span>图形库</span>
      </div>
      <div className="shape-tools">
        <input
          className="shape-search"
          aria-label="搜索图形"
          value={shapeQuery}
          placeholder="搜索图形"
          onChange={(event) => onShapeQueryChange(event.target.value)}
        />
        <div className="shape-category-select-wrapper">
          <select
            className="shape-category-select"
            value={shapeCategory}
            onChange={(event) => onShapeCategoryChange(event.target.value as ShapeCategory)}
            aria-label="选择图形分类"
          >
            {shapeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="shape-category-select-icon" />
        </div>
      </div>
      <div className="shape-grid">
        {visibleShapes.map((item) => (
          <div
            key={item.kind}
            role="button"
            tabIndex={0}
            className="shape-tile"
            draggable
            onClick={() => onAddShape(item.kind)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onAddShape(item.kind); }}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData("application/structra-shape", item.kind);
            }}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </div>
        ))}
        {visibleShapes.length === 0 ? <div className="shape-empty">无匹配图形</div> : null}
      </div>
      <div className="palette-section">
        <div className="panel-subtitle">
          <FileText size={15} />
          <span>页面</span>
        </div>
        <div className="page-list">
          {pages.map((page, index) => (
            <button
              key={page.id}
              className={`page-row${page.id === activePageId ? " active" : ""}${page.id === draggingPageId ? " dragging" : ""}${page.id === pageDropTargetId && page.id !== draggingPageId ? " drop-target" : ""}`}
              draggable={pages.length > 1}
              aria-current={page.id === activePageId ? "page" : undefined}
              aria-label={`打开页面 ${index + 1}: ${page.name}`}
              onClick={() => onOpenPage(page.id)}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("application/structra-page", page.id);
                onDraggingPageChange(page.id);
              }}
              onDragEnter={(event) => {
                if (!draggingPageId || draggingPageId === page.id) return;
                event.preventDefault();
                onPageDropTargetChange(page.id);
              }}
              onDragOver={(event) => {
                if (!draggingPageId || draggingPageId === page.id) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                onPageDropTargetChange(page.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData("application/structra-page") || draggingPageId;
                if (sourceId) {
                  onReorderPage(sourceId, page.id);
                }
                onDraggingPageChange(null);
                onPageDropTargetChange(null);
              }}
              onDragEnd={() => {
                onDraggingPageChange(null);
                onPageDropTargetChange(null);
              }}
              title={page.name}
            >
              <PageThumbnail page={page} />
              <span className="page-index">{index + 1}</span>
              <span className="page-meta">
                <strong>{page.name}</strong>
                <em>{page.nodes.length} 节点 / {page.edges.length} 连线</em>
              </span>
            </button>
          ))}
        </div>
        <div className="page-actions">
          <button onClick={onAddPage}>新建</button>
          <button onClick={onDuplicatePage}>复制</button>
          <button disabled={activePageIndex <= 0} onClick={() => onMovePage("up")}>
            上移
          </button>
          <button disabled={activePageIndex < 0 || activePageIndex >= pages.length - 1} onClick={() => onMovePage("down")}>
            下移
          </button>
          <button onClick={onRenamePage}>重命名</button>
          <button disabled={pages.length <= 1} onClick={onDeletePage}>
            删除
          </button>
        </div>
        <div className="document-search">
          <input
            aria-label="搜索文档"
            value={documentQuery}
            placeholder="搜索全部页面和节点"
            onChange={(event) => onDocumentQueryChange(event.target.value)}
          />
          {documentQuery.trim() ? (
            <div className="document-search-results">
              {documentSearchResults.length === 0 ? (
                <div className="document-search-empty">无匹配结果</div>
              ) : (
                documentSearchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.page.id}-${result.node?.id ?? "page"}`}
                    onClick={() => onOpenDocumentSearchResult(result.page.id, result.node?.id)}
                  >
                    <span>{result.type === "page" ? `P${result.pageIndex + 1}` : `${result.pageIndex + 1}.${(result.nodeIndex ?? 0) + 1}`}</span>
                    <strong>{result.type === "page" ? result.page.name : result.node?.data.label}</strong>
                    <em>{result.type === "page" ? `${result.page.nodes.length} 节点` : `${result.page.name} · ${result.shapeLabel}`}</em>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
        {recentDocuments.length > 0 ? (
          <div className="recent-documents">
            <div className="panel-subtitle compact">
              <History size={15} />
              <span>最近文档</span>
            </div>
            <div className="recent-document-list">
              {recentDocuments.map((item) => (
                <div key={item.path} className="recent-document-row">
                  <button className="recent-document-open" onClick={() => void onOpenRecentDocument(item.path)} title={item.path}>
                    <strong>{item.name}</strong>
                    <em>{formatVersionTime(item.openedAt)}</em>
                  </button>
                  <button className="recent-document-remove" aria-label={`移除最近文档 ${item.name}`} onClick={() => onForgetRecentDocument(item.path)}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="palette-section">
        <div className="panel-subtitle">
          <Grid3X3 size={15} />
          <span>快捷模板</span>
        </div>
        <div className="template-actions">
          <button disabled={nodes.length === 0} onClick={openTemplatePrompt}>
            保存为模板
          </button>
        </div>
        <div className="template-tabs" role="tablist" aria-label="模板分类">
          <button
            type="button"
            role="tab"
            aria-selected={templateTab === "custom"}
            className={templateTab === "custom" ? "active" : ""}
            onClick={() => setTemplateTab("custom")}
          >
            自定义模板
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={templateTab === "system"}
            className={templateTab === "system" ? "active" : ""}
            onClick={() => setTemplateTab("system")}
          >
            系统模板
          </button>
        </div>
        <div className="template-list">
          {visibleTemplates.length === 0 ? (
            <div className="template-empty">
              {templateTab === "custom" ? "暂无自定义模板，点击“保存为模板”创建" : "暂无系统模板"}
            </div>
          ) : null}
          {visibleTemplates.map((template) => {
            const favorite = favoriteTemplateIds.has(template.id);
            return (
              <div key={template.id} className="template-entry">
                <button type="button" className="template-button" onClick={() => onApplyTemplate(template)} title={template.description}>
                  <DiagramThumbnail nodes={template.nodes} edges={template.edges} className="template-thumbnail" />
                  <span className="template-meta">
                    <strong>{template.name}</strong>
                    <span>{template.description}</span>
                  </span>
                </button>
                <div className="template-entry-actions">
                  <button
                    type="button"
                    className={`template-favorite${favorite ? " active" : ""}`}
                    aria-label={`${favorite ? "取消收藏模板" : "收藏模板"} ${template.name}`}
                    aria-pressed={favorite}
                    title={favorite ? "取消收藏" : "收藏"}
                    onClick={() => onToggleTemplateFavorite(template.id)}
                  >
                    <Star size={13} fill={favorite ? "currentColor" : "none"} />
                  </button>
                  {template.custom ? (
                    <button
                      type="button"
                      className="template-delete"
                      aria-label={`删除本地模板 ${template.name}`}
                      title="删除"
                      onClick={() => onDeleteCustomTemplate(template.id)}
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        {templatePromptOpen ? (
          <section
            className="prompt-overlay"
            role="dialog"
            aria-label="保存为模板"
            aria-modal="true"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setTemplatePromptOpen(false);
              }
            }}
          >
            <button className="prompt-backdrop" type="button" aria-label="取消" onClick={() => setTemplatePromptOpen(false)} />
            <div className="prompt-dialog">
              <strong className="prompt-title">保存为模板</strong>
              <input
                ref={templateInputRef}
                className="prompt-input"
                aria-label="模板名称"
                value={templateName}
                placeholder="模板名称"
                onChange={(event) => setTemplateName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    confirmTemplatePrompt();
                  }
                }}
              />
              <div className="prompt-actions">
                <button type="button" className="prompt-cancel" onClick={() => setTemplatePromptOpen(false)}>
                  取消
                </button>
                <button type="button" className="prompt-confirm" disabled={!templateName.trim()} onClick={confirmTemplatePrompt}>
                  保存
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
      <div className="palette-section">
        <div className="panel-subtitle">
          <Waypoints size={15} />
          <span>大纲</span>
        </div>
        <div className="outline-tools">
          <input
            ref={outlineSearchRef}
            className="outline-search"
            aria-label="搜索节点"
            value={outlineQuery}
            placeholder="搜索节点"
            onChange={(event) => onOutlineQueryChange(event.target.value)}
          />
        </div>
        <div className="outline-list">
          {nodes.length === 0 ? (
            <div className="outline-empty">暂无节点</div>
          ) : visibleOutlineNodes.length === 0 ? (
            <div className="outline-empty">无匹配节点</div>
          ) : (
            visibleOutlineNodes.map(({ node, index }) => (
              <div key={node.id} className={`outline-row${node.selected ? " active" : ""}${node.hidden ? " muted" : ""}`}>
                <button
                  className="outline-visibility"
                  aria-label={node.hidden ? `显示 ${node.data.label}` : `隐藏 ${node.data.label}`}
                  title={node.hidden ? "显示" : "隐藏"}
                  onClick={() => onSetNodeHidden(node.id, !node.hidden)}
                >
                  {node.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  className="outline-select"
                  aria-current={node.selected ? "true" : undefined}
                  aria-label={`选择节点 ${index + 1}: ${node.data.label}`}
                  onClick={() => onSelectNode(node.id)}
                  title={node.data.label}
                >
                  <span>{index + 1}</span>
                  <strong>{node.data.label}</strong>
                  <em>{shapeLibrary.find((item) => item.kind === node.data.shape)?.label ?? node.data.shape}</em>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="palette-section">
        <div className="panel-subtitle">
          <BringToFront size={15} />
          <span>图层</span>
        </div>
        <div className="layer-hint">顶部对象显示在最前</div>
        <div className="layer-list">
          {layerNodes.length === 0 ? (
            <div className="outline-empty">暂无图层</div>
          ) : (
            layerNodes.map(({ node, index }) => {
              const shapeLabel = shapeLibrary.find((item) => item.kind === node.data.shape)?.label ?? node.data.shape;
              const visualIndex = nodes.length - index;
              return (
                <div key={node.id} className={`layer-row${node.selected ? " active" : ""}${node.hidden ? " muted" : ""}`}>
                  <button
                    className="layer-main"
                    aria-current={node.selected ? "true" : undefined}
                    aria-label={`选择图层 ${visualIndex}: ${node.data.label}`}
                    onClick={() => onSelectNode(node.id)}
                    title={node.data.label}
                  >
                    <span>{visualIndex}</span>
                    <strong>{node.data.label}</strong>
                    <em>{shapeLabel}</em>
                  </button>
                  <div className="layer-actions">
                    <button
                      aria-label={node.hidden ? `显示图层 ${node.data.label}` : `隐藏图层 ${node.data.label}`}
                      title={node.hidden ? "显示" : "隐藏"}
                      onClick={() => onSetNodeHidden(node.id, !node.hidden)}
                    >
                      {node.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      aria-label={node.data.locked ? `解锁图层 ${node.data.label}` : `锁定图层 ${node.data.label}`}
                      title={node.data.locked ? "解锁" : "锁定"}
                      onClick={() => onSetNodeLocked(node.id, !node.data.locked)}
                    >
                      {node.data.locked ? <Lock size={13} /> : <Unlock size={13} />}
                    </button>
                    <button
                      aria-label={`上移图层 ${node.data.label}`}
                      title="上移"
                      disabled={index >= nodes.length - 1}
                      onClick={() => onMoveLayerNode(node.id, "up")}
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      aria-label={`下移图层 ${node.data.label}`}
                      title="下移"
                      disabled={index <= 0}
                      onClick={() => onMoveLayerNode(node.id, "down")}
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
