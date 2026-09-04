import { prisma } from '../config/prisma';

export interface CreateDeviceTypeInput {
  name: string;
  description?: string;
  subsystemId: string;
}

export interface UpdateDeviceTypeInput extends Partial<CreateDeviceTypeInput> {}

export class DeviceTypeService {
  static async getAll(subsystemId?: string) {
    return prisma.deviceType.findMany({
      where: subsystemId ? { subsystemId } : undefined,
      include: {
        subsystem: true,
      },
      orderBy: [
        { subsystem: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  static async getById(id: string) {
    return prisma.deviceType.findUnique({
      where: { id },
      include: { subsystem: true },
    });
  }

  static async create(data: CreateDeviceTypeInput) {
    const subsystem = await prisma.subsystem.findUnique({ where: { id: data.subsystemId } });
    if (!subsystem) throw new Error('El subsistema especificado no existe');

    return prisma.deviceType.create({
      data: {
        name: data.name,
        description: data.description || null,
        subsystemId: data.subsystemId,
      },
      include: { subsystem: true },
    });
  }

  static async update(id: string, data: UpdateDeviceTypeInput) {
    const existing = await prisma.deviceType.findUnique({ where: { id } });
    if (!existing) throw new Error('El tipo de dispositivo no existe');

    if (data.subsystemId) {
      const subsystem = await prisma.subsystem.findUnique({ where: { id: data.subsystemId } });
      if (!subsystem) throw new Error('El subsistema especificado no existe');
    }

    return prisma.deviceType.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.subsystemId !== undefined ? { subsystemId: data.subsystemId } : {}),
      },
      include: { subsystem: true },
    });
  }

  static async delete(id: string) {
    const existing = await prisma.deviceType.findUnique({ where: { id } });
    if (!existing) throw new Error('El tipo de dispositivo no existe');

    const associatedDevicesCount = await prisma.device.count({
      where: { deviceTypeId: id },
    });

    if (associatedDevicesCount > 0) {
      throw new Error(
        `No se puede eliminar el tipo de dispositivo "${existing.name}" porque está asociado a ${associatedDevicesCount} dispositivo(s) en el inventario. Reasigna o elimina primero los dispositivos asociados.`
      );
    }

    return prisma.deviceType.delete({
      where: { id },
    });
  }
}
