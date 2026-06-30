import { FAQ_ITEMS } from "@/components/seo/JsonLd";

export function Faq() {
  return (
    <section id="faq" className="border-t border-[var(--border-subtle)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-10 max-w-lg">
          <p className="label mb-3">FAQ</p>
          <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Common questions
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <article
              key={item.question}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6"
            >
              <h3 className="font-display text-base font-medium text-[var(--text-primary)]">
                {item.question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
