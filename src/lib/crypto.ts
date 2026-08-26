import LZString from 'lz-string';
import type { GiftPayload, BoxThemeId, SoundEffectId, VisualEffectId } from '../types';

// Application salt key to ensure obfuscation
const APP_SECRET_KEY = 'funnyText_gift_box_2026_magic_secret_key_v1';

/**
 * Generates a simple 32-bit checksum for payload integrity verification
 */
function calculateChecksum(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Encrypts and encodes a GiftPayload into an opaque, URL-safe hex token
 * E.g. "4c083e120c11101f22..."
 * No plaintext or readable Korean/English text is present in the token.
 */
export function encodeGiftPayload(payload: GiftPayload): string {
  try {
    // 1. Pack into minimal array structure for maximum compression
    // [version, text, subtext, themeId, emoji, soundId, effectId]
    const compactArray = [
      1,
      payload.t,
      payload.s || '',
      payload.b,
      payload.e || '🎁',
      payload.snd,
      payload.fx,
    ];

    const jsonStr = JSON.stringify(compactArray);

    // 2. Compress with LZ-String
    const compressed = LZString.compressToBase64(jsonStr);

    // 3. Obfuscate with pseudo-random XOR stream + App key
    const charCodes: number[] = [];
    const keyLen = APP_SECRET_KEY.length;

    // Random 1-byte salt at beginning
    const salt = Math.floor(Math.random() * 256);
    charCodes.push(salt);

    for (let i = 0; i < compressed.length; i++) {
      const code = compressed.charCodeAt(i);
      const keyChar = APP_SECRET_KEY.charCodeAt((i + salt) % keyLen);
      charCodes.push(code ^ keyChar ^ ((salt * 31) & 0xff));
    }

    // 4. Calculate checksum and append
    const chk = calculateChecksum(jsonStr) % 65536;
    charCodes.push((chk >> 8) & 0xff);
    charCodes.push(chk & 0xff);

    // 5. Convert to Hex string for clean looking token (e.g. 56b900a9...)
    const hex = charCodes
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');

    return hex;
  } catch (err) {
    console.error('Failed to encode gift payload:', err);
    return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  }
}

/**
 * Decodes and decrypts an opaque token back into a GiftPayload object
 */
export function decodeGiftPayload(token: string): GiftPayload | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const cleanToken = token.trim();

    // Check if token is Hex-encoded (even length and valid hex chars)
    if (/^[0-9a-fA-F]+$/.test(cleanToken) && cleanToken.length >= 8) {
      const bytes: number[] = [];
      for (let i = 0; i < cleanToken.length; i += 2) {
        bytes.push(parseInt(cleanToken.substring(i, i + 2), 16));
      }

      if (bytes.length < 4) return null;

      const salt = bytes[0];
      const payloadBytes = bytes.slice(1, bytes.length - 2);
      const storedChk = (bytes[bytes.length - 2] << 8) | bytes[bytes.length - 1];

      const keyLen = APP_SECRET_KEY.length;
      const chars: string[] = [];

      for (let i = 0; i < payloadBytes.length; i++) {
        const keyChar = APP_SECRET_KEY.charCodeAt((i + salt) % keyLen);
        const originalCode = payloadBytes[i] ^ keyChar ^ ((salt * 31) & 0xff);
        chars.push(String.fromCharCode(originalCode));
      }

      const compressed = chars.join('');
      const decompressed = LZString.decompressFromBase64(compressed);

      if (!decompressed) return null;

      // Verify checksum
      const actualChk = calculateChecksum(decompressed) % 65536;
      if (actualChk !== storedChk) {
        console.warn('Checksum mismatch during payload decode');
      }

      const parsed = JSON.parse(decompressed);

      // Compact Array format support
      if (Array.isArray(parsed) && parsed.length >= 7) {
        return {
          v: parsed[0] as number,
          t: String(parsed[1]),
          s: parsed[2] ? String(parsed[2]) : undefined,
          b: parsed[3] as BoxThemeId,
          e: String(parsed[4]),
          snd: parsed[5] as SoundEffectId,
          fx: parsed[6] as VisualEffectId,
        };
      }

      // Legacy Object format support
      if (isValidGiftPayload(parsed)) {
        return parsed;
      }
    }

    // Fallback attempt: LZ-String EncodedURIComponent
    const decompressed = LZString.decompressFromEncodedURIComponent(cleanToken);
    if (decompressed) {
      const parsed = JSON.parse(decompressed);
      if (isValidGiftPayload(parsed)) {
        return parsed;
      }
    }

    return null;
  } catch (err) {
    console.error('Failed to decode gift payload:', err);
    return null;
  }
}

/**
 * Validates that an object satisfies the GiftPayload structure
 */
function isValidGiftPayload(obj: unknown): obj is GiftPayload {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.t === 'string' &&
    p.t.length > 0 &&
    typeof p.b === 'string' &&
    typeof p.snd === 'string'
  );
}
