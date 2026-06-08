import { useEffect, useMemo, useRef, useState } from "react";

import type { CommandItem } from "../domain/types";
import { useModalFocusLifecycle } from "./useModalFocusLifecycle";

type CommandNavigationDirection = "next" | "previous" | "first" | "last";

export function getInitialCommandIndex(items: CommandItem[]) {
  return items.findIndex((item) => !item.disabled);
}

export function getNextCommandIndex(items: CommandItem[], currentIndex: number, direction: CommandNavigationDirection) {
  const enabledIndexes = items.map((item, index) => (!item.disabled ? index : -1)).filter((index) => index >= 0);
  if (enabledIndexes.length === 0) return -1;
  if (direction === "first") return enabledIndexes[0];
  if (direction === "last") return enabledIndexes[enabledIndexes.length - 1];
  if (!enabledIndexes.includes(currentIndex)) {
    return direction === "previous" ? enabledIndexes[enabledIndexes.length - 1] : enabledIndexes[0];
  }
  const currentEnabledIndex = enabledIndexes.indexOf(currentIndex);
  if (direction === "previous") {
    return enabledIndexes[(currentEnabledIndex - 1 + enabledIndexes.length) % enabledIndexes.length];
  }
  return enabledIndexes[(currentEnabledIndex + 1) % enabledIndexes.length];
}

export function CommandPalette({
  items,
  query,
  onQueryChange,
  onClose,
  onRun
}: {
  items: CommandItem[];
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onRun: (item: CommandItem) => void;
}) {
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => !normalizedQuery || item.label.toLowerCase().includes(normalizedQuery) || item.group.toLowerCase().includes(normalizedQuery))
      .slice(0, 12);
  }, [items, query]);
  const [activeIndex, setActiveIndex] = useState(() => getInitialCommandIndex(visibleItems));
  const activeItem = activeIndex >= 0 ? visibleItems[activeIndex] : undefined;
  const activeOptionId = activeItem ? `command-option-${activeItem.id}` : undefined;
  const overlayRef = useRef<HTMLElement>(null);
  const focusTrap = useModalFocusLifecycle({ rootRef: overlayRef });

  useEffect(() => {
    setActiveIndex(getInitialCommandIndex(visibleItems));
  }, [visibleItems]);

  return (
    <section
      ref={overlayRef}
      className="command-palette-overlay"
      role="dialog"
      aria-label="命令面板"
      aria-modal="true"
      onKeyDown={(event) => {
        focusTrap.onKeyDown(event);
        if (event.defaultPrevented && event.key === "Tab") return;
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActiveIndex((current) => getNextCommandIndex(visibleItems, current, "next"));
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setActiveIndex((current) => getNextCommandIndex(visibleItems, current, "previous"));
        }
        if (event.key === "Home") {
          event.preventDefault();
          setActiveIndex(getNextCommandIndex(visibleItems, activeIndex, "first"));
        }
        if (event.key === "End") {
          event.preventDefault();
          setActiveIndex(getNextCommandIndex(visibleItems, activeIndex, "last"));
        }
        if (event.key === "Enter" && activeItem) {
          event.preventDefault();
          onRun(activeItem);
        }
      }}
    >
      <button className="command-palette-backdrop" aria-label="关闭命令面板" onClick={onClose} />
      <div className="command-palette">
        <input
          autoFocus
          aria-label="搜索命令"
          aria-controls="command-palette-results"
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          role="combobox"
          aria-expanded="true"
          value={query}
          placeholder="搜索命令、图形、导入导出"
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <div id="command-palette-results" className="command-list" role="listbox" aria-label="命令结果">
          {visibleItems.length === 0 ? (
            <div className="command-empty">无匹配命令</div>
          ) : (
            visibleItems.map((item, index) => (
              <button
                id={`command-option-${item.id}`}
                key={item.id}
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "active" : ""}
                disabled={item.disabled}
                onMouseEnter={() => {
                  if (!item.disabled) setActiveIndex(index);
                }}
                onClick={() => onRun(item)}
              >
                <span>{item.group}</span>
                <strong>{item.label}</strong>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
