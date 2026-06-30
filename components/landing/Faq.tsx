import { FAQ_ITEMS } from "@/lib/seo/faq";

export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="border-t border-[var(--border-subtle)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-10 max-w-lg">
          <p className="label mb-3">FAQ</p>
          <h2
            id="faq-heading"
            className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl"
          >
            Common questions about Studio Vault
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Roblox Open Cloud uploads, local asset libraries, credential profiles, and
            developer workflows — answered.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] open:shadow-[0_0_0_1px_var(--border-subtle)]"
            >
              <summary className="cursor-pointer list-none px-6 py-5 [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-base font-medium text-[var(--text-primary)] pr-6">
                  {item.question}
                </h3>
              </summary>
              <div className="border-t border-[var(--border-subtle)] px-6 pb-5 pt-4">
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
