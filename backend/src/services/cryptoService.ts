import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Obtener clave desde variable de entorno o fallback a una clave de 32 bytes en dev
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) {
    return Buffer.from(envKey, 'hex');
  }
  // Key por defecto para desarrollo si no está configurada
  return crypto.createHash('sha256').update(envKey || 'default-secret-key-inventario').digest();
}

export interface EncryptedDataPayload {
  iv: string;
  authTag: string;
  data: string;
}

/**
 * Cifra datos de credenciales (objeto o array de credenciales) en un payload AES-256-GCM
 */
export function encryptCredentials(data: any): string {
  if (!data) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // IV recomendado de 12 bytes para GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonText = JSON.stringify(data);
  let encrypted = cipher.update(jsonText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  const payload: EncryptedDataPayload = {
    iv: iv.toString('hex'),
    authTag,
    data: encrypted,
  };

  return JSON.stringify(payload);
}

/**
 * Descifra un payload cifrado AES-256-GCM de credenciales
 */
export function decryptCredentials(encryptedPayloadString: string | null | undefined): any {
  if (!encryptedPayloadString) return null;

  try {
    const payload: EncryptedDataPayload = JSON.parse(encryptedPayloadString);
    if (!payload.iv || !payload.authTag || !payload.data) return null;

    const key = getEncryptionKey();
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error al descifrar credenciales:', error);
    return null;
  }
}
