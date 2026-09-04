import { Request, Response } from 'express';
import { DeviceService } from '../services/deviceService';
import { toUpperObject } from '../utils/uppercase';
import { z } from 'zod';

const credentialItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  notes: z.string().optional(),
});

// Zod validation: Permite array de múltiples credenciales por dispositivo
const createDeviceSchema = z.object({
  systemId: z.string().min(1, 'El sistema es obligatorio'),
  clientId: z.string().optional(),
  subsystemId: z.string().min(1, 'El subsistema es obligatorio'),
  assignedName: z.string().min(1, 'El nombre asignado al dispositivo es obligatorio'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  credentials: z.array(credentialItemSchema).optional(),
  rackCabinet: z.string().optional(),
  switchName: z.string().optional(),
  switchPort: z.string().optional(),
  notes: z.string().optional(),
});

const bulkCreateDeviceSchema = z.object({
  systemId: z.string().min(1, 'El sistema es obligatorio'),
  clientId: z.string().optional(),
  subsystemId: z.string().min(1, 'El subsistema es obligatorio'),
  baseName: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  startNumber: z.number().int().min(1).default(1),
  count: z.number().int().min(1).max(500).default(10),
  startIpAddress: z.string().optional(),
  rackCabinet: z.string().optional(),
  switchName: z.string().optional(),
  startSwitchPort: z.number().int().optional(),
  credentials: z.array(credentialItemSchema).optional(),
  notes: z.string().optional(),
});

const importDevicesSchema = z.object({
  systemId: z.string().min(1, 'El sistema es obligatorio'),
  items: z.array(
    z.object({
      subsystemName: z.string().optional(),
      subsystemId: z.string().optional(),
      assignedName: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      serialNumber: z.string().optional(),
      ipAddress: z.string().optional(),
      macAddress: z.string().optional(),
      rackCabinet: z.string().optional(),
      switchName: z.string().optional(),
      switchPort: z.string().optional(),
      notes: z.string().optional(),
      credentials: z.array(credentialItemSchema).optional(),
    })
  ).min(1, 'Debes enviar al menos un dispositivo para importar'),
});

export class DeviceController {
  static async getAll(req: Request, res: Response) {
    try {
      const { systemId, clientId, subsystemId, search, rackCabinet } = req.query;
      const devices = await DeviceService.getAll({
        systemId: systemId as string,
        clientId: clientId as string,
        subsystemId: subsystemId as string,
        search: search as string,
        rackCabinet: rackCabinet as string,
      });
      return res.json({ success: true, data: devices });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const device = await DeviceService.getById(req.params.id);
      if (!device) {
        return res.status(404).json({ success: false, error: 'Dispositivo no encontrado' });
      }
      return res.json({ success: true, data: device });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getCredentials(req: Request, res: Response) {
    try {
      const credentials = await DeviceService.getCredentials(req.params.id);
      return res.json({ success: true, data: credentials });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validated = createDeviceSchema.parse(req.body);
      const upperData = toUpperObject(validated);
      const device = await DeviceService.create(upperData as any);
      return res.status(201).json({ success: true, data: device });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createBulk(req: Request, res: Response) {
    try {
      const validated = bulkCreateDeviceSchema.parse(req.body);
      const upperData = toUpperObject(validated);
      const result = await DeviceService.createBulk(upperData as any);
      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async importDevices(req: Request, res: Response) {
    try {
      const validated = importDevicesSchema.parse(req.body);
      const upperData = toUpperObject(validated);
      const result = await DeviceService.importDevices(upperData.systemId, upperData.items as any);
      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const validated = createDeviceSchema.partial().parse(req.body);
      const upperData = toUpperObject(validated);
      const device = await DeviceService.update(req.params.id, upperData as any);
      return res.json({ success: true, data: device });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await DeviceService.delete(req.params.id);
      return res.json({ success: true, message: 'Dispositivo eliminado correctamente' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
