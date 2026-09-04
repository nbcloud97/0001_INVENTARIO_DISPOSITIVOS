import { prisma } from '../config/prisma';
import fs from 'fs';
import path from 'path';

export interface CreateSystemAttachmentInput {
  systemId: string;
  filename: string;
  storedName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdBy?: string;
}

export class SystemAttachmentService {
  static async getBySystemId(systemId: string) {
    return prisma.systemAttachment.findMany({
      where: { systemId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string) {
    return prisma.systemAttachment.findUnique({
      where: { id },
    });
  }

  static async create(data: CreateSystemAttachmentInput) {
    const system = await prisma.system.findUnique({ where: { id: data.systemId } });
    if (!system) throw new Error('El sistema especificado no existe');

    return prisma.systemAttachment.create({
      data: {
        systemId: data.systemId,
        filename: data.filename,
        storedName: data.storedName,
        filePath: data.filePath,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        createdBy: data.createdBy || null,
      },
    });
  }

  static async delete(id: string) {
    const attachment = await prisma.systemAttachment.findUnique({ where: { id } });
    if (!attachment) throw new Error('Adjunto no encontrado');

    // Eliminar archivo físico de disco si existe
    if (fs.existsSync(attachment.filePath)) {
      try {
        fs.unlinkSync(attachment.filePath);
      } catch (err) {
        console.error('Error al eliminar archivo físico:', err);
      }
    }

    return prisma.systemAttachment.delete({
      where: { id },
    });
  }
}
