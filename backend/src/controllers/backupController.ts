import { Request, Response } from 'express';
import { backupService } from '../services/backupService';

export class BackupController {
  /**
   * GET /api/v1/backup/stats
   * Estadísticas de la base de datos
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await backupService.getDatabaseStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('Error al obtener estadísticas para backup:', error);
      res.status(500).json({ success: false, error: error.message || 'Error al obtener estadísticas' });
    }
  }

  /**
   * GET /api/v1/backup/export
   * Descargar copia de seguridad completa en formato JSON
   */
  static async exportBackup(req: Request, res: Response): Promise<void> {
    try {
      const backup = await backupService.exportFullBackup();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `backup_inventario_${dateStr}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(backup, null, 2));
    } catch (error: any) {
      console.error('Error al exportar copia de seguridad:', error);
      res.status(500).json({ success: false, error: error.message || 'Error al exportar copia de seguridad' });
    }
  }

  /**
   * POST /api/v1/backup/restore
   * Restaurar copia de seguridad desde archivo o JSON
   */
  static async restoreBackup(req: Request, res: Response): Promise<void> {
    try {
      let backupData = req.body;

      // Si se subió como archivo multipart/form-data
      if (req.file) {
        const fileContent = req.file.buffer.toString('utf-8');
        try {
          backupData = JSON.parse(fileContent);
        } catch (e) {
          res.status(400).json({ success: false, error: 'El archivo subido no es un JSON válido' });
          return;
        }
      }

      if (!backupData || !backupData.metadata) {
        res.status(400).json({
          success: false,
          error: 'Estructura de copia de seguridad no válida. Debe contener metadatos del aplicativo.',
        });
        return;
      }

      const result = await backupService.restoreBackup(backupData);

      res.json({
        success: true,
        data: {
          message: 'Copia de seguridad restaurada correctamente',
          ...result,
        },
      });
    } catch (error: any) {
      console.error('Error al restaurar copia de seguridad:', error);
      res.status(500).json({ success: false, error: error.message || 'Error al restaurar copia de seguridad' });
    }
  }
}
