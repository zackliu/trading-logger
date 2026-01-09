import { TagSchema } from "@trading-logger/shared";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { createTag, deleteTag, listTags, updateTag } from "../services/tags.js";

export async function registerTagRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/tags",
    {
      schema: {
        response: {
          200: z.array(TagSchema)
        }
      }
    },
    async (_req, reply) => {
      await reply.send(listTags());
    }
  );

  server.post(
    "/tags",
    {
      schema: {
        body: TagSchema.pick({ name: true, color: true }),
        response: {
          200: TagSchema
        }
      }
    },
    async (req, reply) => {
      const tag = createTag(req.body);
      await reply.send(tag);
    }
  );

  server.put(
    "/tags/:id",
    {
      schema: {
        body: TagSchema.pick({ name: true, color: true }).partial(),
        response: {
          200: TagSchema
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      try {
        const tag = updateTag(id, req.body);
        await reply.send(tag);
      } catch (err: any) {
        reply.code(404);
        await reply.send({ message: err?.message ?? "Not found" } as any);
      }
    }
  );

  server.delete(
    "/tags/:id",
    {
      schema: {
        response: {
          200: z.object({ success: z.boolean() })
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      deleteTag(id);
      await reply.send({ success: true });
    }
  );
}
