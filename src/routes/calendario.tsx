import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/calendario")({
  component: CalendarioPage,
  head: () => ({ meta: [{ title: "Calendario — NaraGest" }] }),
});

function CalendarioPage() {
  return (
    <ModulePage
      title="Calendario y vencimientos"
      subtitle="Guardias, caducidades, revisiones y citas del equipo"
      icon={CalendarDays}
      primaryAction={{ label: "Nuevo evento" }}
      filters={["Mes", "Semana", "Guardias", "Caducidades", "Equipo"]}
      stats={[
        { label: "Eventos mes", value: "18" },
        { label: "Guardias", value: "2" },
        { label: "Vencimientos 7d", value: "6" },
        { label: "Hoy", value: "3" },
      ]}
      columns={[
        { key: "fecha", label: "Fecha" },
        { key: "evento", label: "Evento" },
        { key: "tipo", label: "Tipo" },
        { key: "responsable", label: "Responsable" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", fecha: "06/11/2026", evento: "Control temperatura neveras", tipo: "Control", responsable: "Pablo", estado: "Hoy" },
        { id: "2", fecha: "09/11/2026", evento: "Guardia domingo", tipo: "Guardia", responsable: "Ana", estado: "Programado" },
        { id: "3", fecha: "15/11/2026", evento: "Caducidad amoxicilina L08C", tipo: "Caducidad", responsable: "Sara", estado: "Alerta" },
      ]}
    />
  );
}
