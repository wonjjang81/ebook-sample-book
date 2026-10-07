import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  providerSub: text('provider_sub').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull(),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => [
  uniqueIndex('idx_users_provider_sub').on(table.provider, table.providerSub),
  uniqueIndex('idx_users_email').on(table.email),
]);

export const memberships = sqliteTable('memberships', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  userId: text('user_id').references(() => users.id),
  role: text('role').notNull(),
  status: text('status').notNull(),
  isBootstrapOwner: integer('is_bootstrap_owner', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => [
  uniqueIndex('idx_memberships_email').on(table.email),
  uniqueIndex('idx_memberships_user_id').on(table.userId),
  index('idx_memberships_status_role').on(table.status, table.role),
]);

export const oauthAttempts = sqliteTable('oauth_attempts', {
  stateHash: text('state_hash').primaryKey(),
  browserHash: text('browser_hash').notNull(),
  nonce: text('nonce').notNull(),
  pkceVerifier: text('pkce_verifier').notNull(),
  returnTo: text('return_to').notNull(),
  expiresAt: integer('expires_at').notNull(),
  consumedAt: integer('consumed_at'),
  createdAt: integer('created_at').notNull(),
}, (table) => [index('idx_oauth_attempts_expires_at').on(table.expiresAt)]);

export const sessions = sqliteTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  absoluteExpiresAt: integer('absolute_expires_at').notNull(),
  idleExpiresAt: integer('idle_expires_at').notNull(),
  lastSeenAt: integer('last_seen_at').notNull(),
  createdAt: integer('created_at').notNull(),
}, (table) => [
  index('idx_sessions_user_id').on(table.userId),
  index('idx_sessions_expiry').on(table.absoluteExpiresAt, table.idleExpiresAt),
]);

export const productImages = sqliteTable('product_images', {
  productId: text('product_id').primaryKey(),
  activeVersion: text('active_version').notNull(),
  updatedBy: text('updated_by').notNull().references(() => users.id),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
});

export const productImageVersions = sqliteTable('product_image_versions', {
  productId: text('product_id').notNull(),
  version: text('version').notNull(),
  originalKey: text('original_key').notNull(),
  thumbKey: text('thumb_key').notNull(),
  originalType: text('original_type').notNull(),
  thumbType: text('thumb_type').notNull(),
  originalSize: integer('original_size').notNull(),
  thumbSize: integer('thumb_size').notNull(),
  status: text('status').notNull(),
  retainedUntil: integer('retained_until'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at').notNull(),
}, (table) => [
  primaryKey({ columns: [table.productId, table.version] }),
  index('idx_product_image_versions_retention').on(table.status, table.retainedUntil),
]);

export const auditEvents = sqliteTable('audit_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  detail: text('detail'),
  createdAt: integer('created_at').notNull(),
}, (table) => [
  index('idx_audit_events_target').on(table.targetType, table.targetId, table.createdAt),
  index('idx_audit_events_user').on(table.userId, table.createdAt),
]);
