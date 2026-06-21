import crypto from 'crypto';

/**
 * Anti-cheat: HMAC-signed game sessions.
 *
 * A session is issued (server-side) the moment a run starts. The signed token
 * pins the server-issued `issuedAt` timestamp so the client cannot forge how
 * long the run took. On score submission the server re-derives the signature,
 * checks elapsed wall-clock time against the number of lanes crossed, and
 * enforces that score is exactly derived from distance (no arbitrary scores).
 */

const SECRET = process.env.SCORE_HMAC_SECRET || '';

/** Points awarded per lane crossed (must match gameStore.incrementScore). */
export const POINTS_PER_LANE = 100;

/**
 * Minimum wall-clock time per forward hop, in ms. The in-game hop cooldown is
 * 140ms; we use a lower bound here to tolerate network/timer jitter while still
 * rejecting teleport/speed hacks.
 */
export const MIN_HOP_MS = 70;

/** A session token older than this (ms) is rejected. */
export const MAX_SESSION_AGE_MS = 60 * 60 * 1000; // 1 hour

/** Slack to absorb network/timer offset between run start and token issuance. */
export const GRACE_MS = 1500;

export interface SessionToken {
  sessionId: string;
  issuedAt: number;
  wallet: string;
  sig: string;
}

export function signSession(sessionId: string, issuedAt: number, wallet: string): string {
  if (!SECRET) throw new Error('SCORE_HMAC_SECRET is not set');
  return crypto
    .createHmac('sha256', SECRET)
    .update(`${sessionId}.${issuedAt}.${wallet}`)
    .digest('hex');
}

export function issueSession(wallet: string): SessionToken {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const issuedAt = Date.now();
  return { sessionId, issuedAt, wallet, sig: signSession(sessionId, issuedAt, wallet) };
}

export function verifySignature(t: SessionToken): boolean {
  const expected = signSession(t.sessionId, t.issuedAt, t.wallet);
  if (typeof t.sig !== 'string' || t.sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(t.sig) as any,
      Buffer.from(expected) as any
    );
  } catch {
    return false;
  }
}

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * Validate a submitted run against its session token. Pure function — the
 * caller is responsible for replay protection (single-use session id) and DB
 * insertion.
 */
export function validateRun(
  token: SessionToken,
  wallet: string,
  score: number,
  distance: number,
  now = Date.now()
): ValidationResult {
  if (!verifySignature(token)) return { ok: false, reason: 'bad signature' };
  if (token.wallet !== wallet) return { ok: false, reason: 'wallet mismatch' };

  if (!Number.isInteger(score) || score < 0) return { ok: false, reason: 'bad score' };
  if (!Number.isInteger(distance) || distance < 1) return { ok: false, reason: 'bad distance' };

  // Score must be exactly derived from lanes crossed — no arbitrary values.
  if (score !== distance * POINTS_PER_LANE) return { ok: false, reason: 'score/distance mismatch' };

  const elapsed = now - token.issuedAt;
  if (elapsed < -GRACE_MS) return { ok: false, reason: 'session from the future' };
  if (elapsed > MAX_SESSION_AGE_MS) return { ok: false, reason: 'session expired' };

  // Physical-plausibility: crossing N lanes takes at least N * MIN_HOP_MS.
  // GRACE_MS absorbs the small delay between play starting and the session
  // token being issued, so legitimate short runs aren't false-rejected.
  if (elapsed < distance * MIN_HOP_MS - GRACE_MS) {
    return { ok: false, reason: 'too fast — speed hack' };
  }

  return { ok: true };
}
