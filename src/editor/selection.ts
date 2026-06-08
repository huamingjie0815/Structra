import type { DiagramNode } from "../domain/types";

export function getGroupSelectionIds(nodes: DiagramNode[], id: string) {
  const node = nodes.find((item) => item.id === id);
  if (!node?.data.groupId) return new Set([id]);
  return new Set(nodes.filter((item) => !item.hidden && item.data.groupId === node.data.groupId).map((item) => item.id));
}
