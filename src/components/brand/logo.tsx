import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function NaraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      aria-hidden="true"
      fill="none"
    >
      <rect width="32" height="32" rx="7" className="fill-teal" />
      <path d="M16 4.8C16 13 19 16 27.2 16C19 16 16 19 16 27.2C16 19 13 16 4.8 16C13 16 16 13 16 4.8Z" className="fill-bg" />
    </svg>
  );
}

export function NaraWordmark({
  className,
  to = "/",
}: {
  className?: string;
  to?: "/";
}) {
  return (
    <Link
      to={to}
      className={cn("inline-flex items-center gap-2.5 text-ink", className)}
      aria-label="Nara, inicio"
    >
      <NaraMark />
      <span className="font-display text-[1.35rem] font-semibold tracking-tight leading-none">
        Nara
      </span>
    </Link>
  );
}
