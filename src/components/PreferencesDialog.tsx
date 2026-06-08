import { Check, RotateCcw, Save, Settings, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PAGE_PRESETS } from "../domain/diagramDefaults";
import { normalizeCanvasSettings } from "../domain/documentSession";
import { buildPreferencesFromCanvasSettings, normalizeAppPreferences, type AppPreferences, type AppTheme, type DefaultExportFormat } from "../domain/preferences";
import type { CanvasSettings, GridVariant, PagePreset } from "../domain/types";
import { IconButton } from "./IconButton";
import { useModalFocusLifecycle } from "./useModalFocusLifecycle";

type PreferencesDraft = {
  documentSettings: CanvasSettings;
  appPreferences: AppPreferences;
};

export function PreferencesDialog({
  open,
  currentCanvasSettings,
  preferences,
  onClose,
  onApplyDocumentSettings,
  onSavePreferences
}: {
  open: boolean;
  currentCanvasSettings: CanvasSettings;
  preferences: AppPreferences;
  onClose: () => void;
  onApplyDocumentSettings: (settings: CanvasSettings) => void;
  onSavePreferences: (preferences: AppPreferences) => void;
}) {
  const [draft, setDraft] = useState<PreferencesDraft>(() => ({
    documentSettings: currentCanvasSettings,
    appPreferences: preferences
  }));
  const overlayRef = useRef<HTMLElement>(null);
  const focusTrap = useModalFocusLifecycle({ rootRef: overlayRef, active: open });

  useEffect(() => {
    if (!open) return;
    setDraft({
      documentSettings: currentCanvasSettings,
      appPreferences: preferences
    });
  }, [currentCanvasSettings, open, preferences]);

  if (!open) return null;

  const updateDocumentSettings = (patch: Partial<CanvasSettings>) => {
    setDraft((current) => ({
      ...current,
      documentSettings: normalizeCanvasSettings({ ...current.documentSettings, ...patch })
    }));
  };
  const updateDefaultSettings = (patch: Partial<CanvasSettings>) => {
    setDraft((current) => ({
      ...current,
      appPreferences: normalizeAppPreferences({
        ...current.appPreferences,
        canvasSettings: { ...current.appPreferences.canvasSettings, ...patch }
      })
    }));
  };
  const updatePreference = (patch: Partial<AppPreferences>) => {
    setDraft((current) => ({
      ...current,
      appPreferences: normalizeAppPreferences({ ...current.appPreferences, ...patch })
    }));
  };
  const saveDefaults = () => onSavePreferences(draft.appPreferences);
  const applyCurrentDocument = () => onApplyDocumentSettings(draft.documentSettings);

  return (
    <section
      ref={overlayRef}
      className="preferences-overlay"
      role="dialog"
      aria-label="偏好设置"
      aria-modal="true"
      onKeyDown={(event) => {
        focusTrap.onKeyDown(event);
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <button className="preferences-backdrop" type="button" aria-label="关闭偏好设置" onClick={onClose} />
      <div className="preferences-dialog">
        <header className="preferences-header">
          <div className="preferences-title">
            <Settings size={18} />
            <strong>偏好设置</strong>
          </div>
          <IconButton label="关闭偏好设置" onClick={onClose} icon={X} />
        </header>

        <div className="preferences-body">
          <section className="preferences-section" aria-label="当前文档画布设置">
            <div className="preferences-section-title">当前文档</div>
            <CanvasSettingsFields settings={draft.documentSettings} onChange={updateDocumentSettings} />
            <button className="preferences-action secondary" type="button" onClick={applyCurrentDocument}>
              <Check size={15} />
              应用到当前文档
            </button>
          </section>

          <section className="preferences-section" aria-label="应用偏好">
            <div className="preferences-section-title">应用偏好</div>
            <CanvasSettingsFields settings={draft.appPreferences.canvasSettings} onChange={updateDefaultSettings} />
            <div className="preferences-two-col">
              <label className="preferences-field">
                <span>主题</span>
                <select value={draft.appPreferences.theme} onChange={(event) => updatePreference({ theme: event.target.value as AppTheme })}>
                  <option value="system">跟随系统</option>
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </label>
              <label className="preferences-field">
                <span>默认导出</span>
                <select
                  value={draft.appPreferences.defaultExportFormat}
                  onChange={(event) => updatePreference({ defaultExportFormat: event.target.value as DefaultExportFormat })}
                >
                  <option value="svg">SVG</option>
                  <option value="png">PNG</option>
                  <option value="pdf">PDF</option>
                  <option value="json">JSON</option>
                </select>
              </label>
              <button
                className="preferences-action"
                type="button"
                onClick={() => updatePreference(buildPreferencesFromCanvasSettings(draft.appPreferences, draft.documentSettings))}
              >
                <RotateCcw size={15} />
                使用当前文档设置
              </button>
            </div>
            <label className="preferences-check">
              <input
                type="checkbox"
                checked={draft.appPreferences.openWorkspaceOnLaunch}
                onChange={(event) => updatePreference({ openWorkspaceOnLaunch: event.target.checked })}
              />
              <span>启动时打开本地工作台</span>
            </label>
            <label className="preferences-check">
              <input
                type="checkbox"
                checked={draft.appPreferences.autosaveRecovery}
                onChange={(event) => updatePreference({ autosaveRecovery: event.target.checked })}
              />
              <span>自动保存恢复缓存</span>
            </label>
            <button className="preferences-action primary" type="button" onClick={saveDefaults}>
              <Save size={15} />
              保存偏好
            </button>
          </section>
        </div>
      </div>
    </section>
  );
}

function CanvasSettingsFields({ settings, onChange }: { settings: CanvasSettings; onChange: (patch: Partial<CanvasSettings>) => void }) {
  return (
    <div className="preferences-fields">
      <div className="preferences-two-col">
        <label className="preferences-field">
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
        <label className="preferences-field">
          <span>画布背景</span>
          <input type="color" value={settings.background} onChange={(event) => onChange({ background: event.target.value })} />
        </label>
      </div>
      <div className="preferences-two-col">
        <label className="preferences-field">
          <span>网格步长</span>
          <input type="number" min={4} max={48} step={2} value={settings.gridSize} onChange={(event) => onChange({ gridSize: Number(event.target.value) })} />
        </label>
        <label className="preferences-field">
          <span>网格样式</span>
          <select value={settings.gridVariant} onChange={(event) => onChange({ gridVariant: event.target.value as GridVariant })}>
            <option value="lines">线</option>
            <option value="dots">点</option>
            <option value="cross">十字</option>
          </select>
        </label>
      </div>
      <div className="preferences-check-row">
        <label className="preferences-check">
          <input type="checkbox" checked={settings.showGrid} onChange={(event) => onChange({ showGrid: event.target.checked })} />
          <span>显示网格</span>
        </label>
        <label className="preferences-check">
          <input type="checkbox" checked={settings.showRulers} onChange={(event) => onChange({ showRulers: event.target.checked })} />
          <span>显示标尺</span>
        </label>
        <label className="preferences-check">
          <input type="checkbox" checked={settings.snapToGrid} onChange={(event) => onChange({ snapToGrid: event.target.checked })} />
          <span>吸附网格</span>
        </label>
      </div>
    </div>
  );
}
