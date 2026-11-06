import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/compras")({
  component: ComprasPage,
  head: () => ({ meta: [{ title: "Compras — NaraGest" }] }),
});

function ComprasPage() {
  return (
    <ModulePage
      title="Compras"
      subtitle="Pedidos a mayoristas, albaranes y proveedores"
      icon={ShoppingCart}
      primaryAction={{ label: "Nuevo pedido" }}
      filters={["Todos", "Pendientes", "Recibidos", "Parciales"]}
      stats={[
        { label: "Pedidos abiertos", value: "4" },
        { label: "Por recibir", value: "2" },
        { label: "Proveedores", value: "6" },
        { label: "Este mes", value: "—" },
      ]}
      columns={[
        { key: "numero", label: "Nº" },
        { key: "proveedor", label: "Proveedor" },
        { key: "fecha", label: "Fecha" },
        { key: "lineas", label: "Líneas" },
        { key: "importe", label: "Importe" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", numero: "P-2026-118", proveedor: "COFARES", fecha: "05/11/2026", lineas: 24, importe: "1.842 €", estado: "Pendiente" },
        { id: "2", numero: "P-2026-117", proveedor: "Alliance", fecha: "04/11/2026", lineas: 11, importe: "620 €", estado: "Parcial" },
        { id: "3", numero: "P-2026-116", proveedor: "Hefame", fecha: "03/11/2026", lineas: 18, importe: "980 €", estado: "Recibido" },
      ]}
    />
  );
}
