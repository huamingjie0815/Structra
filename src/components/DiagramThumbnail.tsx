import type React from "react";

import {
  getNodeOpacity,
  getNodeStrokeDasharray,
  getNodeStrokeWidth,
  getSwimlaneDividerLines,
  getTableDividerLines
} from "../domain/nodeSemantics";
import { SWIMLANE_TITLE_HEIGHT } from "../domain/diagramDefaults";
import type { DiagramEdge, DiagramNode, DiagramPage } from "../domain/types";
import { getEdgeEndpoints, getEdgeStroke, getEdgeStrokeWidth, getSvgEdgePath } from "../editor/edgeGeometry";
import { getBounds, getNodeRotation } from "../editor/geometry";
import { getVisibleGraph } from "../io/exporters";

export function DiagramThumbnail({ nodes, edges, className = "page-thumbnail" }: { nodes: DiagramNode[]; edges: DiagramEdge[]; className?: string }) {
  const visibleGraph = getVisibleGraph(nodes, edges);
  const bounds = getBounds(visibleGraph.nodes);
  const viewBox = `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`;

  return (
    <svg className={className} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} rx={18} className="page-thumbnail-bg" />
      {visibleGraph.edges.map((item) => {
        const endpoints = getEdgeEndpoints(item, visibleGraph.nodes);
        if (!endpoints) return null;
        return (
          <path
            key={item.id}
            d={getSvgEdgePath(item, endpoints)}
            fill="none"
            stroke={getEdgeStroke(item)}
            strokeWidth={Math.max(2, getEdgeStrokeWidth(item) * 1.5)}
            strokeDasharray={String(item.style?.strokeDasharray ?? "") || undefined}
            strokeLinecap="round"
            opacity={0.72}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {visibleGraph.nodes.map((node) => (
        <PageThumbnailNode key={node.id} node={node} />
      ))}
    </svg>
  );
}

export function PageThumbnail({ page }: { page: DiagramPage }) {
  return <DiagramThumbnail nodes={page.nodes} edges={page.edges} />;
}

function PageThumbnailNode({ node }: { node: DiagramNode }) {
  const { x, y } = node.position;
  const { width, height, fill, stroke, shape } = node.data;
  const rotation = getNodeRotation(node.data);
  const strokeWidth = Math.max(2, getNodeStrokeWidth(node.data) * 1.3);
  const strokeDasharray = getNodeStrokeDasharray(node.data) || undefined;
  const wrap = (element: React.ReactElement) =>
    rotation ? <g transform={`rotate(${rotation} ${x + width / 2} ${y + height / 2})`}>{element}</g> : element;
  const common = {
    fill,
    stroke,
    strokeWidth,
    strokeDasharray,
    opacity: getNodeOpacity(node.data),
    vectorEffect: "non-scaling-stroke" as const
  };

  if (shape === "decision") {
    return wrap(<polygon points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`} {...common} />);
  }
  if (shape === "bpmnGateway" || shape === "erRelationship") {
    const innerInset = Math.min(width, height) * 0.18;
    return wrap(
      <g opacity={common.opacity}>
        <polygon points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`} {...common} opacity={1} />
        {shape === "bpmnGateway" ? (
          <polygon
            points={`${x + width / 2},${y + innerInset} ${x + width - innerInset},${y + height / 2} ${x + width / 2},${y + height - innerInset} ${x + innerInset},${y + height / 2}`}
            fill="none"
            stroke={stroke}
            strokeWidth={Math.max(1, strokeWidth * 0.75)}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </g>
    );
  }
  if (shape === "terminator") {
    return wrap(<rect x={x} y={y} width={width} height={height} rx={height / 2} {...common} />);
  }
  if (shape === "circle" || shape === "bpmnStartEvent" || shape === "bpmnEndEvent" || shape === "erAttribute" || shape === "mindTopic") {
    return wrap(
      <ellipse
        cx={x + width / 2}
        cy={y + height / 2}
        rx={width / 2}
        ry={height / 2}
        {...common}
        strokeWidth={shape === "bpmnEndEvent" ? strokeWidth * 2 : strokeWidth}
      />
    );
  }
  if (shape === "mindBranch") {
    return wrap(
      <g opacity={common.opacity}>
        <rect x={x} y={y} width={width} height={height} rx={height / 2} {...common} opacity={1} />
        <line x1={x + 12} y1={y + 8} x2={x + 12} y2={y + height - 8} stroke={stroke} strokeWidth={Math.max(3, strokeWidth * 1.2)} vectorEffect="non-scaling-stroke" />
      </g>
    );
  }
  if (shape === "orgPerson") {
    const avatar = Math.min(28, height * 0.38);
    return wrap(
      <g opacity={common.opacity}>
        <rect x={x} y={y} width={width} height={height} rx={10} {...common} opacity={1} />
        <circle cx={x + 24} cy={y + 22} r={avatar / 2} fill="none" stroke={stroke} strokeWidth={Math.max(1, strokeWidth * 0.8)} vectorEffect="non-scaling-stroke" />
        <path d={`M ${x + 12} ${y + 52} Q ${x + 24} ${y + 40}, ${x + 36} ${y + 52}`} fill="none" stroke={stroke} strokeWidth={Math.max(1, strokeWidth * 0.8)} vectorEffect="non-scaling-stroke" />
      </g>
    );
  }
  if (shape === "hexagon") {
    return wrap(<polygon points={`${x + width * 0.2},${y} ${x + width * 0.8},${y} ${x + width},${y + height / 2} ${x + width * 0.8},${y + height} ${x + width * 0.2},${y + height} ${x},${y + height / 2}`} {...common} />);
  }
  if (shape === "bpmnTask") {
    const markerSize = Math.min(18, height * 0.24);
    return wrap(
      <g opacity={common.opacity}>
        <rect x={x} y={y} width={width} height={height} rx={12} {...common} opacity={1} />
        <rect x={x + 12} y={y + height - markerSize - 10} width={markerSize} height={markerSize} rx={3} fill="none" stroke={stroke} strokeWidth={Math.max(1, strokeWidth * 0.75)} />
      </g>
    );
  }
  if (shape === "umlClass") {
    return wrap(
      <g opacity={common.opacity}>
        <rect x={x} y={y} width={width} height={height} rx={4} {...common} opacity={1} />
        <line x1={x} y1={y + height * 0.34} x2={x + width} y2={y + height * 0.34} stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
        <line x1={x} y1={y + height * 0.64} x2={x + width} y2={y + height * 0.64} stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
      </g>
    );
  }
  if (shape === "erEntity") {
    const titleHeight = Math.min(32, height * 0.38);
    return wrap(
      <g opacity={common.opacity}>
        <rect x={x} y={y} width={width} height={height} rx={3} {...common} opacity={1} />
        <line x1={x} y1={y + titleHeight} x2={x + width} y2={y + titleHeight} stroke={stroke} strokeWidth={Math.max(1, strokeWidth * 0.7)} vectorEffect="non-scaling-stroke" />
      </g>
    );
  }
  if (shape === "data") {
    const offset = Math.min(24, width * 0.18);
    return wrap(<polygon points={`${x + offset},${y} ${x + width},${y} ${x + width - offset},${y + height} ${x},${y + height}`} {...common} />);
  }
  if (shape === "document") {
    const waveTop = y + height - 12;
    return wrap(<path d={`M ${x} ${y} H ${x + width} V ${waveTop} Q ${x + width * 0.75} ${y + height + 6}, ${x + width / 2} ${y + height - 4} T ${x} ${y + height - 4} Z`} {...common} />);
  }
  if (shape === "subprocess") {
    const inset = Math.min(16, width * 0.12);
    return wrap(
      <g opacity={common.opacity}>
        <rect x={x} y={y} width={width} height={height} rx={8} {...common} opacity={1} />
        <line x1={x + inset} y1={y + 8} x2={x + inset} y2={y + height - 8} stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
        <line x1={x + width - inset} y1={y + 8} x2={x + width - inset} y2={y + height - 8} stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
      </g>
    );
  }
  if (shape === "note") {
    const fold = Math.min(24, width * 0.22, height * 0.35);
    return wrap(
      <g opacity={common.opacity}>
        <path d={`M ${x} ${y} H ${x + width - fold} L ${x + width} ${y + fold} V ${y + height} H ${x} Z`} {...common} opacity={1} />
        <polygon points={`${x + width - fold},${y} ${x + width - fold},${y + fold} ${x + width},${y + fold}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={0.72} vectorEffect="non-scaling-stroke" />
      </g>
    );
  }
  if (shape === "database") {
    return wrap(
      <g opacity={common.opacity}>
        <ellipse cx={x + width / 2} cy={y + 12} rx={width / 2} ry={12} {...common} opacity={1} />
        <path d={`M ${x} ${y + 12} V ${y + height - 12} A ${width / 2} 12 0 0 0 ${x + width} ${y + height - 12} V ${y + 12}`} {...common} opacity={1} />
      </g>
    );
  }
  if (shape === "swimlane") {
    const dividers = getSwimlaneDividerLines(x, y, width, height, node.data);
    return wrap(
      <g opacity={common.opacity}>
        <rect x={x} y={y} width={width} height={height} rx={8} {...common} opacity={1} />
        <line x1={x} y1={y + SWIMLANE_TITLE_HEIGHT} x2={x + width} y2={y + SWIMLANE_TITLE_HEIGHT} stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
        {dividers.map((line, index) => (
          <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={stroke} strokeWidth={strokeWidth} opacity={0.55} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    );
  }
  if (shape === "table") {
    const dividers = getTableDividerLines(x, y, width, height, node.data);
    return wrap(
      <g opacity={common.opacity}>
        <rect x={x} y={y} width={width} height={height} rx={6} {...common} opacity={1} />
        {dividers.map((line, index) => (
          <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={stroke} strokeWidth={strokeWidth} opacity={0.48} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    );
  }
  if (shape === "manual") {
    return wrap(<polygon points={`${x},${y + 12} ${x + width},${y} ${x + width},${y + height} ${x},${y + height}`} {...common} />);
  }
  if (shape === "preparation") {
    return wrap(<polygon points={`${x + width * 0.12},${y} ${x + width * 0.88},${y} ${x + width},${y + height / 2} ${x + width * 0.88},${y + height} ${x + width * 0.12},${y + height} ${x},${y + height / 2}`} {...common} />);
  }
  if (shape === "offpage") {
    return wrap(<polygon points={`${x},${y} ${x + width},${y} ${x + width},${y + height * 0.72} ${x + width / 2},${y + height} ${x},${y + height * 0.72}`} {...common} />);
  }
  if (shape === "merge") {
    return wrap(<polygon points={`${x + width / 2},${y + height} ${x},${y} ${x + width},${y}`} {...common} />);
  }
  if (shape === "display" || shape === "delay") {
    return wrap(<path d={`M ${x} ${y} H ${x + width - height / 2} A ${height / 2} ${height / 2} 0 0 1 ${x + width - height / 2} ${y + height} H ${x} Z`} {...common} />);
  }
  if (shape === "text") {
    return wrap(<line x1={x} y1={y + height / 2} x2={x + width} y2={y + height / 2} stroke={node.data.text} strokeWidth={strokeWidth} strokeLinecap="round" vectorEffect="non-scaling-stroke" />);
  }
  return wrap(<rect x={x} y={y} width={width} height={height} rx={8} {...common} />);
}
