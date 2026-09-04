import { Request, Response } from 'express';
import { SubsystemService } from '../services/subsystemService';
import { toUpperObject } from '../utils/uppercase';
import { z } from 'zod';

const subsystemSchema = z.object({
  name: z.string().min(1, 'El nombre del subsistema es obligatorio'),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
});

export class SubsystemController {
  static async getAll(req: Request, res: Response) {
    try {
      const subsystems = await SubsystemService.getAll();
      return res.json({ success: true, data: subsystems });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const subsystem = await SubsystemService.getById(req.params.id);
      if (!subsystem) {
        return res.status(404).json({ success: false, error: 'Subsistema no encontrado' });
      }
      return res.json({ success: true, data: subsystem });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validated = subsystemSchema.parse(req.body);
      const upperData = toUpperObject(validated);
      const subsystem = await SubsystemService.create(upperData as any);
      return res.status(201).json({ success: true, data: subsystem });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const validated = subsystemSchema.partial().parse(req.body);
      const upperData = toUpperObject(validated);
      const subsystem = await SubsystemService.update(req.params.id, upperData as any);
      return res.json({ success: true, data: subsystem });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await SubsystemService.delete(req.params.id);
      return res.json({ success: true, message: 'Subsistema eliminado correctamente' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
