import {
  CustomFieldOptionSchema,
  CustomFieldSchema,
  CustomFieldTypeEnum
} from "@trading-logger/shared";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createCustomField,
  deleteCustomField,
  listCustomFields,
  updateCustomField
} from "../services/customFields.js";

const FieldInputSchema = CustomFieldSchema.pick({
  key: true,
  label: true,
  type: true,
  isRequired: true
}).extend({
  options: z.array(CustomFieldOptionSchema.omit({ id: true, fieldId: true })).optional()
});

export async function registerCustomFieldRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/custom-fields",
    {
      schema: {
        response: {
          200: z.array(CustomFieldSchema)
        }
      }
    },
    async (_req, reply) => {
      await reply.send(listCustomFields());
    }
  );

  server.post(
    "/custom-fields",
    {
      schema: {
        body: FieldInputSchema,
        response: {
          200: CustomFieldSchema
        }
      }
    },
    async (req, reply) => {
      const field = createCustomField(req.body);
      await reply.send(field);
    }
  );

  server.put(
    "/custom-fields/:id",
    {
      schema: {
        body: FieldInputSchema.partial().extend({
          type: CustomFieldTypeEnum.optional()
        }),
        response: {
          200: z.object({ success: z.boolean() })
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      try {
        updateCustomField(id, req.body);
        await reply.send({ success: true });
      } catch (err: any) {
        reply.code(404);
        await reply.send({ message: err?.message ?? "Not found" } as any);
      }
    }
  );

  server.delete(
    "/custom-fields/:id",
    {
      schema: {
        response: {
          200: z.object({ success: z.boolean() })
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      deleteCustomField(id);
      await reply.send({ success: true });
    }
  );
}
