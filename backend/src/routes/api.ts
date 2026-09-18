import { Router } from 'express';
import { ClientController } from '../controllers/clientController';
import { SubsystemController } from '../controllers/subsystemController';
import { SystemController } from '../controllers/systemController';
import { DeviceController } from '../controllers/deviceController';
import { AuthController } from '../controllers/authController';
import { SystemNoteController } from '../controllers/systemNoteController';
import { SystemAttachmentController, uploadMiddleware } from '../controllers/systemAttachmentController';
import { DeviceTypeController } from '../controllers/deviceTypeController';
import { DeviceStatusController } from '../controllers/deviceStatusController';
import { Beta10Controller } from '../controllers/beta10Controller';
import { BackupController } from '../controllers/backupController';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middlewares/authMiddleware';
import multer from 'multer';

const jsonUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

export const apiRouter = Router();

// =========================================================================
// 1. Rutas Públicas (Sin autenticación)
// =========================================================================
apiRouter.post('/auth/login', AuthController.login);

// =========================================================================
// 2. Rutas Protegidas (Requieren Token JWT válido)
// =========================================================================

// Autenticación de sesión activa
apiRouter.get('/auth/me', authenticateToken, AuthController.me);

// Rutas de Clientes
apiRouter.get('/clients', authenticateToken, ClientController.getAll);
apiRouter.get('/clients/:id', authenticateToken, ClientController.getById);
apiRouter.post('/clients', authenticateToken, ClientController.create);
apiRouter.put('/clients/:id', authenticateToken, ClientController.update);
apiRouter.delete('/clients/:id', authenticateToken, ClientController.delete);

// Rutas de Subsistemas
apiRouter.get('/subsystems', authenticateToken, SubsystemController.getAll);
apiRouter.get('/subsystems/:id', authenticateToken, SubsystemController.getById);
apiRouter.post('/subsystems', authenticateToken, SubsystemController.create);
apiRouter.put('/subsystems/:id', authenticateToken, SubsystemController.update);
apiRouter.delete('/subsystems/:id', authenticateToken, SubsystemController.delete);

// Rutas de Tipos de Dispositivo (Catálogo por Subsistema)
apiRouter.get('/device-types', authenticateToken, DeviceTypeController.getAll);
apiRouter.get('/device-types/:id', authenticateToken, DeviceTypeController.getById);
apiRouter.post('/device-types', authenticateToken, DeviceTypeController.create);
apiRouter.put('/device-types/:id', authenticateToken, DeviceTypeController.update);
apiRouter.delete('/device-types/:id', authenticateToken, DeviceTypeController.delete);

// Rutas de Estados de Dispositivo (Configuración de Estados)
apiRouter.get('/device-statuses', authenticateToken, DeviceStatusController.getAll);
apiRouter.get('/device-statuses/:id', authenticateToken, DeviceStatusController.getById);
apiRouter.post('/device-statuses', authenticateToken, DeviceStatusController.create);
apiRouter.put('/device-statuses/:id', authenticateToken, DeviceStatusController.update);
apiRouter.delete('/device-statuses/:id', authenticateToken, DeviceStatusController.delete);

// Rutas de Sistemas (Jerarquía Cliente -> Sistema -> Dispositivos, Notas & Adjuntos)
apiRouter.get('/systems', authenticateToken, SystemController.getAll);
apiRouter.get('/systems/:id', authenticateToken, SystemController.getById);
apiRouter.post('/systems', authenticateToken, SystemController.create);
apiRouter.put('/systems/:id', authenticateToken, SystemController.update);
apiRouter.delete('/systems/:id', authenticateToken, SystemController.delete);

// Rutas de Notas de Sistema
apiRouter.get('/systems/:systemId/notes', authenticateToken, SystemNoteController.getBySystemId);
apiRouter.post('/systems/notes', authenticateToken, SystemNoteController.create);
apiRouter.put('/systems/notes/:id', authenticateToken, SystemNoteController.update);
apiRouter.delete('/systems/notes/:id', authenticateToken, SystemNoteController.delete);

// Rutas de Archivos Adjuntos de Sistema
apiRouter.get('/systems/:systemId/attachments', authenticateToken, SystemAttachmentController.getBySystemId);
apiRouter.post('/systems/attachments', authenticateToken, uploadMiddleware, SystemAttachmentController.upload);
apiRouter.get('/systems/attachments/:id/download', authenticateToken, SystemAttachmentController.download);
apiRouter.get('/systems/attachments/:id/preview', authenticateToken, SystemAttachmentController.preview);
apiRouter.put('/systems/attachments/:id', authenticateToken, SystemAttachmentController.update);
apiRouter.delete('/systems/attachments/:id', authenticateToken, SystemAttachmentController.delete);

// Rutas de Dispositivos
apiRouter.get('/devices', authenticateToken, DeviceController.getAll);
apiRouter.get('/devices/:id', authenticateToken, DeviceController.getById);
apiRouter.get('/devices/:id/credentials', authenticateToken, DeviceController.getCredentials);
apiRouter.post('/devices', authenticateToken, DeviceController.create);
apiRouter.post('/devices/bulk', authenticateToken, DeviceController.createBulk);
apiRouter.post('/devices/import', authenticateToken, DeviceController.importDevices);
apiRouter.put('/devices/:id', authenticateToken, DeviceController.update);
apiRouter.delete('/devices/:id', authenticateToken, DeviceController.delete);

// Rutas de Integración con Oracle ERP Beta 10
apiRouter.get('/beta10/search', authenticateToken, Beta10Controller.searchClients);
apiRouter.get('/beta10/clients/:idcliente/systems', authenticateToken, Beta10Controller.getClientSystems);
apiRouter.post('/beta10/import', authenticateToken, Beta10Controller.importClient);

// Rutas de Copias de Seguridad y Restauración
apiRouter.get('/backup/stats', authenticateToken, BackupController.getStats);
apiRouter.get('/backup/export', authenticateToken, BackupController.exportBackup);
apiRouter.post('/backup/restore', authenticateToken, jsonUpload.single('file'), BackupController.restoreBackup);

// Rutas de Gestión de Usuarios y Permisos
apiRouter.get('/users', authenticateToken, UserController.getAll);
apiRouter.post('/users', authenticateToken, UserController.create);
apiRouter.put('/users/:id', authenticateToken, UserController.update);
apiRouter.delete('/users/:id', authenticateToken, UserController.delete);
