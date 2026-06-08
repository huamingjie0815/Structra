import { BackgroundVariant, MarkerType } from "@xyflow/react";

import type {
  AlignmentGuides,
  CanvasSettings,
  DiagramComment,
  DiagramDocument,
  DiagramEdge,
  DiagramNode,
  DiagramNodeData,
  DiagramTemplate,
  EdgeDashMode,
  ErField,
  FontFamily,
  GridVariant,
  PagePreset,
  ShapeCategory,
  ShapeKind,
  Snapshot
} from "./types";

export const STORAGE_KEY = "structra-diagram-v1";
export const VERSION_STORAGE_KEY = "structra-version-history-v1";
export const TEMPLATE_STORAGE_KEY = "structra-custom-templates-v1";
export const MAX_VERSION_COUNT = 20;
export const MAX_CUSTOM_TEMPLATE_COUNT = 16;
export const DEFAULT_EDGE_STROKE = "#46515f";
export const DEFAULT_EDGE_WIDTH = 1.8;
export const DEFAULT_EDGE_BEND_OFFSET = 20;
export const AUTO_ROUTE_PADDING = 28;
export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  showGrid: true,
  showRulers: true,
  snapToGrid: true,
  gridSize: 12,
  gridVariant: "lines",
  pagePreset: "content",
  background: "#f8fafc"
};
export const EMPTY_ALIGNMENT_GUIDES: AlignmentGuides = { x: [], y: [] };
export const ALIGNMENT_GUIDE_TOLERANCE = 6;
export const RULER_SIZE = 24;
export const SWIMLANE_TITLE_HEIGHT = 34;
export const DEFAULT_LANE_LABELS = ["泳道 1", "泳道 2", "泳道 3"];
export const DEFAULT_UML_ATTRIBUTES = ["+ id: string", "+ name: string"];
export const DEFAULT_UML_METHODS = ["+ save(): void"];
export const DEFAULT_ER_FIELDS: ErField[] = [
  { key: "PK", name: "id", type: "string" },
  { name: "name", type: "string" }
];
export const DEFAULT_ER_SOURCE_CARDINALITY = "1";
export const DEFAULT_ER_TARGET_CARDINALITY = "N";
export const EDGE_DASH_PATTERNS: Record<EdgeDashMode, string> = {
  solid: "",
  dashed: "8 6",
  dotted: "2 5"
};
export const GRID_BACKGROUND_VARIANTS: Record<GridVariant, BackgroundVariant> = {
  lines: BackgroundVariant.Lines,
  dots: BackgroundVariant.Dots,
  cross: BackgroundVariant.Cross
};
export const PAGE_PRESETS: Record<Exclude<PagePreset, "content">, { label: string; width: number; height: number }> = {
  a4Portrait: { label: "A4竖", width: 794, height: 1123 },
  a4Landscape: { label: "A4横", width: 1123, height: 794 },
  wide: { label: "16:9", width: 1280, height: 720 }
};
export const FONT_FAMILY_OPTIONS: Array<{ value: FontFamily; label: string; css: string }> = [
  { value: "system", label: "默认", css: "system-ui, sans-serif" },
  { value: "serif", label: "衬线", css: "Georgia, serif" },
  { value: "mono", label: "等宽", css: "ui-monospace, SFMono-Regular, Menlo, monospace" }
];
export const shapeCategories: Array<{ id: ShapeCategory; label: string }> = [
  { id: "all", label: "全部" },
  { id: "flow", label: "流程" },
  { id: "bpmn", label: "BPMN" },
  { id: "uml", label: "UML" },
  { id: "er", label: "ER" },
  { id: "mind", label: "导图" },
  { id: "org", label: "组织" },
  { id: "data", label: "数据" },
  { id: "basic", label: "容器" },
  { id: "annotation", label: "标注" }
];
export const shapeCategoryMap: Record<ShapeKind, Exclude<ShapeCategory, "all">> = {
  terminator: "flow",
  process: "flow",
  circle: "basic",
  hexagon: "basic",
  decision: "flow",
  bpmnStartEvent: "bpmn",
  bpmnEndEvent: "bpmn",
  bpmnTask: "bpmn",
  bpmnGateway: "bpmn",
  document: "flow",
  data: "data",
  database: "data",
  umlClass: "uml",
  erEntity: "er",
  erAttribute: "er",
  erRelationship: "er",
  swimlane: "basic",
  subprocess: "flow",
  manual: "flow",
  delay: "flow",
  preparation: "flow",
  offpage: "flow",
  merge: "flow",
  display: "flow",
  note: "annotation",
  table: "basic",
  text: "annotation",
  mindTopic: "mind",
  mindBranch: "mind",
  orgPerson: "org",
  orgUnit: "org"
};

export const initialNodes: DiagramNode[] = [
  {
    id: "node-start",
    type: "diagram",
    position: { x: 90, y: 90 },
    data: {
      label: "用户提交申请",
      shape: "terminator",
      fill: "#e6f6ee",
      stroke: "#1f9d63",
      text: "#17342a",
      fontSize: 14,
      textAlign: "center",
      width: 152,
      height: 56
    }
  },
  {
    id: "node-review",
    type: "diagram",
    position: { x: 335, y: 86 },
    data: {
      label: "系统校验资料",
      shape: "process",
      fill: "#f7fbff",
      stroke: "#3178c6",
      text: "#182b3a",
      fontSize: 14,
      textAlign: "center",
      width: 158,
      height: 66
    }
  },
  {
    id: "node-decision",
    type: "diagram",
    position: { x: 585, y: 72 },
    data: {
      label: "资料完整?",
      shape: "decision",
      fill: "#fff5df",
      stroke: "#c07a12",
      text: "#38290e",
      fontSize: 14,
      textAlign: "center",
      width: 132,
      height: 98
    }
  },
  {
    id: "node-end",
    type: "diagram",
    position: { x: 820, y: 90 },
    data: {
      label: "生成审批单",
      shape: "document",
      fill: "#f4f0ff",
      stroke: "#7559c7",
      text: "#2d2548",
      fontSize: 14,
      textAlign: "center",
      width: 158,
      height: 76
    }
  }
];

export const initialEdges: DiagramEdge[] = [
  edge("edge-start-review", "node-start", "node-review"),
  edge("edge-review-decision", "node-review", "node-decision"),
  edge("edge-decision-end", "node-decision", "node-end", "是")
];

export const initialDocument: DiagramDocument = {
  activePageId: "page-main",
  pages: [
    {
      id: "page-main",
      name: "页面 1",
      nodes: [],
      edges: [],
      comments: []
    }
  ]
};

export const diagramTemplates: DiagramTemplate[] = [
  {
    id: "approval",
    name: "审批流程",
    description: "标准申请、校验、判断、归档流程",
    nodes: initialNodes,
    edges: initialEdges
  },
  {
    id: "swimlane",
    name: "跨部门泳道",
    description: "按角色划分的本地审批流程",
    nodes: [
      diagramNode("lane-sales", "diagram", { x: 60, y: 60 }, "销售 / 交付 / 财务", "swimlane", 720, 260, "#fbfcfe", "#64748b"),
      diagramNode("lane-start", "diagram", { x: 110, y: 155 }, "客户发起", "terminator", 120, 52, "#e6f6ee", "#1f9d63"),
      diagramNode("lane-delivery", "diagram", { x: 300, y: 148 }, "交付评估", "process", 150, 66, "#f7fbff", "#3178c6"),
      diagramNode("lane-finance", "diagram", { x: 520, y: 148 }, "财务确认", "decision", 128, 96, "#fff5df", "#c07a12"),
      diagramNode("lane-close", "diagram", { x: 710, y: 155 }, "生成合同", "document", 140, 72, "#f4f0ff", "#7559c7")
    ],
    edges: [
      edge("lane-edge-1", "lane-start", "lane-delivery"),
      edge("lane-edge-2", "lane-delivery", "lane-finance"),
      edge("lane-edge-3", "lane-finance", "lane-close", "通过")
    ]
  },
  {
    id: "data-pipeline",
    name: "数据处理链路",
    description: "采集、清洗、入库、输出的数据流程",
    nodes: [
      diagramNode("data-source", "diagram", { x: 100, y: 120 }, "采集数据", "data", 150, 66, "#eef8fa", "#248a9c"),
      diagramNode("data-clean", "diagram", { x: 330, y: 120 }, "清洗转换", "process", 150, 66, "#f7fbff", "#3178c6"),
      diagramNode("data-store", "diagram", { x: 560, y: 112 }, "数据仓库", "database", 140, 86, "#fff0f1", "#c84d5f"),
      diagramNode("data-report", "diagram", { x: 790, y: 116 }, "输出报表", "document", 150, 76, "#f4f0ff", "#7559c7")
    ],
    edges: [
      edge("data-edge-1", "data-source", "data-clean"),
      edge("data-edge-2", "data-clean", "data-store"),
      edge("data-edge-3", "data-store", "data-report")
    ]
  },
  {
    id: "bpmn-approval",
    name: "BPMN审批",
    description: "事件、任务、网关和结束事件的标准审批模型",
    nodes: [
      diagramNode("bpmn-start", "diagram", { x: 80, y: 150 }, "提交", "bpmnStartEvent", 86, 86, "#f6fffb", "#22845f"),
      diagramNode("bpmn-draft", "diagram", { x: 240, y: 152 }, "填写申请", "bpmnTask", 168, 82, "#f8fbff", "#2f6fab"),
      diagramNode("bpmn-review", "diagram", { x: 470, y: 152 }, "主管审批", "bpmnTask", 168, 82, "#f8fbff", "#2f6fab"),
      diagramNode("bpmn-gateway", "diagram", { x: 720, y: 138 }, "通过?", "bpmnGateway", 108, 108, "#fff9ec", "#b7791f"),
      diagramNode("bpmn-archive", "diagram", { x: 910, y: 152 }, "归档", "bpmnTask", 150, 82, "#f8fbff", "#2f6fab"),
      diagramNode("bpmn-end", "diagram", { x: 1110, y: 150 }, "结束", "bpmnEndEvent", 86, 86, "#fff7f5", "#c2412d")
    ],
    edges: [
      edge("bpmn-edge-1", "bpmn-start", "bpmn-draft"),
      edge("bpmn-edge-2", "bpmn-draft", "bpmn-review"),
      edge("bpmn-edge-3", "bpmn-review", "bpmn-gateway"),
      edge("bpmn-edge-4", "bpmn-gateway", "bpmn-archive", "是"),
      edge("bpmn-edge-5", "bpmn-archive", "bpmn-end"),
      edgeWithHandles("bpmn-edge-rework", "bpmn-gateway", "bpmn-draft", "bottom-source", "bottom-target", "退回")
    ]
  },
  {
    id: "uml-order",
    name: "UML类图",
    description: "类属性、方法和类之间关系的建模模板",
    nodes: [
      withNodeData(diagramNode("uml-user", "diagram", { x: 90, y: 120 }, "User", "umlClass", 190, 150, "#fffdf8", "#8a5a18"), {
        umlAttributes: ["+ id: string", "+ email: string", "- passwordHash: string"],
        umlMethods: ["+ login(): Token", "+ updateProfile(): void"]
      }),
      withNodeData(diagramNode("uml-order", "diagram", { x: 390, y: 120 }, "Order", "umlClass", 190, 150, "#fffdf8", "#8a5a18"), {
        umlAttributes: ["+ id: string", "+ total: Money", "+ status: OrderStatus"],
        umlMethods: ["+ submit(): void", "+ cancel(): void"]
      }),
      withNodeData(diagramNode("uml-payment", "diagram", { x: 690, y: 120 }, "Payment", "umlClass", 190, 150, "#fffdf8", "#8a5a18"), {
        umlAttributes: ["+ id: string", "+ amount: Money", "+ paidAt: Date"],
        umlMethods: ["+ authorize(): Result", "+ refund(): Result"]
      })
    ],
    edges: [edge("uml-edge-user-order", "uml-user", "uml-order", "1..*"), edge("uml-edge-order-payment", "uml-order", "uml-payment", "1")]
  },
  {
    id: "er-order",
    name: "ER订单模型",
    description: "实体字段、PK/FK标记和关系基数示例",
    nodes: [
      withNodeData(diagramNode("er-customer", "diagram", { x: 80, y: 120 }, "Customer", "erEntity", 190, 122, "#f7fbff", "#255f9e"), {
        erFields: [
          { key: "PK", name: "id", type: "uuid" },
          { name: "name", type: "varchar" },
          { name: "email", type: "varchar" }
        ]
      }),
      withNodeData(diagramNode("er-relationship", "diagram", { x: 360, y: 132 }, "places", "erRelationship", 132, 98, "#fff8f0", "#bd5b1f"), {
        erSourceCardinality: "1",
        erTargetCardinality: "N"
      }),
      withNodeData(diagramNode("er-order", "diagram", { x: 620, y: 120 }, "Order", "erEntity", 190, 122, "#f7fbff", "#255f9e"), {
        erFields: [
          { key: "PK", name: "id", type: "uuid" },
          { key: "FK", name: "customer_id", type: "uuid" },
          { name: "total", type: "decimal" }
        ]
      })
    ],
    edges: [edge("er-edge-1", "er-customer", "er-relationship"), edge("er-edge-2", "er-relationship", "er-order")]
  },
  {
    id: "org-chart",
    name: "组织架构",
    description: "上下级汇报关系和团队分层结构",
    nodes: [
      diagramNode("org-ceo", "diagram", { x: 430, y: 40 }, "总经理", "orgPerson", 150, 74, "#f7fbff", "#255f9e"),
      diagramNode("org-product", "diagram", { x: 160, y: 180 }, "产品负责人", "orgPerson", 150, 74, "#f8fff6", "#3f8f46"),
      diagramNode("org-tech", "diagram", { x: 430, y: 180 }, "技术负责人", "orgPerson", 150, 74, "#f8fff6", "#3f8f46"),
      diagramNode("org-sales", "diagram", { x: 700, y: 180 }, "销售负责人", "orgPerson", 150, 74, "#f8fff6", "#3f8f46"),
      diagramNode("org-design", "diagram", { x: 80, y: 320 }, "设计组", "orgUnit", 132, 58, "#fffdf8", "#8a5a18"),
      diagramNode("org-fe", "diagram", { x: 330, y: 320 }, "前端组", "orgUnit", 132, 58, "#fffdf8", "#8a5a18"),
      diagramNode("org-be", "diagram", { x: 530, y: 320 }, "后端组", "orgUnit", 132, 58, "#fffdf8", "#8a5a18"),
      diagramNode("org-cs", "diagram", { x: 780, y: 320 }, "客户成功", "orgUnit", 132, 58, "#fffdf8", "#8a5a18")
    ],
    edges: [
      edgeWithHandles("org-edge-1", "org-ceo", "org-product", "bottom-source", "top-target"),
      edgeWithHandles("org-edge-2", "org-ceo", "org-tech", "bottom-source", "top-target"),
      edgeWithHandles("org-edge-3", "org-ceo", "org-sales", "bottom-source", "top-target"),
      edgeWithHandles("org-edge-4", "org-product", "org-design", "bottom-source", "top-target"),
      edgeWithHandles("org-edge-5", "org-tech", "org-fe", "bottom-source", "top-target"),
      edgeWithHandles("org-edge-6", "org-tech", "org-be", "bottom-source", "top-target"),
      edgeWithHandles("org-edge-7", "org-sales", "org-cs", "bottom-source", "top-target")
    ]
  },
  {
    id: "functional-org-chart",
    name: "职能型组织架构",
    description: "管理层、职能部门和执行小组的本地组织结构模板",
    nodes: [
      diagramNode("func-board", "diagram", { x: 430, y: 40 }, "董事会", "orgUnit", 150, 62, "#f7fbff", "#255f9e"),
      diagramNode("func-ceo", "diagram", { x: 430, y: 140 }, "CEO", "orgPerson", 150, 74, "#f7fbff", "#255f9e"),
      diagramNode("func-product", "diagram", { x: 120, y: 260 }, "产品中心", "orgUnit", 150, 62, "#eef8fa", "#248a9c"),
      diagramNode("func-rd", "diagram", { x: 330, y: 260 }, "研发中心", "orgUnit", 150, 62, "#eef8fa", "#248a9c"),
      diagramNode("func-market", "diagram", { x: 540, y: 260 }, "市场销售", "orgUnit", 150, 62, "#eef8fa", "#248a9c"),
      diagramNode("func-finance", "diagram", { x: 750, y: 260 }, "财务人事", "orgUnit", 150, 62, "#eef8fa", "#248a9c"),
      diagramNode("func-ux", "diagram", { x: 90, y: 380 }, "体验设计", "orgUnit", 128, 54, "#fffdf8", "#8a5a18"),
      diagramNode("func-platform", "diagram", { x: 300, y: 380 }, "平台组", "orgUnit", 128, 54, "#fffdf8", "#8a5a18"),
      diagramNode("func-growth", "diagram", { x: 540, y: 380 }, "增长组", "orgUnit", 128, 54, "#fffdf8", "#8a5a18"),
      diagramNode("func-ops", "diagram", { x: 780, y: 380 }, "运营支持", "orgUnit", 128, 54, "#fffdf8", "#8a5a18")
    ],
    edges: [
      edgeWithHandles("func-edge-1", "func-board", "func-ceo", "bottom-source", "top-target"),
      edgeWithHandles("func-edge-2", "func-ceo", "func-product", "bottom-source", "top-target"),
      edgeWithHandles("func-edge-3", "func-ceo", "func-rd", "bottom-source", "top-target"),
      edgeWithHandles("func-edge-4", "func-ceo", "func-market", "bottom-source", "top-target"),
      edgeWithHandles("func-edge-5", "func-ceo", "func-finance", "bottom-source", "top-target"),
      edgeWithHandles("func-edge-6", "func-product", "func-ux", "bottom-source", "top-target"),
      edgeWithHandles("func-edge-7", "func-rd", "func-platform", "bottom-source", "top-target"),
      edgeWithHandles("func-edge-8", "func-market", "func-growth", "bottom-source", "top-target"),
      edgeWithHandles("func-edge-9", "func-finance", "func-ops", "bottom-source", "top-target")
    ]
  },
  {
    id: "incident-swimlane",
    name: "故障响应泳道",
    description: "客服、值班、研发和管理层分工处理事故的泳道模板",
    nodes: [
      withNodeData(diagramNode("incident-lane", "diagram", { x: 50, y: 60 }, "事故处理 RACI", "swimlane", 820, 330, "#fbfcfe", "#64748b"), {
        laneCount: 4,
        laneLabels: ["客服", "值班", "研发", "管理层"]
      }),
      diagramNode("incident-report", "diagram", { x: 105, y: 132 }, "收到反馈", "terminator", 120, 50, "#e6f6ee", "#1f9d63"),
      diagramNode("incident-triage", "diagram", { x: 285, y: 128 }, "分级定责", "process", 136, 60, "#f7fbff", "#3178c6"),
      diagramNode("incident-major", "diagram", { x: 475, y: 112 }, "重大事故?", "decision", 112, 84, "#fff5df", "#c07a12"),
      diagramNode("incident-fix", "diagram", { x: 640, y: 128 }, "修复发布", "process", 136, 60, "#f7fbff", "#3178c6"),
      diagramNode("incident-brief", "diagram", { x: 645, y: 228 }, "发布公告", "document", 136, 70, "#f4f0ff", "#7559c7"),
      diagramNode("incident-review", "diagram", { x: 820, y: 224 }, "复盘改进", "subprocess", 146, 64, "#f2f7ff", "#496eb5")
    ],
    edges: [
      edge("incident-edge-1", "incident-report", "incident-triage"),
      edge("incident-edge-2", "incident-triage", "incident-major"),
      edge("incident-edge-3", "incident-major", "incident-fix", "是"),
      edgeWithHandles("incident-edge-4", "incident-major", "incident-brief", "bottom-source", "left-target", "公告"),
      edge("incident-edge-5", "incident-fix", "incident-review"),
      edge("incident-edge-6", "incident-brief", "incident-review")
    ]
  },
  {
    id: "bpmn-order-fulfillment",
    name: "BPMN订单履约",
    description: "订单创建、库存校验、支付、发货和结束事件的 BPMN 模板",
    nodes: [
      diagramNode("fulfill-start", "diagram", { x: 70, y: 150 }, "下单", "bpmnStartEvent", 84, 84, "#f6fffb", "#22845f"),
      diagramNode("fulfill-stock", "diagram", { x: 220, y: 151 }, "库存校验", "bpmnTask", 156, 78, "#f8fbff", "#2f6fab"),
      diagramNode("fulfill-stock-gateway", "diagram", { x: 440, y: 136 }, "有货?", "bpmnGateway", 106, 106, "#fff9ec", "#b7791f"),
      diagramNode("fulfill-pay", "diagram", { x: 620, y: 151 }, "支付确认", "bpmnTask", 156, 78, "#f8fbff", "#2f6fab"),
      diagramNode("fulfill-ship", "diagram", { x: 830, y: 151 }, "仓库发货", "bpmnTask", 156, 78, "#f8fbff", "#2f6fab"),
      diagramNode("fulfill-end", "diagram", { x: 1050, y: 150 }, "完成", "bpmnEndEvent", 84, 84, "#fff7f5", "#c2412d"),
      diagramNode("fulfill-backorder", "diagram", { x: 440, y: 300 }, "缺货通知", "bpmnTask", 156, 78, "#fff7f5", "#c2412d")
    ],
    edges: [
      edge("fulfill-edge-1", "fulfill-start", "fulfill-stock"),
      edge("fulfill-edge-2", "fulfill-stock", "fulfill-stock-gateway"),
      edge("fulfill-edge-3", "fulfill-stock-gateway", "fulfill-pay", "是"),
      edge("fulfill-edge-4", "fulfill-pay", "fulfill-ship"),
      edge("fulfill-edge-5", "fulfill-ship", "fulfill-end"),
      edgeWithHandles("fulfill-edge-6", "fulfill-stock-gateway", "fulfill-backorder", "bottom-source", "top-target", "否")
    ]
  },
  {
    id: "uml-service-model",
    name: "UML服务模型",
    description: "接口、服务、仓储和领域对象的 UML 类图素材",
    nodes: [
      withNodeData(diagramNode("uml-controller", "diagram", { x: 80, y: 110 }, "OrderController", "umlClass", 210, 158, "#fffdf8", "#8a5a18"), {
        umlAttributes: ["- service: OrderService"],
        umlMethods: ["+ createOrder(dto): Order", "+ cancelOrder(id): void"]
      }),
      withNodeData(diagramNode("uml-service", "diagram", { x: 380, y: 110 }, "OrderService", "umlClass", 210, 158, "#fffdf8", "#8a5a18"), {
        umlAttributes: ["- repo: OrderRepository", "- gateway: PaymentGateway"],
        umlMethods: ["+ submit(order): Result", "+ refund(order): Result"]
      }),
      withNodeData(diagramNode("uml-repository", "diagram", { x: 680, y: 110 }, "OrderRepository", "umlClass", 210, 158, "#fffdf8", "#8a5a18"), {
        umlAttributes: ["- db: Database"],
        umlMethods: ["+ save(order): void", "+ findById(id): Order"]
      }),
      withNodeData(diagramNode("uml-entity", "diagram", { x: 380, y: 330 }, "Order", "umlClass", 210, 158, "#fffdf8", "#8a5a18"), {
        umlAttributes: ["+ id: string", "+ status: OrderStatus", "+ total: Money"],
        umlMethods: ["+ markPaid(): void", "+ cancel(): void"]
      })
    ],
    edges: [
      edge("uml-service-edge-1", "uml-controller", "uml-service", "uses"),
      edge("uml-service-edge-2", "uml-service", "uml-repository", "uses"),
      edgeWithHandles("uml-service-edge-3", "uml-service", "uml-entity", "bottom-source", "top-target", "manages"),
      edgeWithHandles("uml-service-edge-4", "uml-repository", "uml-entity", "bottom-source", "right-target", "stores")
    ]
  },
  {
    id: "er-inventory",
    name: "ER库存模型",
    description: "商品、仓库、库存流水和订单明细的数据建模模板",
    nodes: [
      withNodeData(diagramNode("er-product", "diagram", { x: 70, y: 90 }, "Product", "erEntity", 196, 130, "#f7fbff", "#255f9e"), {
        erFields: [
          { key: "PK", name: "id", type: "uuid" },
          { name: "sku", type: "varchar" },
          { name: "name", type: "varchar" }
        ]
      }),
      withNodeData(diagramNode("er-warehouse", "diagram", { x: 650, y: 90 }, "Warehouse", "erEntity", 196, 130, "#f7fbff", "#255f9e"), {
        erFields: [
          { key: "PK", name: "id", type: "uuid" },
          { name: "code", type: "varchar" },
          { name: "region", type: "varchar" }
        ]
      }),
      withNodeData(diagramNode("er-stock", "diagram", { x: 360, y: 250 }, "Stock", "erEntity", 210, 142, "#f7fbff", "#255f9e"), {
        erFields: [
          { key: "PK", name: "id", type: "uuid" },
          { key: "FK", name: "product_id", type: "uuid" },
          { key: "FK", name: "warehouse_id", type: "uuid" },
          { name: "quantity", type: "integer" }
        ]
      }),
      withNodeData(diagramNode("er-product-stock", "diagram", { x: 300, y: 112 }, "has", "erRelationship", 116, 86, "#fff8f0", "#bd5b1f"), {
        erSourceCardinality: "1",
        erTargetCardinality: "N"
      }),
      withNodeData(diagramNode("er-warehouse-stock", "diagram", { x: 600, y: 112 }, "stores", "erRelationship", 116, 86, "#fff8f0", "#bd5b1f"), {
        erSourceCardinality: "1",
        erTargetCardinality: "N"
      })
    ],
    edges: [
      edge("er-inventory-edge-1", "er-product", "er-product-stock"),
      edge("er-inventory-edge-2", "er-product-stock", "er-stock"),
      edge("er-inventory-edge-3", "er-warehouse", "er-warehouse-stock"),
      edge("er-inventory-edge-4", "er-warehouse-stock", "er-stock")
    ]
  },
  {
    id: "sipoc-process",
    name: "SIPOC流程分析",
    description: "供应者、输入、过程、输出和客户的流程梳理模板",
    nodes: [
      diagramNode("sipoc-supplier", "diagram", { x: 70, y: 90 }, "供应者", "table", 150, 170, "#ffffff", "#667085"),
      diagramNode("sipoc-input", "diagram", { x: 270, y: 90 }, "输入", "data", 150, 70, "#eef8fa", "#248a9c"),
      diagramNode("sipoc-process", "diagram", { x: 470, y: 90 }, "核心过程", "subprocess", 170, 70, "#f2f7ff", "#496eb5"),
      diagramNode("sipoc-output", "diagram", { x: 700, y: 90 }, "输出", "document", 150, 74, "#f4f0ff", "#7559c7"),
      diagramNode("sipoc-customer", "diagram", { x: 900, y: 90 }, "客户", "table", 150, 170, "#ffffff", "#667085"),
      diagramNode("sipoc-step-1", "diagram", { x: 470, y: 210 }, "步骤 1", "process", 132, 56, "#f7fbff", "#3178c6"),
      diagramNode("sipoc-step-2", "diagram", { x: 470, y: 300 }, "步骤 2", "process", 132, 56, "#f7fbff", "#3178c6")
    ],
    edges: [
      edge("sipoc-edge-1", "sipoc-supplier", "sipoc-input"),
      edge("sipoc-edge-2", "sipoc-input", "sipoc-process"),
      edge("sipoc-edge-3", "sipoc-process", "sipoc-output"),
      edge("sipoc-edge-4", "sipoc-output", "sipoc-customer"),
      edgeWithHandles("sipoc-edge-5", "sipoc-process", "sipoc-step-1", "bottom-source", "top-target"),
      edge("sipoc-edge-6", "sipoc-step-1", "sipoc-step-2")
    ]
  },
  {
    id: "mind-map",
    name: "思维导图",
    description: "中心主题、左右分支和执行项结构",
    nodes: [
      diagramNode("mind-center", "diagram", { x: 430, y: 190 }, "产品发布计划", "mindTopic", 190, 86, "#fff7ed", "#c2410c"),
      diagramNode("mind-market", "diagram", { x: 120, y: 80 }, "市场准备", "mindBranch", 150, 56, "#eef8fa", "#248a9c"),
      diagramNode("mind-content", "diagram", { x: 120, y: 210 }, "内容物料", "mindBranch", 150, 56, "#eef8fa", "#248a9c"),
      diagramNode("mind-risk", "diagram", { x: 120, y: 340 }, "风险预案", "mindBranch", 150, 56, "#eef8fa", "#248a9c"),
      diagramNode("mind-product", "diagram", { x: 760, y: 80 }, "功能冻结", "mindBranch", 150, 56, "#f0f8ef", "#4d8f50"),
      diagramNode("mind-test", "diagram", { x: 760, y: 210 }, "测试验收", "mindBranch", 150, 56, "#f0f8ef", "#4d8f50"),
      diagramNode("mind-launch", "diagram", { x: 760, y: 340 }, "上线复盘", "mindBranch", 150, 56, "#f0f8ef", "#4d8f50")
    ],
    edges: [
      edgeWithHandles("mind-edge-1", "mind-center", "mind-market", "left-source", "right-target"),
      edgeWithHandles("mind-edge-2", "mind-center", "mind-content", "left-source", "right-target"),
      edgeWithHandles("mind-edge-3", "mind-center", "mind-risk", "left-source", "right-target"),
      edgeWithHandles("mind-edge-4", "mind-center", "mind-product", "right-source", "left-target"),
      edgeWithHandles("mind-edge-5", "mind-center", "mind-test", "right-source", "left-target"),
      edgeWithHandles("mind-edge-6", "mind-center", "mind-launch", "right-source", "left-target")
    ]
  },
  {
    id: "bpmn-incident-response",
    name: "BPMN故障响应",
    description: "告警、分诊、升级、修复和复盘的 BPMN 事件流",
    nodes: [
      diagramNode("bpmn-inc-start", "diagram", { x: 70, y: 150 }, "告警触发", "bpmnStartEvent", 84, 84, "#f6fffb", "#22845f"),
      diagramNode("bpmn-inc-triage", "diagram", { x: 220, y: 151 }, "值班分诊", "bpmnTask", 156, 78, "#f8fbff", "#2f6fab"),
      diagramNode("bpmn-inc-gateway", "diagram", { x: 440, y: 136 }, "P0?", "bpmnGateway", 106, 106, "#fff9ec", "#b7791f"),
      diagramNode("bpmn-inc-warroom", "diagram", { x: 620, y: 95 }, "建立战情室", "bpmnTask", 162, 78, "#fff7f5", "#c2412d"),
      diagramNode("bpmn-inc-fix", "diagram", { x: 830, y: 95 }, "发布修复", "bpmnTask", 156, 78, "#f8fbff", "#2f6fab"),
      diagramNode("bpmn-inc-review", "diagram", { x: 830, y: 250 }, "复盘行动项", "bpmnTask", 162, 78, "#f8fbff", "#2f6fab"),
      diagramNode("bpmn-inc-end", "diagram", { x: 1050, y: 150 }, "关闭事件", "bpmnEndEvent", 84, 84, "#fff7f5", "#c2412d")
    ],
    edges: [
      edge("bpmn-inc-edge-1", "bpmn-inc-start", "bpmn-inc-triage"),
      edge("bpmn-inc-edge-2", "bpmn-inc-triage", "bpmn-inc-gateway"),
      edge("bpmn-inc-edge-3", "bpmn-inc-gateway", "bpmn-inc-warroom", "是"),
      edge("bpmn-inc-edge-4", "bpmn-inc-warroom", "bpmn-inc-fix"),
      edge("bpmn-inc-edge-5", "bpmn-inc-fix", "bpmn-inc-end"),
      edgeWithHandles("bpmn-inc-edge-6", "bpmn-inc-gateway", "bpmn-inc-review", "bottom-source", "left-target", "否"),
      edge("bpmn-inc-edge-7", "bpmn-inc-review", "bpmn-inc-end")
    ]
  },
  {
    id: "uml-auth-domain",
    name: "UML权限模型",
    description: "用户、角色、权限和会话对象的本地类图模板",
    nodes: [
      withNodeData(diagramNode("uml-auth-user", "diagram", { x: 80, y: 110 }, "User", "umlClass", 200, 150, "#fffdf8", "#8a5a18"), {
        umlAttributes: ["+ id: string", "+ email: string", "+ status: UserStatus"],
        umlMethods: ["+ assignRole(role): void", "+ disable(): void"]
      }),
      withNodeData(diagramNode("uml-auth-role", "diagram", { x: 370, y: 110 }, "Role", "umlClass", 200, 150, "#fffdf8", "#8a5a18"), {
        umlAttributes: ["+ id: string", "+ name: string", "+ scope: string"],
        umlMethods: ["+ grant(permission): void", "+ revoke(permission): void"]
      }),
      withNodeData(diagramNode("uml-auth-permission", "diagram", { x: 660, y: 110 }, "Permission", "umlClass", 210, 150, "#fffdf8", "#8a5a18"), {
        umlAttributes: ["+ action: string", "+ resource: string"],
        umlMethods: ["+ matches(request): boolean"]
      }),
      withNodeData(diagramNode("uml-auth-session", "diagram", { x: 370, y: 330 }, "Session", "umlClass", 200, 140, "#fffdf8", "#8a5a18"), {
        umlAttributes: ["+ token: string", "+ expiresAt: Date"],
        umlMethods: ["+ refresh(): Token", "+ revoke(): void"]
      })
    ],
    edges: [
      edge("uml-auth-edge-1", "uml-auth-user", "uml-auth-role", "0..*"),
      edge("uml-auth-edge-2", "uml-auth-role", "uml-auth-permission", "1..*"),
      edgeWithHandles("uml-auth-edge-3", "uml-auth-user", "uml-auth-session", "bottom-source", "top-target", "creates")
    ]
  },
  {
    id: "er-subscription-billing",
    name: "ER订阅计费",
    description: "账号、订阅、发票和支付记录的计费数据模型",
    nodes: [
      withNodeData(diagramNode("er-account", "diagram", { x: 70, y: 90 }, "Account", "erEntity", 196, 130, "#f7fbff", "#255f9e"), {
        erFields: [
          { key: "PK", name: "id", type: "uuid" },
          { name: "name", type: "varchar" },
          { name: "billing_email", type: "varchar" }
        ]
      }),
      withNodeData(diagramNode("er-subscription", "diagram", { x: 360, y: 90 }, "Subscription", "erEntity", 220, 142, "#f7fbff", "#255f9e"), {
        erFields: [
          { key: "PK", name: "id", type: "uuid" },
          { key: "FK", name: "account_id", type: "uuid" },
          { name: "plan", type: "varchar" },
          { name: "status", type: "varchar" }
        ]
      }),
      withNodeData(diagramNode("er-invoice", "diagram", { x: 660, y: 90 }, "Invoice", "erEntity", 210, 142, "#f7fbff", "#255f9e"), {
        erFields: [
          { key: "PK", name: "id", type: "uuid" },
          { key: "FK", name: "subscription_id", type: "uuid" },
          { name: "amount_due", type: "decimal" },
          { name: "due_date", type: "date" }
        ]
      }),
      withNodeData(diagramNode("er-payment", "diagram", { x: 660, y: 300 }, "Payment", "erEntity", 210, 130, "#f7fbff", "#255f9e"), {
        erFields: [
          { key: "PK", name: "id", type: "uuid" },
          { key: "FK", name: "invoice_id", type: "uuid" },
          { name: "paid_at", type: "timestamp" }
        ]
      })
    ],
    edges: [
      edge("er-bill-edge-1", "er-account", "er-subscription", "1:N"),
      edge("er-bill-edge-2", "er-subscription", "er-invoice", "1:N"),
      edgeWithHandles("er-bill-edge-3", "er-invoice", "er-payment", "bottom-source", "top-target", "0..1")
    ]
  },
  {
    id: "mind-retrospective",
    name: "复盘导图",
    description: "目标、事实、原因、行动项和负责人结构",
    nodes: [
      diagramNode("retro-center", "diagram", { x: 430, y: 190 }, "项目复盘", "mindTopic", 190, 86, "#fff7ed", "#c2410c"),
      diagramNode("retro-goal", "diagram", { x: 120, y: 70 }, "目标回顾", "mindBranch", 150, 56, "#eef8fa", "#248a9c"),
      diagramNode("retro-facts", "diagram", { x: 120, y: 170 }, "关键事实", "mindBranch", 150, 56, "#eef8fa", "#248a9c"),
      diagramNode("retro-cause", "diagram", { x: 120, y: 270 }, "根因分析", "mindBranch", 150, 56, "#eef8fa", "#248a9c"),
      diagramNode("retro-actions", "diagram", { x: 760, y: 110 }, "行动项", "mindBranch", 150, 56, "#f0f8ef", "#4d8f50"),
      diagramNode("retro-owner", "diagram", { x: 760, y: 230 }, "负责人", "mindBranch", 150, 56, "#f0f8ef", "#4d8f50"),
      diagramNode("retro-date", "diagram", { x: 760, y: 350 }, "截止日期", "mindBranch", 150, 56, "#f0f8ef", "#4d8f50")
    ],
    edges: [
      edgeWithHandles("retro-edge-1", "retro-center", "retro-goal", "left-source", "right-target"),
      edgeWithHandles("retro-edge-2", "retro-center", "retro-facts", "left-source", "right-target"),
      edgeWithHandles("retro-edge-3", "retro-center", "retro-cause", "left-source", "right-target"),
      edgeWithHandles("retro-edge-4", "retro-center", "retro-actions", "right-source", "left-target"),
      edgeWithHandles("retro-edge-5", "retro-center", "retro-owner", "right-source", "left-target"),
      edgeWithHandles("retro-edge-6", "retro-center", "retro-date", "right-source", "left-target")
    ]
  },
  {
    id: "mind-feature-planning",
    name: "功能规划导图",
    description: "用户、场景、能力、指标和风险的产品规划结构",
    nodes: [
      diagramNode("feature-center", "diagram", { x: 430, y: 190 }, "新功能规划", "mindTopic", 190, 86, "#fff7ed", "#c2410c"),
      diagramNode("feature-user", "diagram", { x: 100, y: 90 }, "目标用户", "mindBranch", 150, 56, "#eef8fa", "#248a9c"),
      diagramNode("feature-scene", "diagram", { x: 100, y: 210 }, "核心场景", "mindBranch", 150, 56, "#eef8fa", "#248a9c"),
      diagramNode("feature-scope", "diagram", { x: 100, y: 330 }, "MVP范围", "mindBranch", 150, 56, "#eef8fa", "#248a9c"),
      diagramNode("feature-metric", "diagram", { x: 780, y: 90 }, "成功指标", "mindBranch", 150, 56, "#f0f8ef", "#4d8f50"),
      diagramNode("feature-risk", "diagram", { x: 780, y: 210 }, "主要风险", "mindBranch", 150, 56, "#f0f8ef", "#4d8f50"),
      diagramNode("feature-release", "diagram", { x: 780, y: 330 }, "发布计划", "mindBranch", 150, 56, "#f0f8ef", "#4d8f50")
    ],
    edges: [
      edgeWithHandles("feature-edge-1", "feature-center", "feature-user", "left-source", "right-target"),
      edgeWithHandles("feature-edge-2", "feature-center", "feature-scene", "left-source", "right-target"),
      edgeWithHandles("feature-edge-3", "feature-center", "feature-scope", "left-source", "right-target"),
      edgeWithHandles("feature-edge-4", "feature-center", "feature-metric", "right-source", "left-target"),
      edgeWithHandles("feature-edge-5", "feature-center", "feature-risk", "right-source", "left-target"),
      edgeWithHandles("feature-edge-6", "feature-center", "feature-release", "right-source", "left-target")
    ]
  },
  {
    id: "matrix-org-chart",
    name: "矩阵组织架构",
    description: "职能负责人、项目负责人和跨职能小组的矩阵组织模板",
    nodes: [
      diagramNode("matrix-ceo", "diagram", { x: 430, y: 40 }, "总负责人", "orgPerson", 150, 74, "#f7fbff", "#255f9e"),
      diagramNode("matrix-product", "diagram", { x: 120, y: 170 }, "产品职能", "orgUnit", 150, 62, "#eef8fa", "#248a9c"),
      diagramNode("matrix-tech", "diagram", { x: 330, y: 170 }, "技术职能", "orgUnit", 150, 62, "#eef8fa", "#248a9c"),
      diagramNode("matrix-growth", "diagram", { x: 540, y: 170 }, "增长职能", "orgUnit", 150, 62, "#eef8fa", "#248a9c"),
      diagramNode("matrix-project-a", "diagram", { x: 220, y: 310 }, "项目 A", "orgUnit", 140, 58, "#fffdf8", "#8a5a18"),
      diagramNode("matrix-project-b", "diagram", { x: 470, y: 310 }, "项目 B", "orgUnit", 140, 58, "#fffdf8", "#8a5a18"),
      diagramNode("matrix-lead-a", "diagram", { x: 220, y: 420 }, "项目经理 A", "orgPerson", 150, 74, "#f8fff6", "#3f8f46"),
      diagramNode("matrix-lead-b", "diagram", { x: 470, y: 420 }, "项目经理 B", "orgPerson", 150, 74, "#f8fff6", "#3f8f46")
    ],
    edges: [
      edgeWithHandles("matrix-edge-1", "matrix-ceo", "matrix-product", "bottom-source", "top-target"),
      edgeWithHandles("matrix-edge-2", "matrix-ceo", "matrix-tech", "bottom-source", "top-target"),
      edgeWithHandles("matrix-edge-3", "matrix-ceo", "matrix-growth", "bottom-source", "top-target"),
      edgeWithHandles("matrix-edge-4", "matrix-product", "matrix-project-a", "bottom-source", "top-target"),
      edgeWithHandles("matrix-edge-5", "matrix-tech", "matrix-project-a", "bottom-source", "top-target"),
      edgeWithHandles("matrix-edge-6", "matrix-tech", "matrix-project-b", "bottom-source", "top-target"),
      edgeWithHandles("matrix-edge-7", "matrix-growth", "matrix-project-b", "bottom-source", "top-target"),
      edgeWithHandles("matrix-edge-8", "matrix-project-a", "matrix-lead-a", "bottom-source", "top-target"),
      edgeWithHandles("matrix-edge-9", "matrix-project-b", "matrix-lead-b", "bottom-source", "top-target")
    ]
  },
  {
    id: "blank",
    name: "空白画布",
    description: "从空白页面开始绘制",
    nodes: [],
    edges: []
  }
];

export function edge(id: string, source: string, target: string, label = ""): DiagramEdge {
  return {
    id,
    source,
    target,
    type: "smoothstep",
    label,
    data: { bendOffset: DEFAULT_EDGE_BEND_OFFSET },
    markerEnd: edgeMarker(DEFAULT_EDGE_STROKE),
    style: { stroke: DEFAULT_EDGE_STROKE, strokeWidth: DEFAULT_EDGE_WIDTH },
    labelStyle: { fill: "#1f2937", fontSize: 12, fontWeight: 600 },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9 }
  };
}

export function edgeWithHandles(id: string, source: string, target: string, sourceHandle: string, targetHandle: string, label = ""): DiagramEdge {
  return {
    ...edge(id, source, target, label),
    sourceHandle,
    targetHandle
  };
}

export function edgeMarker(color: string) {
  return { type: MarkerType.ArrowClosed, width: 16, height: 16, color };
}

export function withNodeData(node: DiagramNode, data: Partial<DiagramNodeData>): DiagramNode {
  return {
    ...node,
    data: {
      ...node.data,
      ...data
    }
  };
}

export function diagramNode(
  id: string,
  type: "diagram",
  position: { x: number; y: number },
  label: string,
  shape: ShapeKind,
  width: number,
  height: number,
  fill: string,
  stroke: string
): DiagramNode {
  return {
    id,
    type,
    position,
    data: {
      label,
      shape,
      fill,
      stroke,
      text: "#1f2937",
      fontSize: 14,
      textAlign: "center",
      ...getShapeDataDefaults(shape),
      width,
      height
    }
  };
}

export function getShapeDataDefaults(shape: ShapeKind): Partial<DiagramNodeData> {
  if (shape === "swimlane") return { laneCount: 3, laneOrientation: "horizontal", laneLabels: [...DEFAULT_LANE_LABELS] };
  if (shape === "table") return { tableRows: 3, tableColumns: 3 };
  if (shape === "umlClass") return { umlAttributes: [...DEFAULT_UML_ATTRIBUTES], umlMethods: [...DEFAULT_UML_METHODS] };
  if (shape === "erEntity") return { erFields: DEFAULT_ER_FIELDS.map((field) => ({ ...field })) };
  if (shape === "erRelationship") return { erSourceCardinality: DEFAULT_ER_SOURCE_CARDINALITY, erTargetCardinality: DEFAULT_ER_TARGET_CARDINALITY };
  if (shape === "bpmnStartEvent") return { bpmnEventType: "none" };
  if (shape === "bpmnEndEvent") return { bpmnEventType: "none" };
  if (shape === "bpmnTask") return { bpmnTaskType: "task" };
  if (shape === "bpmnGateway") return { bpmnGatewayType: "exclusive" };
  if (shape === "mindTopic") return { mindPriority: 0, mindProgress: 0, mindSide: "auto" };
  if (shape === "mindBranch") return { mindPriority: 0, mindProgress: 0, mindSide: "auto" };
  if (shape === "orgPerson") return { orgRole: "", orgDepartment: "" };
  if (shape === "orgUnit") return { orgRole: "部门", orgDepartment: "" };
  return {};
}

export function cloneSnapshot(nodes: DiagramNode[], edges: DiagramEdge[], comments: DiagramComment[] = []): Snapshot {
  return JSON.parse(JSON.stringify({ nodes, edges, comments })) as Snapshot;
}
