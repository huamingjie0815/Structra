import type { ShapeLibraryItem } from "../features/shapes/shapeLibrary";
import type { DiagramNode, DiagramPage, DiagramTemplate, ShapeCategory, ShapeKind } from "../domain/types";

export type OutlineNodeItem = { node: DiagramNode; index: number };
export type LayerNodeItem = { node: DiagramNode; index: number };
export type DocumentSearchResult = {
  type: "page" | "node";
  page: DiagramPage;
  pageIndex: number;
  node?: DiagramNode;
  nodeIndex?: number;
  shapeLabel?: string;
};

export function getShapeLabel(shapes: ShapeLibraryItem[], kind: ShapeKind) {
  return shapes.find((item) => item.kind === kind)?.label ?? kind;
}

export function getVisibleShapes(
  shapes: ShapeLibraryItem[],
  shapeCategoryMap: Record<ShapeKind, Exclude<ShapeCategory, "all">>,
  shapeCategory: ShapeCategory,
  shapeQuery: string
) {
  const query = shapeQuery.trim().toLowerCase();
  return shapes.filter((shape) => {
    const matchesCategory = shapeCategory === "all" || shapeCategoryMap[shape.kind] === shapeCategory;
    const matchesQuery = !query || shape.label.toLowerCase().includes(query) || shape.kind.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
}

export function getAllTemplates(customTemplates: DiagramTemplate[], builtInTemplates: DiagramTemplate[]) {
  return [...customTemplates, ...builtInTemplates];
}

export function getVisibleOutlineNodes(nodes: DiagramNode[], outlineQuery: string, shapes: ShapeLibraryItem[]): OutlineNodeItem[] {
  const query = outlineQuery.trim().toLowerCase();
  return nodes
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => {
      const shapeLabel = getShapeLabel(shapes, node.data.shape);
      return !query || node.data.label.toLowerCase().includes(query) || shapeLabel.toLowerCase().includes(query);
    });
}

export function getLayerNodes(nodes: DiagramNode[]): LayerNodeItem[] {
  return nodes.map((node, index) => ({ node, index })).reverse();
}

export function getDocumentSearchResults(pages: DiagramPage[], documentQuery: string, shapes: ShapeLibraryItem[], limit = 24): DocumentSearchResult[] {
  const query = documentQuery.trim().toLowerCase();
  if (!query) return [];

  return pages
    .flatMap((page, pageIndex) => {
      const results: DocumentSearchResult[] = [];
      if (page.name.toLowerCase().includes(query)) {
        results.push({ type: "page", page, pageIndex });
      }
      page.nodes.forEach((node, nodeIndex) => {
        const shapeLabel = getShapeLabel(shapes, node.data.shape);
        if (node.data.label.toLowerCase().includes(query) || shapeLabel.toLowerCase().includes(query) || page.name.toLowerCase().includes(query)) {
          results.push({ type: "node", page, pageIndex, node, nodeIndex, shapeLabel });
        }
      });
      return results;
    })
    .slice(0, limit);
}
