import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/stock")({
  component: StockPage,
  head: () => ({ meta: [{ title: "Stock y almacén — NaraGest" }] }),
});

function StockPage() {
  return (
    <ModulePage
      title="Stock y almacén"
      subtitle="Productos, lotes, ubicaciones y stock mínimo"
      icon={Package}
      primaryAction={{ label: "Nuevo producto" }}
      filters={["Todos", "Bajo mínimo", "Sin movimiento", "Psicótropos", "Nevera"]}
      stats={[
        { label: "Referencias", value: "1.248", hint: "Activas" },
        { label: "Bajo mínimo", value: "8", hint: "Requieren pedido" },
        { label: "Valor stock", value: "—", hint: "PVP / coste" },
        { label: "Roturas", value: "3", hint: "Hoy" },
      ]}
      columns={[
        { key: "codigo", label: "Código" },
        { key: "nombre", label: "Producto" },
        { key: "lote", label: "Lote" },
        { key: "caducidad", label: "Caducidad" },
        { key: "stock", label: "Stock" },
        { key: "minimo", label: "Mínimo" },
        { key: "ubicacion", label: "Ubicación" },
      ]}
      rows={[
        { id: "1", codigo: "8470001", nombre: "Paracetamol 1 g 20 comp.", lote: "L23A", caducidad: "2027-03", stock: 42, minimo: 20, ubicacion: "Góndola A" },
        { id: "2", codigo: "8470002", nombre: "Ibuprofeno 600 mg 20 comp.", lote: "L19B", caducidad: "2026-12", stock: 8, minimo: 15, ubicacion: "Góndola A" },
        { id: "3", codigo: "8470003", nombre: "Amoxicilina 500 mg 24 cáps.", lote: "L08C", caducidad: "2026-11", stock: 5, minimo: 10, ubicacion: "Recetas" },
        { id: "4", codigo: "8470004", nombre: "Insulina glargina", lote: "N02", caducidad: "2026-10", stock: 12, minimo: 8, ubicacion: "Nevera 1" },
        { id: "5", codigo: "8470005", nombre: "Omeprazol 20 mg 28 cáps.", lote: "L44D", caducidad: "2028-01", stock: 60, minimo: 25, ubicacion: "Góndola B" },
      ]}
    />
  );
}
