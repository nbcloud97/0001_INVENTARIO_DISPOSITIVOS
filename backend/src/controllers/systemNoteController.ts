import { Request, Response } from 'express';
import { SystemNoteService } from '../services/systemNoteService';
import { toUpperObject } from '../utils/uppercase';
import { z } from 'zod';

const createSystemNoteSchema = z.object({
  systemId: z.string().min(1, 'El sistema es obligatorio'),
  title: z.string().optional(),
  content: z.string().min(1, 'El contenido de la nota es obligatorio'),
  createdBy: z.string().optional(),
});

export class SystemNoteController {
  static async getBySystemId(req: Request, res: Response) {
    try {
      const notes = await SystemNoteService.getBySystemId(req.params.systemId);
      return res.json({ success: true, data: notes });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validated = createSystemNoteSchema.parse(req.body);
      const upperData = toUpperObject(validated);
      const note = await SystemNoteService.create(upperData as any);
      return res.status(201).json({ success: true, data: note });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const validated = createSystemNoteSchema.partial().parse(req.body);
      const upperData = toUpperObject(validated);
      const note = await SystemNoteService.update(req.params.id, upperData as any);
      return res.json({ success: true, data: note });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await SystemNoteService.delete(req.params.id);
      return res.json({ success: true, message: 'Nota eliminada correctamente' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
