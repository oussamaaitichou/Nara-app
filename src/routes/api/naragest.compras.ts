import { createFileRoute } from "@tanstack/react-router";
import { canWrite, canDelete, resolveNgAccess } from "@/lib/naragest/access.server";
import {
  createPurchase,
  listPurchases,
  softDeletePurchase,
  updatePurchaseStatus,
} from "@/lib/naragest/commerce.server";

export const Route = createFileRoute("/api/naragest/compras")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status });
        const data = await listPurchases(resolved.access.organizationId);
        return Response.json({
          data,
          meta: {
            organizationId: resolved.access.organizationId,
            roleId: resolved.access.roleId,
            canWrite: canWrite(resolved.access.roleId),
            canDelete: canDelete(resolved.access.roleId),
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
          supplier?: string;
          purchaseDate?: string;
          linesCount?: number;
          amount?: number;
          status?: string;
          family?: string;
        };
        if (!body.supplier?.trim() || body.amount == null || body.amount < 0) {
          return Response.json({ error: "Faltan supplier o amount" }, { status: 400 });
        }
        const row = await createPurchase(resolved.access.organizationId, resolved.access.userId, {
          supplier: body.supplier.trim(),
          purchaseDate: body.purchaseDate || new Date().toISOString().slice(0, 10),
          linesCount: Math.max(1, body.linesCount ?? 1),
          amount: Number(body.amount),
          status: body.status || "Pendiente",
          family: body.family?.trim() || "Otros",
        });
        return Response.json({ data: row }, { status: 201 });
      },
      PATCH: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status });
        if (!canWrite(resolved.access.roleId)) {
          return Response.json({ error: "Sin permiso de escritura" }, { status: 403 });
        }
        const body = (await request.json()) as { id?: string; status?: string };
        if (!body.id || !body.status) return Response.json({ error: "Falta id o status" }, { status: 400 });
        const row = await updatePurchaseStatus(
          resolved.access.organizationId,
          resolved.access.userId,
          body.id,
          body.status,
        );
        if (!row) return Response.json({ error: "No encontrado" }, { status: 404 });
        return Response.json({ data: row });
      },
      DELETE: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status });
        if (!canDelete(resolved.access.roleId)) {
          return Response.json({ error: "Sin permiso de borrado" }, { status: 403 });
        }
        const id = new URL(request.url).searchParams.get("id");
        if (!id) return Response.json({ error: "Falta id" }, { status: 400 });
        const ok = await softDeletePurchase(resolved.access.organizationId, resolved.access.userId, id);
        if (!ok) return Response.json({ error: "No encontrado" }, { status: 404 });
        return Response.json({ ok: true });
      },
    },
  },
});
