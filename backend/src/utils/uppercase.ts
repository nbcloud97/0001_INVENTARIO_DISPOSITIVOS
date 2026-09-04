/**
 * Convierte las cadenas de texto del usuario a MAYÚSCULAS antes de guardar en la base de datos.
 * Excluye claves de identificadores de base de datos (id, systemId, clientId, subsystemId),
 * valores de estilo (color, icon) y CREDENCIALES (credentials, username, password, user, pass, extra)
 * para preservar su casing y caracteres exactos introducidos por el usuario.
 */
export function toUpperString(val: string | undefined | null): string | undefined {
  if (typeof val === 'string') {
    return val.trim().toUpperCase();
  }
  return val === null ? undefined : val;
}

export function toUpperObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const result: any = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in result) {
    // Si la clave es 'credentials', NO procesar sus propiedades ni convertir a mayúsculas
    if (key === 'credentials') {
      continue;
    }

    if (typeof result[key] === 'string') {
      const lowerKey = key.toLowerCase();
      // Preservar minúsculas/mayúsculas exactas en identificadores, estilos y CREDENCIALES
      if (
        key === 'id' ||
        key.endsWith('Id') ||
        key.endsWith('_id') ||
        key === 'color' ||
        key === 'icon' ||
        lowerKey === 'username' ||
        lowerKey === 'password' ||
        lowerKey === 'user' ||
        lowerKey === 'pass' ||
        lowerKey === 'extra'
      ) {
        result[key] = result[key].trim();
      } else {
        result[key] = result[key].trim().toUpperCase();
      }
    } else if (result[key] && typeof result[key] === 'object') {
      result[key] = toUpperObject(result[key]);
    }
  }

  return result;
}
