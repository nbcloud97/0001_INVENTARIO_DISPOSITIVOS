import { Request, Response } from 'express';
import { oracleBeta10Service } from '../services/oracleBeta10Service';

export class Beta10Controller {
  /**
   * GET /api/v1/beta10/search?q=...
   * Buscar clientes en Beta 10
   */
  static async searchClients(req: Request, res: Response): Promise<void> {
    try {
      const query = (req.query.q as string) || '';
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const clients = await oracleBeta10Service.searchClients(query, limit);
      res.json({ success: true, data: clients });
    } catch (error: any) {
      console.error('Error buscando clientes en Beta 10:', error);
      res.status(500).json({ success: false, error: error.message || 'Error al conectar con Beta 10' });
    }
  }

  /**
   * GET /api/v1/beta10/clients/:idcliente/systems
   * Obtener cliente y sus sistemas desde Beta 10
   */
  static async getClientSystems(req: Request, res: Response): Promise<void> {
    try {
      const idcliente = Number(req.params.idcliente);
      if (isNaN(idcliente)) {
        res.status(400).json({ success: false, error: 'El ID de cliente debe ser un número válido' });
        return;
      }

      const clientData = await oracleBeta10Service.getClientWithSystems(idcliente);
      res.json({ success: true, data: clientData });
    } catch (error: any) {
      console.error(`Error obteniendo sistemas del cliente ${req.params.idcliente} en Beta 10:`, error);
      res.status(500).json({ success: false, error: error.message || 'Error al obtener datos de Beta 10' });
    }
  }

  /**
   * POST /api/v1/beta10/import
   * Importar cliente y sistemas seleccionados
   */
  static async importClient(req: Request, res: Response): Promise<void> {
    try {
      const { idcliente, selectedSystemIds } = req.body;

      if (!idcliente || isNaN(Number(idcliente))) {
        res.status(400).json({ success: false, error: 'Debes proporcionar un ID de cliente válido' });
        return;
      }

      const parsedSystemIds = Array.isArray(selectedSystemIds)
        ? selectedSystemIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
        : undefined;

      const result = await oracleBeta10Service.importClientAndSystems(
        Number(idcliente),
        parsedSystemIds
      );

      res.status(200).json({
        success: true,
        data: {
          message: 'Importación desde Beta 10 completada con éxito',
          ...result,
        },
      });
    } catch (error: any) {
      console.error('Error al importar cliente desde Beta 10:', error);
      res.status(500).json({ success: false, error: error.message || 'Error al importar desde Beta 10' });
    }
  }
}
