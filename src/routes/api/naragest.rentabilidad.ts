import { createFileRoute } from "@tanstack/react-router";
import { canWrite, canDelete, resolveNgAccess } from "@/lib/naragest/access.server";
import {
  createMarginLine,
  listMarginLines,
  softDeleteMarginLine,
} from "@/lib/naragest/commerce.server";

export const Route = createFileRoute("/api/naragest/rentabilidad")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status });
        const data = await listMarginLines(resolved.access.organizationId);
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
          productName?: string;
          category?: string;
          units?: number;
          pvp?: number;
          unitCost?: number;
        };
        if (!body.productName?.trim() || body.pvp == null) {
          return Response.json({ error: "Faltan productName o pvp" }, { status: 400 });
        }
        const row = await createMarginLine(resolved.access.organizationId, resolved.access.userId, {
          productName: body.productName.trim(),
          category: body.category?.trim() || "Otros",
          units: Math.max(1, body.units ?? 1),
          pvp: Number(body.pvp),
          unitCost: Number(body.unitCost ?? 0),
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
        const ok = await softDeleteMarginLine(
          resolved.access.organizationId,
          resolved.access.userId,
          id,
        );
        if (!ok) return Response.json({ error: "No encontrado" }, { status: 404 });
        return Response.json({ ok: true });
      },
    },
  },
});
