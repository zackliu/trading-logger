import { AttachmentSchema } from "@trading-logger/shared";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import { pipeline } from "stream/promises";
import { uploadsDir, sqlite } from "../db/client.js";

const allowedMime = ["image/png", "image/jpeg", "image/webp"];

export async function registerAttachmentRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/attachments",
    {
      schema: {
        response: {
          200: AttachmentSchema
        }
      }
    },
    async (req, reply) => {
      const data = await req.file();
      if (!data) {
        await reply.code(400).send({ message: "File required" } as any);
        return;
      }
      if (!allowedMime.includes(data.mimetype)) {
        await reply
          .code(400)
          .send({ message: "Only png/jpg/webp are supported" } as any);
        return;
      }
      const ext = mime.extension(data.mimetype) || "bin";
      const filename = `${Date.now()}-${nanoid()}.${ext}`;
      const filepath = path.join(uploadsDir, filename);
      await pipeline(data.file, fs.createWriteStream(filepath));
      const stats = fs.statSync(filepath);
      const recordField = (data.fields as Record<string, any>).recordId as
        | { value: string }
        | undefined;
      const recordId =
        recordField && "value" in recordField && recordField.value
          ? Number(recordField.value)
          : null;

      const info = sqlite
        .prepare(
          `INSERT INTO attachments (record_id, file_path, mime, size_bytes, created_at) VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          recordId ?? null,
          filename,
          data.mimetype,
          stats.size,
          new Date().toISOString()
        );
      const id = Number(info.lastInsertRowid);
      await reply.send({
        id,
        recordId: recordId ?? undefined,
        filePath: filename,
        mime: data.mimetype,
        sizeBytes: stats.size,
        createdAt: new Date().toISOString()
      });
    }
  );

  server.get(
    "/attachments/:id",
    {
      schema: {
        response: {
          200: AttachmentSchema
        }
      }
    },
    async (req, reply) => {
      const id = Number((req.params as any).id);
      const row = sqlite
        .prepare(`SELECT * FROM attachments WHERE id = ?`)
        .get(id) as any;
      if (!row) {
        await reply.code(404).send({ message: "Not found" } as any);
        return;
      }
      await reply.send({
        id: row.id,
        recordId: row.record_id ?? undefined,
        filePath: row.file_path,
        mime: row.mime,
        width: row.width ?? undefined,
        height: row.height ?? undefined,
        sizeBytes: row.size_bytes ?? undefined,
        createdAt: row.created_at
      });
    }
  );
}
