import { useCallback, useMemo, useState } from "react";

export const TEMPLATE_FAVORITES_STORAGE_KEY = "structra-template-favorites-v1";
const MAX_TEMPLATE_FAVORITES = 64;

type TemplateFavoriteStorage = Pick<Storage, "getItem" | "setItem">;

export function normalizeTemplateFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const favoriteIds: string[] = [];
  value.forEach((item) => {
    if (typeof item !== "string") return;
    const id = item.trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    favoriteIds.push(id);
  });
  return favoriteIds.slice(0, MAX_TEMPLATE_FAVORITES);
}

export function loadTemplateFavorites(storage: Pick<Storage, "getItem"> = localStorage) {
  try {
    return normalizeTemplateFavoriteIds(JSON.parse(storage.getItem(TEMPLATE_FAVORITES_STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function persistTemplateFavorites(storage: Pick<Storage, "setItem">, favoriteIds: string[]) {
  storage.setItem(TEMPLATE_FAVORITES_STORAGE_KEY, JSON.stringify(normalizeTemplateFavoriteIds(favoriteIds)));
}

export function toggleTemplateFavoriteId(favoriteIds: string[], templateId: string) {
  const normalizedId = templateId.trim();
  if (!normalizedId) return normalizeTemplateFavoriteIds(favoriteIds);
  const current = normalizeTemplateFavoriteIds(favoriteIds);
  if (current.includes(normalizedId)) return current.filter((id) => id !== normalizedId);
  return normalizeTemplateFavoriteIds([normalizedId, ...current]);
}

export function removeTemplateFavoriteId(favoriteIds: string[], templateId: string) {
  return normalizeTemplateFavoriteIds(favoriteIds).filter((id) => id !== templateId);
}

export function useTemplateFavorites(storage: TemplateFavoriteStorage = localStorage) {
  const [favoriteTemplateIds, setFavoriteTemplateIds] = useState<string[]>(() => loadTemplateFavorites(storage));
  const favoriteTemplateIdSet = useMemo(() => new Set(favoriteTemplateIds), [favoriteTemplateIds]);

  const updateFavoriteIds = useCallback(
    (nextFavoriteIds: string[]) => {
      const normalized = normalizeTemplateFavoriteIds(nextFavoriteIds);
      setFavoriteTemplateIds(normalized);
      persistTemplateFavorites(storage, normalized);
    },
    [storage]
  );

  const toggleTemplateFavorite = useCallback(
    (templateId: string) => {
      setFavoriteTemplateIds((current) => {
        const nextFavoriteIds = toggleTemplateFavoriteId(current, templateId);
        persistTemplateFavorites(storage, nextFavoriteIds);
        return nextFavoriteIds;
      });
    },
    [storage]
  );

  const removeTemplateFavorite = useCallback(
    (templateId: string) => {
      setFavoriteTemplateIds((current) => {
        const nextFavoriteIds = removeTemplateFavoriteId(current, templateId);
        persistTemplateFavorites(storage, nextFavoriteIds);
        return nextFavoriteIds;
      });
    },
    [storage]
  );

  return {
    favoriteTemplateIds,
    favoriteTemplateIdSet,
    updateFavoriteIds,
    toggleTemplateFavorite,
    removeTemplateFavorite
  };
}
