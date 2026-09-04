import { prisma } from '../config/prisma';

export interface CreateDeviceStatusInput {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateDeviceStatusInput extends Partial<CreateDeviceStatusInput> {}

export class DeviceStatusService {
  static async getAll() {
    return prisma.deviceStatus.findMany({
      include: {
        _count: {
          select: { devices: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getById(id: string) {
    return prisma.deviceStatus.findUnique({
      where: { id },
      include: {
        _count: {
          select: { devices: true },
        },
      },
    });
  }

  static async create(data: CreateDeviceStatusInput) {
    const existing = await prisma.deviceStatus.findUnique({ where: { name: data.name.trim() } });
    if (existing) throw new Error(`El estado "${data.name}" ya existe`);

    return prisma.deviceStatus.create({
      data: {
        name: data.name.trim(),
        color: data.color || '#10b981',
        description: data.description || null,
      },
    });
  }

  static async update(id: string, data: UpdateDeviceStatusInput) {
    const existing = await prisma.deviceStatus.findUnique({ where: { id } });
    if (!existing) throw new Error('El estado especificado no existe');

    if (data.name && data.name.trim().toUpperCase() !== existing.name.toUpperCase()) {
      const nameConflict = await prisma.deviceStatus.findUnique({ where: { name: data.name.trim() } });
      if (nameConflict) throw new Error(`El estado "${data.name}" ya existe`);
    }

    return prisma.deviceStatus.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
      },
    });
  }

  static async delete(id: string) {
    const existing = await prisma.deviceStatus.findUnique({ where: { id } });
    if (!existing) throw new Error('El estado no existe');

    const associatedDevicesCount = await prisma.device.count({
      where: { statusId: id },
    });

    if (associatedDevicesCount > 0) {
      throw new Error(
        `No se puede eliminar el estado "${existing.name}" porque está asignado a ${associatedDevicesCount} dispositivo(s) en el inventario.`
      );
    }

    return prisma.deviceStatus.delete({
      where: { id },
    });
  }
}
