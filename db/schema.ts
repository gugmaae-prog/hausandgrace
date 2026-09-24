import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("haus_grace_leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  message: text("message").notNull().default(""),
  source: text("source").notNull().default("website"),
  propertyReference: text("property_reference"),
  consent: integer("consent", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const importRuns = sqliteTable("haus_grace_import_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(),
  status: text("status").notNull(),
  received: integer("received").notNull().default(0),
  published: integer("published").notNull().default(0),
  rejected: integer("rejected").notNull().default(0),
  details: text("details").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const agentProfiles = sqliteTable("hg_agent_profiles", {
  email: text("email").primaryKey(),
  displayName: text("display_name").notNull(),
  phone: text("phone").notNull().default(""),
  title: text("title").notNull().default("Property Advisor"),
  avatarUrl: text("avatar_url").notNull().default(""),
  role: text("role").notNull().default("agent"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const agentAdvisorProfiles = sqliteTable("hg_agent_advisor_profiles", {
  agentEmail: text("agent_email").primaryKey().references(() => agentProfiles.email, { onDelete: "cascade" }),
  topDevelopersJson: text("top_developers_json").notNull().default("[]"),
  topProjectsJson: text("top_projects_json").notNull().default("[]"),
  customProjectsJson: text("custom_projects_json").notNull().default("[]"),
  aiHeadline: text("ai_headline").notNull().default(""),
  aiBio: text("ai_bio").notNull().default(""),
  aiSpecialtiesJson: text("ai_specialties_json").notNull().default("[]"),
  aiRecommendationsJson: text("ai_recommendations_json").notNull().default("[]"),
  portfolioHeadline: text("portfolio_headline").notNull().default(""),
  portfolioBio: text("portfolio_bio").notNull().default(""),
  portfolioSpecialtiesJson: text("portfolio_specialties_json").notNull().default("[]"),
  portfolioRecommendationsJson: text("portfolio_recommendations_json").notNull().default("[]"),
  portfolioPublic: integer("portfolio_public", { mode: "boolean" }).notNull().default(false),
  portfolioSlug: text("portfolio_slug").notNull().unique(),
  whatsappPhone: text("whatsapp_phone").notNull().default(""),
  linkedinUrl: text("linkedin_url").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  propertyFinderProfileUrl: text("property_finder_profile_url").notNull().default(""),
  propertyFinderBrn: text("property_finder_brn").notNull().default(""),
  propertyFinderExperience: text("property_finder_experience").notNull().default(""),
  propertyFinderLanguagesJson: text("property_finder_languages_json").notNull().default("[]"),
  propertyFinderAreasJson: text("property_finder_areas_json").notNull().default("[]"),
  propertyFinderVerifiedAt: text("property_finder_verified_at").notNull().default(""),
  onboardingComplete: integer("onboarding_complete", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_hg_agent_advisor_profiles_public").on(table.portfolioPublic, table.portfolioSlug),
]);

export const agentSecondaryUnits = sqliteTable("hg_agent_secondary_units", {
  id: text("id").primaryKey(),
  agentEmail: text("agent_email").notNull().references(() => agentProfiles.email, { onDelete: "cascade" }),
  title: text("title").notNull(),
  community: text("community").notNull(),
  emirate: text("emirate").notNull().default("Dubai"),
  propertyType: text("property_type").notNull(),
  bedrooms: text("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull().default(0),
  sizeSqft: integer("size_sqft").notNull().default(0),
  priceAed: integer("price_aed").notNull().default(0),
  reference: text("reference").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("available"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_hg_agent_secondary_units_owner").on(table.agentEmail, table.updatedAt),
  index("idx_hg_agent_secondary_units_public").on(table.agentEmail, table.published, table.status),
]);

export const agentPropertyFinderListings = sqliteTable("hg_agent_property_finder_listings", {
  id: text("id").primaryKey(),
  agentEmail: text("agent_email").notNull().references(() => agentProfiles.email, { onDelete: "cascade" }),
  externalId: text("external_id").notNull(),
  externalUrl: text("external_url").notNull(),
  reference: text("reference").notNull().default(""),
  title: text("title").notNull(),
  location: text("location").notNull(),
  propertyType: text("property_type").notNull(),
  listingType: text("listing_type").notNull(),
  bedrooms: text("bedrooms").notNull().default(""),
  bathrooms: integer("bathrooms").notNull().default(0),
  sizeSqft: integer("size_sqft").notNull().default(0),
  priceAed: integer("price_aed").notNull().default(0),
  imageUrl: text("image_url").notNull().default(""),
  listedAt: text("listed_at").notNull().default(""),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("active"),
  fetchedAt: text("fetched_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_hg_pf_listings_owner").on(table.agentEmail, table.status, table.updatedAt),
  uniqueIndex("uq_hg_pf_listings_owner_external").on(table.agentEmail, table.externalId),
]);

export const agentPropertyFinderSync = sqliteTable("hg_agent_property_finder_sync", {
  agentEmail: text("agent_email").primaryKey().references(() => agentProfiles.email, { onDelete: "cascade" }),
  profileUrl: text("profile_url").notNull(),
  status: text("status").notNull().default("pending"),
  listingCount: integer("listing_count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
  error: text("error").notNull().default(""),
  lastAttemptedAt: text("last_attempted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSyncedAt: text("last_synced_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_hg_pf_sync_status").on(table.status, table.lastAttemptedAt),
]);

export const agentLoginCodes = sqliteTable("hg_agent_login_codes", {
  email: text("email").primaryKey(),
  nonce: text("nonce").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const agentSessions = sqliteTable("hg_agent_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull().references(() => agentProfiles.email, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_hg_agent_sessions_email").on(table.email),
  index("idx_hg_agent_sessions_expires").on(table.expiresAt),
]);

export const agentRateLimits = sqliteTable("hg_agent_rate_limits", {
  key: text("key").primaryKey(),
  windowStartedAt: text("window_started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  count: integer("count").notNull().default(0),
});

export const agentCredentials = sqliteTable("hg_agent_credentials", {
  email: text("email").primaryKey().references(() => agentProfiles.email, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  passwordIterations: integer("password_iterations").notNull(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: text("locked_until"),
  mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(false),
  passwordChangedAt: text("password_changed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: text("last_login_at"),
}, (table) => [
  index("idx_hg_agent_credentials_locked").on(table.lockedUntil),
]);

export const agentAdminAudit = sqliteTable("hg_agent_admin_audit", {
  id: text("id").primaryKey(),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(),
  targetEmail: text("target_email").notNull(),
  details: text("details").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_hg_agent_admin_audit_target").on(table.targetEmail, table.createdAt),
]);

export const agentConversations = sqliteTable("hg_agent_conversations", {
  id: text("id").primaryKey(),
  agentEmail: text("agent_email").notNull().references(() => agentProfiles.email, { onDelete: "cascade" }),
  title: text("title").notNull(),
  mode: text("mode").notNull().default("advisory"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_hg_agent_conversations_owner").on(table.agentEmail, table.updatedAt),
]);

export const agentMessages = sqliteTable("hg_agent_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => agentConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_hg_agent_messages_conversation").on(table.conversationId, table.createdAt),
]);

export const agentDocuments = sqliteTable("hg_agent_documents", {
  id: text("id").primaryKey(),
  agentEmail: text("agent_email").notNull().references(() => agentProfiles.email, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  contentJson: text("content_json").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_hg_agent_documents_owner").on(table.agentEmail, table.updatedAt),
]);

export const agentEmailLog = sqliteTable("hg_agent_email_log", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => agentDocuments.id, { onDelete: "cascade" }),
  agentEmail: text("agent_email").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull(),
  error: text("error"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_hg_agent_email_log_document").on(table.documentId, table.createdAt),
]);
