import { useCallback, useState } from "react";
import type { CommandItem } from "../../domain/types";

export function useCommandPaletteWorkflow() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState("");

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  const runCommand = useCallback((item: CommandItem) => {
    if (item.disabled) return;
    setCommandPaletteOpen(false);
    setCommandPaletteQuery("");
    item.run();
  }, []);

  return {
    commandPaletteOpen,
    commandPaletteQuery,
    setCommandPaletteQuery,
    openCommandPalette,
    closeCommandPalette,
    runCommand
  };
}
