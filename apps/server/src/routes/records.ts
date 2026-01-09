import {
  PaginatedRecordsSchema,
  RecordInputSchema,
  RecordUpdateSchema,
  RecordWithRelationsSchema
} from "@trading-logger/shared";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  bulkDelete,
  bulkUpdateTags,
  createRecord,
  getRecordById,
  listRecords,
  updateRecord
} from "../services/records.js";
import { parseRecordFilters } from "./utils.js";
import { CustomFieldFilterSchema } from "@trading-logger/shared";

export async function registerRecordRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/records",
    {
      schema: {
        response: {
          200: PaginatedRecordsSchema
        }
      }
    },
    async (req, reply) => {
      const filters = parseRecordFilters(req.query as Record<string, any>);
      if (filters.customFieldFilters) {
        const parsed = CustomFieldFilterSchema.array().safeParse(
          filters.customFieldFilters
        );
        filters.customFieldFilters = parsed.success ? parsed.data : undefined;
      }
      const data = listRecords(filters);
      await reply.send(data);
    }
  );

  server.get(
    "/records/:id",
    {
      schema: {
        response: {
          200: RecordWithRelationsSchema
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      const record = getRecordById(id);
      if (!record) {
        reply.code(404);
        await reply.send({ message: "Record not found" } as any);
        return;
      }
      await reply.send(record);
    }
  );

  server.post(
    "/records",
    {
      schema: {
        body: RecordInputSchema,
        response: {
          200: RecordWithRelationsSchema
        }
      }
    },
    async (req, reply) => {
      const record = createRecord(req.body);
      await reply.send(record);
    }
  );

  server.put(
    "/records/:id",
    {
      schema: {
        body: RecordUpdateSchema.partial(),
        response: {
          200: RecordWithRelationsSchema
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      try {
        const record = updateRecord(id, { ...req.body, id });
        await reply.send(record);
      } catch (err: any) {
        reply.code(404);
        await reply.send({ message: err?.message ?? "Record not found" } as any);
      }
    }
  );

  server.delete(
    "/records/:id",
    {
      schema: {
        response: {
          200: z.object({ success: z.boolean() })
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      bulkDelete([id]);
      await reply.send({ success: true });
    }
  );

  server.post(
    "/records/bulk/delete",
    {
      schema: {
        body: z.object({
          ids: z.array(z.number().int()).min(1)
        }),
        response: {
          200: z.object({ success: z.boolean() })
        }
      }
    },
    async (req, reply) => {
      bulkDelete(req.body.ids);
      await reply.send({ success: true });
    }
  );

  server.post(
    "/records/bulk/tags",
    {
      schema: {
        body: z.object({
          ids: z.array(z.number().int()).min(1),
          tagIds: z.array(z.number().int()).default([])
        }),
        response: {
          200: z.object({ success: z.boolean() })
        }
      }
    },
    async (req, reply) => {
      bulkUpdateTags(req.body.ids, req.body.tagIds);
      await reply.send({ success: true });
    }
  );
}
