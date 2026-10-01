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
      <rect width="32" height="32" rx="8" className="fill-teal" />
      <path
        d="M16 7.2c.7 0 1.2.4 1.5 1.1l1.4 3.4 3.6.3c1.5.1 2.1 1.9 1 2.8l-2.8 2.3.9 3.6c.4 1.5-1.2 2.6-2.5 1.8L16 20.7l-3.1 1.8c-1.3.8-2.9-.3-2.5-1.8l.9-3.6-2.8-2.3c-1.1-.9-.5-2.7 1-2.8l3.6-.3 1.4-3.4c.3-.7.8-1.1 1.5-1.1Z"
        className="fill-bg"
      />
      <path
        d="M16 11.2v9.2M12.2 16h7.6"
        className="stroke-teal"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
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
