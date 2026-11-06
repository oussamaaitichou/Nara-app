import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/caja")({
  component: CajaPage,
  head: () => ({ meta: [{ title: "Caja y tesorería — NaraGest" }] }),
});

function CajaPage() {
  return (
    <ModulePage
      title="Caja y tesorería"
      subtitle="Arqueos, cobros, pagos y conciliación"
      icon={BarChart3}
      primaryAction={{ label: "Nuevo arqueo" }}
      filters={["Hoy", "Semana", "Pendientes", "Conciliados"]}
      stats={[
        { label: "Efectivo en caja", value: "—" },
        { label: "Cobros tarjeta", value: "—" },
        { label: "Arqueos hoy", value: "1" },
        { label: "Descuadres", value: "0" },
      ]}
      columns={[
        { key: "fecha", label: "Fecha" },
        { key: "turno", label: "Turno" },
        { key: "apertura", label: "Apertura" },
        { key: "cierre", label: "Cierre" },
        { key: "descuadre", label: "Descuadre" },
        { key: "responsable", label: "Responsable" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", fecha: "06/11/2026", turno: "Mañana", apertura: "150,00 €", cierre: "—", descuadre: "—", responsable: "Ana", estado: "Abierto" },
        { id: "2", fecha: "05/11/2026", turno: "Tarde", apertura: "150,00 €", cierre: "148,20 €", descuadre: "-1,80 €", responsable: "Luis", estado: "Cerrado" },
      ]}
    />
  );
}
