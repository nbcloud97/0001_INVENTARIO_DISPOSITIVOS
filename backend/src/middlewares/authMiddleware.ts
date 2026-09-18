import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string | null;
    role: string;
  };
}

/**
 * Middleware para proteger rutas mediante verificación de Token JWT
 * Acepta el token tanto en la cabecera 'Authorization: Bearer <token>'
 * como en el parámetro de consulta '?token=<token>' (útil para descargas/previsualizaciones directas)
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;

  // 1. Extraer desde encabezado Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Extraer desde query parameter (fallback para descargas / previsualización en pestaña nueva)
  if (!token && req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Acceso no autorizado: Token JWT no proporcionado',
    });
    return;
  }

  try {
    const user = await AuthService.verifyToken(token);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Sesión expirada o token no válido. Por favor, vuelve a iniciar sesión.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: 'Error al verificar autenticación: ' + error.message,
    });
  }
}
