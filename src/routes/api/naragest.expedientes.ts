import { createFileRoute } from "@tanstack/react-router";
import { canWrite, resolveNgAccess } from "@/lib/naragest/access.server";
import { createCase, listCases, updateCase } from "@/lib/naragest/repo.server";
import { createCaseSchema, updateCaseSchema } from "@/lib/naragest/schema";

export const Route = createFileRoute("/api/naragest/expedientes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) {
          return Response.json({ error: resolved.error }, { status: resolved.status });
        }
        const clientId = new URL(request.url).searchParams.get("clientId") ?? undefined;
        const rows = await listCases(resolved.access.organizationId, clientId);
        return Response.json({
          data: rows,
          meta: {
            organizationId: resolved.access.organizationId,
            roleId: resolved.access.roleId,
            canWrite: canWrite(resolved.access.roleId),
          },
        });
      },

      POST: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) {
          return Response.json({ error: resolved.error }, { status: resolved.status });
        }
        if (!canWrite(resolved.access.roleId)) {
          return Response.json({ error: "Sin permiso de escritura" }, { status: 403 });
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "JSON inválido" }, { status: 400 });
        }
        const parsed = createCaseSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Validación", details: parsed.error.flatten() }, { status: 422 });
        }
        try {
          const row = await createCase(
            resolved.access.organizationId,
            resolved.access.userId,
            parsed.data,
          );
          return Response.json({ data: row }, { status: 201 });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Error" }, { status: 400 });
        }
      },

      PATCH: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) {
          return Response.json({ error: resolved.error }, { status: resolved.status });
        }
        if (!canWrite(resolved.access.roleId)) {
          return Response.json({ error: "Sin permiso de escritura" }, { status: 403 });
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "JSON inválido" }, { status: 400 });
        }
        const id = (body as { id?: string }).id;
        if (!id) return Response.json({ error: "Falta id" }, { status: 400 });
        const parsed = updateCaseSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Validación", details: parsed.error.flatten() }, { status: 422 });
        }
        const row = await updateCase(
          resolved.access.organizationId,
          resolved.access.userId,
          id,
          parsed.data,
        );
        if (!row) return Response.json({ error: "No encontrado" }, { status: 404 });
        return Response.json({ data: row });
      },
    },
  },
});
