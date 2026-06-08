import { useCallback, useEffect, useMemo, useState } from "react";
import type { DiagramPage, PagePreset } from "../../domain/types";
import { buildSvg } from "../../io/svgExport";

type PresentationWorkflowInput = {
  pages: DiagramPage[];
  activePage?: DiagramPage;
  activePageIndex: number;
  canvasBackground: string;
  pagePreset: PagePreset;
};

export function usePresentationWorkflow({
  pages,
  activePage,
  activePageIndex,
  canvasBackground,
  pagePreset
}: PresentationWorkflowInput) {
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationPageIndex, setPresentationPageIndex] = useState(0);
  const maxPageIndex = Math.max(0, pages.length - 1);
  const presentationPage = pages[presentationPageIndex] ?? activePage;
  const presentationSvg = useMemo(
    () => (presentationPage ? buildSvg(presentationPage.nodes, presentationPage.edges, canvasBackground, pagePreset) : ""),
    [canvasBackground, pagePreset, presentationPage]
  );

  const closePresentation = useCallback(() => {
    setPresentationMode(false);
  }, []);

  const movePresentationPage = useCallback(
    (direction: -1 | 1) => {
      setPresentationPageIndex((index) => Math.min(maxPageIndex, Math.max(0, index + direction)));
    },
    [maxPageIndex]
  );

  const openPresentation = useCallback(() => {
    setPresentationPageIndex(Math.min(maxPageIndex, Math.max(0, activePageIndex)));
    setPresentationMode(true);
  }, [activePageIndex, maxPageIndex]);

  useEffect(() => {
    if (!presentationMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePresentation();
      }
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        movePresentationPage(1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        movePresentationPage(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePresentation, movePresentationPage, presentationMode]);

  return {
    presentationMode,
    presentationPageIndex,
    presentationPage,
    presentationSvg,
    openPresentation,
    movePresentationPage,
    closePresentation
  };
}
