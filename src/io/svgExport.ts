import { DEFAULT_CANVAS_SETTINGS, EDGE_DASH_PATTERNS, SWIMLANE_TITLE_HEIGHT } from "../domain/diagramDefaults";
import {
  getErFields,
  getFontFamily,
  getNodeOpacity,
  getNodeStrokeDasharray,
  getNodeStrokeWidth,
  getSwimlaneCount,
  getSwimlaneDividerLines,
  getSwimlaneLabels,
  getSwimlaneOrientation,
  getTableCellValues,
  getTableColumns,
  getTableDividerLines,
  getTableRows,
  getUmlAttributes,
  getUmlMethods
} from "../domain/nodeSemantics";
import type { DiagramEdge, DiagramNode, ErField, PagePreset } from "../domain/types";
import {
  getEdgeEndpoints,
  getEdgeLabelBackgroundFill,
  getEdgeLabelBackgroundOpacity,
  getEdgeLabelColor,
  getEdgeLabelFontSize,
  getEdgeStroke,
  getEdgeStrokeWidth,
  getSvgEdgePathResult
} from "../editor/edgeGeometry";
import { getSvgConnectorMarkerKind } from "../editor/connectorPresets";
import { getExportBounds, getNodeRotation } from "../editor/geometry";
import { getVisibleGraph } from "./exporters";

export function buildSvg(nodes: DiagramNode[], edges: DiagramEdge[], background = DEFAULT_CANVAS_SETTINGS.background, pagePreset: PagePreset = DEFAULT_CANVAS_SETTINGS.pagePreset) {
  const visibleGraph = getVisibleGraph(nodes, edges);
  const bounds = getExportBounds(visibleGraph.nodes, pagePreset);
  const markerDefs = visibleGraph.edges
    .map((item, index) => svgConnectorMarkerDef(item, index, background))
    .join("");
  const marker = markerDefs ? `<defs>${markerDefs}</defs>` : "";
  const animatedStyle = visibleGraph.edges.some((item) => item.animated)
    ? `<style>@keyframes edge-flow{to{stroke-dashoffset:-14}}.edge-flow{animation:edge-flow .65s linear infinite}</style>`
    : "";
  const edgeSvg = visibleGraph.edges
    .map((item, index) => {
      const endpoints = getEdgeEndpoints(item, visibleGraph.nodes);
      if (!endpoints) return "";
      const markerStart = item.markerStart ? ` marker-start="url(#arrow-${index})"` : "";
      const markerEnd = item.markerEnd ? ` marker-end="url(#arrow-${index})"` : "";
      const dashValue = item.style?.strokeDasharray || (item.animated ? EDGE_DASH_PATTERNS.dashed : "");
      const dash = dashValue ? ` stroke-dasharray="${escapeXml(String(dashValue))}"` : "";
      const animatedClass = item.animated ? ` class="edge-flow"` : "";
      const stroke = escapeXml(getEdgeStroke(item));
      const strokeWidth = getEdgeStrokeWidth(item);
      const { path, labelX, labelY } = getSvgEdgePathResult(item, endpoints);
      const labelFill = escapeXml(getEdgeLabelColor(item));
      const labelFontSize = getEdgeLabelFontSize(item);
      const labelWeight = Number(item.labelStyle?.fontWeight ?? 600);
      const label = item.label
        ? `${svgEdgeLabelBackground(String(item.label), labelX, labelY, labelFontSize, item)}${svgMultilineText(
            String(item.label),
            labelX,
            labelY,
            `text-anchor="middle" font-size="${labelFontSize}" fill="${labelFill}" font-weight="${labelWeight}"`,
            labelFontSize
          )}`
        : "";
      return `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"${dash}${animatedClass}${markerStart}${markerEnd}/>${label}`;
    })
    .join("");
  const nodeSvg = visibleGraph.nodes.map(svgNode).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}">${marker}${animatedStyle}<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${escapeXml(background)}"/>${edgeSvg}${nodeSvg}</svg>`;
}

function svgConnectorMarkerDef(edge: DiagramEdge, index: number, background: string) {
  if (!edge.markerStart && !edge.markerEnd) return "";
  const color = escapeXml(getEdgeStroke(edge));
  const bg = escapeXml(background);
  const kind = getSvgConnectorMarkerKind(edge);
  if (kind === "triangle-open") {
    return `<marker id="arrow-${index}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9 z" fill="${bg}" stroke="${color}" stroke-width="1.4"/></marker>`;
  }
  if (kind === "diamond-open") {
    return `<marker id="arrow-${index}" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M 1 6 L 6 1 L 11 6 L 6 11 z" fill="${bg}" stroke="${color}" stroke-width="1.35"/></marker>`;
  }
  if (kind === "diamond-filled") {
    return `<marker id="arrow-${index}" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M 1 6 L 6 1 L 11 6 L 6 11 z" fill="${color}" stroke="${color}" stroke-width="1.35"/></marker>`;
  }
  return `<marker id="arrow-${index}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${color}"/></marker>`;
}

export function svgEdgeLabelBackground(value: string, x: number, y: number, fontSize: number, edge: DiagramEdge) {
  const fill = getEdgeLabelBackgroundFill(edge);
  const fillOpacity = getEdgeLabelBackgroundOpacity(edge);
  if (!fill || fillOpacity <= 0) return "";

  const lines = value.split(/\r?\n/);
  const lineHeight = fontSize * 1.25;
  const firstY = y - ((lines.length - 1) * lineHeight) / 2;
  const width = Math.max(...lines.map((line) => estimateSvgTextWidth(line || " ", fontSize))) + 12;
  const height = lines.length * lineHeight + 6;
  const rectX = x - width / 2;
  const rectY = firstY - fontSize - 3;
  return `<rect x="${rectX}" y="${rectY}" width="${width}" height="${height}" rx="4" fill="${escapeXml(fill)}" fill-opacity="${fillOpacity}"/>`;
}

export function estimateSvgTextWidth(value: string, fontSize: number) {
  return (
    Array.from(value).reduce((sum, char) => {
      return sum + (char.charCodeAt(0) > 255 ? 1 : 0.56);
    }, 0) * fontSize
  );
}

export function svgMultilineText(value: string, x: number, y: number, attrs: string, fontSize: number) {
  const lines = value.split(/\r?\n/);
  if (lines.length <= 1) {
    return `<text x="${x}" y="${y}" ${attrs}>${escapeXml(value)}</text>`;
  }

  const lineHeight = fontSize * 1.25;
  const firstY = y - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" y="${firstY + index * lineHeight}">${escapeXml(line || " ")}</tspan>`)
    .join("");
  return `<text ${attrs}>${tspans}</text>`;
}

function wrapNodeSvg(node: DiagramNode, content: string) {
  const { x, y } = node.position;
  const { width, height } = node.data;
  const rotation = getNodeRotation(node.data);
  const rotated = rotation ? `<g transform="rotate(${rotation} ${x + width / 2} ${y + height / 2})">${content}</g>` : content;
  const opacity = getNodeOpacity(node.data);
  return opacity >= 1 ? rotated : `<g opacity="${opacity}">${rotated}</g>`;
}

export function svgNode(node: DiagramNode) {
  const { x, y } = node.position;
  const { width, height, label, fontSize } = node.data;
  const fill = escapeXml(String(node.data.fill));
  const stroke = escapeXml(String(node.data.stroke));
  const text = escapeXml(String(node.data.text));
  const textAlign = node.data.textAlign ?? "center";
  const textInset = Math.min(18, Math.max(10, width * 0.08));
  const labelX = textAlign === "left" ? x + textInset : textAlign === "right" ? x + width - textInset : x + width / 2;
  const textAnchor = textAlign === "left" ? "start" : textAlign === "right" ? "end" : "middle";
  const fontFamily = escapeXml(getFontFamily(node.data.fontFamily));
  const fontWeight = (node.data.bold ?? true) ? 700 : 400;
  const fontStyle = node.data.italic ? "italic" : "normal";
  const textDecoration = node.data.underline ? "underline" : "none";
  const strokeWidth = getNodeStrokeWidth(node.data);
  const strokeDasharray = getNodeStrokeDasharray(node.data);
  const strokeDash = strokeDasharray ? ` stroke-dasharray="${escapeXml(String(strokeDasharray))}"` : "";
  const common = `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${strokeDash}`;
  const textAttrs = `text-anchor="${textAnchor}" font-size="${fontSize}" fill="${text}" font-family="${fontFamily}" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDecoration}"`;
  const labelSvg = svgMultilineText(label, labelX, y + height / 2 + fontSize / 3, textAttrs, fontSize);
  const wrapSvg = (content: string) => wrapNodeSvg(node, content);
  if (node.data.shape === "decision") {
    return wrapSvg(`<polygon points="${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}" ${common}/>${labelSvg}`);
  }
  if (node.data.shape === "bpmnGateway" || node.data.shape === "erRelationship") {
    const innerInset = Math.min(width, height) * 0.18;
    const innerDiamond =
      node.data.shape === "bpmnGateway"
        ? `<polygon points="${x + width / 2},${y + innerInset} ${x + width - innerInset},${y + height / 2} ${x + width / 2},${y + height - innerInset} ${x + innerInset},${y + height / 2}" fill="none" stroke="${stroke}" stroke-width="${Math.max(1, strokeWidth * 0.75)}"/>`
        : "";
    const relationshipCardinalities =
      node.data.shape === "erRelationship"
        ? [
            node.data.erSourceCardinality
              ? `<text x="${x + width * 0.22}" y="${y + height * 0.5 - 10}" text-anchor="middle" font-size="${Math.max(9, fontSize - 2)}" fill="${text}" font-family="${fontFamily}" font-weight="700">${escapeXml(node.data.erSourceCardinality)}</text>`
              : "",
            node.data.erTargetCardinality
              ? `<text x="${x + width * 0.78}" y="${y + height * 0.5 - 10}" text-anchor="middle" font-size="${Math.max(9, fontSize - 2)}" fill="${text}" font-family="${fontFamily}" font-weight="700">${escapeXml(node.data.erTargetCardinality)}</text>`
              : ""
          ].join("")
        : "";
    return wrapSvg(`<polygon points="${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}" ${common}/>${innerDiamond}${labelSvg}${relationshipCardinalities}`);
  }
  if (node.data.shape === "terminator") {
    return wrapSvg(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" ${common}/>${labelSvg}`);
  }
  if (node.data.shape === "circle" || node.data.shape === "bpmnStartEvent" || node.data.shape === "bpmnEndEvent" || node.data.shape === "erAttribute" || node.data.shape === "mindTopic") {
    const eventStrokeWidth = node.data.shape === "bpmnEndEvent" ? strokeWidth * 2 : strokeWidth;
    return wrapSvg(`<ellipse cx="${x + width / 2}" cy="${y + height / 2}" rx="${width / 2}" ry="${height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${eventStrokeWidth}"${strokeDash}/>${labelSvg}`);
  }
  if (node.data.shape === "mindBranch") {
    const markerStroke = Math.max(3, strokeWidth * 1.2);
    return wrapSvg(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" ${common}/><line x1="${x + 12}" y1="${y + 8}" x2="${x + 12}" y2="${y + height - 8}" stroke="${stroke}" stroke-width="${markerStroke}"/>${labelSvg}`);
  }
  if (node.data.shape === "orgPerson") {
    const avatar = Math.min(28, height * 0.38);
    const avatarSvg = `<circle cx="${x + 24}" cy="${y + 22}" r="${avatar / 2}" fill="none" stroke="${stroke}" stroke-width="${Math.max(1, strokeWidth * 0.8)}"/><path d="M ${x + 12} ${y + 52} Q ${x + 24} ${y + 40}, ${x + 36} ${y + 52}" fill="none" stroke="${stroke}" stroke-width="${Math.max(1, strokeWidth * 0.8)}"/>`;
    const personText = svgMultilineText(label, x + 52, y + height / 2 + fontSize / 3, `text-anchor="start" font-size="${fontSize}" fill="${text}" font-family="${fontFamily}" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDecoration}"`, fontSize);
    return wrapSvg(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10" ${common}/>${avatarSvg}${personText}`);
  }
  if (node.data.shape === "hexagon") {
    return wrapSvg(`<polygon points="${x + width * 0.2},${y} ${x + width * 0.8},${y} ${x + width},${y + height / 2} ${x + width * 0.8},${y + height} ${x + width * 0.2},${y + height} ${x},${y + height / 2}" ${common}/>${labelSvg}`);
  }
  if (node.data.shape === "bpmnTask") {
    const markerSize = Math.min(18, height * 0.24);
    return wrapSvg(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" ${common}/><rect x="${x + 12}" y="${y + height - markerSize - 10}" width="${markerSize}" height="${markerSize}" rx="3" fill="none" stroke="${stroke}" stroke-width="${Math.max(1, strokeWidth * 0.75)}"/>${labelSvg}`);
  }
  if (node.data.shape === "umlClass") {
    const titleAttrs = `text-anchor="middle" font-size="${fontSize}" fill="${text}" font-family="${fontFamily}" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDecoration}"`;
    const sectionFontSize = Math.max(10, fontSize - 1);
    const sectionAttrs = `text-anchor="start" font-size="${sectionFontSize}" fill="${text}" font-family="${fontFamily}" font-weight="500" font-style="${fontStyle}" text-decoration="${textDecoration}"`;
    const lineHeight = sectionFontSize * 1.22;
    const sectionText = (lines: string[], top: number, sectionHeight: number) =>
      lines
        .slice(0, Math.max(1, Math.floor((sectionHeight - 4) / lineHeight)))
        .map((line, index) => `<text x="${x + 10}" y="${top + 16 + index * lineHeight}" ${sectionAttrs}>${escapeXml(line || " ")}</text>`)
        .join("");
    const classTitle = svgMultilineText(label, x + width / 2, y + height * 0.18 + fontSize / 3, titleAttrs, fontSize);
    const attributesSvg = sectionText(getUmlAttributes(node.data), y + height * 0.34, height * 0.3);
    const methodsSvg = sectionText(getUmlMethods(node.data), y + height * 0.64, height * 0.36);
    return wrapSvg(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" ${common}/><line x1="${x}" y1="${y + height * 0.34}" x2="${x + width}" y2="${y + height * 0.34}" stroke="${stroke}" stroke-width="${strokeWidth}"/><line x1="${x}" y1="${y + height * 0.64}" x2="${x + width}" y2="${y + height * 0.64}" stroke="${stroke}" stroke-width="${strokeWidth}"/>${classTitle}${attributesSvg}${methodsSvg}`);
  }
  if (node.data.shape === "erEntity") {
    const fields = getErFields(node.data);
    const titleHeight = Math.min(32, height * 0.38);
    const titleAttrs = `text-anchor="middle" font-size="${fontSize}" fill="${text}" font-family="${fontFamily}" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDecoration}"`;
    const fieldFontSize = Math.max(9, Math.min(fontSize - 1, 13));
    const rowHeight = fieldFontSize * 1.45;
    const fieldAttrs = `font-size="${fieldFontSize}" fill="${text}" font-family="${fontFamily}" font-weight="500"`;
    const keyBadge = (field: ErField, rowY: number) => {
      if (!field.key) return "";
      const badgeWidth = field.key === "PK" ? 22 : 20;
      const badgeFill = field.key === "PK" ? "#255f9e" : "#3f8f46";
      return `<rect x="${x + 8}" y="${rowY - fieldFontSize + 1}" width="${badgeWidth}" height="${fieldFontSize + 4}" rx="3" fill="${badgeFill}" fill-opacity="0.14" stroke="${badgeFill}" stroke-width="1"/><text x="${x + 8 + badgeWidth / 2}" y="${rowY}" text-anchor="middle" font-size="${Math.max(8, fieldFontSize - 2)}" fill="${badgeFill}" font-family="${fontFamily}" font-weight="700">${field.key}</text>`;
    };
    const fieldText = fields
      .slice(0, Math.max(1, Math.floor((height - titleHeight - 8) / rowHeight)))
      .map((field, index) => {
        const rowY = y + titleHeight + 15 + index * rowHeight;
        const fieldX = x + (field.key ? 38 : 10);
        const type = field.type ? `<tspan fill="${text}" opacity="0.72">: ${escapeXml(field.type)}</tspan>` : "";
        return `${keyBadge(field, rowY)}<text x="${fieldX}" y="${rowY}" ${fieldAttrs}>${escapeXml(field.name || " ")}${type}</text>`;
      })
      .join("");
    return wrapSvg(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="3" ${common}/><line x1="${x}" y1="${y + titleHeight}" x2="${x + width}" y2="${y + titleHeight}" stroke="${stroke}" stroke-width="${Math.max(1, strokeWidth * 0.72)}"/>${svgMultilineText(label, x + width / 2, y + titleHeight / 2 + fontSize / 3, titleAttrs, fontSize)}${fieldText}`);
  }
  if (node.data.shape === "swimlane") {
    const titleAttrs = `text-anchor="start" font-size="${fontSize}" fill="${text}" font-family="${fontFamily}" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDecoration}"`;
    const titleSvg = svgMultilineText(label, x + 12, y + 22, titleAttrs, fontSize);
    const laneCount = getSwimlaneCount(node.data);
    const laneOrientation = getSwimlaneOrientation(node.data);
    const laneLabels = getSwimlaneLabels(node.data);
    const laneLabelAttrs = `text-anchor="start" font-size="${Math.max(10, fontSize - 2)}" fill="${stroke}" font-family="${fontFamily}" font-weight="700" opacity="0.82"`;
    const laneLabelSvg = laneLabels
      .map((laneLabel, index) => {
        if (laneOrientation === "horizontal") {
          const laneHeight = (height - SWIMLANE_TITLE_HEIGHT) / laneCount;
          return svgMultilineText(laneLabel, x + 12, y + SWIMLANE_TITLE_HEIGHT + laneHeight * index + 18, laneLabelAttrs, Math.max(10, fontSize - 2));
        }
        const laneWidth = width / laneCount;
        const labelX = x + laneWidth * index + 10;
        const labelY = y + SWIMLANE_TITLE_HEIGHT + 18;
        return `<text x="${labelX}" y="${labelY}" ${laneLabelAttrs} transform="rotate(90 ${labelX} ${labelY})">${escapeXml(laneLabel)}</text>`;
      })
      .join("");
    const dividers = getSwimlaneDividerLines(x, y, width, height, node.data)
      .map((line) => `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${stroke}" stroke-width="${Math.max(1, strokeWidth * 0.75)}" opacity="0.55"/>`)
      .join("");
    return wrapSvg(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" ${common}/><rect x="${x}" y="${y}" width="${width}" height="${SWIMLANE_TITLE_HEIGHT}" rx="8" fill="${stroke}" opacity="0.08"/><line x1="${x}" y1="${y + SWIMLANE_TITLE_HEIGHT}" x2="${x + width}" y2="${y + SWIMLANE_TITLE_HEIGHT}" stroke="${stroke}" stroke-width="${Math.max(1, strokeWidth * 0.75)}" opacity="0.7"/>${dividers}${titleSvg}${laneLabelSvg}`);
  }
  if (node.data.shape === "table") {
    const rows = getTableRows(node.data);
    const columns = getTableColumns(node.data);
    const cells = getTableCellValues(node.data, rows, columns);
    const hasCellText = cells.some((cell) => cell.trim());
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const cellFontSize = Math.max(9, Math.min(fontSize, cellHeight * 0.32));
    const cellAttrs = `text-anchor="middle" font-size="${cellFontSize}" fill="${text}" font-family="${fontFamily}" font-weight="${fontWeight}"`;
    const cellTextSvg = hasCellText
      ? cells
          .map((cell, index) => {
            if (!cell.trim()) return "";
            const row = Math.floor(index / columns);
            const column = index % columns;
            return svgMultilineText(cell, x + cellWidth * column + cellWidth / 2, y + cellHeight * row + cellHeight / 2 + cellFontSize / 3, cellAttrs, cellFontSize);
          })
          .join("")
      : labelSvg;
    const dividers = getTableDividerLines(x, y, width, height, node.data)
      .map((line) => `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${stroke}" stroke-width="${Math.max(1, strokeWidth * 0.65)}" opacity="0.55"/>`)
      .join("");
    return wrapSvg(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" ${common}/>${dividers}${cellTextSvg}`);
  }
  if (node.data.shape === "document") {
    const waveTop = y + height - 12;
    return wrapSvg(`<path d="M ${x} ${y} H ${x + width} V ${waveTop} Q ${x + width * 0.75} ${y + height + 6}, ${x + width / 2} ${y + height - 4} T ${x} ${y + height - 4} Z" ${common}/>${labelSvg}`);
  }
  if (node.data.shape === "data") {
    const offset = Math.min(24, width * 0.18);
    return wrapSvg(`<polygon points="${x + offset},${y} ${x + width},${y} ${x + width - offset},${y + height} ${x},${y + height}" ${common}/>${labelSvg}`);
  }
  if (node.data.shape === "subprocess") {
    const inset = Math.min(16, width * 0.12);
    const innerStroke = Math.max(1, strokeWidth * 0.75);
    return wrapSvg(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" ${common}/><line x1="${x + inset}" y1="${y + 8}" x2="${x + inset}" y2="${y + height - 8}" stroke="${stroke}" stroke-width="${innerStroke}"/><line x1="${x + width - inset}" y1="${y + 8}" x2="${x + width - inset}" y2="${y + height - 8}" stroke="${stroke}" stroke-width="${innerStroke}"/>${labelSvg}`);
  }
  if (node.data.shape === "note") {
    const fold = Math.min(24, width * 0.22, height * 0.35);
    return wrapSvg(`<path d="M ${x} ${y} H ${x + width - fold} L ${x + width} ${y + fold} V ${y + height} H ${x} Z" ${common}/><polygon points="${x + width - fold},${y} ${x + width - fold},${y + fold} ${x + width},${y + fold}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="0.72"/>${labelSvg}`);
  }
  if (node.data.shape === "database") {
    return wrapSvg(`<ellipse cx="${x + width / 2}" cy="${y + 12}" rx="${width / 2}" ry="12" ${common}/><path d="M ${x} ${y + 12} V ${y + height - 12} A ${width / 2} 12 0 0 0 ${x + width} ${y + height - 12} V ${y + 12}" ${common}/>${labelSvg}`);
  }
  if (node.data.shape === "manual") {
    return wrapSvg(`<polygon points="${x},${y + 12} ${x + width},${y} ${x + width},${y + height} ${x},${y + height}" ${common}/>${labelSvg}`);
  }
  if (node.data.shape === "delay") {
    return wrapSvg(`<path d="M ${x} ${y} H ${x + width - height / 2} A ${height / 2} ${height / 2} 0 0 1 ${x + width - height / 2} ${y + height} H ${x} Z" ${common}/>${labelSvg}`);
  }
  if (node.data.shape === "preparation") {
    return wrapSvg(`<polygon points="${x + width * 0.12},${y} ${x + width * 0.88},${y} ${x + width},${y + height / 2} ${x + width * 0.88},${y + height} ${x + width * 0.12},${y + height} ${x},${y + height / 2}" ${common}/>${labelSvg}`);
  }
  if (node.data.shape === "offpage") {
    return wrapSvg(`<polygon points="${x},${y} ${x + width},${y} ${x + width},${y + height * 0.72} ${x + width / 2},${y + height} ${x},${y + height * 0.72}" ${common}/>${labelSvg}`);
  }
  if (node.data.shape === "merge") {
    return wrapSvg(`<polygon points="${x + width / 2},${y + height} ${x},${y} ${x + width},${y}" ${common}/>${svgMultilineText(label, labelX, y + height * 0.42, textAttrs, fontSize)}`);
  }
  if (node.data.shape === "display") {
    return wrapSvg(`<path d="M ${x} ${y} H ${x + width - 24} A ${height / 2} ${height / 2} 0 0 1 ${x + width - 24} ${y + height} H ${x} Z" ${common}/>${labelSvg}`);
  }
  if (node.data.shape === "text") {
    return wrapSvg(labelSvg);
  }
  return wrapSvg(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" ${common}/>${labelSvg}`);
}

export function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" };
    return map[char];
  });
}
