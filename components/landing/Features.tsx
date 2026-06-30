import {
  IconFolder,
  IconGrid,
  IconQueue,
  IconSearch,
  IconTag,
  IconUpload,
} from "@/components/ui/Icon";

const FEATURES = [
  {
    icon: IconSearch,
    title: "Search everything instantly",
    description:
      "Filter by type, folder, tag, or asset ID. No more digging through Creator Dashboard tabs.",
  },
  {
    icon: IconGrid,
    title: "Organize assets visually",
    description:
      "Collections work like folders mixed with playlists. Group by project, style, or release.",
  },
  {
    icon: IconUpload,
    title: "Bulk upload with confidence",
    description:
      "Queue dozens of files, set display names, and watch each one move from queued to done.",
  },
  {
    icon: IconTag,
    title: "Metadata that actually helps",
    description:
      "Tags, thumbnails, filenames, and rbxassetid URIs — stored locally, searchable forever.",
  },
  {
    icon: IconQueue,
    title: "Status you can trust",
    description:
      "Per-item progress, retry logic, and clear error messages. You always know what happened.",
  },
  {
    icon: IconFolder,
    title: "Built for serious Roblox development",
    description:
      "Model package updates, portable export, team sharing via JSON. For studios shipping experiences.",
  },
] as const;

const REASONS = [
  {
    stat: "4 types",
    label: "Images, audio, models, meshes — one queue",
  },
  {
    stat: "0 servers",
    label: "Credentials never leave your browser",
  },
  {
    stat: "∞ local",
    label: "IndexedDB library with no upload limits",
  },
] as const;

export function Features() {
  return (
    <>
      <section id="features" className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mb-12 max-w-lg">
            <p className="label mb-3">Why developers switch</p>
            <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Spend time building. Not searching.
            </h2>
            <p className="mt-3 text-[var(--text-secondary)]">
              Creator Dashboard was built for publishing. Studio Vault was built for
              the daily work of managing hundreds of assets across experiences.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map((reason) => (
              <div
                key={reason.stat}
                className="surface surface-interactive rounded-xl p-5"
              >
                <p className="font-display text-2xl font-medium text-[var(--text-primary)]">
                  {reason.stat}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{reason.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-t border-[var(--border-subtle)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mb-12 max-w-lg">
            <p className="label mb-3">Workflow</p>
            <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Every asset in one place.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="group surface-interactive card-lift rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]">
                  <feature.icon size={18} />
                </div>
                <h3 className="font-display text-base font-medium text-[var(--text-primary)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 sm:flex-row sm:items-center sm:p-10">
            <div className="max-w-md">
              <h2 className="font-display text-xl font-medium tracking-tight text-[var(--text-primary)] sm:text-2xl">
                Stop digging through Creator Dashboard.
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Your Open Cloud key. Your machine. Your asset library.
              </p>
            </div>
            <a href="/workspace" className="btn-primary shrink-0 px-6 py-2.5">
              Open workspace
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
