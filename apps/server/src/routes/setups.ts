import { SetupSchema } from "@trading-logger/shared";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createSetup,
  deleteSetup,
  listSetups,
  updateSetup
} from "../services/setups.js";

export async function registerSetupRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/setups",
    {
      schema: {
        response: {
          200: z.array(SetupSchema)
        }
      }
    },
    async (_req, reply) => {
      await reply.send(listSetups());
    }
  );

  server.post(
    "/setups",
    {
      schema: {
        body: z.object({
          name: z.string(),
          sortOrder: z.number().int().optional()
        }),
        response: {
          200: SetupSchema
        }
      }
    },
    async (req, reply) => {
      try {
        const setup = createSetup(req.body);
        await reply.send(setup);
      } catch (err: any) {
        reply.code(400);
        await reply.send({ message: err?.message ?? "Failed to create setup" } as any);
      }
    }
  );

  server.put(
    "/setups/:id",
    {
      schema: {
        body: z
          .object({
            name: z.string().optional(),
            sortOrder: z.number().int().optional()
          })
          .partial(),
        response: {
          200: SetupSchema
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      try {
        const setup = updateSetup(id, req.body);
        await reply.send(setup);
      } catch (err: any) {
        reply.code(400);
        await reply.send({ message: err?.message ?? "Failed to update setup" } as any);
      }
    }
  );

  server.delete(
    "/setups/:id",
    {
      schema: {
        response: {
          200: z.object({ success: z.boolean() })
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      try {
        deleteSetup(id);
        await reply.send({ success: true });
      } catch (err: any) {
        reply.code(400);
        await reply.send({ message: err?.message ?? "Failed to delete setup" } as any);
      }
    }
  );
}
