import { z } from "zod";

// Enums
export const AccountTypeEnum = z.enum(["live", "sim"]);
export type AccountType = z.infer<typeof AccountTypeEnum>;

export const ResultTypeEnum = z.enum([
  "takeProfit",
  "stopLoss",
  "breakeven",
  "manualExit"
]);
export type ResultType = z.infer<typeof ResultTypeEnum>;

export const CustomFieldTypeEnum = z.enum([
  "text",
  "number",
  "boolean",
  "singleSelect",
  "multiSelect",
  "date",
  "datetime"
]);
export type CustomFieldType = z.infer<typeof CustomFieldTypeEnum>;

// Base schemas
export const ComplianceCheckTypeEnum = z.enum(["checkbox", "setup"]);
export type ComplianceCheckType = z.infer<typeof ComplianceCheckTypeEnum>;

export const ComplianceOptionSchema = z.object({
  id: z.number().int().positive().optional(),
  checkId: z.number().int().positive().optional(),
  label: z.string(),
  sortOrder: z.number().int().optional()
});
export type ComplianceOption = z.infer<typeof ComplianceOptionSchema>;

export const ComplianceCheckSchema = z.object({
  id: z.number().int().positive().optional(),
  label: z.string().min(1),
  type: ComplianceCheckTypeEnum,
  options: z.array(ComplianceOptionSchema).optional(),
  createdAt: z.string().datetime().optional()
});
export type ComplianceCheck = z.infer<typeof ComplianceCheckSchema>;

export const EmotionEnum = z.enum([
  "fear",
  "greed",
  "anger",
  "overconfidence",
  "regret",
  "hope",
  "boredom",
  "fatigue",
  "confusion",
  "calm"
]);
export type Emotion = z.infer<typeof EmotionEnum>;

export const TagSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1),
  color: z.string().optional(),
  createdAt: z.string().datetime().optional()
});
export type Tag = z.infer<typeof TagSchema>;

export const AttachmentSchema = z.object({
  id: z.number().int().positive().optional(),
  recordId: z.number().int().positive().optional(),
  filePath: z.string(),
  mime: z.string(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  sizeBytes: z.number().int().optional(),
  createdAt: z.string().datetime().optional()
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const SetupSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1),
  sortOrder: z.number().int().optional(),
  createdAt: z.string().datetime().optional()
});
export type Setup = z.infer<typeof SetupSchema>;

export const ComplianceSelectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("checkbox"),
    checkId: z.number().int().positive(),
    checked: z.boolean().default(false)
  }),
  z.object({
    type: z.literal("setup"),
    checkId: z.number().int().positive(),
    optionId: z.number().int().positive().nullable().default(null)
  })
]);
export type ComplianceSelection = z.infer<typeof ComplianceSelectionSchema>;

export const CustomFieldOptionSchema = z.object({
  id: z.number().int().positive().optional(),
  fieldId: z.number().int().positive().optional(),
  value: z.string(),
  label: z.string(),
  sortOrder: z.number().int().optional()
});
export type CustomFieldOption = z.infer<typeof CustomFieldOptionSchema>;

export const CustomFieldSchema = z.object({
  id: z.number().int().positive().optional(),
  key: z.string().min(1),
  label: z.string().min(1),
  type: CustomFieldTypeEnum,
  isRequired: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  options: z.array(CustomFieldOptionSchema).optional()
});
export type CustomField = z.infer<typeof CustomFieldSchema>;

// Custom field values for records
const BaseValue = z.object({
  id: z.number().int().positive().optional(),
  fieldId: z.number().int().positive()
});

export const CustomFieldValueSchema = z.discriminatedUnion("type", [
  BaseValue.extend({
    type: z.literal("text"),
    value: z.string()
  }),
  BaseValue.extend({
    type: z.literal("number"),
    value: z.number()
  }),
  BaseValue.extend({
    type: z.literal("boolean"),
    value: z.boolean()
  }),
  BaseValue.extend({
    type: z.literal("singleSelect"),
    value: z.string()
  }),
  BaseValue.extend({
    type: z.literal("multiSelect"),
    values: z.array(z.string())
  }),
  BaseValue.extend({
    type: z.literal("date"),
    value: z.string().date()
  }),
  BaseValue.extend({
    type: z.literal("datetime"),
    value: z.string().datetime()
  })
]);
export type CustomFieldValue = z.infer<typeof CustomFieldValueSchema>;

// Record schemas
export const RecordBaseSchema = z.object({
  id: z.number().int().positive().optional(),
  datetime: z.string().datetime(),
  symbol: z.string().min(1),
  setupId: z.number().int().positive(),
  accountType: AccountTypeEnum,
  result: ResultTypeEnum,
  rMultiple: z.number().nullable().optional(),
  entryEmotion: EmotionEnum.optional(),
  exitEmotion: EmotionEnum.optional(),
  complied: z.boolean(),
  notes: z.string().default(""),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});
export type RecordBase = z.infer<typeof RecordBaseSchema>;

export const RecordInputSchema = RecordBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rMultiple: true
}).extend({
  rMultiple: z.number().nullable().default(null),
  tagIds: z.array(z.number().int()).default([]),
  setupId: z.number().int().positive().default(1),
  customValues: z.array(CustomFieldValueSchema).default([]),
  attachmentIds: z.array(z.number().int()).default([]),
  entryEmotion: EmotionEnum.optional(),
  exitEmotion: EmotionEnum.optional(),
  complianceSelections: z.array(ComplianceSelectionSchema).default([])
});
export type RecordInput = z.infer<typeof RecordInputSchema>;

export const RecordUpdateSchema = RecordInputSchema.partial().extend({
  id: z.number().int().positive()
});
export type RecordUpdate = z.infer<typeof RecordUpdateSchema>;

export const RecordWithRelationsSchema = RecordBaseSchema.extend({
  setup: SetupSchema,
  tags: z.array(TagSchema),
  attachments: z.array(AttachmentSchema),
  customValues: z.array(CustomFieldValueSchema),
  complianceSelections: z.array(ComplianceSelectionSchema)
});
export type RecordWithRelations = z.infer<typeof RecordWithRelationsSchema>;

// Filters and analytics
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(20)
});

export const DateRangeSchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional()
});

const CustomFieldFilterBase = z.object({
  fieldId: z.number().int().positive()
});

export const CustomFieldFilterSchema = z.discriminatedUnion("type", [
  CustomFieldFilterBase.extend({
    type: z.literal("text"),
    value: z.string()
  }),
  CustomFieldFilterBase.extend({
    type: z.literal("number"),
    min: z.number().optional(),
    max: z.number().optional()
  }),
  CustomFieldFilterBase.extend({
    type: z.literal("boolean"),
    value: z.boolean()
  }),
  CustomFieldFilterBase.extend({
    type: z.literal("singleSelect"),
    values: z.array(z.string())
  }),
  CustomFieldFilterBase.extend({
    type: z.literal("multiSelect"),
    values: z.array(z.string())
  }),
  CustomFieldFilterBase.extend({
    type: z.literal("date"),
    start: z.string().date().optional(),
    end: z.string().date().optional()
  }),
  CustomFieldFilterBase.extend({
    type: z.literal("datetime"),
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional()
  })
]);
export type CustomFieldFilter = z.infer<typeof CustomFieldFilterSchema>;

export const RecordFilterSchema = DateRangeSchema.extend({
  symbols: z.array(z.string()).optional(),
  tagIds: z.array(z.number().int()).optional(),
  setupIds: z.array(z.number().int()).optional(),
  complied: z.boolean().optional(),
  accountTypes: z.array(AccountTypeEnum).optional(),
  results: z.array(ResultTypeEnum).optional(),
  entryEmotion: z.array(EmotionEnum).optional(),
  exitEmotion: z.array(EmotionEnum).optional(),
  customFieldFilters: z.array(CustomFieldFilterSchema).optional()
}).merge(PaginationSchema.partial());
export type RecordFilters = z.infer<typeof RecordFilterSchema>;

export const GroupByEnum = z.enum([
  "tag",
  "setup",
  "symbol",
  "complied",
  "accountType",
  "result"
]);
export type GroupByKey = z.infer<typeof GroupByEnum>;

export const AnalyticsSummarySchema = z.object({
  totalTrades: z.number(),
  wins: z.number(),
  losses: z.number(),
  breakeven: z.number(),
  winRate: z.number(),
  profitFactor: z.number().nullable(),
  expectancy: z.number().nullable(),
  avgR: z.number().nullable(),
  avgWinR: z.number().nullable(),
  avgLossR: z.number().nullable(),
  payoffRatio: z.number().nullable()
});
export type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>;

export const BreakdownRowSchema = z.object({
  key: z.string(),
  label: z.string(),
  trades: z.number(),
  wins: z.number(),
  losses: z.number(),
  breakeven: z.number(),
  winRate: z.number().nullable(),
  profitFactor: z.number().nullable(),
  expectancy: z.number().nullable()
});
export type BreakdownRow = z.infer<typeof BreakdownRowSchema>;

export const PaginatedRecordsSchema = z.object({
  total: z.number().int(),
  items: z.array(RecordWithRelationsSchema)
});
export type PaginatedRecords = z.infer<typeof PaginatedRecordsSchema>;
