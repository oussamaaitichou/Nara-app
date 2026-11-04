import { createFileRoute } from "@tanstack/react-router";
import { ChatApp } from "@/components/chat/chat-app";
import { AppShell } from "@/components/layout/app-shell";

type ConsultaSearch = {
  q?: string;
  tema?: string;
};

export const Route = createFileRoute("/consulta")({
  validateSearch: (search: Record<string, unknown>): ConsultaSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
    tema: typeof search.tema === "string" ? search.tema : undefined,
  }),
  component: ConsultaPage,
  head: () => ({
    meta: [{ title: "Consultar a Nara — Asesora de farmacia" }],
  }),
});

function ConsultaPage() {
  const { q, tema } = Route.useSearch();
  return (
    <AppShell fullBleed>
      <div className="flex h-[calc(100dvh-3.25rem)] min-h-0 flex-col md:h-dvh">
        <ChatApp initialQuestion={q} initialTopic={tema} />
      </div>
    </AppShell>
  );
}
