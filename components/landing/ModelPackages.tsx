import { LandingModelPackageDemo } from "@/components/landing/LandingWorkflowDemos";

export function ModelPackages() {
  return (
    <section id="model-packages" className="border-t border-[var(--border-subtle)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end">
          <div className="max-w-lg">
            <p className="label mb-3">Model packages</p>
            <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Upload packages. Overwrite them in place.
            </h2>
            <p className="mt-3 text-[var(--text-secondary)]">
              Roblox models upload as packages — not raw mesh blobs. Studio Vault creates them
              through Open Cloud like any other asset, then lets you push a new FBX to the same
              asset ID when art changes.
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Scripts, instances, and datastore references keep working because the{" "}
              <span className="font-mono text-[var(--text-secondary)]">rbxassetid</span> never
              changes — only the package content does.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
            <p className="label mb-2">Supported flows</p>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li>
                <span className="font-mono text-[var(--text-secondary)]">POST</span> — upload new
                FBX, RBXM, GLTF, or GLB as a Model package
              </li>
              <li>
                <span className="font-mono text-[var(--text-secondary)]">PATCH</span> — replace an
                existing package with a new FBX (same asset ID)
              </li>
              <li>
                Library panel — update workflow lives next to your saved assets in the workspace
              </li>
            </ul>
          </div>
        </div>

        <LandingModelPackageDemo />
      </div>
    </section>
  );
}
