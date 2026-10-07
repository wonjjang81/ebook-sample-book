import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { apiError, cookie, json, parseCookies, requestOriginIsAllowed } from './http';

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const SESSION_COOKIE = 'samplebook_session';
const OAUTH_BROWSER_COOKIE = 'samplebook_oauth_browser';
const OAUTH_TTL_SECONDS = 10 * 60;
const SESSION_ABSOLUTE_SECONDS = 12 * 60 * 60;
const SESSION_IDLE_SECONDS = 2 * 60 * 60;

export interface AppEnvironment {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: D1Database;
  BUCKET: R2Bucket;
  APP_ORIGIN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  ADMIN_EMAIL?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
}

export function isSafeReturnTo(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\');
}

function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

export function validateGoogleClaims(
  claims: JWTPayload & { email?: string; email_verified?: boolean; nonce?: string },
  expected: { adminEmail: string; nonce: string },
): { sub: string; email: string } {
  if (!claims.sub) throw new Error('Google 사용자 식별자가 없습니다.');
  if (!claims.email_verified) throw new Error('Google에서 확인되지 않은 이메일입니다.');
  if (!claims.email) throw new Error('Google 이메일 정보가 없습니다.');
  if (claims.nonce !== expected.nonce) throw new Error('OAuth nonce가 일치하지 않습니다.');
  if (!claims.iss || !GOOGLE_ISSUERS.includes(claims.iss)) throw new Error('Google 발급자가 올바르지 않습니다.');
  const email = normalizeEmail(claims.email);
  if (email !== normalizeEmail(expected.adminEmail)) throw new Error('허용되지 않은 관리자 계정입니다.');
  return { sub: claims.sub, email };
}

function randomToken(bytes = 32): string {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return base64Url(values);
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

function appOrigin(request: Request, environment: AppEnvironment): string {
  return environment.APP_ORIGIN ? new URL(environment.APP_ORIGIN).origin : new URL(request.url).origin;
}

function requireOAuthConfiguration(environment: AppEnvironment): {
  clientId: string;
  clientSecret: string;
  adminEmail: string;
} {
  if (!environment.GOOGLE_CLIENT_ID || !environment.GOOGLE_CLIENT_SECRET || !environment.ADMIN_EMAIL) {
    throw new Error('관리자 로그인이 아직 설정되지 않았습니다.');
  }
  return {
    clientId: environment.GOOGLE_CLIENT_ID,
    clientSecret: environment.GOOGLE_CLIENT_SECRET,
    adminEmail: environment.ADMIN_EMAIL,
  };
}

async function beginGoogleLogin(request: Request, environment: AppEnvironment): Promise<Response> {
  let config;
  try {
    config = requireOAuthConfiguration(environment);
  } catch (error) {
    return apiError(503, error instanceof Error ? error.message : '관리자 로그인을 사용할 수 없습니다.');
  }

  const url = new URL(request.url);
  const requestedReturnTo = url.searchParams.get('returnTo') ?? '/';
  const returnTo = isSafeReturnTo(requestedReturnTo) ? requestedReturnTo : '/';
  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken(48);
  const browser = randomToken();
  const now = Math.floor(Date.now() / 1000);

  await environment.DB.prepare(
    `INSERT INTO oauth_attempts
      (state_hash, browser_hash, nonce, pkce_verifier, return_to, expires_at, consumed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
  ).bind(
    await sha256(state),
    await sha256(browser),
    nonce,
    verifier,
    returnTo,
    now + OAUTH_TTL_SECONDS,
    now,
  ).run();

  const redirectUri = `${appOrigin(request, environment)}/api/auth/google/callback`;
  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', config.clientId);
  googleUrl.searchParams.set('redirect_uri', redirectUri);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email');
  googleUrl.searchParams.set('state', state);
  googleUrl.searchParams.set('nonce', nonce);
  googleUrl.searchParams.set('code_challenge', await sha256(verifier));
  googleUrl.searchParams.set('code_challenge_method', 'S256');
  googleUrl.searchParams.set('prompt', 'select_account');

  const headers = new Headers({ location: googleUrl.toString(), 'cache-control': 'no-store' });
  headers.append('set-cookie', cookie(OAUTH_BROWSER_COOKIE, browser, { maxAge: OAUTH_TTL_SECONDS }));
  return new Response(null, { status: 302, headers });
}

interface OAuthAttemptRow {
  browser_hash: string;
  nonce: string;
  pkce_verifier: string;
  return_to: string;
  expires_at: number;
  consumed_at: number | null;
}

async function bindAdminUser(
  environment: AppEnvironment,
  identity: { sub: string; email: string },
  now: number,
): Promise<AdminUser> {
  const existingBySub = await environment.DB.prepare(
    `SELECT u.id, u.provider_sub, u.email, u.status AS user_status,
            m.role, m.status AS membership_status
     FROM users u JOIN memberships m ON m.user_id = u.id
     WHERE u.provider_sub = ?`,
  ).bind(identity.sub).first<{
    id: string;
    provider_sub: string;
    email: string;
    user_status: string;
    role: string;
    membership_status: string;
  }>();
  if (existingBySub) {
    if (existingBySub.user_status !== 'active' || existingBySub.membership_status !== 'active' || existingBySub.role !== 'admin') {
      throw new Error('관리자 계정이 비활성 상태입니다.');
    }
    if (normalizeEmail(existingBySub.email) !== identity.email) throw new Error('Google 계정 바인딩 정보가 일치하지 않습니다.');
    return { id: existingBySub.id, email: identity.email, role: 'admin' };
  }

  const membershipId = crypto.randomUUID();
  await environment.DB.prepare(
    `INSERT INTO memberships (id, email, user_id, role, status, is_bootstrap_owner, created_at, updated_at)
     VALUES (?, ?, NULL, 'admin', 'active', 1, ?, ?)
     ON CONFLICT(email) DO NOTHING`,
  ).bind(membershipId, identity.email, now, now).run();

  const membership = await environment.DB.prepare(
    `SELECT id, user_id, role, status, is_bootstrap_owner FROM memberships WHERE email = ?`,
  ).bind(identity.email).first<{
    id: string;
    user_id: string | null;
    role: string;
    status: string;
    is_bootstrap_owner: number;
  }>();
  if (!membership || membership.status !== 'active' || membership.role !== 'admin' || membership.is_bootstrap_owner !== 1) {
    throw new Error('허용되지 않은 관리자 계정입니다.');
  }

  const userId = crypto.randomUUID();
  await environment.DB.prepare(
    `INSERT INTO users (id, provider, provider_sub, email, role, status, created_at, updated_at)
     VALUES (?, 'google', ?, ?, 'admin', 'active', ?, ?)
     ON CONFLICT(email) DO NOTHING`,
  ).bind(userId, identity.sub, identity.email, now, now).run();

  const bound = await environment.DB.prepare(
    `SELECT id, provider_sub, email, status FROM users WHERE email = ?`,
  ).bind(identity.email).first<{ id: string; provider_sub: string; email: string; status: string }>();
  if (!bound || bound.provider_sub !== identity.sub) throw new Error('관리자 Google 계정이 이미 다른 식별자에 연결되어 있습니다.');
  if (bound.status !== 'active') throw new Error('관리자 계정이 비활성 상태입니다.');
  if (membership.user_id && membership.user_id !== bound.id) throw new Error('관리자 권한이 이미 다른 Google 계정에 연결되어 있습니다.');
  await environment.DB.prepare(
    `UPDATE memberships SET user_id = ?, updated_at = ? WHERE id = ? AND (user_id IS NULL OR user_id = ?)`,
  ).bind(bound.id, now, membership.id, bound.id).run();
  const linked = await environment.DB.prepare(
    `SELECT user_id FROM memberships WHERE id = ?`,
  ).bind(membership.id).first<{ user_id: string | null }>();
  if (linked?.user_id !== bound.id) throw new Error('관리자 권한 연결에 실패했습니다.');
  return { id: bound.id, email: identity.email, role: 'admin' };
}

async function completeGoogleLogin(request: Request, environment: AppEnvironment): Promise<Response> {
  const config = requireOAuthConfiguration(environment);
  const url = new URL(request.url);
  const codeValue = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const browser = parseCookies(request)[OAUTH_BROWSER_COOKIE];
  if (!codeValue || !state || !browser) return apiError(400, 'Google 로그인 응답이 올바르지 않습니다.');

  const stateHash = await sha256(state);
  const attempt = await environment.DB.prepare(
    `SELECT browser_hash, nonce, pkce_verifier, return_to, expires_at, consumed_at
     FROM oauth_attempts WHERE state_hash = ?`,
  ).bind(stateHash).first<OAuthAttemptRow>();
  const now = Math.floor(Date.now() / 1000);
  if (!attempt || attempt.consumed_at !== null || attempt.expires_at <= now) return apiError(400, '만료되었거나 이미 사용된 로그인 요청입니다.');
  if (attempt.browser_hash !== await sha256(browser)) return apiError(400, '로그인을 시작한 브라우저가 아닙니다.');

  const consume = await environment.DB.prepare(
    `UPDATE oauth_attempts SET consumed_at = ?
     WHERE state_hash = ? AND consumed_at IS NULL AND expires_at > ?`,
  ).bind(now, stateHash, now).run();
  if (!consume.meta.changes) return apiError(400, '이미 사용된 로그인 요청입니다.');

  const redirectUri = `${appOrigin(request, environment)}/api/auth/google/callback`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: codeValue,
      code_verifier: attempt.pkce_verifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenResponse.ok) return apiError(502, 'Google 로그인 확인에 실패했습니다. 다시 시도해 주세요.');
  const tokenPayload = await tokenResponse.json<{ id_token?: string }>();
  if (!tokenPayload.id_token) return apiError(502, 'Google 사용자 정보를 받지 못했습니다.');

  const verified = await jwtVerify(tokenPayload.id_token, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: config.clientId,
    algorithms: ['RS256'],
    clockTolerance: 10,
  });
  const identity = validateGoogleClaims(verified.payload, { adminEmail: config.adminEmail, nonce: attempt.nonce });
  const user = await bindAdminUser(environment, identity, now);

  const sessionToken = randomToken(48);
  await environment.DB.prepare(
    `INSERT INTO sessions
      (token_hash, user_id, absolute_expires_at, idle_expires_at, last_seen_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(
    await sha256(sessionToken),
    user.id,
    now + SESSION_ABSOLUTE_SECONDS,
    now + SESSION_IDLE_SECONDS,
    now,
    now,
  ).run();
  await environment.DB.prepare(
    `INSERT INTO audit_events (id, user_id, action, target_type, target_id, detail, created_at)
     VALUES (?, ?, 'login', 'session', NULL, NULL, ?)`,
  ).bind(crypto.randomUUID(), user.id, now).run();

  const headers = new Headers({ location: attempt.return_to, 'cache-control': 'no-store' });
  headers.append('set-cookie', cookie(SESSION_COOKIE, sessionToken, { maxAge: SESSION_ABSOLUTE_SECONDS }));
  headers.append('set-cookie', cookie(OAUTH_BROWSER_COOKIE, '', { maxAge: 0 }));
  return new Response(null, { status: 302, headers });
}

export async function getAdminUser(request: Request, environment: AppEnvironment): Promise<AdminUser | null> {
  const sessionToken = parseCookies(request)[SESSION_COOKIE];
  if (!sessionToken) return null;
  const tokenHash = await sha256(sessionToken);
  const now = Math.floor(Date.now() / 1000);
  const row = await environment.DB.prepare(
    `SELECT u.id, u.email, u.status AS user_status, m.role, m.status AS membership_status,
            s.absolute_expires_at, s.idle_expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     JOIN memberships m ON m.user_id = u.id
     WHERE s.token_hash = ?`,
  ).bind(tokenHash).first<{
    id: string;
    email: string;
    role: string;
    user_status: string;
    membership_status: string;
    absolute_expires_at: number;
    idle_expires_at: number;
  }>();
  if (!row || row.user_status !== 'active' || row.membership_status !== 'active' || row.role !== 'admin' || row.absolute_expires_at <= now || row.idle_expires_at <= now) {
    if (row) await environment.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();
    return null;
  }
  const nextIdle = Math.min(row.absolute_expires_at, now + SESSION_IDLE_SECONDS);
  await environment.DB.prepare(
    `UPDATE sessions SET idle_expires_at = ?, last_seen_at = ? WHERE token_hash = ?`,
  ).bind(nextIdle, now, tokenHash).run();
  return { id: row.id, email: row.email, role: 'admin' };
}

async function logout(request: Request, environment: AppEnvironment): Promise<Response> {
  if (!requestOriginIsAllowed(request, appOrigin(request, environment))) return apiError(403, '허용되지 않은 요청 출처입니다.');
  const sessionToken = parseCookies(request)[SESSION_COOKIE];
  if (sessionToken) await environment.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(await sha256(sessionToken)).run();
  const response = json({ authenticated: false });
  response.headers.append('set-cookie', cookie(SESSION_COOKIE, '', { maxAge: 0 }));
  return response;
}

export async function handleAuthRequest(request: Request, environment: AppEnvironment): Promise<Response | null> {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/auth/google/start') return beginGoogleLogin(request, environment);
  if (request.method === 'GET' && url.pathname === '/api/auth/google/callback') {
    try {
      return await completeGoogleLogin(request, environment);
    } catch (error) {
      console.error('Google OAuth callback failed', error);
      return apiError(403, error instanceof Error ? error.message : 'Google 로그인에 실패했습니다.');
    }
  }
  if (request.method === 'GET' && url.pathname === '/api/auth/me') {
    const user = await getAdminUser(request, environment);
    return json(user ? { authenticated: true, user } : { authenticated: false });
  }
  if (request.method === 'POST' && url.pathname === '/api/auth/logout') return logout(request, environment);
  return null;
}

export function isMutationOriginAllowed(request: Request, environment: AppEnvironment): boolean {
  return requestOriginIsAllowed(request, appOrigin(request, environment));
}
