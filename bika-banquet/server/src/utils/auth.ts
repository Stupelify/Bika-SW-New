import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN: jwt.SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
}

/**
 * Generate JWT token
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    jwtid: crypto.randomUUID(),
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate random token for verification/reset
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
