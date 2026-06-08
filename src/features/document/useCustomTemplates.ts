import { useCallback, useState } from "react";
import { cloneSnapshot, MAX_CUSTOM_TEMPLATE_COUNT, TEMPLATE_STORAGE_KEY } from "../../domain/diagramDefaults";
import { loadSavedTemplates } from "../../domain/documentSession";
import type { DiagramEdge, DiagramNode, DiagramTemplate } from "../../domain/types";

type TemplateStorage = Pick<Storage, "getItem" | "setItem">;

export function createCustomTemplate(name: string, nodes: DiagramNode[], edges: DiagramEdge[], idSeed = Date.now()): DiagramTemplate {
  const snapshot = cloneSnapshot(nodes, edges, []);
  return {
    id: `custom-template-${idSeed}`,
    name: name.trim(),
    description: `自定义模板 · ${snapshot.nodes.length} 节点 / ${snapshot.edges.length} 连线`,
    nodes: snapshot.nodes,
    edges: snapshot.edges,
    custom: true
  };
}

export function limitCustomTemplates(templates: DiagramTemplate[]) {
  return templates.slice(0, MAX_CUSTOM_TEMPLATE_COUNT);
}

export function persistCustomTemplates(storage: Pick<Storage, "setItem">, templates: DiagramTemplate[]) {
  storage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
}

export function useCustomTemplates(storage: TemplateStorage = localStorage) {
  const [customTemplates, setCustomTemplates] = useState<DiagramTemplate[]>(() => loadSavedTemplates(storage));

  const saveCustomTemplate = useCallback(
    (name: string, nodes: DiagramNode[], edges: DiagramEdge[]) => {
      const template = createCustomTemplate(name, nodes, edges);
      setCustomTemplates((current) => {
        const nextTemplates = limitCustomTemplates([template, ...current]);
        persistCustomTemplates(storage, nextTemplates);
        return nextTemplates;
      });
    },
    [storage]
  );

  const deleteCustomTemplate = useCallback(
    (id: string) => {
      setCustomTemplates((current) => {
        const nextTemplates = current.filter((template) => template.id !== id);
        persistCustomTemplates(storage, nextTemplates);
        return nextTemplates;
      });
    },
    [storage]
  );

  return {
    customTemplates,
    saveCustomTemplate,
    deleteCustomTemplate
  };
}
