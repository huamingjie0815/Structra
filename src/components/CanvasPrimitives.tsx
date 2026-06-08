import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  NodeResizer,
  Position,
  type EdgeProps,
  type NodeProps,
  useReactFlow
} from "@xyflow/react";
import { Lock, Plus } from "lucide-react";
import type { CSSProperties, MouseEvent, PointerEvent } from "react";

import { RULER_SIZE } from "../domain/diagramDefaults";
import {
  getErFields,
  BPMN_EVENT_LABELS,
  BPMN_GATEWAY_LABELS,
  BPMN_TASK_LABELS,
  MIND_SIDE_LABELS,
  getBpmnEventType,
  getBpmnGatewayType,
  getBpmnTaskType,
  getFontFamily,
  getMindPriority,
  getMindProgress,
  getMindSide,
  getNodeOpacity,
  getNodeStrokeStyle,
  getNodeStrokeWidth,
  getOrgDepartment,
  getOrgRole,
  getSwimlaneCount,
  getSwimlaneLabels,
  getSwimlaneOrientation,
  getTableCellValues,
  getTableColumns,
  getTableRows,
  getUmlAttributes,
  getUmlMethods
} from "../domain/nodeSemantics";
import type { CanvasSize, CanvasViewport, DiagramEdge, DiagramNode, DiagramNodeData } from "../domain/types";
import {
  getDiagramEdgePath,
  getEdgeBendOffset,
  getEdgeWaypoints,
  normalizeEdgeBendOffset
} from "../editor/edgeGeometry";
import { getNodeRotation } from "../editor/geometry";

export const EDGE_ROUTE_COMMIT_EVENT = "structra-edge-route-commit";

function DiagramNodeView({ data, selected }: NodeProps<DiagramNode>) {
  const className = `diagram-node ${data.shape}${selected ? " selected" : ""}${data.locked ? " locked" : ""}`;
  const style = {
    "--node-fill": data.fill,
    "--node-stroke": data.stroke,
    "--node-text": data.text,
    "--node-width": `${data.width}px`,
    "--node-height": `${data.height}px`,
    "--node-font": `${data.fontSize}px`,
    "--node-align": data.textAlign ?? "center",
    "--node-border-width": `${getNodeStrokeWidth(data)}px`,
    "--node-border-style": getNodeStrokeStyle(data),
    "--node-opacity": `${getNodeOpacity(data)}`,
    "--node-family": getFontFamily(data.fontFamily),
    "--node-weight": (data.bold ?? true) ? "700" : "400",
    "--node-style": data.italic ? "italic" : "normal",
    "--node-decoration": data.underline ? "underline" : "none",
    "--node-rotation": `${getNodeRotation(data)}deg`
  } as CSSProperties;

  return (
    <div className={className} style={style}>
      <NodeResizer
        isVisible={selected && !data.locked}
        minWidth={64}
        minHeight={42}
        color="#0f89c8"
        handleClassName="node-resize-handle"
        lineClassName="node-resize-line"
      />
      {data.locked ? (
        <div className="node-lock-badge" aria-hidden="true">
          <Lock size={11} />
        </div>
      ) : null}
      {(["Top", "Right", "Bottom", "Left"] as const).map((side) => {
        const position = Position[side];
        const id = side.toLowerCase();
        return (
          <div key={id}>
            <Handle type="target" id={`${id}-target`} position={position} className={`node-handle target ${id}`} />
            <Handle type="source" id={`${id}-source`} position={position} className={`node-handle source ${id}`} />
          </div>
        );
      })}
      <div className="node-content">
        {data.shape === "swimlane" ? (
          <SwimlaneContent data={data} />
        ) : data.shape === "table" ? (
          <TableContent data={data} />
        ) : data.shape === "umlClass" ? (
          <UmlClassContent data={data} />
        ) : data.shape === "erEntity" ? (
          <ErEntityContent data={data} />
        ) : data.shape === "erRelationship" ? (
          <ErRelationshipContent data={data} />
        ) : data.shape === "bpmnStartEvent" || data.shape === "bpmnEndEvent" || data.shape === "bpmnTask" || data.shape === "bpmnGateway" ? (
          <BpmnNodeContent data={data} />
        ) : data.shape === "mindTopic" || data.shape === "mindBranch" ? (
          <MindNodeContent data={data} />
        ) : data.shape === "orgPerson" || data.shape === "orgUnit" ? (
          <OrgNodeContent data={data} />
        ) : (
          data.label
        )}
      </div>
    </div>
  );
}

function SwimlaneContent({ data }: { data: DiagramNodeData }) {
  const laneCount = getSwimlaneCount(data);
  const laneOrientation = getSwimlaneOrientation(data);
  const laneLabels = getSwimlaneLabels(data);
  return (
    <>
      <div className="lane-title">{data.label}</div>
      <div className={`lane-dividers ${laneOrientation}`} aria-hidden="true">
        {Array.from({ length: laneCount - 1 }, (_, index) => (
          <span
            key={index}
            style={{ [laneOrientation === "horizontal" ? "top" : "left"]: `${((index + 1) / laneCount) * 100}%` } as CSSProperties}
          />
        ))}
      </div>
      <div className={`lane-labels ${laneOrientation}`} aria-hidden="true">
        {laneLabels.map((label, index) => (
          <span
            key={index}
            style={
              laneOrientation === "horizontal"
                ? ({ top: `${(index / laneCount) * 100}%`, height: `${100 / laneCount}%` } as CSSProperties)
                : ({ left: `${(index / laneCount) * 100}%`, width: `${100 / laneCount}%` } as CSSProperties)
            }
          >
            {label}
          </span>
        ))}
      </div>
    </>
  );
}

function TableContent({ data }: { data: DiagramNodeData }) {
  const rows = getTableRows(data);
  const columns = getTableColumns(data);
  const cells = getTableCellValues(data, rows, columns);
  const hasCellText = cells.some((cell) => cell.trim());
  return (
    <>
      {hasCellText ? (
        <span className="table-cells" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
          {cells.map((cell, index) => (
            <span key={index} className="table-cell">
              {cell}
            </span>
          ))}
        </span>
      ) : (
        <span className="table-title">{data.label}</span>
      )}
      <span className="table-grid-lines" aria-hidden="true">
        {Array.from({ length: rows - 1 }, (_, index) => (
          <span key={`row-${index}`} className="row" style={{ top: `${((index + 1) / rows) * 100}%` }} />
        ))}
        {Array.from({ length: columns - 1 }, (_, index) => (
          <span key={`col-${index}`} className="column" style={{ left: `${((index + 1) / columns) * 100}%` }} />
        ))}
      </span>
    </>
  );
}

function UmlClassContent({ data }: { data: DiagramNodeData }) {
  const attributes = getUmlAttributes(data);
  const methods = getUmlMethods(data);
  return (
    <span className="uml-compartments">
      <strong className="uml-class-title">{data.label}</strong>
      <span className="uml-class-section">
        {attributes.map((item, index) => (
          <span key={index}>{item || " "}</span>
        ))}
      </span>
      <span className="uml-class-section">
        {methods.map((item, index) => (
          <span key={index}>{item || " "}</span>
        ))}
      </span>
    </span>
  );
}

function ErEntityContent({ data }: { data: DiagramNodeData }) {
  const fields = getErFields(data);
  return (
    <span className="er-entity-content">
      <strong className="er-entity-title">{data.label}</strong>
      <span className="er-field-list">
        {fields.map((field, index) => (
          <span key={index} className="er-field-row">
            {field.key ? <b className={`er-key ${field.key.toLowerCase()}`}>{field.key}</b> : <i className="er-key-spacer" />}
            <span className="er-field-name">{field.name || " "}</span>
            {field.type ? <span className="er-field-type">{field.type}</span> : null}
          </span>
        ))}
      </span>
    </span>
  );
}

function ErRelationshipContent({ data }: { data: DiagramNodeData }) {
  return (
    <span className="er-relationship-content">
      {data.erSourceCardinality ? <span className="er-cardinality source">{data.erSourceCardinality}</span> : null}
      <strong>{data.label}</strong>
      {data.erTargetCardinality ? <span className="er-cardinality target">{data.erTargetCardinality}</span> : null}
    </span>
  );
}

function BpmnNodeContent({ data }: { data: DiagramNodeData }) {
  const badge =
    data.shape === "bpmnTask"
      ? BPMN_TASK_LABELS[getBpmnTaskType(data)]
      : data.shape === "bpmnGateway"
        ? BPMN_GATEWAY_LABELS[getBpmnGatewayType(data)]
        : BPMN_EVENT_LABELS[getBpmnEventType(data)];
  return (
    <span className="semantic-node-content bpmn-semantic-content">
      <strong>{data.label}</strong>
      <span className="semantic-badge">{badge}</span>
    </span>
  );
}

function MindNodeContent({ data }: { data: DiagramNodeData }) {
  const priority = getMindPriority(data);
  const progress = getMindProgress(data);
  const side = getMindSide(data);
  return (
    <span className="semantic-node-content mind-semantic-content">
      <strong>{data.label}</strong>
      <span className="semantic-badge-row">
        {priority > 0 ? <span className="semantic-badge">P{priority}</span> : null}
        {progress > 0 ? <span className="semantic-badge">{progress}%</span> : null}
        {side !== "auto" ? <span className="semantic-badge">{MIND_SIDE_LABELS[side]}</span> : null}
      </span>
    </span>
  );
}

function OrgNodeContent({ data }: { data: DiagramNodeData }) {
  const role = getOrgRole(data);
  const department = getOrgDepartment(data);
  return (
    <span className="semantic-node-content org-semantic-content">
      <strong>{data.label}</strong>
      {role || department ? (
        <span className="org-meta">
          {role ? <span>{role}</span> : null}
          {department ? <span>{department}</span> : null}
        </span>
      ) : null}
    </span>
  );
}

export function CanvasRulers({ viewport, size }: { viewport: CanvasViewport; size: CanvasSize }) {
  const width = Math.max(1, size.width);
  const height = Math.max(1, size.height);
  const xTicks = getRulerTicks("x", viewport, size);
  const yTicks = getRulerTicks("y", viewport, size);

  return (
    <div className="canvas-rulers" aria-hidden="true">
      <div className="ruler-corner" />
      <svg className="canvas-ruler ruler-top" width={width} height={RULER_SIZE}>
        {xTicks.map((tick) => (
          <g key={`x-${tick.value}`}>
            <line x1={tick.position} y1={tick.major ? 7 : 13} x2={tick.position} y2={RULER_SIZE} />
            {tick.major ? <text x={tick.position + 3} y={10}>{formatRulerValue(tick.value)}</text> : null}
          </g>
        ))}
      </svg>
      <svg className="canvas-ruler ruler-left" width={RULER_SIZE} height={height}>
        {yTicks.map((tick) => (
          <g key={`y-${tick.value}`}>
            <line x1={tick.major ? 7 : 13} y1={tick.position} x2={RULER_SIZE} y2={tick.position} />
            {tick.major ? (
              <text transform={`translate(10 ${tick.position - 3}) rotate(-90)`}>{formatRulerValue(tick.value)}</text>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}

function getRulerTicks(axis: "x" | "y", viewport: CanvasViewport, size: CanvasSize) {
  const length = Math.max(1, axis === "x" ? size.width : size.height);
  const offset = axis === "x" ? viewport.x : viewport.y;
  const zoom = Math.max(0.05, viewport.zoom);
  const majorStep = getRulerMajorStep(zoom);
  const minorStep = majorStep / 2;
  const start = (0 - offset) / zoom;
  const end = (length - offset) / zoom;
  const first = Math.floor(start / minorStep) * minorStep;
  const ticks: Array<{ value: number; position: number; major: boolean }> = [];

  for (let value = first; value <= end + minorStep && ticks.length < 200; value += minorStep) {
    const normalized = value / majorStep;
    const major = Math.abs(normalized - Math.round(normalized)) < 0.001;
    ticks.push({ value, position: value * zoom + offset, major });
  }

  return ticks;
}

function getRulerMajorStep(zoom: number) {
  const targetWorldPixels = 80 / Math.max(0.05, zoom);
  const magnitude = 10 ** Math.floor(Math.log10(targetWorldPixels));
  const normalized = targetWorldPixels / magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function formatRulerValue(value: number) {
  return Math.abs(value) >= 1000 ? `${Math.round(value / 100) / 10}k` : String(Math.round(value));
}

function DiagramEdgeView({
  id,
  type,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  label,
  labelStyle,
  labelBgStyle,
  markerStart,
  markerEnd,
  style,
  selected,
  interactionWidth
}: EdgeProps<DiagramEdge>) {
  const reactFlow = useReactFlow<DiagramNode, DiagramEdge>();
  const edgeType = String(type ?? "smoothstep");
  const bendOffset = getEdgeBendOffset({ data });
  const waypoints = getEdgeWaypoints({ data });
  const [path, labelX, labelY] = getDiagramEdgePath({
    type: edgeType,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    bendOffset,
    waypoints
  });
  const canAdjustBend = selected && edgeType !== "straight" && waypoints.length === 0;
  const bendHandleStyle = {
    transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 28}px)`
  } as CSSProperties;
  const addHandleStyle = {
    transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + 30}px)`
  } as CSSProperties;

  const addWaypoint = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const nextWaypoint = { x: Math.round(labelX), y: Math.round(labelY) };
    reactFlow.updateEdge(id, (edge) => ({
      ...edge,
      data: { ...edge.data, waypoints: [...getEdgeWaypoints(edge), nextWaypoint].slice(0, 8) }
    }));
    window.setTimeout(notifyEdgeRouteCommit, 0);
  };

  const removeWaypoint = (event: MouseEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    reactFlow.updateEdge(id, (edge) => ({
      ...edge,
      data: { ...edge.data, waypoints: getEdgeWaypoints(edge).filter((_, waypointIndex) => waypointIndex !== index) }
    }));
    window.setTimeout(notifyEdgeRouteCommit, 0);
  };

  const startWaypointDrag = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWaypoint = waypoints[index];
    if (!startWaypoint) return;
    const zoom = Math.max(0.05, reactFlow.getZoom());

    const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
      const nextX = Math.round(startWaypoint.x + (moveEvent.clientX - startX) / zoom);
      const nextY = Math.round(startWaypoint.y + (moveEvent.clientY - startY) / zoom);
      reactFlow.updateEdge(id, (edge) => {
        const nextWaypoints = getEdgeWaypoints(edge).map((waypoint, waypointIndex) =>
          waypointIndex === index ? { x: nextX, y: nextY } : waypoint
        );
        return { ...edge, data: { ...edge.data, waypoints: nextWaypoints } };
      });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.setTimeout(notifyEdgeRouteCommit, 0);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  };

  const startBendDrag = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startOffset = bendOffset;
    const zoom = Math.max(0.05, reactFlow.getZoom());
    const axis = sourcePosition === Position.Top || sourcePosition === Position.Bottom ? "y" : "x";
    const sign = sourcePosition === Position.Left || sourcePosition === Position.Top ? -1 : 1;

    const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
      const delta = axis === "x" ? moveEvent.clientX - startX : moveEvent.clientY - startY;
      const nextOffset = normalizeEdgeBendOffset(startOffset + (delta * sign) / zoom);
      reactFlow.updateEdge(id, (edge) => ({
        ...edge,
        data: { ...edge.data, bendOffset: nextOffset }
      }));
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.setTimeout(notifyEdgeRouteCommit, 0);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        labelX={labelX}
        labelY={labelY}
        label={label}
        labelStyle={labelStyle}
        labelShowBg={Boolean(label)}
        labelBgStyle={labelBgStyle}
        labelBgPadding={[5, 3]}
        labelBgBorderRadius={4}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={style}
        interactionWidth={interactionWidth}
      />
      {selected ? (
        <EdgeLabelRenderer>
          {canAdjustBend ? (
            <button
              className="edge-bend-handle nodrag nopan"
              style={bendHandleStyle}
              aria-label="拖拽调整折点"
              title="拖拽调整折点"
              onPointerDown={startBendDrag}
            />
          ) : null}
          <button
            className="edge-waypoint-add-handle nodrag nopan"
            style={addHandleStyle}
            aria-label="添加手动折点"
            title="添加手动折点"
            onClick={addWaypoint}
            disabled={waypoints.length >= 8}
          >
            <Plus size={12} strokeWidth={3} />
          </button>
          {waypoints.map((waypoint, index) => (
            <button
              key={`${waypoint.x}-${waypoint.y}-${index}`}
              className="edge-waypoint-handle nodrag nopan"
              style={{ transform: `translate(-50%, -50%) translate(${waypoint.x}px, ${waypoint.y}px)` }}
              aria-label={`拖拽手动折点 ${index + 1}`}
              title="拖拽调整，双击删除"
              onPointerDown={(event) => startWaypointDrag(event, index)}
              onDoubleClick={(event) => removeWaypoint(event, index)}
            />
          ))}
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

function notifyEdgeRouteCommit() {
  window.dispatchEvent(new Event(EDGE_ROUTE_COMMIT_EVENT));
}

export const nodeTypes = { diagram: DiagramNodeView };
export const edgeTypes = { smoothstep: DiagramEdgeView, step: DiagramEdgeView, straight: DiagramEdgeView, bezier: DiagramEdgeView };
