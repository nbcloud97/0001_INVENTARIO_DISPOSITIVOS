import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(validated);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(401).json({ success: false, error: error.message });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Token no proporcionado' });
      }

      const token = authHeader.split(' ')[1];
      const user = await AuthService.verifyToken(token);

      if (!user) {
        return res.status(401).json({ success: false, error: 'Sesión expirada o no válida' });
      }

      return res.json({ success: true, data: user });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
