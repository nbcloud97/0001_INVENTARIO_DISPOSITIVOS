import { Request, Response } from 'express';
import { DeviceTypeService } from '../services/deviceTypeService';
import { z } from 'zod';

const createDeviceTypeSchema = z.object({
  name: z.string().min(1, 'El nombre del tipo de dispositivo es obligatorio'),
  description: z.string().optional(),
  subsystemId: z.string().min(1, 'El subsistema es obligatorio'),
});

export class DeviceTypeController {
  static async getAll(req: Request, res: Response) {
    try {
      const { subsystemId } = req.query;
      const deviceTypes = await DeviceTypeService.getAll(subsystemId as string | undefined);
      return res.json({ success: true, data: deviceTypes });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const deviceType = await DeviceTypeService.getById(req.params.id);
      if (!deviceType) {
        return res.status(404).json({ success: false, error: 'Tipo de dispositivo no encontrado' });
      }
      return res.json({ success: true, data: deviceType });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validated = createDeviceTypeSchema.parse(req.body);
      const deviceType = await DeviceTypeService.create({
        name: validated.name.trim(),
        description: validated.description ? validated.description.trim() : undefined,
        subsystemId: validated.subsystemId,
      });
      return res.status(201).json({ success: true, data: deviceType });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const validated = createDeviceTypeSchema.partial().parse(req.body);
      const deviceType = await DeviceTypeService.update(req.params.id, {
        ...(validated.name ? { name: validated.name.trim() } : {}),
        ...(validated.description !== undefined ? { description: validated.description.trim() } : {}),
        ...(validated.subsystemId ? { subsystemId: validated.subsystemId } : {}),
      });
      return res.json({ success: true, data: deviceType });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await DeviceTypeService.delete(req.params.id);
      return res.json({ success: true, message: 'Tipo de dispositivo eliminado correctamente' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
