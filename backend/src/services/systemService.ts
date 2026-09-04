import { prisma } from '../config/prisma';

export interface CreateSystemInput {
  name: string;
  code?: string;
  description?: string;
  notes?: string;
  clientId: string;
  subsystemId?: string;
}

export interface UpdateSystemInput extends Partial<CreateSystemInput> {}

export class SystemService {
  static async getAll(clientId?: string) {
    const where = clientId ? { clientId } : {};
    return prisma.system.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        subsystem: { select: { id: true, name: true, color: true, icon: true } },
        _count: { select: { devices: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async getById(id: string) {
    return prisma.system.findUnique({
      where: { id },
      include: {
        client: true,
        subsystem: true,
        devices: true
      }
    });
  }

  static async create(data: CreateSystemInput) {
    return prisma.system.create({
      data,
      include: {
        client: { select: { id: true, name: true } },
        subsystem: { select: { id: true, name: true, color: true, icon: true } }
      }
    });
  }

  static async update(id: string, data: UpdateSystemInput) {
    return prisma.system.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, name: true } },
        subsystem: { select: { id: true, name: true, color: true, icon: true } }
      }
    });
  }

  static async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.device.deleteMany({ where: { systemId: id } });
      return tx.system.delete({ where: { id } });
    });
  }
}
