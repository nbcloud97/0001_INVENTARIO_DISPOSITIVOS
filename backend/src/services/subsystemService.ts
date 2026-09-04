import { prisma } from '../config/prisma';

export interface CreateSubsystemInput {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface UpdateSubsystemInput extends Partial<CreateSubsystemInput> {}

export class SubsystemService {
  static async getAll() {
    return prisma.subsystem.findMany({
      include: {
        _count: {
          select: { devices: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async getById(id: string) {
    return prisma.subsystem.findUnique({
      where: { id }
    });
  }

  static async create(data: CreateSubsystemInput) {
    return prisma.subsystem.create({ data });
  }

  static async update(id: string, data: UpdateSubsystemInput) {
    return prisma.subsystem.update({
      where: { id },
      data
    });
  }

  static async delete(id: string) {
    const devicesCount = await prisma.device.count({ where: { subsystemId: id } });
    if (devicesCount > 0) {
      throw new Error(`No se puede eliminar el subsistema porque está asignado a ${devicesCount} dispositivo(s)`);
    }

    const typesCount = await prisma.deviceType.count({ where: { subsystemId: id } });
    if (typesCount > 0) {
      throw new Error(`No se puede eliminar el subsistema porque tiene ${typesCount} tipo(s) de dispositivo asociado(s)`);
    }

    return prisma.subsystem.delete({
      where: { id }
    });
  }
}
