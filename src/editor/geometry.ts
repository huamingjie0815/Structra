import { PAGE_PRESETS } from "../domain/diagramDefaults";
import type { DiagramNode, PagePreset } from "../domain/types";
import { normalizeNodeRotation } from "../domain/nodeSemantics";

export function getNodeRotation(data: DiagramNode["data"]) {
  return normalizeNodeRotation(data.rotation ?? 0);
}

export function rotatePoint(x: number, y: number, centerX: number, centerY: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = x - centerX;
  const dy = y - centerY;
  return { x: centerX + dx * cos - dy * sin, y: centerY + dx * sin + dy * cos };
}

export function getNodeVisualBounds(node: DiagramNode) {
  const { x, y } = node.position;
  const { width, height } = node.data;
  const rotation = getNodeRotation(node.data);
  if (!rotation) return { left: x, top: y, right: x + width, bottom: y + height };
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const corners = [
    rotatePoint(x, y, centerX, centerY, rotation),
    rotatePoint(x + width, y, centerX, centerY, rotation),
    rotatePoint(x + width, y + height, centerX, centerY, rotation),
    rotatePoint(x, y + height, centerX, centerY, rotation)
  ];
  return {
    left: Math.min(...corners.map((point) => point.x)),
    top: Math.min(...corners.map((point) => point.y)),
    right: Math.max(...corners.map((point) => point.x)),
    bottom: Math.max(...corners.map((point) => point.y))
  };
}

export function getExportBounds(nodes: DiagramNode[], pagePreset: PagePreset) {
  const pageBounds = getPageBounds(pagePreset);
  if (!pageBounds) return getBounds(nodes);
  if (!nodes.length) return pageBounds;

  const contentBounds = getBounds(nodes);
  const x = Math.min(pageBounds.x, contentBounds.x);
  const y = Math.min(pageBounds.y, contentBounds.y);
  const right = Math.max(pageBounds.x + pageBounds.width, contentBounds.x + contentBounds.width);
  const bottom = Math.max(pageBounds.y + pageBounds.height, contentBounds.y + contentBounds.height);
  return { x, y, width: right - x, height: bottom - y };
}

export function getNodeBounds(nodes: DiagramNode[]) {
  const left = Math.min(...nodes.map((node) => node.position.x));
  const top = Math.min(...nodes.map((node) => node.position.y));
  const right = Math.max(...nodes.map((node) => node.position.x + node.data.width));
  const bottom = Math.max(...nodes.map((node) => node.position.y + node.data.height));
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top
  };
}

export function getBounds(nodes: DiagramNode[]) {
  if (!nodes.length) return { x: 0, y: 0, width: 1200, height: 800 };
  const pad = 80;
  const bounds = nodes.map(getNodeVisualBounds);
  const minX = Math.min(...bounds.map((item) => item.left)) - pad;
  const minY = Math.min(...bounds.map((item) => item.top)) - pad;
  const maxX = Math.max(...bounds.map((item) => item.right)) + pad;
  const maxY = Math.max(...bounds.map((item) => item.bottom)) + pad;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getPageBounds(pagePreset: PagePreset) {
  if (pagePreset === "content") return null;
  const page = PAGE_PRESETS[pagePreset];
  return { x: 0, y: 0, width: page.width, height: page.height };
}
