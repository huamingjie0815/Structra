import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef } from "react";

import type { DiagramPage } from "../domain/types";
import { IconButton } from "./IconButton";
import { useModalFocusLifecycle } from "./useModalFocusLifecycle";

export function PresentationOverlay({
  page,
  pageIndex,
  pageCount,
  svg,
  onPrevious,
  onNext,
  onClose
}: {
  page: DiagramPage;
  pageIndex: number;
  pageCount: number;
  svg: string;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLElement>(null);
  const focusTrap = useModalFocusLifecycle({ rootRef: overlayRef });

  return (
    <section
      ref={overlayRef}
      className="presentation-overlay"
      role="dialog"
      aria-label="演示模式"
      aria-modal="true"
      onKeyDown={(event) => {
        focusTrap.onKeyDown(event);
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div className="presentation-topbar">
        <div>
          <strong>{page.name}</strong>
          <span>
            {pageIndex + 1} / {pageCount}
          </span>
        </div>
        <div className="presentation-controls">
          <IconButton label="上一页" disabled={pageIndex <= 0} onClick={onPrevious} icon={ChevronLeft} />
          <IconButton label="下一页" disabled={pageIndex >= pageCount - 1} onClick={onNext} icon={ChevronRight} />
          <IconButton label="关闭演示" onClick={onClose} icon={X} />
        </div>
      </div>
      <div className="presentation-stage" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="presentation-footer">
        <span>{page.nodes.length} 节点</span>
        <span>{page.edges.length} 连线</span>
      </div>
    </section>
  );
}
