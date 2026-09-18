import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity-secret-key-inventario-2026';

export const ALL_PERMISSIONS = [
  'VIEW_INVENTORY',
  'EDIT_INVENTORY',
  'DELETE_RECORDS',
  'VIEW_PASSWORDS',
  'BETA10_IMPORT',
  'MANAGE_TYPES',
  'MANAGE_USERS',
  'MANAGE_BACKUPS',
];

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
        const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        await prisma.user.create({
          data: {
            username: 'ADMIN',
            passwordHash,
            name: 'Administrador',
            role: 'ADMIN',
            permissions: JSON.stringify(ALL_PERMISSIONS),
          },
        });
        console.log(`🔑 Usuario administrador inicial creado: [Usuario: admin, Contraseña: ${defaultPassword}]`);
      }
    } catch (error) {
      console.error('Error al inicializar usuario admin por defecto:', error);
    }
  }

  static parsePermissions(role: string, rawPermissions?: string | null): string[] {
    if (rawPermissions) {
      try {
        const parsed = JSON.parse(rawPermissions);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback
      }
    }
    if (role === 'ADMIN') {
      return ALL_PERMISSIONS;
    }
    return ['VIEW_INVENTORY'];
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

    const permissions = AuthService.parsePermissions(user.role, user.permissions);

    // Generar Token JWT con vigencia de 7 días
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions,
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
        permissions,
      },
    };
  }

  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, name: true, role: true, permissions: true },
      });
      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: AuthService.parsePermissions(user.role, user.permissions),
      };
    } catch {
      return null;
    }
  }
}
