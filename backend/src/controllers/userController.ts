import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthService, ALL_PERMISSIONS } from '../services/authService';

const createUserSchema = z.object({
  username: z.string().min(2, 'El nombre de usuario debe tener al menos 2 caracteres'),
  name: z.string().optional(),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']).default('ADMIN'),
  permissions: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres').optional(),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']).optional(),
  permissions: z.array(z.string()).optional(),
});

export class UserController {
  /**
   * GET /api/v1/users
   * Listar todos los usuarios
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const formatted = users.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        permissions: AuthService.parsePermissions(u.role, u.permissions),
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));

      res.json({ success: true, data: formatted });
    } catch (error: any) {
      console.error('Error al listar usuarios:', error);
      res.status(500).json({ success: false, error: error.message || 'Error al obtener usuarios' });
    }
  }

  /**
   * POST /api/v1/users
   * Crear un nuevo usuario
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const validated = createUserSchema.parse(req.body);
      const cleanUsername = validated.username.trim().toUpperCase();

      // Verificar si ya existe
      const existing = await prisma.user.findFirst({
        where: { username: cleanUsername },
      });

      if (existing) {
        res.status(400).json({ success: false, error: `El nombre de usuario "${cleanUsername}" ya está en uso` });
        return;
      }

      const passwordHash = await bcrypt.hash(validated.password.trim(), 10);
      const permissionsToSave = validated.permissions || (validated.role === 'ADMIN' ? ALL_PERMISSIONS : ['VIEW_INVENTORY']);

      const newUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          name: validated.name ? validated.name.trim() : cleanUsername,
          passwordHash,
          role: validated.role,
          permissions: JSON.stringify(permissionsToSave),
        },
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          permissions: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          permissions: AuthService.parsePermissions(newUser.role, newUser.permissions),
          createdAt: newUser.createdAt,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: error.errors[0]?.message || 'Datos inválidos' });
        return;
      }
      console.error('Error al crear usuario:', error);
      res.status(500).json({ success: false, error: error.message || 'Error al crear usuario' });
    }
  }

  /**
   * PUT /api/v1/users/:id
   * Actualizar usuario
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validated = updateUserSchema.parse(req.body);

      const existing = await prisma.user.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }

      const updateData: any = {};
      if (validated.name !== undefined) {
        updateData.name = validated.name.trim();
      }
      if (validated.role !== undefined) {
        updateData.role = validated.role;
      }
      if (validated.permissions !== undefined) {
        updateData.permissions = JSON.stringify(validated.permissions);
      }
      if (validated.password && validated.password.trim()) {
        updateData.passwordHash = await bcrypt.hash(validated.password.trim(), 10);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          permissions: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: {
          id: updated.id,
          username: updated.username,
          name: updated.name,
          role: updated.role,
          permissions: AuthService.parsePermissions(updated.role, updated.permissions),
          updatedAt: updated.updatedAt,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: error.errors[0]?.message || 'Datos inválidos' });
        return;
      }
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ success: false, error: error.message || 'Error al actualizar usuario' });
    }
  }

  /**
   * DELETE /api/v1/users/:id
   * Eliminar usuario
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.userId;

      if (id === currentUserId) {
        res.status(400).json({ success: false, error: 'No puedes eliminar tu propio usuario en sesión activa' });
        return;
      }

      const totalUsers = await prisma.user.count();
      if (totalUsers <= 1) {
        res.status(400).json({ success: false, error: 'No se puede eliminar el único usuario del sistema' });
        return;
      }

      await prisma.user.delete({
        where: { id },
      });

      res.json({ success: true, data: { message: 'Usuario eliminado correctamente' } });
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ success: false, error: error.message || 'Error al eliminar usuario' });
    }
  }
}
