import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const userRoleEnum = pgEnum("user_role", ["admin", "editor"]);
export const publishStatusEnum = pgEnum("publish_status", ["draft", "published"]);
export const leadStatusEnum = pgEnum("lead_status", [
  "novo",
  "contatado",
  "agendado",
  "realizado",
  "proposta",
  "convertido",
  "encerrado",
]);
export const messageStatusEnum = pgEnum("message_status", ["novo", "respondido", "arquivado"]);

export const LEAD_STATUSES = leadStatusEnum.enumValues;
export const MESSAGE_STATUSES = messageStatusEnum.enumValues;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type PublishStatus = (typeof publishStatusEnum.enumValues)[number];

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

// ---------------------------------------------------------------------------
// Autenticação e auditoria
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("editor"),
  isActive: boolean("is_active").notNull().default(true),
  // Segredo TOTP criptografado com APP_SECRET (AES-256-GCM). Nunca armazenado em claro.
  mfaSecretEnc: text("mfa_secret_enc"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  // Códigos de recuperação: hashes SHA-256 dos códigos, consumidos ao usar.
  recoveryCodeHashes: jsonb("recovery_code_hashes").$type<string[]>().notNull().default([]),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    // false enquanto o segundo fator ainda não foi confirmado neste login.
    mfaVerified: boolean("mfa_verified").notNull().default(false),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const passwordResets = pgTable("password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt)],
);

// ---------------------------------------------------------------------------
// Leads (diagnóstico gratuito) e mensagens de contato
// ---------------------------------------------------------------------------
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    company: text("company").notNull(),
    segment: text("segment").notNull(),
    instagramOrSite: text("instagram_or_site"),
    whatsapp: text("whatsapp").notNull(),
    email: text("email").notNull(),
    companyAge: text("company_age").notNull(),
    teamSize: text("team_size").notNull(),
    mainProblem: text("main_problem").notNull(),
    problemDetails: text("problem_details"),
    monthlyInvestment: text("monthly_investment").notNull(),
    timeline: text("timeline").notNull(),
    bestPeriod: text("best_period").notNull(),
    consent: boolean("consent").notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    status: leadStatusEnum("status").notNull().default("novo"),
    source: text("source").notNull().default("/diagnostico"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [index("leads_status_idx").on(t.status), index("leads_created_idx").on(t.createdAt)],
);

export const leadNotes = pgTable("lead_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const leadEvents = pgTable("lead_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorName: text("actor_name"),
  type: text("type").notNull(), // created | status_change | note | export
  fromStatus: text("from_status"),
  toStatus: text("to_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    whatsapp: text("whatsapp").notNull(),
    email: text("email"),
    company: text("company"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    consent: boolean("consent").notNull(),
    status: messageStatusEnum("status").notNull().default("novo"),
    ipHash: text("ip_hash"),
    ...timestamps,
  },
  (t) => [index("messages_created_idx").on(t.createdAt)],
);

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("site"),
  consent: boolean("consent").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Mídia
// ---------------------------------------------------------------------------
export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: text("category").notNull().default("geral"),
    storageKey: text("storage_key").notNull().unique(),
    filename: text("filename").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull().default(""),
    focalX: real("focal_x").notNull().default(0.5),
    focalY: real("focal_y").notNull().default(0.5),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("media_category_idx").on(t.category)],
);

/** Slots nomeados (foto dos fundadores, OG padrão, checklist...) apontando para uma mídia. */
export const mediaSlots = pgTable("media_slots", {
  slot: text("slot").primaryKey(),
  mediaId: uuid("media_id").references(() => media.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Conteúdo editável (textos das páginas), com rascunho/publicado e versões
// ---------------------------------------------------------------------------
export const contentEntries = pgTable("content_entries", {
  key: text("key").primaryKey(),
  draft: jsonb("draft").$type<Record<string, unknown>>(),
  published: jsonb("published").$type<Record<string, unknown>>(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contentVersions = pgTable(
  "content_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("content_versions_key_idx").on(t.key, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Projetos, depoimentos e blog
// ---------------------------------------------------------------------------
export type ProjectLink = { label: string; url: string };

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    client: text("client"),
    segment: text("segment"),
    summary: text("summary").notNull().default(""),
    scenario: text("scenario").notNull().default(""),
    bottleneck: text("bottleneck").notNull().default(""),
    solution: text("solution").notNull().default(""),
    // Resultado só deve ser preenchido com dados reais medidos e autorizados.
    result: text("result").notNull().default(""),
    services: jsonb("services").$type<string[]>().notNull().default([]),
    coverMediaId: uuid("cover_media_id").references(() => media.id, { onDelete: "set null" }),
    galleryMediaIds: jsonb("gallery_media_ids").$type<string[]>().notNull().default([]),
    videoUrl: text("video_url"),
    links: jsonb("links").$type<ProjectLink[]>().notNull().default([]),
    isDemo: boolean("is_demo").notNull().default(false),
    status: publishStatusEnum("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("projects_status_order_idx").on(t.status, t.sortOrder)],
);

export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  company: text("company"),
  role: text("role"),
  city: text("city"),
  photoMediaId: uuid("photo_media_id").references(() => media.id, { onDelete: "set null" }),
  quote: text("quote").notNull(),
  authorized: boolean("authorized").notNull().default(false),
  status: publishStatusEnum("status").notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    // Markdown. Renderizado com react-markdown sem HTML bruto (seguro contra XSS).
    body: text("body").notNull().default(""),
    category: text("category").notNull().default("Gargalos do negócio"),
    coverMediaId: uuid("cover_media_id").references(() => media.id, { onDelete: "set null" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    status: publishStatusEnum("status").notNull().default("draft"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("posts_status_published_idx").on(t.status, t.publishedAt)],
);

// ---------------------------------------------------------------------------
// Configurações gerais (linha única)
// ---------------------------------------------------------------------------
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
