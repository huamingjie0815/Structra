import { DEFAULT_CANVAS_SETTINGS } from "./diagramDefaults";
import { normalizeCanvasSettings } from "./documentSession";
import type { CanvasSettings } from "./types";

export const PREFERENCES_STORAGE_KEY = "structra.preferences.v1";

export type DefaultExportFormat = "json" | "svg" | "png" | "pdf";
export type AppTheme = "system" | "light" | "dark";

export type AppPreferences = {
  canvasSettings: CanvasSettings;
  openWorkspaceOnLaunch: boolean;
  autosaveRecovery: boolean;
  defaultExportFormat: DefaultExportFormat;
  theme: AppTheme;
};

type PreferencesStorage = Pick<Storage, "getItem" | "setItem">;

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  canvasSettings: DEFAULT_CANVAS_SETTINGS,
  openWorkspaceOnLaunch: true,
  autosaveRecovery: true,
  defaultExportFormat: "svg",
  theme: "system"
};

export function normalizeAppPreferences(value?: unknown): AppPreferences {
  if (!isRecord(value)) return DEFAULT_APP_PREFERENCES;
  const exportFormat = value.defaultExportFormat;
  const theme = value.theme;
  return {
    canvasSettings: normalizeCanvasSettings(isRecord(value.canvasSettings) ? value.canvasSettings : DEFAULT_CANVAS_SETTINGS),
    openWorkspaceOnLaunch: typeof value.openWorkspaceOnLaunch === "boolean" ? value.openWorkspaceOnLaunch : DEFAULT_APP_PREFERENCES.openWorkspaceOnLaunch,
    autosaveRecovery: typeof value.autosaveRecovery === "boolean" ? value.autosaveRecovery : DEFAULT_APP_PREFERENCES.autosaveRecovery,
    defaultExportFormat: isDefaultExportFormat(exportFormat) ? exportFormat : DEFAULT_APP_PREFERENCES.defaultExportFormat,
    theme: isAppTheme(theme) ? theme : DEFAULT_APP_PREFERENCES.theme
  };
}

export function loadAppPreferences(storage: PreferencesStorage = localStorage): AppPreferences {
  try {
    const raw = storage.getItem(PREFERENCES_STORAGE_KEY);
    return normalizeAppPreferences(raw ? JSON.parse(raw) : undefined);
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

export function saveAppPreferences(preferences: AppPreferences, storage: PreferencesStorage = localStorage): AppPreferences {
  const normalized = normalizeAppPreferences(preferences);
  storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function buildPreferencesFromCanvasSettings(current: AppPreferences, canvasSettings: CanvasSettings): AppPreferences {
  return normalizeAppPreferences({
    ...current,
    canvasSettings
  });
}

function isDefaultExportFormat(value: unknown): value is DefaultExportFormat {
  return value === "json" || value === "svg" || value === "png" || value === "pdf";
}

function isAppTheme(value: unknown): value is AppTheme {
  return value === "system" || value === "light" || value === "dark";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
