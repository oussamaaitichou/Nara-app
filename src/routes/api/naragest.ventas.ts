import { createFileRoute } from "@tanstack/react-router";
import { canWrite, canDelete, resolveNgAccess } from "@/lib/naragest/access.server";
import { createSale, listSales, softDeleteSale } from "@/lib/naragest/commerce.server";

export const Route = createFileRoute("/api/naragest/ventas")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status });
        const data = await listSales(resolved.access.organizationId);
        return Response.json({
          data,
          meta: {
            canWrite: canWrite(resolved.access.roleId),
            canDelete: canDelete(resolved.access.roleId),
            roleId: resolved.access.roleId,
          },
        });
      },
      POST: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status });
        if (!canWrite(resolved.access.roleId)) {
          return Response.json({ error: "Sin permiso de escritura" }, { status: 403 });
        }
        const body = (await request.json()) as {
          saleDate?: string;
          saleTime?: string;
          amount?: number;
          payment?: string;
          linesCount?: number;
          kind?: string;
          category?: string;
        };
        if (body.amount == null) return Response.json({ error: "Falta amount" }, { status: 400 });
        const row = await createSale(resolved.access.organizationId, resolved.access.userId, {
          saleDate: body.saleDate || new Date().toISOString().slice(0, 10),
          saleTime: body.saleTime || "12:00",
          amount: Number(body.amount),
          payment: body.payment === "Efectivo" ? "Efectivo" : "Tarjeta",
          linesCount: Math.max(1, body.linesCount ?? 1),
          kind: body.kind === "devolucion" ? "devolucion" : "venta",
          category: body.category?.trim() || "Otros",
        });
        return Response.json({ data: row }, { status: 201 });
      },
      DELETE: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status });
        if (!canDelete(resolved.access.roleId)) {
          return Response.json({ error: "Sin permiso de borrado" }, { status: 403 });
        }
        const id = new URL(request.url).searchParams.get("id");
        if (!id) return Response.json({ error: "Falta id" }, { status: 400 });
        const ok = await softDeleteSale(resolved.access.organizationId, resolved.access.userId, id);
        if (!ok) return Response.json({ error: "No encontrado" }, { status: 404 });
        return Response.json({ ok: true });
      },
    },
  },
});
