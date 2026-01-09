import {
  AnalyticsSummary,
  BreakdownRow,
  RecordFilters
} from "@trading-logger/shared";
import { sqlite } from "../db/client.js";
import { buildRecordWhereClause, normalizeFilters } from "./filters.js";

function calcProfitFactor(sumWins: number, sumLosses: number) {
  if (!sumWins || !sumLosses) return null;
  const lossesAbs = Math.abs(sumLosses);
  if (lossesAbs === 0) return null;
  return sumWins / lossesAbs;
}

export function getSummary(rawFilters: Partial<RecordFilters>): AnalyticsSummary {
  const filters = normalizeFilters(rawFilters);
  const { where, params } = buildRecordWhereClause(filters);
  const row = sqlite
    .prepare(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN r.pnl > 0 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN r.pnl < 0 THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN r.pnl = 0 THEN 1 ELSE 0 END) as breakeven,
        AVG(CASE WHEN r.pnl > 0 THEN r.pnl END) as avgWin,
        AVG(CASE WHEN r.pnl < 0 THEN r.pnl END) as avgLoss,
        SUM(CASE WHEN r.pnl > 0 THEN r.pnl ELSE 0 END) as sumWins,
        SUM(CASE WHEN r.pnl < 0 THEN r.pnl ELSE 0 END) as sumLosses,
        AVG(r.pnl) as avgPnl,
        AVG(r.r_multiple) as avgR,
        AVG(CASE WHEN r.pnl > 0 THEN r.r_multiple END) as avgWinR,
        AVG(CASE WHEN r.pnl < 0 THEN r.r_multiple END) as avgLossR
      FROM records r
      WHERE ${where}`
    )
    .get(...params) as any;

  const totalTrades = row?.total ?? 0;
  const wins = row?.wins ?? 0;
  const losses = row?.losses ?? 0;
  const breakeven = row?.breakeven ?? 0;
  const sumWins = row?.sumWins ?? 0;
  const sumLosses = row?.sumLosses ?? 0;

  const winRate = totalTrades ? wins / totalTrades : 0;
  const payoffRatio =
    row?.avgWin && row?.avgLoss ? row.avgWin / Math.abs(row.avgLoss) : null;

  return {
    totalTrades,
    wins,
    losses,
    breakeven,
    winRate,
    avgWin: row?.avgWin ?? null,
    avgLoss: row?.avgLoss ?? null,
    profitFactor: calcProfitFactor(sumWins, sumLosses),
    expectancy: row?.avgPnl ?? null,
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
        SUM(CASE WHEN r.pnl > 0 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN r.pnl < 0 THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN r.pnl = 0 THEN 1 ELSE 0 END) as breakeven,
        AVG(r.pnl) as avgPnl,
        SUM(CASE WHEN r.pnl > 0 THEN r.pnl ELSE 0 END) as sumWins,
        SUM(CASE WHEN r.pnl < 0 THEN r.pnl ELSE 0 END) as sumLosses
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
        SUM(CASE WHEN r.pnl > 0 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN r.pnl < 0 THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN r.pnl = 0 THEN 1 ELSE 0 END) as breakeven,
        AVG(r.pnl) as avgPnl,
        SUM(CASE WHEN r.pnl > 0 THEN r.pnl ELSE 0 END) as sumWins,
        SUM(CASE WHEN r.pnl < 0 THEN r.pnl ELSE 0 END) as sumLosses
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
        SUM(CASE WHEN r.pnl > 0 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN r.pnl < 0 THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN r.pnl = 0 THEN 1 ELSE 0 END) as breakeven,
        AVG(r.pnl) as avgPnl,
        SUM(CASE WHEN r.pnl > 0 THEN r.pnl ELSE 0 END) as sumWins,
        SUM(CASE WHEN r.pnl < 0 THEN r.pnl ELSE 0 END) as sumLosses
      FROM records r
      WHERE ${where}
      GROUP BY r.symbol
      ORDER BY trades DESC
    `;
  } else if (by === "complied") {
    query = `
      SELECT 
        r.complied as key,
        CASE WHEN r.complied = 1 THEN 'Complied' ELSE 'Not complied' END as label,
        COUNT(*) as trades,
        SUM(CASE WHEN r.pnl > 0 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN r.pnl < 0 THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN r.pnl = 0 THEN 1 ELSE 0 END) as breakeven,
        AVG(r.pnl) as avgPnl,
        SUM(CASE WHEN r.pnl > 0 THEN r.pnl ELSE 0 END) as sumWins,
        SUM(CASE WHEN r.pnl < 0 THEN r.pnl ELSE 0 END) as sumLosses
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
        SUM(CASE WHEN r.pnl > 0 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN r.pnl < 0 THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN r.pnl = 0 THEN 1 ELSE 0 END) as breakeven,
        AVG(r.pnl) as avgPnl,
        SUM(CASE WHEN r.pnl > 0 THEN r.pnl ELSE 0 END) as sumWins,
        SUM(CASE WHEN r.pnl < 0 THEN r.pnl ELSE 0 END) as sumLosses
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
        SUM(CASE WHEN r.pnl > 0 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN r.pnl < 0 THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN r.pnl = 0 THEN 1 ELSE 0 END) as breakeven,
        AVG(r.pnl) as avgPnl,
        SUM(CASE WHEN r.pnl > 0 THEN r.pnl ELSE 0 END) as sumWins,
        SUM(CASE WHEN r.pnl < 0 THEN r.pnl ELSE 0 END) as sumLosses
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
    const profitFactor = calcProfitFactor(row.sumWins ?? 0, row.sumLosses ?? 0);
    const winRate = row.trades ? (row.wins ?? 0) / row.trades : null;
    const expectancy = row.avgPnl ?? null;
    return {
      key: String(row.key),
      label: row.label ?? String(row.key),
      trades: row.trades ?? 0,
      wins: row.wins ?? 0,
      losses: row.losses ?? 0,
      breakeven: row.breakeven ?? 0,
      winRate,
      avgPnl: row.avgPnl ?? null,
      profitFactor,
      expectancy
    };
  });
}
