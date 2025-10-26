/**
 * Security utilities for HMAC signature verification and secure headers
 */
import * as crypto from 'crypto';

/**
 * Security headers interface for HMAC verification
 */
export interface SecurityHeaders {
  'x-signature': string;
  'x-timestamp': string;
  'x-nonce': string;
}

/**
 * Generate a cryptographically secure random nonce
 * @returns 32-character hexadecimal nonce
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Sign a payload with HMAC-SHA256
 * @param payload - The payload object to sign
 * @param secret - The secret key for HMAC signing
 * @returns Hexadecimal HMAC signature
 */
export function signPayload(payload: object, secret: string): string {
  const data = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Create secure headers for authenticated requests
 * @param payload - The payload to sign (event data without API key)
 * @param projectSecret - The project secret for HMAC signing
 * @returns Security headers object
 */
export function createSecureHeaders(
  payload: object,
  projectSecret: string
): SecurityHeaders {
  const timestamp = new Date().toISOString();
  const nonce = generateNonce();
  
  // Create signable payload with security metadata
  const signablePayload = {
    ...payload,
    timestamp,
    nonce,
  };
  
  const signature = signPayload(signablePayload, projectSecret);

  return {
    'x-signature': signature,
    'x-timestamp': timestamp,
    'x-nonce': nonce,
  };
}