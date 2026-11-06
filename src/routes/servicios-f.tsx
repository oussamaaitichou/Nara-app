import { createFileRoute } from "@tanstack/react-router";
import { Thermometer } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/servicios-f")({
  component: ServiciosFPage,
  head: () => ({ meta: [{ title: "Servicios — NaraGest" }] }),
});

function ServiciosFPage() {
  return (
    <ModulePage
      title="Servicios"
      subtitle="SPD, vacunación, cesación y controles de calidad"
      icon={Thermometer}
      primaryAction={{ label: "Nuevo servicio" }}
      filters={["Todos", "SPD", "Vacunas", "Temperaturas", "Otros"]}
      stats={[
        { label: "SPD activos", value: "24" },
        { label: "Vacunas mes", value: "18" },
        { label: "Temperaturas OK", value: "2/2" },
        { label: "Incidencias", value: "0" },
      ]}
      columns={[
        { key: "servicio", label: "Servicio" },
        { key: "detalle", label: "Detalle" },
        { key: "fecha", label: "Fecha" },
        { key: "responsable", label: "Responsable" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", servicio: "SPD", detalle: "Preparación semanal · 12 pacientes", fecha: "06/11/2026", responsable: "Sara", estado: "En curso" },
        { id: "2", servicio: "Temperatura", detalle: "Nevera 1 · 4,2 °C", fecha: "06/11/2026", responsable: "Pablo", estado: "OK" },
        { id: "3", servicio: "Vacunación", detalle: "Gripe · 3 dosis", fecha: "05/11/2026", responsable: "Ana", estado: "Registrado" },
      ]}
    />
  );
}
