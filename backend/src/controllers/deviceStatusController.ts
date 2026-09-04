import { Request, Response } from 'express';
import { DeviceStatusService } from '../services/deviceStatusService';

export class DeviceStatusController {
  static async getAll(req: Request, res: Response) {
    try {
      const statuses = await DeviceStatusService.getAll();
      return res.json({ success: true, data: statuses });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const status = await DeviceStatusService.getById(req.params.id);
      if (!status) return res.status(404).json({ success: false, error: 'Estado no encontrado' });
      return res.json({ success: true, data: status });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, color, description } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'El nombre del estado es obligatorio' });
      }

      const created = await DeviceStatusService.create({ name, color, description });
      return res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updated = await DeviceStatusService.update(req.params.id, req.body);
      return res.json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await DeviceStatusService.delete(req.params.id);
      return res.json({ success: true, message: 'Estado eliminado correctamente' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }
}
