export const EDITOR_SESSION_PARAM = "id";
export const WORKSPACE_PARAM = "workspace";
export const EDITOR_SESSION_STORAGE_KEY = "structra.editor-session-id.v1";

type EditorSessionStorage = Pick<Storage, "getItem" | "setItem">;

export function hasEditorSessionRoute(search: string) {
  const params = new URLSearchParams(search);
  return Boolean(params.get(EDITOR_SESSION_PARAM)?.trim());
}

export function hasExplicitWorkspaceRoute(search: string) {
  const params = new URLSearchParams(search);
  return params.get(WORKSPACE_PARAM) === "1";
}

export function getInitialWorkspaceOpen(openWorkspaceOnLaunch: boolean, search: string) {
  if (hasEditorSessionRoute(search)) return false;
  if (hasExplicitWorkspaceRoute(search)) return true;
  return openWorkspaceOnLaunch;
}

export function getOrCreateEditorSessionId(
  storage: EditorSessionStorage = localStorage,
  now = Date.now(),
  random = Math.random()
) {
  const existing = storage.getItem(EDITOR_SESSION_STORAGE_KEY)?.trim();
  if (existing) return existing;
  const suffix = Math.floor(random * 1_000_000).toString(36).padStart(4, "0");
  const id = `local-${now.toString(36)}-${suffix}`;
  storage.setItem(EDITOR_SESSION_STORAGE_KEY, id);
  return id;
}

export function buildEditorSearch(search: string, sessionId: string) {
  const params = new URLSearchParams(search);
  params.set(EDITOR_SESSION_PARAM, sessionId);
  params.delete(WORKSPACE_PARAM);
  return stringifySearch(params);
}

export function buildWorkspaceSearch(search: string) {
  const params = new URLSearchParams(search);
  params.delete(EDITOR_SESSION_PARAM);
  params.set(WORKSPACE_PARAM, "1");
  return stringifySearch(params);
}

export function buildEditorUrl(pathname: string, search: string, hash: string, sessionId: string) {
  return `${pathname}${buildEditorSearch(search, sessionId)}${hash}`;
}

export function buildWorkspaceUrl(pathname: string, search: string, hash: string) {
  return `${pathname}${buildWorkspaceSearch(search)}${hash}`;
}

function stringifySearch(params: URLSearchParams) {
  const value = params.toString();
  return value ? `?${value}` : "";
}
