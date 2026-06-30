"use client";

import { DEFAULT_NAMING_PATTERN, DEFAULT_UPLOAD_POLICY } from "@/lib/policy/defaults";
import type { UploadConfig, UploadPolicyConfig } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface PolicySettingsPanelProps {
  config: UploadConfig;
  onChange: (next: UploadConfig) => void;
  disabled?: boolean;
}

export function PolicySettingsPanel({
  config,
  onChange,
  disabled = false,
}: PolicySettingsPanelProps) {
  const policy = { ...DEFAULT_UPLOAD_POLICY, ...config.policy };

  function updatePolicy(patch: Partial<UploadPolicyConfig>) {
    onChange({
      ...config,
      policy: { ...policy, ...patch },
    });
  }

  return (
    <section className="panel w-full min-w-0">
      <SectionHeader
        title="Upload policy"
        description="Catch naming mistakes and wrong dimensions before files reach Open Cloud. Same rules apply in CI via studio-vault validate."
        meta={policy.enabled ? "Enforcement on" : "Enforcement off"}
      />

      <label className="settings-toggle-row mb-5 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="settings-toggle mt-0.5"
          checked={policy.enabled}
          disabled={disabled}
          onChange={(event) => updatePolicy({ enabled: event.target.checked })}
        />
        <span className="min-w-0">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Enable upload policy
          </span>
          <span className="caption mt-0.5 block">
            Validates the queue on add and before upload starts.
          </span>
        </span>
      </label>

      <div
        className={[
          "settings-policy-grid grid gap-5 transition-opacity",
          policy.enabled ? "" : "pointer-events-none opacity-45",
        ].join(" ")}
      >
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="label">Naming pattern (regex)</span>
          <input
            type="text"
            value={policy.namingPattern}
            onChange={(event) => updatePolicy({ namingPattern: event.target.value })}
            placeholder={DEFAULT_NAMING_PATTERN}
            className="field-input font-mono text-sm"
            disabled={disabled || !policy.enabled}
            spellCheck={false}
          />
          <p className="caption">
            Example studio convention: <code className="policy-code">^UI_[A-Za-z0-9_]+$</code>
          </p>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label">Max display name length</span>
          <input
            type="number"
            min={1}
            max={200}
            value={policy.maxNameLength}
            onChange={(event) =>
              updatePolicy({
                maxNameLength: Math.max(1, Number(event.target.value) || 50),
              })
            }
            className="field-input font-mono"
            disabled={disabled || !policy.enabled}
          />
        </label>

        <label className="settings-toggle-row flex cursor-pointer items-center gap-3 self-end">
          <input
            type="checkbox"
            className="settings-toggle"
            checked={policy.blockOnViolation}
            disabled={disabled || !policy.enabled}
            onChange={(event) =>
              updatePolicy({ blockOnViolation: event.target.checked })
            }
          />
          <span className="text-sm text-[var(--text-secondary)]">
            Block upload on violations
          </span>
        </label>

        <div className="sm:col-span-2">
          <p className="label mb-3">Image dimensions (optional)</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DimField
              label="Min width"
              value={policy.imageMinWidth}
              onChange={(v) => updatePolicy({ imageMinWidth: v })}
              disabled={disabled || !policy.enabled}
            />
            <DimField
              label="Min height"
              value={policy.imageMinHeight}
              onChange={(v) => updatePolicy({ imageMinHeight: v })}
              disabled={disabled || !policy.enabled}
            />
            <DimField
              label="Max width"
              value={policy.imageMaxWidth}
              onChange={(v) => updatePolicy({ imageMaxWidth: v })}
              disabled={disabled || !policy.enabled}
            />
            <DimField
              label="Max height"
              value={policy.imageMaxHeight}
              onChange={(v) => updatePolicy({ imageMaxHeight: v })}
              disabled={disabled || !policy.enabled}
            />
          </div>
        </div>

        <label className="settings-toggle-row flex cursor-pointer items-center gap-3 sm:col-span-2">
          <input
            type="checkbox"
            className="settings-toggle"
            checked={policy.warnDuplicateNames}
            disabled={disabled || !policy.enabled}
            onChange={(event) =>
              updatePolicy({ warnDuplicateNames: event.target.checked })
            }
          />
          <span className="text-sm text-[var(--text-secondary)]">
            Flag duplicate display names in the queue
          </span>
        </label>
      </div>
    </section>
  );
}

function DimField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number | null;
  onChange: (next: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-faint)]">
        {label}
      </span>
      <input
        type="number"
        min={0}
        placeholder="—"
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value.trim();
          onChange(raw ? Math.max(0, Number(raw) || 0) : null);
        }}
        className="field-input font-mono text-sm"
        disabled={disabled}
      />
    </label>
  );
}
