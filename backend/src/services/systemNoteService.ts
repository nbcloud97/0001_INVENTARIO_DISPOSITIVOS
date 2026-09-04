import { prisma } from '../config/prisma';

export interface CreateSystemNoteInput {
  systemId: string;
  title?: string;
  content: string;
  createdBy?: string;
}

export interface UpdateSystemNoteInput {
  title?: string;
  content?: string;
}

export class SystemNoteService {
  static async getBySystemId(systemId: string) {
    return prisma.systemNote.findMany({
      where: { systemId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(data: CreateSystemNoteInput) {
    const system = await prisma.system.findUnique({ where: { id: data.systemId } });
    if (!system) throw new Error('El sistema especificado no existe');

    return prisma.systemNote.create({
      data: {
        systemId: data.systemId,
        title: data.title || null,
        content: data.content,
        createdBy: data.createdBy || null,
      },
    });
  }

  static async update(id: string, data: UpdateSystemNoteInput) {
    return prisma.systemNote.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
      },
    });
  }

  static async delete(id: string) {
    return prisma.systemNote.delete({
      where: { id },
    });
  }
}
