import { cloneDocument } from "../domain/documentSession";
import type { DiagramDocument, Selection } from "../domain/types";

export type HistoryEntry = {
  document: DiagramDocument;
  selection: Selection;
};

export type DocumentHistory = {
  entries: HistoryEntry[];
  index: number;
};

export function createHistory(entry: HistoryEntry): DocumentHistory {
  return { entries: [cloneHistoryEntry(entry)], index: 0 };
}

export function resetHistoryEntry(entry: HistoryEntry): DocumentHistory {
  return createHistory(entry);
}

export function pushHistoryEntry(history: DocumentHistory, entry: HistoryEntry): DocumentHistory {
  const nextEntry = cloneHistoryEntry(entry);
  const current = history.entries[history.index];
  if (current && entriesEqual(current, nextEntry)) return history;

  const entries = history.entries.slice(0, history.index + 1).concat(nextEntry);
  return { entries, index: entries.length - 1 };
}

export function undoHistory(history: DocumentHistory) {
  if (history.index <= 0) return { history, entry: null };
  const nextHistory = { ...history, index: history.index - 1 };
  return { history: nextHistory, entry: cloneHistoryEntry(nextHistory.entries[nextHistory.index]) };
}

export function redoHistory(history: DocumentHistory) {
  if (history.index >= history.entries.length - 1) return { history, entry: null };
  const nextHistory = { ...history, index: history.index + 1 };
  return { history: nextHistory, entry: cloneHistoryEntry(nextHistory.entries[nextHistory.index]) };
}

export function getHistoryState(history: DocumentHistory) {
  return {
    canUndo: history.index > 0,
    canRedo: history.index < history.entries.length - 1
  };
}

export function cloneHistoryEntry(entry: HistoryEntry): HistoryEntry {
  return {
    document: cloneDocument(entry.document),
    selection: entry.selection ? { ...entry.selection } : null
  };
}

function entriesEqual(a: HistoryEntry, b: HistoryEntry) {
  return JSON.stringify(a.document) === JSON.stringify(b.document) && JSON.stringify(a.selection) === JSON.stringify(b.selection);
}
