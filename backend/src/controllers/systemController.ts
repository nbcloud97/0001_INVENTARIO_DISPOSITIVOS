import { Request, Response } from 'express';
import { SystemService } from '../services/systemService';
import { toUpperObject } from '../utils/uppercase';
import { z } from 'zod';

const systemSchema = z.object({
  name: z.string().min(1, 'El nombre del sistema es obligatorio'),
  code: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  clientId: z.string().min(1, 'El cliente asociado es obligatorio'),
  subsystemId: z.string().optional(),
});

export class SystemController {
  static async getAll(req: Request, res: Response) {
    try {
      const clientId = req.query.clientId as string | undefined;
      const systems = await SystemService.getAll(clientId);
      return res.json({ success: true, data: systems });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const system = await SystemService.getById(req.params.id);
      if (!system) {
        return res.status(404).json({ success: false, error: 'Sistema no encontrado' });
      }
      return res.json({ success: true, data: system });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validated = systemSchema.parse(req.body);
      const upperData = toUpperObject(validated);
      const system = await SystemService.create(upperData as any);
      return res.status(201).json({ success: true, data: system });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const validated = systemSchema.partial().parse(req.body);
      const upperData = toUpperObject(validated);
      const system = await SystemService.update(req.params.id, upperData as any);
      return res.json({ success: true, data: system });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await SystemService.delete(req.params.id);
      return res.json({ success: true, message: 'Sistema eliminado correctamente' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
