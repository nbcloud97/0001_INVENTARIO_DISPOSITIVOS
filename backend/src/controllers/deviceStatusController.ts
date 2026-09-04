import { Request, Response } from 'express';
import { DeviceStatusService } from '../services/deviceStatusService';

export class DeviceStatusController {
  static async getAll(req: Request, res: Response) {
    try {
      const statuses = await DeviceStatusService.getAll();
      res.json(statuses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const status = await DeviceStatusService.getById(req.params.id);
      if (!status) return res.status(404).json({ error: 'Estado no encontrado' });
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, color, description } = req.body;
      if (!name) return res.status(400).json({ error: 'El nombre del estado es obligatorio' });

      const created = await DeviceStatusService.create({ name, color, description });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updated = await DeviceStatusService.update(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await DeviceStatusService.delete(req.params.id);
      res.json({ message: 'Estado eliminado correctamente' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
