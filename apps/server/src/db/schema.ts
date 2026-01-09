import {
  integer,
  real,
  sqliteTable,
  text
} from "drizzle-orm/sqlite-core";

export const records = sqliteTable("records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  datetime: text("datetime").notNull(),
  symbol: text("symbol").notNull(),
  accountType: text("account_type").notNull(),
  result: text("result").notNull(),
  rMultiple: real("r_multiple"),
  entryEmotion: text("entry_emotion"),
  exitEmotion: text("exit_emotion"),
  complied: integer("complied", { mode: "boolean" }).notNull().default(false),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP")
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  color: text("color"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
});

export const recordTags = sqliteTable("record_tags", {
  recordId: integer("record_id")
    .notNull()
    .references(() => records.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" })
});

export const attachments = sqliteTable("attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recordId: integer("record_id").references(() => records.id, {
    onDelete: "cascade"
  }),
  filePath: text("file_path").notNull(),
  mime: text("mime").notNull(),
  width: integer("width"),
  height: integer("height"),
  sizeBytes: integer("size_bytes"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
});

export const customFields = sqliteTable("custom_fields", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull(),
  isRequired: integer("is_required", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP")
});

export const customFieldOptions = sqliteTable("custom_field_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fieldId: integer("field_id")
    .notNull()
    .references(() => customFields.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order")
});

export const recordFieldValues = sqliteTable("record_field_values", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recordId: integer("record_id")
    .notNull()
    .references(() => records.id, { onDelete: "cascade" }),
  fieldId: integer("field_id")
    .notNull()
    .references(() => customFields.id, { onDelete: "cascade" }),
  valueText: text("value_text"),
  valueNumber: real("value_number"),
  valueBool: integer("value_bool", { mode: "boolean" }),
  valueDate: text("value_date"),
  valueDatetime: text("value_datetime"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP")
});

export const complianceChecks = sqliteTable("compliance_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  type: text("type").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
});

export const complianceCheckOptions = sqliteTable("compliance_check_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  checkId: integer("check_id")
    .notNull()
    .references(() => complianceChecks.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").default(0)
});

export const recordCompliance = sqliteTable("record_compliance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recordId: integer("record_id")
    .notNull()
    .references(() => records.id, { onDelete: "cascade" }),
  checkId: integer("check_id")
    .notNull()
    .references(() => complianceChecks.id, { onDelete: "cascade" }),
  isChecked: integer("is_checked", { mode: "boolean" }),
  optionId: integer("option_id").references(() => complianceCheckOptions.id, {
    onDelete: "set null"
  })
});
