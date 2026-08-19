import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// ---------- Helpers ----------
const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
};

// ---------- Businesses (tenants) ----------
export const businesses = sqliteTable("businesses", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  vatNumber: text("vat_number"),
  regNumber: text("reg_number"),
  logoUrl: text("logo_url"),
  brandColor: text("brand_color").notNull().default("#111827"),
  pdfTemplate: text("pdf_template").notNull().default("modern"), // modern | classic | minimal
  invoicePrefix: text("invoice_prefix").notNull().default("INV"),
  nextInvoiceSeq: integer("next_invoice_seq").notNull().default(1),
  currency: text("currency").notNull().default("ZAR"),
  defaultTaxRate: real("default_tax_rate").notNull().default(15), // % VAT default
  bankDetails: text("bank_details"), // free text: bank, account, branch code
  paymentTermsDays: integer("payment_terms_days").notNull().default(7),
  ...timestamps,
});

export const businessesRelations = relations(businesses, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  invoices: many(invoices),
  recurringSchedules: many(recurringSchedules),
  subscriptions: many(subscriptions),
}));

// ---------- Users ----------
export const users = sqliteTable("users", {
  id: id(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("owner"), // owner | staff
  ...timestamps,
});

export const usersRelations = relations(users, ({ one }) => ({
  business: one(businesses, {
    fields: [users.businessId],
    references: [businesses.id],
  }),
}));

// ---------- Clients ----------
export const clients = sqliteTable("clients", {
  id: id(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  vatNumber: text("vat_number"),
  notes: text("notes"),
  ...timestamps,
});

export const clientsRelations = relations(clients, ({ one, many }) => ({
  business: one(businesses, {
    fields: [clients.businessId],
    references: [businesses.id],
  }),
  invoices: many(invoices),
  recurringSchedules: many(recurringSchedules),
}));

// ---------- Recurring schedules ----------
export const recurringSchedules = sqliteTable("recurring_schedules", {
  id: id(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // e.g. "Monthly retainer"
  frequency: text("frequency").notNull(), // weekly | monthly | quarterly | annually
  intervalCount: integer("interval_count").notNull().default(1),
  startDate: text("start_date").notNull(), // ISO date
  nextRunDate: text("next_run_date").notNull(), // ISO date
  endDate: text("end_date"), // ISO date, nullable = never
  autoSend: integer("auto_send", { mode: "boolean" }).notNull().default(true),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  taxRate: real("tax_rate"), // overrides business default if set
  notes: text("notes"),
  lineItemsJson: text("line_items_json").notNull(), // JSON array of {description, quantity, unitPrice}
  lastRunAt: text("last_run_at"),
  ...timestamps,
});

export const recurringSchedulesRelations = relations(
  recurringSchedules,
  ({ one, many }) => ({
    business: one(businesses, {
      fields: [recurringSchedules.businessId],
      references: [businesses.id],
    }),
    client: one(clients, {
      fields: [recurringSchedules.clientId],
      references: [clients.id],
    }),
    invoices: many(invoices),
  })
);

// ---------- Invoices ----------
export const invoices = sqliteTable("invoices", {
  id: id(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  recurringScheduleId: text("recurring_schedule_id").references(
    () => recurringSchedules.id,
    { onDelete: "set null" }
  ),
  number: text("number").notNull(), // e.g. INV-0001
  status: text("status").notNull().default("draft"), // draft|sent|paid|overdue|cancelled
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull(),
  currency: text("currency").notNull().default("ZAR"),
  subtotal: real("subtotal").notNull().default(0),
  taxRate: real("tax_rate").notNull().default(0),
  taxAmount: real("tax_amount").notNull().default(0),
  total: real("total").notNull().default(0),
  amountPaid: real("amount_paid").notNull().default(0),
  notes: text("notes"),
  sentAt: text("sent_at"),
  paidAt: text("paid_at"),
  ...timestamps,
});

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  business: one(businesses, {
    fields: [invoices.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  recurringSchedule: one(recurringSchedules, {
    fields: [invoices.recurringScheduleId],
    references: [recurringSchedules.id],
  }),
  lineItems: many(invoiceLineItems),
  payments: many(payments),
}));

// ---------- Invoice line items ----------
export const invoiceLineItems = sqliteTable("invoice_line_items", {
  id: id(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: real("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull().default(0),
  amount: real("amount").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const invoiceLineItemsRelations = relations(
  invoiceLineItems,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceLineItems.invoiceId],
      references: [invoices.id],
    }),
  })
);

// ---------- Payments ----------
export const payments = sqliteTable("payments", {
  id: id(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  method: text("method").notNull().default("manual"), // manual|payfast|stripe|eft
  reference: text("reference"),
  paidAt: text("paid_at").notNull(),
  ...timestamps,
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

// ---------- SaaS subscription plans (for the app's own monthly billing) ----------
export const plans = sqliteTable("plans", {
  id: id(),
  name: text("name").notNull(), // Starter | Pro | Business
  priceMonthly: real("price_monthly").notNull(),
  currency: text("currency").notNull().default("ZAR"),
  invoiceLimit: integer("invoice_limit"), // null = unlimited
  clientLimit: integer("client_limit"), // null = unlimited
  features: text("features").notNull().default("[]"), // JSON array of strings
  ...timestamps,
});

export const subscriptions = sqliteTable("subscriptions", {
  id: id(),
  businessId: text("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  status: text("status").notNull().default("trialing"), // trialing|active|past_due|canceled
  provider: text("provider"), // payfast|stripe|null (manual)
  providerCustomerId: text("provider_customer_id"),
  providerSubscriptionId: text("provider_subscription_id"),
  trialEndsAt: text("trial_ends_at"),
  currentPeriodStart: text("current_period_start"),
  currentPeriodEnd: text("current_period_end"),
  canceledAt: text("canceled_at"),
  ...timestamps,
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  business: one(businesses, {
    fields: [subscriptions.businessId],
    references: [businesses.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));
