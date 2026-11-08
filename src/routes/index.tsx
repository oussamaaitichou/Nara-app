import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
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
import { Button } from "@/components/ui/button";

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
        <GestModules />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20">
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
            <strong className="text-slate-800">Nara</strong> te orienta en el mostrador.{" "}
            <strong className="text-slate-800">NaraGest</strong> concentra stock, compras, ventas y
            rentabilidad — con alertas claras y accion.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#3B6EF5] px-6 text-white shadow-lg shadow-blue-500/25 hover:bg-[#2f5cd6]"
            >
              <a href="/solicitar">
                Solicitar demo
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50/60"
            >
              <Link to="/consulta">
                Probar el chat
                <MessageSquare className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DualProducts() {
  return (
    <section id="productos" className="relative pb-8 sm:pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-wide text-[#3B6EF5] uppercase">Dos piezas, un mismo criterio</p>
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
              <div className="mt-6">
                <Link
                  to="/consulta"
                  className="inline-flex items-center gap-2 rounded-full bg-[#3B6EF5] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-[#2f5cd6]"
                >
                  Hablar con Nara <ArrowRight className="size-3.5" />
                </Link>
              </div>
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
                Dashboard de la farmacia: stock, compras, ventas, margen y caducidades. Alertas con causa y
                siguiente paso — sin perder el control del titular.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
                <Li>KPIs y alertas al entrar al panel</Li>
                <Li>Stock, compras, ventas y rentabilidad</Li>
                <Li>Cada alerta enlaza al modulo o al chat con contexto</Li>
              </ul>
              <div className="mt-6">
                <a
                  href="/solicitar"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                  Solicitar NaraGest <ArrowRight className="size-3.5" />
                </a>
              </div>
            </div>
          </article>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-slate-500">
          En <strong className="text-slate-700">demo</strong> puedes probar{" "}
          <strong className="text-slate-700">chat + NaraGest</strong>. Luego contratas solo chat, o gest (que
          incluye el asistente).
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
            Que hace el panel de gestion
          </h2>
          <p className="mt-3 text-slate-500">
            Mismos modulos que en NaraGest: cifras claras, tarjetas suaves y acceso directo a la accion.
          </p>
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
          <div className="pointer-events-none absolute -bottom-20 left-10 size-48 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="relative max-w-xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Prueba Nara y NaraGest en tu farmacia
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-blue-50 sm:text-base">
              Solicita una demo: acceso temporal a chat y gestion. Tu decides despues si te quedas solo con
              el asistente o con el pack completo.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/solicitar"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#3B6EF5] shadow-sm transition hover:bg-blue-50"
              >
                Solicitar demo <ArrowRight className="size-4" />
              </a>
              <Link
                to="/consulta"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Abrir el chat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
