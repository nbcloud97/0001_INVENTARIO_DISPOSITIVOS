import { Request, Response } from 'express';
import { ClientService } from '../services/clientService';
import { toUpperObject } from '../utils/uppercase';
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre comercial del cliente es obligatorio'),
  legalName: z.string().optional(),
  cif: z.string().optional(),
  manualId: z.string().optional(),
  notes: z.string().optional(),
});

export class ClientController {
  static async getAll(req: Request, res: Response) {
    try {
      const clients = await ClientService.getAll();
      return res.json({ success: true, data: clients });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const client = await ClientService.getById(req.params.id);
      if (!client) {
        return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
      }
      return res.json({ success: true, data: client });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validated = clientSchema.parse(req.body);
      const upperData = toUpperObject(validated);
      const client = await ClientService.create(upperData as any);
      return res.status(201).json({ success: true, data: client });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const validated = clientSchema.partial().parse(req.body);
      const upperData = toUpperObject(validated);
      const client = await ClientService.update(req.params.id, upperData as any);
      return res.json({ success: true, data: client });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await ClientService.delete(req.params.id);
      return res.json({ success: true, message: 'Cliente eliminado correctamente' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
