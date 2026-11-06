import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/ventas")({
  component: VentasPage,
  head: () => ({ meta: [{ title: "Ventas y ticket — NaraGest" }] }),
});

function VentasPage() {
  return (
    <ModulePage
      title="Ventas y ticket"
      subtitle="Caja, tickets, devoluciones y medios de pago"
      icon={Wallet}
      primaryAction={{ label: "Importar Excel" }}
      filters={["Hoy", "Semana", "Mes", "Devoluciones"]}
      stats={[
        { label: "Ventas hoy", value: "—", hint: "Conectar TPV / Excel" },
        { label: "Ticket medio", value: "—" },
        { label: "Tickets", value: "—" },
        { label: "Devoluciones", value: "0" },
      ]}
      columns={[
        { key: "ticket", label: "Ticket" },
        { key: "hora", label: "Hora" },
        { key: "importe", label: "Importe" },
        { key: "pago", label: "Pago" },
        { key: "lineas", label: "Líneas" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", ticket: "T-10482", hora: "09:14", importe: "24,50 €", pago: "Tarjeta", lineas: 3, estado: "Cerrado" },
        { id: "2", ticket: "T-10483", hora: "09:22", importe: "8,90 €", pago: "Efectivo", lineas: 1, estado: "Cerrado" },
        { id: "3", ticket: "T-10484", hora: "09:41", importe: "56,20 €", pago: "Tarjeta", lineas: 5, estado: "Cerrado" },
      ]}
      emptyHint="Conecta tu TPV o importa el Excel de ventas para ver el detalle."
    />
  );
}
