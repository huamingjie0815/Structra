import { useCallback, useMemo, useState } from "react";

import type { CanvasSettings } from "../../domain/types";

export function useCanvasSettingsWorkflow(initialSettings: CanvasSettings) {
  const [showGrid, setShowGrid] = useState(initialSettings.showGrid);
  const [snapToGrid, setSnapToGrid] = useState(initialSettings.snapToGrid);
  const [gridSize, setGridSize] = useState(initialSettings.gridSize);
  const [gridVariant, setGridVariant] = useState(initialSettings.gridVariant);
  const [pagePreset, setPagePreset] = useState(initialSettings.pagePreset);
  const [canvasBackground, setCanvasBackground] = useState(initialSettings.background);
  const [showRulers, setShowRulers] = useState(initialSettings.showRulers);

  const currentSettings = useMemo(
    () => ({ showGrid, showRulers, snapToGrid, gridSize, gridVariant, pagePreset, background: canvasBackground }),
    [canvasBackground, gridSize, gridVariant, pagePreset, showGrid, showRulers, snapToGrid]
  );

  const updateCanvasSettings = useCallback((patch: Partial<CanvasSettings>) => {
    if (patch.showGrid !== undefined) setShowGrid(patch.showGrid);
    if (patch.showRulers !== undefined) setShowRulers(patch.showRulers);
    if (patch.snapToGrid !== undefined) setSnapToGrid(patch.snapToGrid);
    if (patch.gridSize !== undefined) setGridSize(patch.gridSize);
    if (patch.gridVariant !== undefined) setGridVariant(patch.gridVariant);
    if (patch.pagePreset !== undefined) setPagePreset(patch.pagePreset);
    if (patch.background !== undefined) setCanvasBackground(patch.background);
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid((value) => !value);
  }, []);

  const toggleRulers = useCallback(() => {
    setShowRulers((value) => !value);
  }, []);

  const toggleSnapToGrid = useCallback(() => {
    setSnapToGrid((value) => !value);
  }, []);

  return {
    showGrid,
    showRulers,
    snapToGrid,
    gridSize,
    gridVariant,
    pagePreset,
    canvasBackground,
    currentSettings,
    updateCanvasSettings,
    setShowGrid,
    setSnapToGrid,
    setShowRulers,
    setGridSize,
    setGridVariant,
    setPagePreset,
    setCanvasBackground,
    toggleGrid,
    toggleRulers,
    toggleSnapToGrid
  };
}
