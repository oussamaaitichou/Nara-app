import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/automatizaciones")({
  component: AutomatizacionesPage,
  head: () => ({ meta: [{ title: "Automatizaciones — NaraGest" }] }),
});

function AutomatizacionesPage() {
  return (
    <ModulePage
      title="Automatizaciones"
      subtitle="Reglas: caducidad → tarea, stock bajo → pedido, etc."
      icon={Workflow}
      primaryAction={{ label: "Nueva regla" }}
      filters={["Todas", "Activas", "Pausadas"]}
      stats={[
        { label: "Reglas", value: "4" },
        { label: "Activas", value: "3" },
        { label: "Ejecuciones 7d", value: "28" },
        { label: "Errores", value: "0" },
      ]}
      columns={[
        { key: "nombre", label: "Regla" },
        { key: "disparador", label: "Disparador" },
        { key: "accion", label: "Acción" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", nombre: "Caducidad 30 días", disparador: "Lote ≤ 30 días", accion: "Crear tarea + aviso", estado: "Activa" },
        { id: "2", nombre: "Stock bajo mínimo", disparador: "Stock < mínimo", accion: "Proponer pedido", estado: "Activa" },
        { id: "3", nombre: "Temperatura fuera de rango", disparador: "Nevera alert", accion: "Tarea urgente", estado: "Activa" },
        { id: "4", nombre: "Resumen diario a titular", disparador: "22:00", accion: "Enviar resumen", estado: "Pausada" },
      ]}
    />
  );
}
