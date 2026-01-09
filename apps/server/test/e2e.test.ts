import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticPlugin from "@fastify/static";
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler
} from "fastify-type-provider-zod";

// Isolate DB/uploads into a temp folder so tests don't affect real data
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trading-logger-test-"));
process.env.DATA_DIR = path.join(tmpDir, "data");

const { runMigrations, uploadsDir } = await import("../src/db/client.js");
const { registerRecordRoutes } = await import("../src/routes/records.js");
const { registerTagRoutes } = await import("../src/routes/tags.js");
const { registerCustomFieldRoutes } = await import(
  "../src/routes/customFields.js"
);
const { registerAttachmentRoutes } = await import(
  "../src/routes/attachments.js"
);

async function buildServer() {
  const server = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  await server.register(cors, { origin: true, credentials: true });
  await server.register(multipart, {
    limits: { fileSize: 2 * 1024 * 1024, files: 1 }
  });
  await server.register(staticPlugin, {
    root: uploadsDir,
    prefix: "/uploads"
  });

  await runMigrations();

  await server.register(
    async (app) => {
      await registerRecordRoutes(app);
      await registerTagRoutes(app);
      await registerCustomFieldRoutes(app);
      await registerAttachmentRoutes(app);
    },
    { prefix: "/api" }
  );

  return server;
}

test("record fields persist with tags, custom field, and attachment", async (t) => {
  const server = await buildServer();
  t.after(async () => {
    await server.close();
  });

  // Create a tag
  const tagRes = await server.inject({
    method: "POST",
    url: "/api/tags",
    payload: { name: "Momentum", color: "#123456" }
  });
  assert.equal(tagRes.statusCode, 200, tagRes.payload);
  const tag = tagRes.json() as { id: number };

  // Create a custom field
  const fieldRes = await server.inject({
    method: "POST",
    url: "/api/custom-fields",
    payload: {
      key: "note",
      label: "Note",
      type: "text",
      isRequired: false
    }
  });
  assert.equal(fieldRes.statusCode, 200, fieldRes.payload);
  const customField = fieldRes.json() as { id: number };

  // Upload an image attachment
  const boundary = "----tl-test-boundary";
  const pngBuffer = Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108020000009077053a0000000b49444154789c6360000002000159930dd00000000049454e44ae426082",
    "hex"
  );
  const multipartBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(
      'Content-Disposition: form-data; name="file"; filename="test.png"\r\n'
    ),
    Buffer.from("Content-Type: image/png\r\n\r\n"),
    pngBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const attachmentRes = await server.inject({
    method: "POST",
    url: "/api/attachments",
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`
    },
    payload: multipartBody
  });
  assert.equal(attachmentRes.statusCode, 200, attachmentRes.payload);
  const attachment = attachmentRes.json() as {
    id: number;
    filePath: string;
    mime: string;
  };

  // Create a record with all fields populated
  const now = new Date().toISOString();
  const recordRes = await server.inject({
    method: "POST",
    url: "/api/records",
    payload: {
      datetime: now,
      symbol: "AAPL",
      accountType: "live",
      result: "breakeven",
      pnl: 123.45,
      riskAmount: 50,
      rMultiple: 2.5,
      complied: true,
      notes: "Filled via e2e test",
      tagIds: [tag.id],
      customValues: [
        { fieldId: customField.id, type: "text", value: "Custom note" }
      ],
      attachmentIds: [attachment.id]
    }
  });
  assert.equal(recordRes.statusCode, 200, recordRes.payload);
  const record = recordRes.json() as { id: number };

  // Read back the record by id and verify fields/relations
  const getRes = await server.inject({
    method: "GET",
    url: `/api/records/${record.id}`
  });
  assert.equal(getRes.statusCode, 200);
  const fetched = getRes.json() as any;
  assert.equal(fetched.symbol, "AAPL");
  assert.equal(fetched.accountType, "live");
  assert.equal(fetched.result, "breakeven");
  assert.equal(fetched.pnl, 123.45);
  assert.equal(fetched.riskAmount, 50);
  assert.equal(fetched.rMultiple, 2.5);
  assert.equal(fetched.complied, true);
  assert.equal(fetched.notes, "Filled via e2e test");
  assert.equal(fetched.tags[0].id, tag.id);
  assert.equal(fetched.attachments[0].filePath, attachment.filePath);
  assert.equal(fetched.customValues[0].value, "Custom note");

  // Filter by tag
  const listRes = await server.inject({
    method: "GET",
    url: `/api/records?tagIds=${tag.id}`
  });
  assert.equal(listRes.statusCode, 200);
  const list = listRes.json() as any;
  assert.equal(list.total, 1);
  assert.equal(list.items[0].id, record.id);

  // Uploaded image can be retrieved from static path
  const fileRes = await server.inject({
    method: "GET",
    url: `/uploads/${attachment.filePath}`
  });
  assert.equal(fileRes.statusCode, 200);
  const fileBuffer = Buffer.isBuffer(fileRes.payload)
    ? (fileRes.payload as Buffer)
    : Buffer.from(fileRes.payload as any);
  assert.ok(fileBuffer.length > 0);
});
