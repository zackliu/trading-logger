import {
  AnalyticsSummary,
  BreakdownRow,
  RecordFilters
} from "@trading-logger/shared";
import { sqlite } from "../db/client.js";
import { buildRecordWhereClause, normalizeFilters } from "./filters.js";

const winCase = `CASE WHEN r.result = 'takeProfit' OR r.r_multiple > 0 THEN 1 ELSE 0 END`;
const lossCase = `CASE WHEN r.result = 'stopLoss' OR r.r_multiple < 0 THEN 1 ELSE 0 END`;
const breakevenCase = `CASE WHEN r.result = 'breakeven' OR r.r_multiple = 0 THEN 1 ELSE 0 END`;
const winRCase = `CASE WHEN ${winCase} = 1 THEN r.r_multiple ELSE 0 END`;
const lossRCase = `CASE WHEN ${lossCase} = 1 THEN r.r_multiple ELSE 0 END`;

function calcProfitFactor(sumWinsR: number, sumLossR: number) {
  if (!sumWinsR || !sumLossR) return null;
  const lossesAbs = Math.abs(sumLossR);
  if (lossesAbs === 0) return null;
  return sumWinsR / lossesAbs;
}

export function getSummary(rawFilters: Partial<RecordFilters>): AnalyticsSummary {
  const filters = normalizeFilters(rawFilters);
  const { where, params } = buildRecordWhereClause(filters);
  const row = sqlite
    .prepare(
      `SELECT 
        COUNT(*) as total,
        SUM(${winCase}) as wins,
        SUM(${lossCase}) as losses,
        SUM(${breakevenCase}) as breakeven,
        SUM(${winRCase}) as sumWinsR,
        SUM(${lossRCase}) as sumLossR,
        AVG(r.r_multiple) as avgR,
        AVG(CASE WHEN ${winCase} = 1 THEN r.r_multiple END) as avgWinR,
        AVG(CASE WHEN ${lossCase} = 1 THEN r.r_multiple END) as avgLossR
      FROM records r
      WHERE ${where}`
    )
    .get(...params) as any;

  const totalTrades = row?.total ?? 0;
  const wins = row?.wins ?? 0;
  const losses = row?.losses ?? 0;
  const breakeven = row?.breakeven ?? 0;
  const sumWinsR = row?.sumWinsR ?? 0;
  const sumLossR = row?.sumLossR ?? 0;

  const winRate = totalTrades ? wins / totalTrades : 0;
  const payoffRatio =
    row?.avgWinR && row?.avgLossR ? row.avgWinR / Math.abs(row.avgLossR) : null;
  const profitFactor = calcProfitFactor(sumWinsR, sumLossR);
  const expectancy = row?.avgR ?? null;

  return {
    totalTrades,
    wins,
    losses,
    breakeven,
    winRate,
    profitFactor,
    expectancy,
    avgR: row?.avgR ?? null,
    avgWinR: row?.avgWinR ?? null,
    avgLossR: row?.avgLossR ?? null,
    payoffRatio
  };
}

export function groupByMetric(
  rawFilters: Partial<RecordFilters>,
  by: string
): BreakdownRow[] {
  const filters = normalizeFilters(rawFilters);
  const { where, params } = buildRecordWhereClause(filters);

  let query = "";
  const extraParams: (string | number | boolean)[] = [];

  if (by.startsWith("customField:")) {
    const fieldId = Number(by.split(":")[1]);
    query = `
      SELECT 
        IFNULL(v.value_text, '') as key,
        IFNULL(v.value_text, '') as label,
        COUNT(*) as trades,
        SUM(${winCase}) as wins,
        SUM(${lossCase}) as losses,
        SUM(${breakevenCase}) as breakeven,
        SUM(${winRCase}) as sumWinsR,
        SUM(${lossRCase}) as sumLossR,
        AVG(r.r_multiple) as avgR
      FROM records r
      JOIN record_field_values v ON v.record_id = r.id AND v.field_id = ?
      WHERE ${where}
      GROUP BY v.value_text
      ORDER BY trades DESC
    `;
    extraParams.push(fieldId);
  } else if (by === "tag") {
    query = `
      SELECT 
        t.id as key,
        t.name as label,
        COUNT(*) as trades,
        SUM(${winCase}) as wins,
        SUM(${lossCase}) as losses,
        SUM(${breakevenCase}) as breakeven,
        SUM(${winRCase}) as sumWinsR,
        SUM(${lossRCase}) as sumLossR,
        AVG(r.r_multiple) as avgR
      FROM records r
      JOIN record_tags rt ON rt.record_id = r.id
      JOIN tags t ON t.id = rt.tag_id
      WHERE ${where}
      GROUP BY t.id, t.name
      ORDER BY trades DESC
    `;
  } else if (by === "symbol") {
    query = `
      SELECT 
        r.symbol as key,
        r.symbol as label,
        COUNT(*) as trades,
        SUM(${winCase}) as wins,
        SUM(${lossCase}) as losses,
        SUM(${breakevenCase}) as breakeven,
        SUM(${winRCase}) as sumWinsR,
        SUM(${lossRCase}) as sumLossR,
        AVG(r.r_multiple) as avgR
      FROM records r
      WHERE ${where}
      GROUP BY r.symbol
      ORDER BY trades DESC
    `;
  } else if (by === "setup") {
    query = `
      SELECT 
        s.id as key,
        s.name as label,
        COUNT(*) as trades,
        SUM(${winCase}) as wins,
        SUM(${lossCase}) as losses,
        SUM(${breakevenCase}) as breakeven,
        SUM(${winRCase}) as sumWinsR,
        SUM(${lossRCase}) as sumLossR,
        AVG(r.r_multiple) as avgR
      FROM records r
      JOIN setups s ON s.id = r.setup_id
      WHERE ${where}
      GROUP BY s.id, s.name
      ORDER BY trades DESC
    `;
  } else if (by === "complied") {
    query = `
      SELECT 
        r.complied as key,
        CASE WHEN r.complied = 1 THEN 'Complied' ELSE 'Not complied' END as label,
        COUNT(*) as trades,
        SUM(${winCase}) as wins,
        SUM(${lossCase}) as losses,
        SUM(${breakevenCase}) as breakeven,
        SUM(${winRCase}) as sumWinsR,
        SUM(${lossRCase}) as sumLossR,
        AVG(r.r_multiple) as avgR
      FROM records r
      WHERE ${where}
      GROUP BY r.complied
      ORDER BY trades DESC
    `;
  } else if (by === "accountType") {
    query = `
      SELECT 
        r.account_type as key,
        r.account_type as label,
        COUNT(*) as trades,
        SUM(${winCase}) as wins,
        SUM(${lossCase}) as losses,
        SUM(${breakevenCase}) as breakeven,
        SUM(${winRCase}) as sumWinsR,
        SUM(${lossRCase}) as sumLossR,
        AVG(r.r_multiple) as avgR
      FROM records r
      WHERE ${where}
      GROUP BY r.account_type
      ORDER BY trades DESC
    `;
  } else if (by === "result") {
    query = `
      SELECT 
        r.result as key,
        r.result as label,
        COUNT(*) as trades,
        SUM(${winCase}) as wins,
        SUM(${lossCase}) as losses,
        SUM(${breakevenCase}) as breakeven,
        SUM(${winRCase}) as sumWinsR,
        SUM(${lossRCase}) as sumLossR,
        AVG(r.r_multiple) as avgR
      FROM records r
      WHERE ${where}
      GROUP BY r.result
      ORDER BY trades DESC
    `;
  } else {
    return [];
  }

  const rows = sqlite.prepare(query).all(...extraParams, ...params) as any[];
  return rows.map((row) => {
    const winRate = row.trades ? (row.wins ?? 0) / row.trades : null;
    const profitFactor = calcProfitFactor(row.sumWinsR ?? 0, row.sumLossR ?? 0);
    const expectancy = row.avgR ?? null;
    return {
      key: String(row.key),
      label: row.label ?? String(row.key),
      trades: row.trades ?? 0,
      wins: row.wins ?? 0,
      losses: row.losses ?? 0,
      breakeven: row.breakeven ?? 0,
      winRate,
      profitFactor,
      expectancy
    };
  });
}
