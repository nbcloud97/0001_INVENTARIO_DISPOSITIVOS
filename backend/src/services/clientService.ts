import { prisma } from '../config/prisma';

export interface CreateClientInput {
  name: string;      // Nombre Comercial (Obligatorio)
  legalName?: string; // Nombre Fiscal
  cif?: string;       // NIF
  manualId?: string;  // ID Manual
  notes?: string;     // Notas
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
    return prisma.client.update({
      where: { id },
      data
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
