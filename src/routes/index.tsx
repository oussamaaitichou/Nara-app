import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  MessageSquare,
  Package,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="nara-stage min-h-dvh text-[var(--color-ink)]">
      <SiteHeader />
      <main>
        <Hero />
        <DualProducts />
        <InteractivePreviews />
        <GestModules />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16">
      <div className="pointer-events-none absolute inset-0 nara-impressionist opacity-80" />
      <div className="pointer-events-none absolute inset-0 nara-topo opacity-60" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="nara-glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-[var(--color-teal)] uppercase">
            <Sparkles className="size-3.5" />
            Inteligencia para la oficina de farmacia
          </p>
          <h1 className="mt-6 font-display text-[2.35rem] font-semibold tracking-tight text-[var(--color-ink)] sm:text-5xl sm:leading-[1.08]">
            Una sola plataforma.
            <span className="nara-iridescent-text block">Criterio y gestión.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
            <strong className="text-[var(--color-ink-soft)]">Nara</strong> orienta el mostrador.{" "}
            <strong className="text-[var(--color-ink-soft)]">NaraGest</strong> concentra stock, compras, ventas y
            rentabilidad. En demo tienes las dos.
          </p>
          <p className="mt-6 text-sm text-[var(--color-subtle)]">
            Abajo: resumen y vistas del producto. Arriba a la derecha:{" "}
            <span className="font-semibold text-[var(--color-teal)]">Acceso</span>.
          </p>
        </div>
      </div>
    </section>
  );
}

function DualProducts() {
  return (
    <section id="productos" className="relative pb-6 sm:pb-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-teal)] uppercase">Resumen</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
            Nara y NaraGest
          </h2>
        </div>
        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <article className="nara-glass group relative overflow-hidden rounded-3xl p-6 transition duration-500 hover:-translate-y-1 sm:p-8">
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="nara-thermal flex size-12 items-center justify-center rounded-2xl text-white shadow-md">
                  <NaraMark className="size-7 brightness-0 invert" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Nara</h3>
                  <p className="text-xs font-medium text-[var(--color-teal)]">Asesora de mostrador</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-[var(--color-muted)]">
                Responde dudas de recetas, genéricos, estupefacientes, inspección y servicios en lenguaje de
                turno. Primero el criterio; después la norma.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-[var(--color-muted)]">
                <Li>Orientación legal y de dispensación al momento</Li>
                <Li>Casos de mostrador, no murales de boletín</Li>
                <Li>Complementa tu criterio; no lo sustituye</Li>
              </ul>
            </div>
          </article>
          <div className="hidden flex-col items-center justify-center lg:flex">
            <div className="nara-glass flex size-14 items-center justify-center rounded-full">
              <span className="nara-iridescent-text text-lg font-bold">+</span>
            </div>
            <div className="mt-2 h-16 w-px bg-gradient-to-b from-[var(--color-teal)]/30 to-[var(--color-thermal-warm)]/30" />
          </div>
          <article className="nara-glass group relative overflow-hidden rounded-3xl p-6 transition duration-500 hover:-translate-y-1 sm:p-8">
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-teal)] to-[var(--color-thermal-cold)] text-white shadow-md">
                  <BarChart3 className="size-6" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">NaraGest</h3>
                  <p className="text-xs font-medium text-[var(--color-teal)]">Gestión inteligente</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-[var(--color-muted)]">
                Dashboard: stock, compras, ventas, margen y caducidades. Alertas con causa y siguiente paso.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-[var(--color-muted)]">
                <Li>KPIs y alertas al entrar al panel</Li>
                <Li>Stock, compras, ventas y rentabilidad</Li>
                <Li>Cada alerta enlaza al módulo o al chat</Li>
              </ul>
            </div>
          </article>
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[var(--color-muted)]">
          La <strong className="text-[var(--color-ink-soft)]">demo</strong> incluye{" "}
          <strong className="text-[var(--color-ink-soft)]">Nara + NaraGest</strong>. Luego cada cuenta ve solo lo contratado.
        </p>
      </div>
    </section>
  );
}

function Li({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-teal)]" />
      <span>{children}</span>
    </li>
  );
}

function InteractivePreviews() {
  const [tab, setTab] = useState<"nara" | "gest">("nara");
  return (
    <section className="border-t border-[var(--color-line)]/80 py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-teal)] uppercase">Así se ve dentro</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
            Recorre la experiencia
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted)]">
            Cambia de pestaña: vista del chat o del panel (interactivo, sin login).
          </p>
        </div>
        <div className="nara-glass mx-auto flex max-w-md rounded-full p-1">
          <button
            type="button"
            onClick={() => setTab("nara")}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              tab === "nara" ? "nara-thermal text-white shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            Nara · chat
          </button>
          <button
            type="button"
            onClick={() => setTab("gest")}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              tab === "gest"
                ? "bg-[var(--color-teal)] text-white shadow-sm"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            NaraGest · panel
          </button>
        </div>
        <div className="nara-glass nara-glow mt-8 overflow-hidden rounded-3xl">
          <div className="flex items-center gap-2 border-b border-[var(--color-line)]/60 bg-[var(--color-surface-2)]/80 px-4 py-3">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs font-medium text-[var(--color-subtle)]">
              {tab === "nara" ? "nara · consulta de mostrador" : "naragest · dashboard"}
            </span>
          </div>
          {tab === "nara" ? <MockChat /> : <MockGest />}
        </div>
      </div>
    </section>
  );
}

function MockChat() {
  return (
    <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
      <aside className="hidden border-r border-[var(--color-line)]/60 bg-[var(--color-surface-2)]/50 p-4 lg:block">
        <p className="text-[11px] font-semibold tracking-wide text-[var(--color-subtle)] uppercase">Temas</p>
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-muted)]">
          {["Recetas", "Genéricos", "Estupefacientes", "Inspección", "Servicios"].map((t) => (
            <li key={t} className="rounded-lg px-2.5 py-1.5 hover:bg-white/80 hover:text-[var(--color-teal)]">
              {t}
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex min-h-[340px] flex-col p-4 sm:p-6">
        <div className="flex-1 space-y-3">
          <div className="nara-thermal ml-auto max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 text-sm shadow-sm">
            Tengo una receta en papel de hace 15 días. ¿Puedo dispensar?
          </div>
          <div className="flex gap-2">
            <NaraMark className="mt-1 size-8 shrink-0" />
            <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-[var(--color-line)] bg-[var(--color-surface)]/90 px-4 py-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              <p className="font-semibold text-[var(--color-ink)]">No. Esa receta está caducada.</p>
              <p className="mt-2 text-[var(--color-muted)]">
                En papel, la validez general es de 10 días naturales. Han pasado 15: no hay acto de
                dispensación legal.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-subtle)]">
          <MessageSquare className="size-4 opacity-50" />
          Escribe tu consulta de mostrador…
        </div>
      </div>
    </div>
  );
}

function MockGest() {
  const cards = [
    { label: "Ventas netas", value: "12.480 €", tone: "nara-thermal-soft" },
    { label: "Compras", value: "7.210 €", tone: "nara-felt" },
    { label: "Margen bruto", value: "42,1 %", tone: "nara-thermal-soft" },
    { label: "Alertas stock", value: "11", tone: "nara-stipple" },
  ];
  return (
    <div className="space-y-4 bg-[var(--color-surface-2)]/40 p-4 sm:p-6">
      <div className="nara-glass rounded-2xl p-4">
        <p className="text-xs font-semibold text-[var(--color-teal)]">Hoy · tu farmacia de un vistazo</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Nara interpreta. NaraGest concentra stock, compras y margen.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border border-[var(--color-line)]/60 p-3 shadow-sm ${c.tone}`}>
            <p className="text-[11px] text-[var(--color-muted)]">{c.label}</p>
            <p className="mt-1 font-display text-lg font-semibold text-[var(--color-ink)]">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4">
        <p className="text-xs font-semibold text-amber-800">Atención · caducidades</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          4 referencias caducan en menos de 30 días. Revisa el módulo de stock.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Stock", "Compras", "Ventas", "Rentabilidad"].map((m) => (
          <span
            key={m}
            className="nara-glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)]"
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function GestModules() {
  const mods = [
    { icon: Package, title: "Stock", body: "Mínimos, exceso y caducidades con priorización." },
    { icon: ShoppingCart, title: "Compras", body: "Pedidos y proveedores sin perder el hilo." },
    { icon: Wallet, title: "Ventas", body: "Tickets y ritmo del mostrador de un vistazo." },
    { icon: TrendingUp, title: "Rentabilidad", body: "Margen y focos de mejora accionables." },
    { icon: Boxes, title: "Caducidades", body: "Anticipa retiradas y reduce merma." },
    { icon: Sparkles, title: "Ideas", body: "Oportunidades detectadas a partir de tus datos." },
  ] as const;
  return (
    <section className="border-t border-[var(--color-line)]/80 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-teal)] uppercase">NaraGest en detalle</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
            Módulos de gestión
          </h2>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mods.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="nara-glass nara-thermal-soft rounded-3xl p-5 transition duration-300 hover:-translate-y-0.5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-teal)] shadow-sm">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-[var(--color-ink)]">{m.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-muted)]">{m.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="nara-thermal nara-lens relative overflow-hidden rounded-3xl p-8 shadow-xl sm:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative max-w-xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Solicita una demo</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-base">
              Acceso temporal a <strong>Nara + NaraGest</strong>. Cuando tengas cuenta, entra con{" "}
              <strong>Acceso</strong> (arriba a la derecha) y verás solo lo contratado.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/solicitar"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[var(--color-teal-deep)] shadow-sm transition hover:bg-white/90"
              >
                Solicitar demo <ArrowRight className="size-4" />
              </a>
              <Link
                to="/login"
                className="nara-glass inline-flex h-11 items-center gap-2 rounded-full border border-white/40 px-5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Ya tengo cuenta · Acceso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
