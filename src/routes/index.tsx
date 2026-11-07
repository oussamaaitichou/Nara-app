import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardCheck,
  Clock,
  FileText,
  Receipt,
  Repeat,
  ShieldAlert,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQS, HOW_STEPS, SAMPLE_EXCHANGE, STATS, TOPICS } from "@/lib/chat/knowledge";
import { Markdown } from "@/lib/chat/markdown";
import type { TopicId } from "@/lib/chat/types";

export const Route = createFileRoute("/")({
  component: Home,
});

const ICONS: Record<TopicId, typeof FileText> = {
  recetas: FileText,
  genericos: Repeat,
  estupefacientes: ShieldAlert,
  seguridad: Stethoscope,
  servicios: Syringe,
  inspeccion: ClipboardCheck,
  guardias: Clock,
  facturacion: Receipt,
};

function Home() {
  return (
    <div className="nara-paper min-h-dvh">
      <SiteHeader />
      <main>
        <Hero />
        <Topics />
        <Sample />
        <How />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
      <div className="nara-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="nara-rise space-y-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium tracking-wide text-teal uppercase">
            <NaraMark className="size-5" />
            Para la oficina de farmacia
          </p>
          <h1 className="font-display text-[2.4rem] font-semibold tracking-tight text-ink sm:text-6xl sm:leading-[1.05]">
            La asesora que el mostrador estaba esperando.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Nara responde dudas de recetas, sustitución, estupefacientes, inspección y
            servicios — en lenguaje de turno, no de boletín. Como Álex para abogados, pero
            formada en la farmacia española.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link to="/consulta">
                Preguntar a Nara
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/solicitar">Solicitar demo</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href="#temas">Ver temas</a>
            </Button>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 pt-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="border-t border-line pt-3">
                <dt className="font-display text-2xl font-semibold tracking-tight text-teal">{s.value}</dt>
                <dd className="text-sm text-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="nara-rise relative">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-lift)] sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted">
              <NaraMark className="size-7" />
              <span className="font-medium text-ink">Consulta de mostrador</span>
            </div>
            <div className="space-y-3">
              <div className="ml-8 rounded-xl rounded-br-sm bg-teal px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                {SAMPLE_EXCHANGE.question}
              </div>
              <div className="flex gap-2">
                <NaraMark className="mt-1 size-7 shrink-0" />
                <div className="rounded-xl rounded-bl-sm bg-teal-mist px-4 py-3 text-sm leading-relaxed text-ink-soft">
                  <p className="font-medium text-teal-deep">No. Esa receta está caducada.</p>
                  <p className="mt-2">
                    En papel, la validez general es de 10 días naturales (RD 1718/2010).
                    Han pasado 15. No hay acto de dispensación legal — ni “por esta vez”.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Topics() {
  return (
    <section id="temas" className="border-t border-line bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-medium tracking-wide text-teal uppercase">Temas</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Lo que sale cada día en la oficina.
          </h2>
          <p className="text-muted">
            Elige un tema o entra directo con el caso. Nara pregunta lo que falta y te
            deja los pasos del mostrador.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOPICS.map((topic) => {
            const Icon = ICONS[topic.id];
            return (
              <Link
                key={topic.id}
                to="/consulta"
                search={{ tema: topic.id, q: topic.starters[0] ?? "" }}
                className="group flex flex-col rounded-xl border border-line bg-bg p-5 transition-colors hover:border-teal hover:bg-teal-mist"
              >
                <Icon className="size-5 text-teal" />
                <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                  {topic.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{topic.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal">
                  Consultar
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Sample() {
  return (
    <section className="border-t border-line py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <p className="text-xs font-medium tracking-wide text-teal uppercase">Así responde</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Primero el criterio. Después la norma.
          </h2>
          <p className="text-muted leading-relaxed">
            Nara no te suelta un mural de legislación. Te dice si puedes dispensar, qué
            decirle al paciente y cuándo hay que llamar al médico, al Colegio o a la
            AEMPS.
          </p>
          <Button asChild>
            <Link to="/consulta" search={{ q: SAMPLE_EXCHANGE.question }}>
              Probar este caso
            </Link>
          </Button>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <p className="text-sm font-medium text-teal">Pregunta</p>
          <p className="mt-2 text-ink">{SAMPLE_EXCHANGE.question}</p>
          <div className="my-5 h-px bg-line" />
          <p className="text-sm font-medium text-teal">Nara</p>
          <div className="mt-2">
            <Markdown text={SAMPLE_EXCHANGE.answer} />
          </div>
        </div>
      </div>
    </section>
  );
}

function How() {
  return (
    <section id="como-funciona" className="border-t border-line bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Cómo funciona</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {HOW_STEPS.map((step) => (
            <div key={step.n} className="rounded-xl border border-line bg-bg p-6">
              <p className="font-display text-sm font-semibold tracking-[0.18em] text-teal">{step.n}</p>
              <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="border-t border-line py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Preguntas frecuentes</h2>
          <p className="mt-3 text-muted">
            Nara es una orientación de compañera de turno. El sello lo pone tu criterio y
            la norma vigente.
          </p>
        </div>
        <Accordion type="single" collapsible className="border-t border-line">
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`q-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
