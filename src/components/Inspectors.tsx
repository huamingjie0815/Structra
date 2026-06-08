import { AlignCenter, Bold, FileText, Italic, Ruler, Type, Underline, Waypoints } from "lucide-react";

import { DEFAULT_CANVAS_SETTINGS, EDGE_DASH_PATTERNS, FONT_FAMILY_OPTIONS, PAGE_PRESETS, getShapeDataDefaults } from "../domain/diagramDefaults";
import type {
  CanvasSettings,
  BpmnEventType,
  BpmnGatewayType,
  BpmnTaskType,
  ConnectorPresetId,
  DiagramEdge,
  DiagramNode,
  DiagramNodeData,
  EdgeArrowMode,
  EdgeDashMode,
  FontFamily,
  GridVariant,
  LaneOrientation,
  MindBranchSide,
  NodeStrokeStyle,
  PagePreset,
  ShapeKind,
  TextAlign
} from "../domain/types";
import {
  formatErFieldLine,
  BPMN_EVENT_LABELS,
  BPMN_GATEWAY_LABELS,
  BPMN_TASK_LABELS,
  MIND_SIDE_LABELS,
  getBpmnEventType,
  getBpmnGatewayType,
  getBpmnTaskType,
  getErFields,
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
  getUmlMethods,
  normalizeLaneCount,
  normalizeNodeRotation,
  normalizeSwimlaneLabels,
  normalizeTableSize,
  parseErFields,
  parseUmlCompartment,
  updateTableCellValue
} from "../domain/nodeSemantics";
import {
  getEdgeArrowMode,
  getEdgeBendOffset,
  getEdgeDashMode,
  getEdgeLabelBackgroundFill,
  getEdgeLabelBackgroundOpacity,
  getEdgeLabelColor,
  getEdgeLabelFontSize,
  getEdgeStroke,
  getEdgeStrokeWidth,
  getEdgeWaypoints,
  normalizeEdgeBendOffset
} from "../editor/edgeGeometry";
import { getNodeRotation } from "../editor/geometry";
import {
  CONNECTOR_PRESETS,
  applyConnectorPreset,
  clearConnectorPreset,
  edgeArrowPatch,
  getConnectorPresetSelectValue
} from "../editor/connectorPresets";
import { shapeLibrary } from "../features/shapes/shapeLibrary";
import { IconButton } from "./IconButton";

function TextStyleControls({ data, onChange }: { data: DiagramNodeData; onChange: (patch: Partial<DiagramNodeData>) => void }) {
  return (
    <div className="text-style-controls">
      <label className="field">
        <span>字体</span>
        <select value={data.fontFamily ?? "system"} onChange={(event) => onChange({ fontFamily: event.target.value as FontFamily })}>
          {FONT_FAMILY_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </label>
      <div className="text-style-buttons" aria-label="文字样式">
        <IconButton label="粗体" active={data.bold ?? true} onClick={() => onChange({ bold: !(data.bold ?? true) })} icon={Bold} />
        <IconButton label="斜体" active={Boolean(data.italic)} onClick={() => onChange({ italic: !data.italic })} icon={Italic} />
        <IconButton label="下划线" active={Boolean(data.underline)} onClick={() => onChange({ underline: !data.underline })} icon={Underline} />
      </div>
    </div>
  );
}

export function DocumentInspector({
  pageName,
  pageCount,
  nodeCount,
  edgeCount,
  settings,
  onChange
}: {
  pageName: string;
  pageCount: number;
  nodeCount: number;
  edgeCount: number;
  settings: CanvasSettings;
  onChange: (patch: Partial<CanvasSettings>) => void;
}) {
  return (
    <div className="inspector-stack">
      <div className="batch-summary">
        <FileText size={18} />
        <span>{pageName}</span>
      </div>
      <div className="two-col">
        <label className="field">
          <span>页面数</span>
          <input value={pageCount} disabled readOnly />
        </label>
        <label className="field">
          <span>当前页对象</span>
          <input value={`${nodeCount} / ${edgeCount}`} disabled readOnly />
        </label>
      </div>
      <label className="field">
        <span>页面尺寸</span>
        <select value={settings.pagePreset} onChange={(event) => onChange({ pagePreset: event.target.value as PagePreset })}>
          <option value="content">内容</option>
          {Object.entries(PAGE_PRESETS).map(([value, preset]) => (
            <option key={value} value={value}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      <ColorField label="画布背景" value={settings.background} onChange={(background) => onChange({ background })} />
      <div className="two-col">
        <label className="field">
          <span>
            <Ruler size={14} />
            网格步长
          </span>
          <input
            type="number"
            min={4}
            max={48}
            step={2}
            value={settings.gridSize}
            onChange={(event) => onChange({ gridSize: normalizeGridSize(event.target.value) })}
          />
        </label>
        <label className="field">
          <span>网格样式</span>
          <select value={settings.gridVariant} onChange={(event) => onChange({ gridVariant: event.target.value as GridVariant })}>
            <option value="lines">线</option>
            <option value="dots">点</option>
            <option value="cross">十字</option>
          </select>
        </label>
      </div>
      <label className="check-field">
        <input type="checkbox" checked={settings.showGrid} onChange={(event) => onChange({ showGrid: event.target.checked })} />
        <span>显示网格</span>
      </label>
      <label className="check-field">
        <input type="checkbox" checked={settings.showRulers} onChange={(event) => onChange({ showRulers: event.target.checked })} />
        <span>显示标尺</span>
      </label>
      <label className="check-field">
        <input type="checkbox" checked={settings.snapToGrid} onChange={(event) => onChange({ snapToGrid: event.target.checked })} />
        <span>吸附网格</span>
      </label>
    </div>
  );
}

function normalizeGridSize(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(48, Math.max(4, Math.round(parsed))) : DEFAULT_CANVAS_SETTINGS.gridSize;
}

export function NodeInspector({
  node,
  onChange,
  onPositionChange
}: {
  node: DiagramNode;
  onChange: (patch: Partial<DiagramNodeData>) => void;
  onPositionChange: (patch: Partial<{ x: number; y: number }>) => void;
}) {
  const tableRows = getTableRows(node.data);
  const tableColumns = getTableColumns(node.data);
  const tableCells = getTableCellValues(node.data, tableRows, tableColumns);
  const umlAttributes = getUmlAttributes(node.data);
  const umlMethods = getUmlMethods(node.data);
  const erFields = getErFields(node.data);
  return (
    <div className="inspector-stack">
      <label className="field">
        <span>
          <Type size={14} />
          文本
        </span>
        <textarea value={node.data.label} onChange={(event) => onChange({ label: event.target.value })} rows={3} />
      </label>
      <label className="field">
        <span>形状</span>
        <select
          value={node.data.shape}
          onChange={(event) => {
            const shape = event.target.value as ShapeKind;
            onChange({
              shape,
              ...(shape !== node.data.shape ? getShapeDataDefaults(shape) : {})
            });
          }}
        >
          {shapeLibrary.map((shape) => (
            <option key={shape.kind} value={shape.kind}>
              {shape.label}
            </option>
          ))}
        </select>
      </label>
      {node.data.shape === "swimlane" ? (
        <div className="two-col">
          <label className="field">
            <span>泳道数</span>
            <input
              type="number"
              min={2}
              max={8}
              value={getSwimlaneCount(node.data)}
              onChange={(event) => {
                const laneCount = normalizeLaneCount(event.target.value);
                onChange({ laneCount, laneLabels: normalizeSwimlaneLabels(getSwimlaneLabels(node.data).join("\n"), laneCount) });
              }}
            />
          </label>
          <label className="field">
            <span>方向</span>
            <select value={getSwimlaneOrientation(node.data)} onChange={(event) => onChange({ laneOrientation: event.target.value as LaneOrientation })}>
              <option value="horizontal">横向</option>
              <option value="vertical">纵向</option>
            </select>
          </label>
          <label className="field full-span">
            <span>泳道名称</span>
            <textarea
              rows={getSwimlaneCount(node.data)}
              value={getSwimlaneLabels(node.data).join("\n")}
              onChange={(event) => onChange({ laneLabels: normalizeSwimlaneLabels(event.target.value, getSwimlaneCount(node.data)) })}
            />
          </label>
        </div>
      ) : null}
      {node.data.shape === "table" ? (
        <div className="two-col">
          <label className="field">
            <span>行数</span>
            <input
              type="number"
              min={1}
              max={12}
              value={tableRows}
              onChange={(event) => {
                const rows = normalizeTableSize(event.target.value);
                onChange({ tableRows: rows, tableCells: getTableCellValues(node.data, rows, tableColumns) });
              }}
            />
          </label>
          <label className="field">
            <span>列数</span>
            <input
              type="number"
              min={1}
              max={12}
              value={tableColumns}
              onChange={(event) => {
                const columns = normalizeTableSize(event.target.value);
                onChange({ tableColumns: columns, tableCells: getTableCellValues(node.data, tableRows, columns) });
              }}
            />
          </label>
          <div className="field full-span">
            <span>单元格</span>
            <div className="table-cell-editor" style={{ gridTemplateColumns: `repeat(${tableColumns}, minmax(0, 1fr))` }}>
              {tableCells.map((cell, index) => (
                <input
                  key={index}
                  aria-label={`表格单元格 ${Math.floor(index / tableColumns) + 1}-${(index % tableColumns) + 1}`}
                  value={cell}
                  onChange={(event) => onChange({ tableCells: updateTableCellValue(node.data, index, event.target.value) })}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {node.data.shape === "umlClass" ? (
        <div className="two-col">
          <label className="field full-span">
            <span>属性</span>
            <textarea
              rows={Math.max(3, umlAttributes.length)}
              value={umlAttributes.join("\n")}
              placeholder="+ id: string"
              onChange={(event) => onChange({ umlAttributes: parseUmlCompartment(event.target.value) })}
            />
          </label>
          <label className="field full-span">
            <span>方法</span>
            <textarea
              rows={Math.max(3, umlMethods.length)}
              value={umlMethods.join("\n")}
              placeholder="+ save(): void"
              onChange={(event) => onChange({ umlMethods: parseUmlCompartment(event.target.value) })}
            />
          </label>
        </div>
      ) : null}
      {node.data.shape === "erEntity" ? (
        <label className="field">
          <span>字段</span>
          <textarea
            rows={Math.max(3, erFields.length)}
            value={erFields.map(formatErFieldLine).join("\n")}
            placeholder={"PK id: string\nFK user_id: string\nstatus: string"}
            onChange={(event) => onChange({ erFields: parseErFields(event.target.value) })}
          />
        </label>
      ) : null}
      {node.data.shape === "erRelationship" ? (
        <div className="two-col">
          <label className="field">
            <span>左基数</span>
            <input value={node.data.erSourceCardinality ?? ""} placeholder="1" onChange={(event) => onChange({ erSourceCardinality: event.target.value })} />
          </label>
          <label className="field">
            <span>右基数</span>
            <input value={node.data.erTargetCardinality ?? ""} placeholder="N" onChange={(event) => onChange({ erTargetCardinality: event.target.value })} />
          </label>
        </div>
      ) : null}
      {node.data.shape === "bpmnStartEvent" || node.data.shape === "bpmnEndEvent" ? (
        <label className="field">
          <span>BPMN事件类型</span>
          <select value={getBpmnEventType(node.data)} onChange={(event) => onChange({ bpmnEventType: event.target.value as BpmnEventType })}>
            {Object.entries(BPMN_EVENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {node.data.shape === "bpmnTask" ? (
        <label className="field">
          <span>BPMN任务类型</span>
          <select value={getBpmnTaskType(node.data)} onChange={(event) => onChange({ bpmnTaskType: event.target.value as BpmnTaskType })}>
            {Object.entries(BPMN_TASK_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {node.data.shape === "bpmnGateway" ? (
        <label className="field">
          <span>BPMN网关类型</span>
          <select value={getBpmnGatewayType(node.data)} onChange={(event) => onChange({ bpmnGatewayType: event.target.value as BpmnGatewayType })}>
            {Object.entries(BPMN_GATEWAY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {node.data.shape === "mindTopic" || node.data.shape === "mindBranch" ? (
        <div className="two-col">
          <label className="field">
            <span>优先级</span>
            <input
              type="number"
              min={0}
              max={5}
              value={getMindPriority(node.data)}
              onChange={(event) => onChange({ mindPriority: Math.min(5, Math.max(0, Math.round(Number(event.target.value) || 0))) })}
            />
          </label>
          <label className="field">
            <span>进度%</span>
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={getMindProgress(node.data)}
              onChange={(event) => onChange({ mindProgress: Math.min(100, Math.max(0, Math.round(Number(event.target.value) || 0))) })}
            />
          </label>
          <label className="field full-span">
            <span>分支侧</span>
            <select value={getMindSide(node.data)} onChange={(event) => onChange({ mindSide: event.target.value as MindBranchSide })}>
              {Object.entries(MIND_SIDE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {node.data.shape === "orgPerson" || node.data.shape === "orgUnit" ? (
        <div className="two-col">
          <label className="field">
            <span>角色/职级</span>
            <input value={getOrgRole(node.data)} placeholder={node.data.shape === "orgUnit" ? "部门" : "负责人"} onChange={(event) => onChange({ orgRole: event.target.value })} />
          </label>
          <label className="field">
            <span>部门/归属</span>
            <input value={getOrgDepartment(node.data)} placeholder="产品中心" onChange={(event) => onChange({ orgDepartment: event.target.value })} />
          </label>
        </div>
      ) : null}
      <div className="two-col">
        <label className="field">
          <span>X</span>
          <input
            type="number"
            step={1}
            value={Math.round(node.position.x)}
            disabled={Boolean(node.data.locked)}
            onChange={(event) => onPositionChange({ x: Number(event.target.value) })}
          />
        </label>
        <label className="field">
          <span>Y</span>
          <input
            type="number"
            step={1}
            value={Math.round(node.position.y)}
            disabled={Boolean(node.data.locked)}
            onChange={(event) => onPositionChange({ y: Number(event.target.value) })}
          />
        </label>
      </div>
      <div className="two-col">
        <label className="field">
          <span>宽</span>
          <input type="number" min={64} value={node.data.width} onChange={(event) => onChange({ width: Number(event.target.value) })} />
        </label>
        <label className="field">
          <span>高</span>
          <input type="number" min={42} value={node.data.height} onChange={(event) => onChange({ height: Number(event.target.value) })} />
        </label>
      </div>
      <label className="field">
        <span>旋转角度</span>
        <input type="range" min={-180} max={180} step={1} value={getNodeRotation(node.data)} onChange={(event) => onChange({ rotation: normalizeNodeRotation(event.target.value) })} />
      </label>
      <label className="field">
        <span>角度数值</span>
        <input type="number" min={-180} max={180} step={1} value={getNodeRotation(node.data)} onChange={(event) => onChange({ rotation: normalizeNodeRotation(event.target.value) })} />
      </label>
      <label className="field">
        <span>
          <AlignCenter size={14} />
          字号
        </span>
        <input type="range" min={11} max={24} value={node.data.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })} />
      </label>
      <label className="field">
        <span>对齐</span>
        <select value={node.data.textAlign ?? "center"} onChange={(event) => onChange({ textAlign: event.target.value as TextAlign })}>
          <option value="left">左对齐</option>
          <option value="center">居中</option>
          <option value="right">右对齐</option>
        </select>
      </label>
      <TextStyleControls data={node.data} onChange={onChange} />
      <div className="swatches">
        <ColorField label="填充" value={node.data.fill} onChange={(fill) => onChange({ fill })} />
        <ColorField label="边框" value={node.data.stroke} onChange={(stroke) => onChange({ stroke })} />
        <ColorField label="文字" value={node.data.text} onChange={(text) => onChange({ text })} />
      </div>
      <div className="two-col">
        <label className="field">
          <span>边框粗细</span>
          <input type="range" min={0} max={8} value={getNodeStrokeWidth(node.data)} onChange={(event) => onChange({ strokeWidth: Number(event.target.value) })} />
        </label>
        <label className="field">
          <span>边框线型</span>
          <select value={getNodeStrokeStyle(node.data)} onChange={(event) => onChange({ strokeStyle: event.target.value as NodeStrokeStyle })}>
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>透明度</span>
        <input type="range" min={10} max={100} value={Math.round(getNodeOpacity(node.data) * 100)} onChange={(event) => onChange({ opacity: Number(event.target.value) / 100 })} />
      </label>
      <label className="check-field">
        <input type="checkbox" checked={Boolean(node.data.locked)} onChange={(event) => onChange({ locked: event.target.checked })} />
        <span>锁定节点</span>
      </label>
    </div>
  );
}

export function BatchInspector({
  nodes,
  onChange
}: {
  nodes: DiagramNode[];
  onChange: (patch: Partial<DiagramNodeData>) => void;
}) {
  const sample = nodes[0];
  const allMindNodes = nodes.every((node) => node.data.shape === "mindTopic" || node.data.shape === "mindBranch");
  const allOrgNodes = nodes.every((node) => node.data.shape === "orgPerson" || node.data.shape === "orgUnit");
  return (
    <div className="inspector-stack">
      <div className="batch-summary">
        <Waypoints size={18} />
        <span>已选择 {nodes.length} 个节点</span>
      </div>
      <label className="field">
        <span>
          <AlignCenter size={14} />
          批量字号
        </span>
        <input type="range" min={11} max={24} value={sample.data.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })} />
      </label>
      <label className="field">
        <span>批量对齐</span>
        <select value={sample.data.textAlign ?? "center"} onChange={(event) => onChange({ textAlign: event.target.value as TextAlign })}>
          <option value="left">左对齐</option>
          <option value="center">居中</option>
          <option value="right">右对齐</option>
        </select>
      </label>
      <TextStyleControls data={sample.data} onChange={onChange} />
      <label className="field">
        <span>批量旋转</span>
        <input type="range" min={-180} max={180} step={1} value={getNodeRotation(sample.data)} onChange={(event) => onChange({ rotation: normalizeNodeRotation(event.target.value) })} />
      </label>
      <div className="swatches">
        <ColorField label="填充" value={sample.data.fill} onChange={(fill) => onChange({ fill })} />
        <ColorField label="边框" value={sample.data.stroke} onChange={(stroke) => onChange({ stroke })} />
        <ColorField label="文字" value={sample.data.text} onChange={(text) => onChange({ text })} />
      </div>
      <div className="two-col">
        <label className="field">
          <span>批量粗细</span>
          <input type="range" min={0} max={8} value={getNodeStrokeWidth(sample.data)} onChange={(event) => onChange({ strokeWidth: Number(event.target.value) })} />
        </label>
        <label className="field">
          <span>批量线型</span>
          <select value={getNodeStrokeStyle(sample.data)} onChange={(event) => onChange({ strokeStyle: event.target.value as NodeStrokeStyle })}>
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>批量透明度</span>
        <input type="range" min={10} max={100} value={Math.round(getNodeOpacity(sample.data) * 100)} onChange={(event) => onChange({ opacity: Number(event.target.value) / 100 })} />
      </label>
      {allMindNodes ? (
        <div className="two-col">
          <label className="field">
            <span>批量优先级</span>
            <input
              type="number"
              min={0}
              max={5}
              value={getMindPriority(sample.data)}
              onChange={(event) => onChange({ mindPriority: Math.min(5, Math.max(0, Math.round(Number(event.target.value) || 0))) })}
            />
          </label>
          <label className="field">
            <span>批量进度%</span>
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={getMindProgress(sample.data)}
              onChange={(event) => onChange({ mindProgress: Math.min(100, Math.max(0, Math.round(Number(event.target.value) || 0))) })}
            />
          </label>
          <label className="field full-span">
            <span>批量分支侧</span>
            <select value={getMindSide(sample.data)} onChange={(event) => onChange({ mindSide: event.target.value as MindBranchSide })}>
              {Object.entries(MIND_SIDE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {allOrgNodes ? (
        <div className="two-col">
          <label className="field">
            <span>批量角色/职级</span>
            <input value={getOrgRole(sample.data)} placeholder={sample.data.shape === "orgUnit" ? "部门" : "负责人"} onChange={(event) => onChange({ orgRole: event.target.value })} />
          </label>
          <label className="field">
            <span>批量部门/归属</span>
            <input value={getOrgDepartment(sample.data)} placeholder="产品中心" onChange={(event) => onChange({ orgDepartment: event.target.value })} />
          </label>
        </div>
      ) : null}
      <label className="check-field">
        <input type="checkbox" checked={Boolean(sample.data.locked)} onChange={(event) => onChange({ locked: event.target.checked })} />
        <span>批量锁定</span>
      </label>
    </div>
  );
}

export function BatchEdgeInspector({
  count,
  sample,
  onChange
}: {
  count: number;
  sample: DiagramEdge;
  onChange: (patch: Partial<DiagramEdge>) => void;
}) {
  const stroke = getEdgeStroke(sample);
  const strokeWidth = getEdgeStrokeWidth(sample);
  const dashMode = getEdgeDashMode(sample);
  const arrowMode = getEdgeArrowMode(sample);
  const bendOffset = getEdgeBendOffset(sample);
  const isStraightEdge = String(sample.type ?? "smoothstep") === "straight";
  const connectorPreset = getConnectorPresetSelectValue(sample);
  return (
    <div className="inspector-stack">
      <div className="batch-summary">
        <Waypoints size={18} />
        <span>已选择 {count} 条连线</span>
      </div>
      <label className="field">
        <span>批量预设</span>
        <select
          value={connectorPreset}
          onChange={(event) => {
            const presetId = event.target.value as ConnectorPresetId | "custom";
            if (presetId !== "custom") onChange(applyConnectorPreset(sample, presetId));
          }}
        >
          <option value="custom">自定义</option>
          {CONNECTOR_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>批量线型</span>
        <select value={sample.type ?? "smoothstep"} onChange={(event) => onChange({ type: event.target.value, data: clearConnectorPreset(sample.data) })}>
          <option value="smoothstep">折线</option>
          <option value="straight">直线</option>
          <option value="step">直角</option>
          <option value="bezier">曲线</option>
        </select>
      </label>
      <label className="field">
        <span>批量线宽</span>
        <input
          type="range"
          min={1}
          max={6}
          step={0.5}
          value={strokeWidth}
          onChange={(event) => onChange({ data: clearConnectorPreset(sample.data), style: { stroke, strokeWidth: Number(event.target.value) } })}
        />
      </label>
      <label className="field">
        <span>批量折点偏移</span>
        <input
          type="range"
          min={0}
          max={160}
          step={5}
          value={bendOffset}
          disabled={isStraightEdge}
          onChange={(event) => onChange({ data: { ...clearConnectorPreset(sample.data), bendOffset: normalizeEdgeBendOffset(event.target.value) } })}
        />
      </label>
      <label className="field">
        <span>批量箭头</span>
        <select
          value={arrowMode}
          onChange={(event) =>
            onChange({
              data: clearConnectorPreset(sample.data),
              ...edgeArrowPatch(event.target.value as EdgeArrowMode, stroke)
            })
          }
        >
          <option value="none">无箭头</option>
          <option value="end">终点箭头</option>
          <option value="start">起点箭头</option>
          <option value="both">双向箭头</option>
        </select>
      </label>
      <label className="field">
        <span>批量虚线</span>
        <select
          value={dashMode}
          onChange={(event) =>
            onChange({
              style: {
                stroke,
                strokeWidth,
                strokeDasharray: EDGE_DASH_PATTERNS[event.target.value as EdgeDashMode] || undefined
              },
              data: clearConnectorPreset(sample.data)
            })
          }
        >
          <option value="solid">实线</option>
          <option value="dashed">短虚线</option>
          <option value="dotted">点线</option>
        </select>
      </label>
      <label className="check-field">
        <input type="checkbox" checked={Boolean(sample.animated)} onChange={(event) => onChange({ animated: event.target.checked })} />
        <span>批量流动动画</span>
      </label>
      <ColorField
        label="批量线条"
        value={stroke}
        onChange={(value) =>
          onChange({
            data: clearConnectorPreset(sample.data),
            style: { stroke: value, strokeWidth },
            ...edgeArrowPatch(arrowMode, value)
          })
        }
      />
    </div>
  );
}

export function EdgeInspector({ edge, onChange, onAutoRoute }: { edge: DiagramEdge; onChange: (patch: Partial<DiagramEdge>) => void; onAutoRoute: () => void }) {
  const stroke = getEdgeStroke(edge);
  const strokeWidth = getEdgeStrokeWidth(edge);
  const dashMode = getEdgeDashMode(edge);
  const arrowMode = getEdgeArrowMode(edge);
  const labelBgFill = getEdgeLabelBackgroundFill(edge);
  const labelBgOpacity = getEdgeLabelBackgroundOpacity(edge);
  const bendOffset = getEdgeBendOffset(edge);
  const waypoints = getEdgeWaypoints(edge);
  const isStraightEdge = String(edge.type ?? "smoothstep") === "straight";
  const connectorPreset = getConnectorPresetSelectValue(edge);
  return (
    <div className="inspector-stack">
      <label className="field">
        <span>连线文本</span>
        <textarea value={String(edge.label ?? "")} rows={2} onChange={(event) => onChange({ label: event.target.value })} />
      </label>
      <label className="field">
        <span>标签字号</span>
        <input
          type="range"
          min={10}
          max={20}
          value={getEdgeLabelFontSize(edge)}
          onChange={(event) => onChange({ labelStyle: { ...edge.labelStyle, fontSize: Number(event.target.value), fill: getEdgeLabelColor(edge) } })}
        />
      </label>
      <ColorField
        label="标签"
        value={getEdgeLabelColor(edge)}
        onChange={(value) => onChange({ labelStyle: { ...edge.labelStyle, fill: value, fontSize: getEdgeLabelFontSize(edge) } })}
      />
      <ColorField
        label="标签底色"
        value={labelBgFill}
        onChange={(value) => onChange({ labelBgStyle: { ...edge.labelBgStyle, fill: value, fillOpacity: labelBgOpacity } })}
      />
      <label className="field">
        <span>底色透明</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(labelBgOpacity * 100)}
          onChange={(event) => onChange({ labelBgStyle: { ...edge.labelBgStyle, fill: labelBgFill, fillOpacity: Number(event.target.value) / 100 } })}
        />
      </label>
      <label className="field">
        <span>连接器预设</span>
        <select
          value={connectorPreset}
          onChange={(event) => {
            const presetId = event.target.value as ConnectorPresetId | "custom";
            if (presetId !== "custom") onChange(applyConnectorPreset(edge, presetId));
          }}
        >
          <option value="custom">自定义</option>
          {CONNECTOR_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>线型</span>
        <select value={edge.type ?? "smoothstep"} onChange={(event) => onChange({ type: event.target.value, data: clearConnectorPreset(edge.data) })}>
          <option value="smoothstep">折线</option>
          <option value="straight">直线</option>
          <option value="step">直角</option>
          <option value="bezier">曲线</option>
        </select>
      </label>
      <label className="field">
        <span>折点偏移</span>
        <input
          type="range"
          min={0}
          max={160}
          step={5}
          value={bendOffset}
          disabled={isStraightEdge}
          onChange={(event) => onChange({ data: { ...clearConnectorPreset(edge.data), bendOffset: normalizeEdgeBendOffset(event.target.value) } })}
        />
      </label>
      <label className="field">
        <span>手动折点</span>
        <button type="button" disabled={waypoints.length === 0} onClick={() => onChange({ data: { ...clearConnectorPreset(edge.data), waypoints: [] } })}>
          清空 {waypoints.length}
        </button>
      </label>
      <label className="field">
        <span>自动路由</span>
        <button type="button" onClick={onAutoRoute}>
          避让节点
        </button>
      </label>
      <label className="field">
        <span>线宽</span>
        <input
          type="range"
          min={1}
          max={6}
          step={0.5}
          value={strokeWidth}
          onChange={(event) => onChange({ data: clearConnectorPreset(edge.data), style: { ...edge.style, strokeWidth: Number(event.target.value), stroke } })}
        />
      </label>
      <label className="field">
        <span>箭头</span>
        <select
          value={arrowMode}
          onChange={(event) =>
            onChange({
              data: clearConnectorPreset(edge.data),
              ...edgeArrowPatch(event.target.value as EdgeArrowMode, stroke)
            })
          }
        >
          <option value="none">无箭头</option>
          <option value="end">终点箭头</option>
          <option value="start">起点箭头</option>
          <option value="both">双向箭头</option>
        </select>
      </label>
      <label className="field">
        <span>虚线</span>
        <select
          value={dashMode}
          onChange={(event) =>
            onChange({
              style: {
                ...edge.style,
                stroke,
                strokeWidth,
                strokeDasharray: EDGE_DASH_PATTERNS[event.target.value as EdgeDashMode] || undefined
              },
              data: clearConnectorPreset(edge.data)
            })
          }
        >
          <option value="solid">实线</option>
          <option value="dashed">短虚线</option>
          <option value="dotted">点线</option>
        </select>
      </label>
      <label className="check-field">
        <input type="checkbox" checked={Boolean(edge.animated)} onChange={(event) => onChange({ animated: event.target.checked })} />
        <span>流动动画</span>
      </label>
      <ColorField
        label="线条"
        value={stroke}
        onChange={(value) =>
          onChange({
            data: clearConnectorPreset(edge.data),
            style: { ...edge.style, stroke: value, strokeWidth },
            ...edgeArrowPatch(arrowMode, value)
          })
        }
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
