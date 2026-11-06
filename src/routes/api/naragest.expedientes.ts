import { createFileRoute } from "@tanstack/react-router";
import { createCase, listCases, updateCase } from "@/lib/naragest/repo.server";
import { createCaseSchema, updateCaseSchema } from "@/lib/naragest/schema";

function ctx(request: Request) {
  const organizationId = request.headers.get("x-ng-org-id")?.trim();
  const actorUserId = request.headers.get("x-ng-user-id")?.trim() ?? null;
  if (!organizationId) {
    return { error: Response.json({ error: "Falta organización (x-ng-org-id)." }, { status: 401 }) };
  }
  return { organizationId, actorUserId };
}

export const Route = createFileRoute("/api/naragest/expedientes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const c = ctx(request);
        if ("error" in c) return c.error;
        const clientId = new URL(request.url).searchParams.get("clientId") ?? undefined;
        const rows = await listCases(c.organizationId, clientId);
        return Response.json({ data: rows });
      },

      POST: async ({ request }) => {
        const c = ctx(request);
        if ("error" in c) return c.error;
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
          const row = await createCase(c.organizationId, c.actorUserId, parsed.data);
          return Response.json({ data: row }, { status: 201 });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Error" }, { status: 400 });
        }
      },

      PATCH: async ({ request }) => {
        const c = ctx(request);
        if ("error" in c) return c.error;
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
        const row = await updateCase(c.organizationId, c.actorUserId, id, parsed.data);
        if (!row) return Response.json({ error: "No encontrado" }, { status: 404 });
        return Response.json({ data: row });
      },
    },
  },
});
