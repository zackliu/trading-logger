import dayjs from "dayjs";
import { sqlite, runMigrations } from "./db/client.js";

async function seed() {
  await runMigrations();
  const tags = [
    { name: "Momentum", color: "#4F46E5" },
    { name: "Reversal", color: "#F59E0B" },
    { name: "Breakout", color: "#10B981" }
  ];

  for (const tag of tags) {
    const exists = sqlite
      .prepare(`SELECT id FROM tags WHERE name = ? LIMIT 1`)
      .get(tag.name);
    if (!exists) {
      sqlite
        .prepare(`INSERT INTO tags (name, color, created_at) VALUES (?, ?, ?)`)
        .run(tag.name, tag.color, dayjs().toISOString());
    }
  }

  const customFields = [
    {
      key: "timeframe",
      label: "Timeframe",
      type: "singleSelect",
      options: [
        { value: "M5", label: "M5" },
        { value: "M15", label: "M15" },
        { value: "H1", label: "H1" }
      ]
    },
    {
      key: "regime",
      label: "Market Regime",
      type: "text"
    }
  ];

  for (const field of customFields) {
    const exists = sqlite
      .prepare(`SELECT id FROM custom_fields WHERE key = ? LIMIT 1`)
      .get(field.key) as any;
    if (!exists) {
      const info = sqlite
        .prepare(
          `INSERT INTO custom_fields (key, label, type, is_required, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
          field.key,
          field.label,
          field.type,
          0,
          dayjs().toISOString(),
          dayjs().toISOString()
        );
      const fieldId = Number(info.lastInsertRowid);
      if (field.options) {
        const stmt = sqlite.prepare(
          `INSERT INTO custom_field_options (field_id, value, label, sort_order) VALUES (?, ?, ?, ?)`
        );
        field.options.forEach((opt, idx) => {
          stmt.run(fieldId, opt.value, opt.label, idx);
        });
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log("Seed data inserted");
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
