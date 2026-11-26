import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export const SESSION_COOKIE_NAME = 'meocung_session';
export const PENDING_COOKIE_NAME = 'meocung_pending_reg';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const PENDING_MAX_AGE = 60 * 10; // 10 minutes

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.PAYLOAD_SECRET ||
  'meocung_auth_secret_key_2026_super_secure';

// File-based store with in-memory fallback for read-only environments
const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PENDING_FILE = path.join(DATA_DIR, 'pending-registrations.json');

export interface PendingRegistration {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  code: string;
  expiresAt: number;
  attempts?: number;
  lastSentAt?: number;
}

const globalForAuth = globalThis as unknown as {
  __meocungUsers?: StoredUser[];
  __meocungPending?: PendingRegistration[];
};

function readUsersFromDisk(): StoredUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        globalForAuth.__meocungUsers = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to in-memory store
  }
  return globalForAuth.__meocungUsers || [];
}

function writeUsersToDisk(users: StoredUser[]): void {
  globalForAuth.__meocungUsers = users;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch {
    // Ignore disk write failure on read-only serverless environments
  }
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(keyHex, 'hex');
  if (derivedBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(derivedBuffer, keyBuffer);
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase();
  const users = readUsersFromDisk();
  return users.find((u) => u.email.toLowerCase() === normalized);
}

export function findUserById(id: string): StoredUser | undefined {
  const users = readUsersFromDisk();
  return users.find((u) => u.id === id);
}

export function createUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): StoredUser {
  const users = readUsersFromDisk();
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeUsersToDisk(users);
  return newUser;
}

function readPendingFromDisk(): PendingRegistration[] {
  try {
    if (fs.existsSync(PENDING_FILE)) {
      const raw = fs.readFileSync(PENDING_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        globalForAuth.__meocungPending = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to in-memory store
  }
  return globalForAuth.__meocungPending || [];
}

function writePendingToDisk(items: PendingRegistration[]): void {
  globalForAuth.__meocungPending = items;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PENDING_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch {
    // Ignore disk write failure on read-only serverless environments
  }
}

export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function savePendingRegistration(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): PendingRegistration {
  const normalizedEmail = input.email.trim().toLowerCase();
  const pendingList = readPendingFromDisk().filter(
    (p) => p.email.toLowerCase() !== normalizedEmail
  );

  const record: PendingRegistration = {
    name: input.name.trim(),
    email: normalizedEmail,
    phone: input.phone?.trim() || undefined,
    passwordHash: hashPassword(input.password),
    code: generateVerificationCode(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
    lastSentAt: Date.now(),
  };

  pendingList.push(record);
  writePendingToDisk(pendingList);
  return record;
}

export function getPendingRegistration(
  email: string
): PendingRegistration | undefined {
  const normalizedEmail = email.trim().toLowerCase();
  return readPendingFromDisk().find(
    (p) => p.email.toLowerCase() === normalizedEmail
  );
}

export function verifyPendingCode(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function incrementPendingAttempts(email: string): number {
  const normalizedEmail = email.trim().toLowerCase();
  const list = readPendingFromDisk();
  const idx = list.findIndex((p) => p.email.toLowerCase() === normalizedEmail);
  if (idx === -1) return 0;
  const nextAttempts = (list[idx].attempts || 0) + 1;
  list[idx] = { ...list[idx], attempts: nextAttempts };
  writePendingToDisk(list);
  return nextAttempts;
}

export function refreshPendingCode(email: string): PendingRegistration | null {
  const normalizedEmail = email.trim().toLowerCase();
  const list = readPendingFromDisk();
  const idx = list.findIndex((p) => p.email.toLowerCase() === normalizedEmail);
  if (idx === -1) return null;

  list[idx] = {
    ...list[idx],
    code: generateVerificationCode(),
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
    lastSentAt: Date.now(),
  };
  writePendingToDisk(list);
  return list[idx];
}

export function deletePendingRegistration(email: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  const filtered = readPendingFromDisk().filter(
    (p) => p.email.toLowerCase() !== normalizedEmail
  );
  writePendingToDisk(filtered);
}

export function createUserFromPending(pending: PendingRegistration): StoredUser {
  const users = readUsersFromDisk();
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    passwordHash: pending.passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeUsersToDisk(users);
  deletePendingRegistration(pending.email);
  return newUser;
}

interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  exp: number;
}

function signPayload(payloadB64: string): string {
  return crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');
}

export function createSessionToken(user: PublicUser): string {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    createdAt: user.createdAt,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): PublicUser | null {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const expectedSig = signPayload(payloadB64);
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    );

    if (!payload.exp || Date.now() > payload.exp) return null;

    const existing = findUserById(payload.userId);
    if (existing) {
      return toPublicUser(existing);
    }

    return {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      createdAt: payload.createdAt,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(user: PublicUser): void {
  const token = createSessionToken(user);
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function setPendingCookie(pending: PendingRegistration): void {
  const payloadB64 = Buffer.from(JSON.stringify(pending)).toString('base64url');
  const signature = signPayload(payloadB64);
  const token = `${payloadB64}.${signature}`;
  cookies().set(PENDING_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PENDING_MAX_AGE,
  });
}

export function getPendingFromCookie(email: string): PendingRegistration | undefined {
  try {
    const token = cookies().get(PENDING_COOKIE_NAME)?.value;
    if (!token) return undefined;
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return undefined;

    const expectedSig = signPayload(payloadB64);
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return undefined;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return undefined;

    const parsed: PendingRegistration = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    );
    if (parsed.email.toLowerCase() !== email.trim().toLowerCase()) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function clearPendingCookie(): void {
  cookies().set(PENDING_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function getSessionUser(): PublicUser | null {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
