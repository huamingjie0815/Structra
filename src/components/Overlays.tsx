import { FileInput, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ContextMenuState } from "../domain/types";

type ImportErrorView = {
  title: string;
  message: string;
  source?: string;
  detail?: string;
};

export function ImportErrorBanner({ error, onDismiss }: { error: ImportErrorView; onDismiss: () => void }) {
  return (
    <section className="import-error-banner" role="alert" aria-label={error.title}>
      <div className="import-error-icon" aria-hidden="true">
        <FileInput size={17} />
      </div>
      <div className="import-error-copy">
        <strong>{error.title}</strong>
        <span>{error.message}</span>
        {error.source ? <em>{error.source}</em> : null}
        {error.detail ? <code>{error.detail}</code> : null}
      </div>
      <button type="button" className="import-error-dismiss" aria-label="关闭导入错误" onClick={onDismiss}>
        <X size={15} />
      </button>
    </section>
  );
}

export function ContextMenu({
  menu,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onBringFront,
  onSendBack,
  onAddProcess,
  onAddDecision,
  onAddNote
}: {
  menu: NonNullable<ContextMenuState>;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringFront: () => void;
  onSendBack: () => void;
  onAddProcess: () => void;
  onAddDecision: () => void;
  onAddNote: () => void;
}) {
  const restoreFocusOnCloseRef = useRef(true);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuItems = useMemo(
    () =>
      menu.target === "pane"
        ? [
            { id: "add-process", label: "添加流程", onSelect: onAddProcess },
            { id: "add-decision", label: "添加判断", onSelect: onAddDecision },
            { id: "add-note", label: "添加注释", onSelect: onAddNote }
          ]
        : [
            { id: "edit", label: menu.target === "node" ? "编辑文本" : "编辑连线文本", onSelect: onEdit },
            ...(menu.target === "node"
              ? [
                  { id: "duplicate", label: "复制", onSelect: onDuplicate },
                  { id: "bring-front", label: "置于顶层", onSelect: onBringFront },
                  { id: "send-back", label: "置于底层", onSelect: onSendBack }
                ]
              : []),
            { id: "delete", label: "删除", onSelect: onDelete, danger: true }
          ],
    [menu.target, onAddDecision, onAddNote, onAddProcess, onBringFront, onDelete, onDuplicate, onEdit, onSendBack]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      const previousFocus = previousFocusRef.current;
      if (restoreFocusOnCloseRef.current && previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [menu.target, menu.id]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.focus();
  }, [activeIndex, menuItems.length]);

  const closeAndRestoreFocus = () => {
    restoreFocusOnCloseRef.current = true;
    onClose();
  };

  const runMenuItem = (index: number) => {
    const item = menuItems[index];
    if (!item) return;
    restoreFocusOnCloseRef.current = false;
    item.onSelect();
  };

  return (
    <>
      <button className="context-menu-backdrop" aria-label="关闭菜单" onClick={closeAndRestoreFocus} />
      <div
        className="context-menu"
        role="menu"
        aria-label={menu.target === "pane" ? "画布菜单" : menu.target === "node" ? "节点菜单" : "连线菜单"}
        style={{ left: menu.x, top: menu.y }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeAndRestoreFocus();
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => getNextMenuItemIndex(menuItems.length, current, "next"));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => getNextMenuItemIndex(menuItems.length, current, "previous"));
          }
          if (event.key === "Home") {
            event.preventDefault();
            setActiveIndex(0);
          }
          if (event.key === "End") {
            event.preventDefault();
            setActiveIndex(Math.max(0, menuItems.length - 1));
          }
        }}
      >
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            type="button"
            role="menuitem"
            tabIndex={activeIndex === index ? 0 : -1}
            className={`${activeIndex === index ? "active" : ""}${item.danger ? " danger" : ""}`}
            onFocus={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => runMenuItem(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

export function getNextMenuItemIndex(count: number, currentIndex: number, direction: "next" | "previous") {
  if (count <= 0) return -1;
  if (direction === "previous") {
    return (currentIndex - 1 + count) % count;
  }
  return (currentIndex + 1) % count;
}
