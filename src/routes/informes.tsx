import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/informes")({
  component: InformesPage,
  head: () => ({ meta: [{ title: "Informes — NaraGest" }] }),
});

function InformesPage() {
  return (
    <ModulePage
      title="Informes y analítica"
      subtitle="Ventas, margen, ticket medio y stock muerto"
      icon={BarChart3}
      primaryAction={{ label: "Generar informe" }}
      filters={["Ventas", "Stock", "Equipo", "Rentabilidad"]}
      stats={[
        { label: "Informes listos", value: "6" },
        { label: "Exportaciones", value: "12" },
        { label: "Periodo", value: "Mes" },
        { label: "Último", value: "Ayer" },
      ]}
      columns={[
        { key: "nombre", label: "Informe" },
        { key: "periodo", label: "Periodo" },
        { key: "generado", label: "Generado" },
        { key: "formato", label: "Formato" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", nombre: "Ventas por familia", periodo: "Oct 2026", generado: "01/11/2026", formato: "PDF", estado: "Listo" },
        { id: "2", nombre: "Stock muerto 90 días", periodo: "Oct 2026", generado: "02/11/2026", formato: "Excel", estado: "Listo" },
        { id: "3", nombre: "Ticket medio por turno", periodo: "Oct 2026", generado: "03/11/2026", formato: "PDF", estado: "Listo" },
      ]}
    />
  );
}
