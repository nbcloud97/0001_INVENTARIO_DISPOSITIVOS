import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { SystemAttachmentService } from '../services/systemAttachmentService';

const uploadDir = path.join(process.cwd(), 'uploads/systems');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `attach-${uniqueSuffix}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Límite de 50MB por archivo
}).single('file');

export class SystemAttachmentController {
  static async getBySystemId(req: Request, res: Response) {
    try {
      const attachments = await SystemAttachmentService.getBySystemId(req.params.systemId);
      return res.json({ success: true, data: attachments });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async upload(req: Request, res: Response) {
    try {
      const file = (req as any).file;
      const { systemId } = req.body;

      if (!file) {
        return res.status(400).json({ success: false, error: 'Debes adjuntar un archivo válido' });
      }
      if (!systemId) {
        return res.status(400).json({ success: false, error: 'El ID del sistema es obligatorio' });
      }

      const attachment = await SystemAttachmentService.create({
        systemId,
        filename: file.originalname,
        storedName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
      });

      return res.status(201).json({ success: true, data: attachment });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async download(req: Request, res: Response) {
    try {
      const attachment = await SystemAttachmentService.getById(req.params.id);
      if (!attachment) {
        return res.status(404).json({ success: false, error: 'Adjunto no encontrado' });
      }

      if (!fs.existsSync(attachment.filePath)) {
        return res.status(404).json({ success: false, error: 'El archivo físico no se encuentra en el servidor' });
      }

      return res.download(attachment.filePath, attachment.filename);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async preview(req: Request, res: Response) {
    try {
      const attachment = await SystemAttachmentService.getById(req.params.id);
      if (!attachment) {
        return res.status(404).json({ success: false, error: 'Adjunto no encontrado' });
      }

      if (!fs.existsSync(attachment.filePath)) {
        return res.status(404).json({ success: false, error: 'El archivo físico no se encuentra en el servidor' });
      }

      const mimeType = attachment.mimeType || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.filename)}"`);
      return res.sendFile(path.resolve(attachment.filePath));
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await SystemAttachmentService.delete(req.params.id);
      return res.json({ success: true, message: 'Archivo adjunto eliminado correctamente' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
