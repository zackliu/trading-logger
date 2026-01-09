import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticPlugin from "@fastify/static";
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler
} from "fastify-type-provider-zod";
import { runMigrations, uploadsDir } from "./db/client.js";
import { registerRecordRoutes } from "./routes/records.js";
import { registerTagRoutes } from "./routes/tags.js";
import { registerCustomFieldRoutes } from "./routes/customFields.js";
import { registerAttachmentRoutes } from "./routes/attachments.js";
import { registerAnalyticsRoutes } from "./routes/analytics.js";

async function main() {
  const server = Fastify({
    logger: true
  }).withTypeProvider<ZodTypeProvider>();

  // Use Zod schemas for validation/serialization
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  await server.register(cors, {
    origin: true,
    credentials: true
  });

  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1
    }
  });

  await server.register(staticPlugin, {
    root: uploadsDir,
    prefix: "/uploads"
  });

  await runMigrations();

  server.get("/api/health", async () => ({ status: "ok" }));

  await server.register(
    async (app) => {
      await registerRecordRoutes(app);
      await registerTagRoutes(app);
      await registerCustomFieldRoutes(app);
      await registerAttachmentRoutes(app);
      await registerAnalyticsRoutes(app);
    },
    { prefix: "/api" }
  );

  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? "0.0.0.0";
  await server.listen({ port, host });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
