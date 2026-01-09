import {
  AnalyticsSummarySchema,
  BreakdownRowSchema
} from "@trading-logger/shared";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { getSummary, groupByMetric } from "../services/analytics.js";
import { parseRecordFilters } from "./utils.js";

export async function registerAnalyticsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/analytics/summary",
    {
      schema: {
        response: {
          200: AnalyticsSummarySchema
        }
      }
    },
    async (req, reply) => {
      const filters = parseRecordFilters(req.query as Record<string, any>);
      const summary = getSummary(filters);
      await reply.send(summary);
    }
  );

  server.get(
    "/analytics/groupBy",
    {
      schema: {
        querystring: z.object({
          by: z.string()
        }),
        response: {
          200: z.array(BreakdownRowSchema)
        }
      }
    },
    async (req, reply) => {
      const filters = parseRecordFilters(req.query as Record<string, any>);
      const by = (req.query as any).by as string;
      const rows = groupByMetric(filters, by);
      await reply.send(rows);
    }
  );
}
