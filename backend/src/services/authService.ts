import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity-secret-key-inventario-2026';

export interface LoginInput {
  username: string;
  password: string;
}

export class AuthService {
  /**
   * Garantiza que exista al menos un usuario administrador por defecto
   */
  static async ensureDefaultAdmin() {
    try {
      const adminCount = await prisma.user.count();
      if (adminCount === 0) {
        const passwordHash = await bcrypt.hash('admin', 10);
        await prisma.user.create({
          data: {
            username: 'ADMIN',
            passwordHash,
            name: 'Administrador',
            role: 'ADMIN',
          },
        });
        console.log('🔑 Usuario administrador inicial creado: [Usuario: admin, Contraseña: admin]');
      }
    } catch (error) {
      console.error('Error al inicializar usuario admin por defecto:', error);
    }
  }

  static async login({ username, password }: LoginInput) {
    const cleanUsername = username.trim().toUpperCase();

    // Buscar usuario insensible a mayúsculas
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
        },
      },
    });

    if (!user) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    const isMatch = await bcrypt.compare(password.trim(), user.passwordHash);
    if (!isMatch) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    // Generar Token JWT con vigencia de 7 días
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        role: user.role,
      },
    };
  }

  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, name: true, role: true },
      });
      return user;
    } catch {
      return null;
    }
  }
}
