import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Accounts table - represents different company accounts (GPG, WEC, GROW, etc.)
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountName: text("account_name").notNull(),
  accountPrefix: text("account_prefix").notNull(),
  bankName: text("bank_name"),
  currentCheckNumber: integer("current_check_number").default(1000),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// Operators table - companies we send payments to
export const operators = pgTable("operators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorName: text("operator_name").notNull(),
  legalEntityName: text("legal_entity_name"),
  aliases: text("aliases").array(), // Alternative names for matching during import
  hasAch: boolean("has_ach").default(false),
  bankName: text("bank_name"),
  bankAddress: text("bank_address"),
  routingNumber: text("routing_number"),
  accountNumber: text("account_number"),
  wireRouting: text("wire_routing"),
  swiftCode: text("swift_code"),
  remittanceEmail: text("remittance_email"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  achAddedBy: text("ach_added_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOperatorSchema = createInsertSchema(operators).omit({
  id: true,
  createdAt: true,
});
export type InsertOperator = z.infer<typeof insertOperatorSchema>;
export type Operator = typeof operators.$inferSelect;

// Account-Operator-Owner mapping table
export const accountOperatorOwners = pgTable("account_operator_owners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  operatorId: varchar("operator_id").notNull(),
  ownerNumber: text("owner_number").notNull(),
});

export const insertAccountOperatorOwnerSchema = createInsertSchema(accountOperatorOwners).omit({
  id: true,
});
export type InsertAccountOperatorOwner = z.infer<typeof insertAccountOperatorOwnerSchema>;
export type AccountOperatorOwner = typeof accountOperatorOwners.$inferSelect;

// Payment history table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  operatorId: varchar("operator_id"),
  operatorName: text("operator_name").notNull(),
  ownerNumber: text("owner_number"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  originalAmount: decimal("original_amount", { precision: 12, scale: 2 }),
  paymentDate: date("payment_date").notNull(),
  docNum: text("doc_num"),
  paymentMethod: text("payment_method").default("ACH"),
  status: text("status").default("imported"),
  batchId: varchar("batch_id"),
  batchName: text("batch_name"),
  checkNumber: integer("check_number"),
  processedDate: date("processed_date"),
  failedReason: text("failed_reason"),
  creditApplied: decimal("credit_applied", { precision: 12, scale: 2 }).default("0"),
  paidByCredit: boolean("paid_by_credit").default(false),
  importFileName: text("import_file_name"),
  importDate: timestamp("import_date"),
  notes: text("notes"),
  isPotentialDuplicate: boolean("is_potential_duplicate").default(false),
  duplicateOfId: varchar("duplicate_of_id"),
  hasAvailableCredit: boolean("has_available_credit").default(false),
  availableCreditAmount: decimal("available_credit_amount", { precision: 12, scale: 2 }),
  entryEdited: boolean("entry_edited").default(false),
  entryEditedAt: timestamp("entry_edited_at"),
  entrySent: boolean("entry_sent").default(false),
  entrySentAt: timestamp("entry_sent_at"),
  isHistorical: boolean("is_historical").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// ACH Batches table
export const achBatches = pgTable("ach_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  batchName: text("batch_name").notNull(),
  fileName: text("file_name").notNull(),
  paymentPeriod: text("payment_period"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentCount: integer("payment_count").notNull(),
  generatedDate: timestamp("generated_date").defaultNow(),
  generatedBy: text("generated_by"),
  filePath: text("file_path"),
});

export const insertAchBatchSchema = createInsertSchema(achBatches).omit({
  id: true,
  generatedDate: true,
});
export type InsertAchBatch = z.infer<typeof insertAchBatchSchema>;
export type AchBatch = typeof achBatches.$inferSelect;

// Credits table
export const credits = pgTable("credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  operatorId: varchar("operator_id").notNull(),
  originalAmount: decimal("original_amount", { precision: 12, scale: 2 }).notNull(),
  remainingBalance: decimal("remaining_balance", { precision: 12, scale: 2 }).notNull(),
  source: text("source").notNull(), // 'Overpayment', 'Operator Credit', 'Cash Call Refund', 'Other'
  reference: text("reference"),
  dateReceived: date("date_received").notNull(),
  createdDate: timestamp("created_date").defaultNow(),
  createdBy: text("created_by"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
});

export const insertCreditSchema = createInsertSchema(credits).omit({
  id: true,
  createdDate: true,
});
export type InsertCredit = z.infer<typeof insertCreditSchema>;
export type Credit = typeof credits.$inferSelect;

// Credit Applications table
export const creditApplications = pgTable("credit_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creditId: varchar("credit_id").notNull(),
  paymentId: varchar("payment_id").notNull(),
  amountApplied: decimal("amount_applied", { precision: 12, scale: 2 }).notNull(),
  appliedDate: date("applied_date").notNull(),
  appliedBy: text("applied_by"),
  notes: text("notes"),
});

export const insertCreditApplicationSchema = createInsertSchema(creditApplications).omit({
  id: true,
});
export type InsertCreditApplication = z.infer<typeof insertCreditApplicationSchema>;
export type CreditApplication = typeof creditApplications.$inferSelect;

// Activity log for recent activity
export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(),
  description: text("description").notNull(),
  accountId: varchar("account_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;

// Users table - for tracking who did what
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Payment status enum values
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  READY: 'ready',
  IN_ENTRY_TRACKER: 'in_entry_tracker',
  IN_BILL_PAY: 'in_bill_pay',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES];

// Credit sources
export const CREDIT_SOURCES = [
  'Overpayment',
  'Operator Credit',
  'Cash Call Refund',
  'Other',
] as const;

export type CreditSource = typeof CREDIT_SOURCES[number];
