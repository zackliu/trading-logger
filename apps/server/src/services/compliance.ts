import {
  ComplianceCheck,
  ComplianceOption,
  ComplianceCheckType
} from "@trading-logger/shared";
import { sqlite } from "../db/client.js";

export function listComplianceChecks(): ComplianceCheck[] {
  const checks = sqlite
    .prepare(`SELECT * FROM compliance_checks ORDER BY created_at ASC`)
    .all() as any[];
  const ids = checks.map((c) => c.id);
  const options = ids.length
    ? (sqlite
        .prepare(
          `SELECT * FROM compliance_check_options WHERE check_id IN (${new Array(
            ids.length
          )
            .fill("?")
            .join(", ")}) ORDER BY sort_order ASC`
        )
        .all(...ids) as any[])
    : [];
  const optionMap = new Map<number, ComplianceOption[]>();
  for (const opt of options) {
    const arr = optionMap.get(opt.check_id) ?? [];
    optionMap.set(opt.check_id, arr);
    arr.push({
      id: opt.id,
      checkId: opt.check_id,
      label: opt.label,
      sortOrder: opt.sort_order ?? undefined
    });
  }
  return checks.map((c) => ({
    id: c.id,
    label: c.label,
    type: c.type as ComplianceCheckType,
    createdAt: c.created_at,
    options: optionMap.get(c.id)
  }));
}

export function createComplianceCheck(input: {
  label: string;
  type: ComplianceCheckType;
  options?: ComplianceOption[];
}): ComplianceCheck {
  const info = sqlite
    .prepare(
      `INSERT INTO compliance_checks (label, type, created_at) VALUES (?, ?, ?)`
    )
    .run(input.label, input.type, new Date().toISOString());
  const checkId = Number(info.lastInsertRowid);
  if (input.type === "setup" && input.options?.length) {
    const stmt = sqlite.prepare(
      `INSERT INTO compliance_check_options (check_id, label, sort_order) VALUES (?, ?, ?)`
    );
    input.options.forEach((opt, idx) => {
      stmt.run(checkId, opt.label, opt.sortOrder ?? idx);
    });
  }
  return {
    id: checkId,
    label: input.label,
    type: input.type,
    options: input.options
  };
}

export function updateComplianceCheck(
  id: number,
  input: Partial<{
    label: string;
    type: ComplianceCheckType;
    options: ComplianceOption[];
  }>
) {
  const current = sqlite
    .prepare(`SELECT * FROM compliance_checks WHERE id = ? LIMIT 1`)
    .get(id) as any;
  if (!current) throw new Error("Compliance check not found");
  const nextType = input.type ?? current.type;
  sqlite
    .prepare(`UPDATE compliance_checks SET label = ?, type = ? WHERE id = ?`)
    .run(input.label ?? current.label, nextType, id);
  if (nextType === "setup") {
    sqlite
      .prepare(`DELETE FROM compliance_check_options WHERE check_id = ?`)
      .run(id);
    const opts = input.options ?? [];
    const stmt = sqlite.prepare(
      `INSERT INTO compliance_check_options (check_id, label, sort_order) VALUES (?, ?, ?)`
    );
    opts.forEach((opt, idx) => {
      stmt.run(id, opt.label, opt.sortOrder ?? idx);
    });
  } else {
    sqlite
      .prepare(`DELETE FROM compliance_check_options WHERE check_id = ?`)
      .run(id);
  }
}

export function deleteComplianceCheck(id: number) {
  sqlite.prepare(`DELETE FROM compliance_checks WHERE id = ?`).run(id);
}
