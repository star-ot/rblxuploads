import { TEAMS_FAQ } from "@/lib/teams/content";

export function TeamsFaq() {
  return (
    <section
      id="teams-faq"
      aria-labelledby="teams-faq-heading"
      className="border-b border-[var(--border-subtle)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 max-w-lg">
          <p className="label mb-3">FAQ for security reviewers</p>
          <h2
            id="teams-faq-heading"
            className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl"
          >
            Questions IT and procurement ask
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Keys, data residency, logging, SSO proxy patterns — answered for your security review
            packet.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {TEAMS_FAQ.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] open:shadow-[0_0_0_1px_var(--border-subtle)]"
            >
              <summary className="cursor-pointer list-none px-6 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [&::-webkit-details-marker]:hidden">
                <h3 className="pr-6 font-display text-base font-medium text-[var(--text-primary)]">
                  {item.question}
                </h3>
              </summary>
              <div className="border-t border-[var(--border-subtle)] px-6 pb-5 pt-4">
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
