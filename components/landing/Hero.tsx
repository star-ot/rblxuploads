import Link from "next/link";
import { IconArrowRight } from "@/components/ui/Icon";
import { HeroComposition } from "./HeroComposition";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8 lg:pb-32 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <p className="label mb-4">Roblox asset workspace</p>
            <h1 className="font-display text-balance text-[2.25rem] font-medium leading-[1.1] tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-[3.25rem]">
              The asset browser Roblox developers always wanted.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              Find. Organize. Ship. Every rbxassetid in one place — bulk upload, version history when
              you re-upload, model packages you can overwrite in place, InsertService scripts for
              instant Studio loading, and credential profiles for every group you ship to.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/workspace" className="btn-primary px-5 py-2.5 text-[15px]">
                Open workspace
                <IconArrowRight size={16} />
              </Link>
              <a href="#studio-loader" className="btn-secondary px-5 py-2.5 text-[15px]">
                InsertService loader
              </a>
              <a href="#credentials" className="btn-ghost px-5 py-2.5 text-[15px]">
                Credential profiles
              </a>
            </div>

            <p className="mt-6 font-mono text-xs text-[var(--text-faint)]">
              Local-first · Encrypted credentials · Version chains · Multi-profile Open Cloud
            </p>
          </div>

          <HeroComposition />
        </div>
      </div>
    </section>
  );
}
