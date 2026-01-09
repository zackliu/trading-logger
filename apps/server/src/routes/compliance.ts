import {
  ComplianceCheckSchema,
  ComplianceOptionSchema,
  ComplianceCheckTypeEnum
} from "@trading-logger/shared";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createComplianceCheck,
  deleteComplianceCheck,
  listComplianceChecks,
  updateComplianceCheck
} from "../services/compliance.js";

const CheckInputSchema = ComplianceCheckSchema.pick({
  label: true,
  type: true
}).extend({
  options: z
    .array(ComplianceOptionSchema.omit({ id: true, checkId: true }))
    .optional()
});

export async function registerComplianceRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/compliance-checks",
    {
      schema: {
        response: {
          200: z.array(ComplianceCheckSchema)
        }
      }
    },
    async (_req, reply) => {
      await reply.send(listComplianceChecks());
    }
  );

  server.post(
    "/compliance-checks",
    {
      schema: {
        body: CheckInputSchema,
        response: {
          200: ComplianceCheckSchema
        }
      }
    },
    async (req, reply) => {
      const created = createComplianceCheck(req.body);
      await reply.send(created);
    }
  );

  server.put(
    "/compliance-checks/:id",
    {
      schema: {
        body: CheckInputSchema.partial().extend({
          type: ComplianceCheckTypeEnum.optional()
        }),
        response: {
          200: z.object({ success: z.boolean() })
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      try {
        await updateComplianceCheck(id, req.body);
        await reply.send({ success: true });
      } catch (err: any) {
        reply.code(404);
        await reply.send({ message: err?.message ?? "Not found" } as any);
      }
    }
  );

  server.delete(
    "/compliance-checks/:id",
    {
      schema: {
        response: {
          200: z.object({ success: z.boolean() })
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      deleteComplianceCheck(id);
      await reply.send({ success: true });
    }
  );
}
