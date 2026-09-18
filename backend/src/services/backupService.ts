import { prisma } from '../config/prisma';

export interface BackupData {
  metadata: {
    version: string;
    exportedAt: string;
    appName: string;
    stats: {
      clients: number;
      systems: number;
      subsystems: number;
      deviceTypes: number;
      deviceStatuses: number;
      devices: number;
      systemNotes: number;
      systemAttachments: number;
    };
  };
  subsystems: any[];
  deviceTypes: any[];
  deviceStatuses: any[];
  clients: any[];
  systems: any[];
  systemNotes: any[];
  systemAttachments: any[];
  devices: any[];
}

export class BackupService {
  /**
   * Obtener estadísticas actuales de la base de datos
   */
  async getDatabaseStats() {
    const [
      clients,
      systems,
      subsystems,
      deviceTypes,
      deviceStatuses,
      devices,
      systemNotes,
      systemAttachments,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.system.count(),
      prisma.subsystem.count(),
      prisma.deviceType.count(),
      prisma.deviceStatus.count(),
      prisma.device.count(),
      prisma.systemNote.count(),
      prisma.systemAttachment.count(),
    ]);

    return {
      clients,
      systems,
      subsystems,
      deviceTypes,
      deviceStatuses,
      devices,
      systemNotes,
      systemAttachments,
    };
  }

  /**
   * Exportar todos los datos de la base de datos a un objeto BackupData
   */
  async exportFullBackup(): Promise<BackupData> {
    const [
      stats,
      subsystems,
      deviceTypes,
      deviceStatuses,
      clients,
      systems,
      systemNotes,
      systemAttachments,
      devices,
    ] = await Promise.all([
      this.getDatabaseStats(),
      prisma.subsystem.findMany(),
      prisma.deviceType.findMany(),
      prisma.deviceStatus.findMany(),
      prisma.client.findMany(),
      prisma.system.findMany(),
      prisma.systemNote.findMany(),
      prisma.systemAttachment.findMany(),
      prisma.device.findMany(),
    ]);

    return {
      metadata: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        appName: 'SATYA - Inventario de Dispositivos',
        stats,
      },
      subsystems,
      deviceTypes,
      deviceStatuses,
      clients,
      systems,
      systemNotes,
      systemAttachments,
      devices,
    };
  }

  /**
   * Restaurar la base de datos a partir de un objeto BackupData
   */
  async restoreBackup(backup: BackupData): Promise<{
    restored: {
      subsystems: number;
      deviceTypes: number;
      deviceStatuses: number;
      clients: number;
      systems: number;
      systemNotes: number;
      systemAttachments: number;
      devices: number;
    };
  }> {
    if (!backup || typeof backup !== 'object') {
      throw new Error('El archivo de copia de seguridad no es un objeto JSON válido');
    }

    // Validar presencia básica de colecciones
    const subsystems = Array.isArray(backup.subsystems) ? backup.subsystems : [];
    const deviceTypes = Array.isArray(backup.deviceTypes) ? backup.deviceTypes : [];
    const deviceStatuses = Array.isArray(backup.deviceStatuses) ? backup.deviceStatuses : [];
    const clients = Array.isArray(backup.clients) ? backup.clients : [];
    const systems = Array.isArray(backup.systems) ? backup.systems : [];
    const systemNotes = Array.isArray(backup.systemNotes) ? backup.systemNotes : [];
    const systemAttachments = Array.isArray(backup.systemAttachments) ? backup.systemAttachments : [];
    const devices = Array.isArray(backup.devices) ? backup.devices : [];

    // Ejecutar restauración en transacción para asegurar integridad
    await prisma.$transaction(async (tx) => {
      // 1. Restaurar Subsystems
      for (const item of subsystems) {
        if (!item.id || !item.name) continue;
        await tx.subsystem.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            name: item.name,
            color: item.color || '#005596',
            icon: item.icon || 'shield',
            description: item.description || null,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          },
          update: {
            name: item.name,
            color: item.color || '#005596',
            icon: item.icon || 'shield',
            description: item.description || null,
          },
        });
      }

      // 2. Restaurar DeviceTypes
      for (const item of deviceTypes) {
        if (!item.id || !item.name || !item.subsystemId) continue;
        await tx.deviceType.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            name: item.name,
            description: item.description || null,
            subsystemId: item.subsystemId,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          },
          update: {
            name: item.name,
            description: item.description || null,
            subsystemId: item.subsystemId,
          },
        });
      }

      // 3. Restaurar DeviceStatuses
      for (const item of deviceStatuses) {
        if (!item.id || !item.name) continue;
        await tx.deviceStatus.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            name: item.name,
            color: item.color || '#10b981',
            description: item.description || null,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          },
          update: {
            name: item.name,
            color: item.color || '#10b981',
            description: item.description || null,
          },
        });
      }

      // 4. Restaurar Clients
      for (const item of clients) {
        if (!item.id || !item.name) continue;
        await tx.client.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            name: item.name,
            legalName: item.legalName || null,
            cif: item.cif || null,
            manualId: item.manualId || null,
            notes: item.notes || null,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          },
          update: {
            name: item.name,
            legalName: item.legalName || null,
            cif: item.cif || null,
            manualId: item.manualId || null,
            notes: item.notes || null,
          },
        });
      }

      // 5. Restaurar Systems
      for (const item of systems) {
        if (!item.id || !item.name || !item.clientId) continue;
        await tx.system.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            name: item.name,
            code: item.code || null,
            description: item.description || null,
            notes: item.notes || null,
            clientId: item.clientId,
            subsystemId: item.subsystemId || null,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          },
          update: {
            name: item.name,
            code: item.code || null,
            description: item.description || null,
            notes: item.notes || null,
            clientId: item.clientId,
            subsystemId: item.subsystemId || null,
          },
        });
      }

      // 6. Restaurar SystemNotes
      for (const item of systemNotes) {
        if (!item.id || !item.content || !item.systemId) continue;
        await tx.systemNote.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            systemId: item.systemId,
            title: item.title || null,
            content: item.content,
            createdBy: item.createdBy || null,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          },
          update: {
            title: item.title || null,
            content: item.content,
            createdBy: item.createdBy || null,
          },
        });
      }

      // 7. Restaurar SystemAttachments
      for (const item of systemAttachments) {
        if (!item.id || !item.filename || !item.systemId) continue;
        await tx.systemAttachment.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            systemId: item.systemId,
            filename: item.filename,
            storedName: item.storedName || item.filename,
            filePath: item.filePath || '',
            mimeType: item.mimeType || 'application/octet-stream',
            fileSize: Number(item.fileSize) || 0,
            createdBy: item.createdBy || null,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          },
          update: {
            filename: item.filename,
            storedName: item.storedName || item.filename,
            filePath: item.filePath || '',
            mimeType: item.mimeType || 'application/octet-stream',
            fileSize: Number(item.fileSize) || 0,
            createdBy: item.createdBy || null,
          },
        });
      }

      // 8. Restaurar Devices
      for (const item of devices) {
        if (!item.id || !item.assignedName || !item.systemId || !item.clientId || !item.subsystemId || !item.deviceTypeId) continue;
        await tx.device.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            systemId: item.systemId,
            clientId: item.clientId,
            subsystemId: item.subsystemId,
            deviceTypeId: item.deviceTypeId,
            statusId: item.statusId || null,
            brand: item.brand || null,
            model: item.model || null,
            serialNumber: item.serialNumber || null,
            assignedName: item.assignedName,
            ipAddress: item.ipAddress || null,
            macAddress: item.macAddress || null,
            credentialsEncrypted: item.credentialsEncrypted || null,
            communicationPorts: item.communicationPorts || null,
            rackCabinet: item.rackCabinet || null,
            switchName: item.switchName || null,
            switchPort: item.switchPort || null,
            notes: item.notes || null,
            createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          },
          update: {
            systemId: item.systemId,
            clientId: item.clientId,
            subsystemId: item.subsystemId,
            deviceTypeId: item.deviceTypeId,
            statusId: item.statusId || null,
            brand: item.brand || null,
            model: item.model || null,
            serialNumber: item.serialNumber || null,
            assignedName: item.assignedName,
            ipAddress: item.ipAddress || null,
            macAddress: item.macAddress || null,
            credentialsEncrypted: item.credentialsEncrypted || null,
            communicationPorts: item.communicationPorts || null,
            rackCabinet: item.rackCabinet || null,
            switchName: item.switchName || null,
            switchPort: item.switchPort || null,
            notes: item.notes || null,
          },
        });
      }
    });

    return {
      restored: {
        subsystems: subsystems.length,
        deviceTypes: deviceTypes.length,
        deviceStatuses: deviceStatuses.length,
        clients: clients.length,
        systems: systems.length,
        systemNotes: systemNotes.length,
        systemAttachments: systemAttachments.length,
        devices: devices.length,
      },
    };
  }
}

export const backupService = new BackupService();
