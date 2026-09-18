import { prisma } from '../config/prisma';

export interface CreateClientInput {
  name: string;       // Nombre Comercial (Obligatorio)
  legalName?: string;  // Nombre Fiscal
  cif?: string;        // NIF
  manualId?: string;   // ID Manual
  notes?: string;      // Notas
  isArchived?: boolean;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}

export class ClientService {
  static async getAll() {
    return prisma.client.findMany({
      include: {
        _count: {
          select: { systems: true, devices: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async getById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        systems: {
          include: {
            subsystem: true,
            _count: { select: { devices: true } }
          }
        }
      }
    });
  }

  static async create(data: CreateClientInput) {
    return prisma.client.create({ data });
  }

  static async update(id: string, data: UpdateClientInput) {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.update({
        where: { id },
        data,
      });

      if (typeof data.isArchived === 'boolean') {
        await tx.system.updateMany({
          where: { clientId: id },
          data: { isArchived: data.isArchived },
        });
      }

      return client;
    });
  }

  static async delete(id: string) {
    // Para evitar cualquier fallo de restricción de clave foránea en SQLite (Foreign Key constraint),
    // eliminamos explícitamente en transacción: Dispositivos -> Sistemas -> Cliente
    return prisma.$transaction(async (tx) => {
      await tx.device.deleteMany({ where: { clientId: id } });
      await tx.system.deleteMany({ where: { clientId: id } });
      return tx.client.delete({ where: { id } });
    });
  }
}
