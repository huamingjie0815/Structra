import {
  Braces,
  Circle,
  Database,
  Diamond,
  FileText,
  Grid3X3,
  Hexagon,
  Monitor,
  Network,
  PanelLeft,
  Pentagon,
  Square,
  Triangle,
  Type,
  UserRound,
  type LucideIcon
} from "lucide-react";

import type { ShapeKind } from "../../domain/types";
import { SHAPE_SPECS } from "../../domain/shapeSpecs";

export type ShapeLibraryItem = {
  kind: ShapeKind;
  label: string;
  icon: LucideIcon;
  width: number;
  height: number;
  fill: string;
  stroke: string;
};

const shapeIcons: Record<ShapeKind, LucideIcon> = {
  terminator: Circle,
  process: Square,
  circle: Circle,
  hexagon: Hexagon,
  decision: Diamond,
  bpmnStartEvent: Circle,
  bpmnEndEvent: Circle,
  bpmnTask: Square,
  bpmnGateway: Diamond,
  document: FileText,
  data: Braces,
  database: Database,
  umlClass: Grid3X3,
  erEntity: Square,
  erAttribute: Circle,
  erRelationship: Diamond,
  swimlane: PanelLeft,
  table: Grid3X3,
  subprocess: Square,
  manual: Braces,
  delay: Circle,
  preparation: Hexagon,
  offpage: Pentagon,
  merge: Triangle,
  display: Monitor,
  note: FileText,
  text: Type,
  mindTopic: Network,
  mindBranch: Network,
  orgPerson: UserRound,
  orgUnit: Square
};

export const shapeLibrary: ShapeLibraryItem[] = SHAPE_SPECS.map((shape) => ({ ...shape, icon: shapeIcons[shape.kind] }));
