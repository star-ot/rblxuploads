import { LandingCredentialsDemo } from "@/components/landing/LandingCredentialsDemo";
import { IconCheck } from "@/components/ui/Icon";

const HIGHLIGHTS = [
  "Separate keys per user or group",
  "One-click profile switching in the header",
  "AES-GCM encrypted keys in IndexedDB by default",
  "Optional passphrase vault for shared machines",
] as const;

export function CredentialManagement() {
  return (
    <section
      id="credentials"
      className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-end">
          <div className="max-w-lg">
            <p className="label mb-3">Credential profiles</p>
            <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
              One workspace. Every group and account.
            </h2>
            <p className="mt-3 text-[var(--text-secondary)]">
              Manage multiple Open Cloud keys without re-pasting. Switch between your personal
              account and studio groups from the header — uploads always target the active profile.
            </p>

            <ul className="mt-6 space-y-2.5">
              {HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]"
                >
                  <IconCheck
                    size={15}
                    className="mt-0.5 shrink-0 text-[var(--accent)]"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
            <p className="label mb-2">Try it below</p>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li>
                Open the header dropdown and pick{" "}
                <span className="font-medium text-[var(--text-secondary)]">
                  QA staging group
                </span>
              </li>
              <li>
                Watch the upload target banner update to Group{" "}
                <span className="font-mono text-[var(--text-secondary)]">9182734</span>
              </li>
              <li>
                Click profile cards on the left — same UI as Settings in the workspace
              </li>
            </ul>
          </div>
        </div>

        <LandingCredentialsDemo />
      </div>
    </section>
  );
}
