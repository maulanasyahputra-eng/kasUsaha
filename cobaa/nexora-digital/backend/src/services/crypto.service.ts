import crypto from 'crypto';
import { config } from '../config';

/**
 * AES-256-GCM untuk credential provider.
 * Format tersimpan: base64( iv[12] : authTag[16] : ciphertext )
 */
export function encryptSecret(plain: string): string {
  const key = Buffer.from(config.encryptionKey, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptSecret(stored: string): string {
  const key = Buffer.from(config.encryptionKey, 'hex');
  const raw = Buffer.from(stored, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ct = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

/**
 * SSRF guard: hanya https (atau http untuk localhost dev), tanpa private IP/localhost
 * kecuali explicitly diizinkan (dev), hostname harus punya dot (bukan bare names).
 */
export function validateProviderBaseUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'URL tidak valid.' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, reason: 'Protokol harus http/https.' };
  }
  const host = url.hostname.toLowerCase();
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
  if (isLocal && config.nodeEnv === 'production') {
    return { ok: false, reason: 'localhost tidak diizinkan di production.' };
  }
  // Blokir IP privat / metadata endpoints (SSRF)
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1)/.test(host)) {
    return { ok: false, reason: 'Alamat internal/privat tidak diizinkan.' };
  }
  if (host === '169.254.169.254') return { ok: false, reason: 'Metadata endpoint diblokir.' };
  if (!isLocal && !host.includes('.')) {
    return { ok: false, reason: 'Hostname harus lengkap (fqdn).' };
  }
  return { ok: true, url };
}
