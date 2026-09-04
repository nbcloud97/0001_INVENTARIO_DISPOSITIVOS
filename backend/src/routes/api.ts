import { Router } from 'express';
import { ClientController } from '../controllers/clientController';
import { SubsystemController } from '../controllers/subsystemController';
import { SystemController } from '../controllers/systemController';
import { DeviceController } from '../controllers/deviceController';
import { AuthController } from '../controllers/authController';
import { SystemNoteController } from '../controllers/systemNoteController';

export const apiRouter = Router();

// Rutas de Autenticación
apiRouter.post('/auth/login', AuthController.login);
apiRouter.get('/auth/me', AuthController.me);

// Rutas de Clientes
apiRouter.get('/clients', ClientController.getAll);
apiRouter.get('/clients/:id', ClientController.getById);
apiRouter.post('/clients', ClientController.create);
apiRouter.put('/clients/:id', ClientController.update);
apiRouter.delete('/clients/:id', ClientController.delete);

// Rutas de Subsistemas
apiRouter.get('/subsystems', SubsystemController.getAll);
apiRouter.get('/subsystems/:id', SubsystemController.getById);
apiRouter.post('/subsystems', SubsystemController.create);
apiRouter.put('/subsystems/:id', SubsystemController.update);
apiRouter.delete('/subsystems/:id', SubsystemController.delete);

// Rutas de Sistemas (Jerarquía Cliente -> Sistema -> Dispositivos & Notas)
apiRouter.get('/systems', SystemController.getAll);
apiRouter.get('/systems/:id', SystemController.getById);
apiRouter.post('/systems', SystemController.create);
apiRouter.put('/systems/:id', SystemController.update);
apiRouter.delete('/systems/:id', SystemController.delete);

// Rutas de Notas de Sistema
apiRouter.get('/systems/:systemId/notes', SystemNoteController.getBySystemId);
apiRouter.post('/systems/notes', SystemNoteController.create);
apiRouter.put('/systems/notes/:id', SystemNoteController.update);
apiRouter.delete('/systems/notes/:id', SystemNoteController.delete);

// Rutas de Dispositivos
apiRouter.get('/devices', DeviceController.getAll);
apiRouter.get('/devices/:id', DeviceController.getById);
apiRouter.get('/devices/:id/credentials', DeviceController.getCredentials);
apiRouter.post('/devices', DeviceController.create);
apiRouter.post('/devices/bulk', DeviceController.createBulk);
apiRouter.post('/devices/import', DeviceController.importDevices);
apiRouter.put('/devices/:id', DeviceController.update);
apiRouter.delete('/devices/:id', DeviceController.delete);
