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
    <div className="min-h-dvh bg-[#F7F8FC] text-slate-900">
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
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#3B6EF5]/15 blur-3xl" />
        <div className="absolute top-40 right-0 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.25) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-[#3B6EF5] uppercase shadow-sm backdrop-blur">
            <Sparkles className="size-3.5" />
            Inteligencia para la oficina de farmacia
          </p>
          <h1 className="mt-6 font-display text-[2.35rem] font-semibold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.08]">
            Una sola plataforma.
            <span className="block bg-gradient-to-r from-[#3B6EF5] via-sky-500 to-emerald-500 bg-clip-text text-transparent">
              Criterio y gestion.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
            <strong className="text-slate-800">Nara</strong> orienta el mostrador.{" "}
            <strong className="text-slate-800">NaraGest</strong> concentra stock, compras, ventas y
            rentabilidad. En demo tienes las dos.
          </p>
          <p className="mt-6 text-sm text-slate-400">
            Abajo: resumen y vistas del producto. Arriba a la derecha:{" "}
            <span className="font-semibold text-[#3B6EF5]">Acceso</span>.
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
          <p className="text-xs font-semibold tracking-wide text-[#3B6EF5] uppercase">Resumen</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Nara y NaraGest
          </h2>
        </div>
        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <article className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[#3B6EF5]/10 blur-2xl transition group-hover:bg-[#3B6EF5]/20" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B6EF5] to-sky-400 text-white shadow-md shadow-blue-500/30">
                  <NaraMark className="size-7 brightness-0 invert" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Nara</h3>
                  <p className="text-xs font-medium text-[#3B6EF5]">Asesora de mostrador</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                Responde dudas de recetas, genericos, estupefacientes, inspeccion y servicios en lenguaje de
                turno. Primero el criterio; despues la norma.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
                <Li>Orientacion legal y de dispensacion al momento</Li>
                <Li>Casos de mostrador, no murales de boletin</Li>
                <Li>Complementa tu criterio; no lo sustituye</Li>
              </ul>
            </div>
          </article>
          <div className="hidden flex-col items-center justify-center lg:flex">
            <div className="flex size-14 items-center justify-center rounded-full border border-blue-100 bg-white shadow-md shadow-blue-500/10">
              <span className="bg-gradient-to-br from-[#3B6EF5] to-emerald-500 bg-clip-text text-lg font-bold text-transparent">
                +
              </span>
            </div>
            <div className="mt-2 h-16 w-px bg-gradient-to-b from-blue-200 to-emerald-200" />
          </div>
          <article className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 sm:p-8">
            <div className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-emerald-400/15 blur-2xl transition group-hover:bg-emerald-400/25" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30">
                  <BarChart3 className="size-6" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-900">NaraGest</h3>
                  <p className="text-xs font-medium text-emerald-600">Gestion inteligente</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                Dashboard: stock, compras, ventas, margen y caducidades. Alertas con causa y siguiente paso.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
                <Li>KPIs y alertas al entrar al panel</Li>
                <Li>Stock, compras, ventas y rentabilidad</Li>
                <Li>Cada alerta enlaza al modulo o al chat</Li>
              </ul>
            </div>
          </article>
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-slate-500">
          La <strong className="text-slate-700">demo</strong> incluye{" "}
          <strong className="text-slate-700">Nara + NaraGest</strong>. Luego cada cuenta ve solo lo contratado.
        </p>
      </div>
    </section>
  );
}

function Li({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#3B6EF5]" />
      <span>{children}</span>
    </li>
  );
}

function InteractivePreviews() {
  const [tab, setTab] = useState<"nara" | "gest">("nara");
  return (
    <section className="border-t border-slate-200/80 py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-wide text-[#3B6EF5] uppercase">Asi se ve dentro</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Recorre la experiencia
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
            Cambia de pestana: vista del chat o del panel (interactivo, sin login).
          </p>
        </div>
        <div className="mx-auto flex max-w-md rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("nara")}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              tab === "nara" ? "bg-[#3B6EF5] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Nara · chat
          </button>
          <button
            type="button"
            onClick={() => setTab("gest")}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              tab === "gest" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            NaraGest · panel
          </button>
        </div>
        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs font-medium text-slate-400">
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
      <aside className="hidden border-r border-slate-100 bg-[#F7F8FC] p-4 lg:block">
        <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Temas</p>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
          {["Recetas", "Genericos", "Estupefacientes", "Inspeccion", "Servicios"].map((t) => (
            <li key={t} className="rounded-lg px-2.5 py-1.5 hover:bg-white hover:text-[#3B6EF5]">
              {t}
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex min-h-[340px] flex-col p-4 sm:p-6">
        <div className="flex-1 space-y-3">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#3B6EF5] px-4 py-3 text-sm text-white shadow-sm">
            Tengo una receta en papel de hace 15 dias. Puedo dispensar?
          </div>
          <div className="flex gap-2">
            <NaraMark className="mt-1 size-8 shrink-0" />
            <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
              <p className="font-semibold text-slate-900">No. Esa receta esta caducada.</p>
              <p className="mt-2 text-slate-600">
                En papel, la validez general es de 10 dias naturales. Han pasado 15: no hay acto de
                dispensacion legal.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400">
          <MessageSquare className="size-4 text-slate-300" />
          Escribe tu consulta de mostrador...
        </div>
      </div>
    </div>
  );
}

function MockGest() {
  const cards = [
    { label: "Ventas netas", value: "12.480 EUR", tone: "bg-[#FFF4E8]" },
    { label: "Compras", value: "7.210 EUR", tone: "bg-[#F3EEFF]" },
    { label: "Margen bruto", value: "42,1 %", tone: "bg-[#E8F8F2]" },
    { label: "Alertas stock", value: "11", tone: "bg-[#E8F3FF]" },
  ];
  return (
    <div className="space-y-4 bg-[#F7F8FC] p-4 sm:p-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-[#3B6EF5]">Hoy · tu farmacia de un vistazo</p>
        <p className="mt-1 text-sm text-slate-600">
          Nara interpreta. NaraGest concentra stock, compras y margen.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border border-slate-100 p-3 shadow-sm ${c.tone}`}>
            <p className="text-[11px] text-slate-500">{c.label}</p>
            <p className="mt-1 font-display text-lg font-semibold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
        <p className="text-xs font-semibold text-amber-800">Atencion · caducidades</p>
        <p className="mt-1 text-sm text-slate-600">
          4 referencias caducan en menos de 30 dias. Revisa el modulo de stock.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Stock", "Compras", "Ventas", "Rentabilidad"].map((m) => (
          <span
            key={m}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
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
    { icon: Package, title: "Stock", body: "Minimos, exceso y caducidades con priorizacion.", tone: "sky" },
    { icon: ShoppingCart, title: "Compras", body: "Pedidos y proveedores sin perder el hilo.", tone: "lilac" },
    { icon: Wallet, title: "Ventas", body: "Tickets y ritmo del mostrador de un vistazo.", tone: "peach" },
    { icon: TrendingUp, title: "Rentabilidad", body: "Margen y focos de mejora accionables.", tone: "mint" },
    { icon: Boxes, title: "Caducidades", body: "Anticipa retiradas y reduce merma.", tone: "sky" },
    { icon: Sparkles, title: "Ideas", body: "Oportunidades detectadas a partir de tus datos.", tone: "lilac" },
  ] as const;
  const tones: Record<string, string> = {
    peach: "bg-[#FFF4E8] border-[#F5E0C8]",
    lilac: "bg-[#F3EEFF] border-[#E0D6F5]",
    sky: "bg-[#E8F3FF] border-[#C9DBF0]",
    mint: "bg-[#E8F8F2] border-[#C5E8DA]",
  };
  return (
    <section className="border-t border-slate-200/80 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-[#3B6EF5] uppercase">NaraGest en detalle</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Modulos de gestion
          </h2>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mods.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className={`rounded-3xl border p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${tones[m.tone]}`}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#3B6EF5] shadow-sm">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">{m.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{m.body}</p>
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
        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-[#3B6EF5] via-[#4B7BF5] to-sky-500 p-8 text-white shadow-xl shadow-blue-500/25 sm:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative max-w-xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Solicita una demo</h2>
            <p className="mt-3 text-sm leading-relaxed text-blue-50 sm:text-base">
              Acceso temporal a <strong>Nara + NaraGest</strong>. Cuando tengas cuenta, entra con{" "}
              <strong>Acceso</strong> (arriba a la derecha) y veras solo lo contratado.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/solicitar"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#3B6EF5] shadow-sm transition hover:bg-blue-50"
              >
                Solicitar demo <ArrowRight className="size-4" />
              </a>
              <Link
                to="/login"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
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
