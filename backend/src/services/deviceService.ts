import { prisma } from '../config/prisma';
import { encryptCredentials, decryptCredentials } from './cryptoService';

export interface DeviceCredentialItem {
  id?: string;
  title?: string;
  username?: string;
  password?: string;
  notes?: string;
}

export interface DeviceCommunicationPortItem {
  id?: string;
  port: number | string;
  service?: string;
}

export function parseCommunicationPorts(jsonStr?: string | null): DeviceCommunicationPortItem[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => ({
        id: item.id || `port-${index}`,
        port: item.port,
        service: item.service || '',
      }));
    }
  } catch {
    if (typeof jsonStr === 'string' && jsonStr.trim()) {
      return jsonStr.split(',').map((part, index) => {
        const match = part.trim().match(/^(\d+)\s*(?:\(([^)]+)\))?$/);
        if (match) {
          return { id: `port-${index}`, port: match[1], service: match[2] || '' };
        }
        return { id: `port-${index}`, port: part.trim() };
      });
    }
  }
  return [];
}

export function stringifyCommunicationPorts(ports?: DeviceCommunicationPortItem[]): string | null {
  if (!ports || !Array.isArray(ports)) return null;
  const validPorts = ports.filter(p => p && p.port !== undefined && p.port !== null && String(p.port).trim() !== '');
  if (validPorts.length === 0) return null;
  return JSON.stringify(validPorts.map(p => ({
    port: String(p.port).trim(),
    service: p.service ? String(p.service).trim() : '',
  })));
}

export interface CreateDeviceInput {
  systemId: string;
  clientId?: string;
  subsystemId: string;
  deviceTypeId?: string;
  statusId?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  assignedName: string;
  ipAddress?: string;
  subnetMask?: string;
  gateway?: string;
  macAddress?: string;
  credentials?: DeviceCredentialItem[];
  communicationPorts?: DeviceCommunicationPortItem[];
  rackCabinet?: string;
  switchName?: string;
  switchPort?: string;
  notes?: string;
}

export interface BulkCreateDevicesInput {
  systemId: string;
  clientId?: string;
  subsystemId: string;
  deviceTypeId?: string;
  statusId?: string;
  brand?: string;
  model?: string;
  baseName?: string;
  startNumber?: number;
  count: number;
  startIpAddress?: string;
  subnetMask?: string;
  gateway?: string;
  rackCabinet?: string;
  switchName?: string;
  startSwitchPort?: number;
  credentials?: DeviceCredentialItem[];
  communicationPorts?: DeviceCommunicationPortItem[];
  notes?: string;
}

export interface ImportDeviceItemInput {
  subsystemName?: string;
  subsystemId?: string;
  deviceTypeName?: string;
  deviceTypeId?: string;
  statusName?: string;
  assignedName?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  ipAddress?: string;
  subnetMask?: string;
  gateway?: string;
  macAddress?: string;
  rackCabinet?: string;
  switchName?: string;
  switchPort?: string;
  notes?: string;
  credentials?: DeviceCredentialItem[];
  communicationPorts?: DeviceCommunicationPortItem[] | string;
}

export class DeviceService {
  static async getAll(filters?: {
    systemId?: string;
    clientId?: string;
    subsystemId?: string;
    deviceTypeId?: string;
    search?: string;
    rackCabinet?: string;
  }) {
    const where: any = {};

    if (filters?.systemId) where.systemId = filters.systemId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.subsystemId) where.subsystemId = filters.subsystemId;
    if (filters?.deviceTypeId) where.deviceTypeId = filters.deviceTypeId;
    if (filters?.rackCabinet) where.rackCabinet = filters.rackCabinet;

    if (filters?.search) {
      const term = filters.search.trim();
      where.OR = [
        { assignedName: { contains: term } },
        { brand: { contains: term } },
        { model: { contains: term } },
        { serialNumber: { contains: term } },
        { ipAddress: { contains: term } },
        { macAddress: { contains: term } },
        { rackCabinet: { contains: term } },
        { switchName: { contains: term } },
        { deviceType: { name: { contains: term } } },
      ];
    }

    const devices = await prisma.device.findMany({
      where,
      include: {
        system: { select: { id: true, name: true, code: true } },
        client: { select: { id: true, name: true } },
        subsystem: { select: { id: true, name: true, color: true, icon: true } },
        deviceType: { select: { id: true, name: true } },
        status: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return devices.map((d) => {
      let credsCount = 0;
      if (d.credentialsEncrypted) {
        try {
          const decrypted = decryptCredentials(d.credentialsEncrypted);
          if (Array.isArray(decrypted)) {
            credsCount = decrypted.length;
          } else if (decrypted && (decrypted.username || decrypted.password)) {
            credsCount = 1;
          }
        } catch {
          credsCount = 1;
        }
      }

      return {
        ...d,
        deviceTypeName: d.deviceType?.name || null,
        statusName: d.status?.name || null,
        statusColor: d.status?.color || null,
        hasCredentials: Boolean(d.credentialsEncrypted),
        credentialsCount: credsCount,
        communicationPorts: parseCommunicationPorts(d.communicationPorts),
        credentialsEncrypted: undefined,
      };
    });
  }

  static async getById(id: string) {
    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        system: true,
        client: true,
        subsystem: true,
        deviceType: true,
        status: true,
      },
    });

    if (!device) return null;

    let credsCount = 0;
    if (device.credentialsEncrypted) {
      try {
        const decrypted = decryptCredentials(device.credentialsEncrypted);
        credsCount = Array.isArray(decrypted) ? decrypted.length : 1;
      } catch {
        credsCount = 1;
      }
    }

    return {
      ...device,
      deviceTypeName: device.deviceType?.name || null,
      statusName: device.status?.name || null,
      statusColor: device.status?.color || null,
      hasCredentials: Boolean(device.credentialsEncrypted),
      credentialsCount: credsCount,
      communicationPorts: parseCommunicationPorts(device.communicationPorts),
      credentialsEncrypted: undefined,
    };
  }

  static async getCredentials(id: string): Promise<DeviceCredentialItem[]> {
    const device = await prisma.device.findUnique({
      where: { id },
      select: { credentialsEncrypted: true },
    });

    if (!device || !device.credentialsEncrypted) return [];
    const decrypted = decryptCredentials(device.credentialsEncrypted);

    if (Array.isArray(decrypted)) {
      return decrypted;
    } else if (decrypted && typeof decrypted === 'object') {
      return [decrypted];
    }
    return [];
  }

  static async create(data: CreateDeviceInput) {
    let credentialsEncrypted: string | undefined = undefined;

    if (data.credentials && Array.isArray(data.credentials)) {
      const validCreds = data.credentials.filter(c => c.username || c.password || c.title);
      if (validCreds.length > 0) {
        credentialsEncrypted = encryptCredentials(validCreds);
      }
    }

    const communicationPortsStr = stringifyCommunicationPorts(data.communicationPorts);

    const system = await prisma.system.findUnique({ where: { id: data.systemId } });
    if (!system) throw new Error('El sistema especificado no existe');

    const clientId = data.clientId || system.clientId;
    const subsystemId = data.subsystemId || system.subsystemId || undefined;

    if (!subsystemId) throw new Error('Debes indicar un subsistema para el dispositivo');
    let statusId = data.statusId || null;
    if (!statusId) {
      const defaultStatus = await prisma.deviceStatus.findFirst({
        where: { name: { equals: 'Operativo' } },
      });
      statusId = defaultStatus?.id || null;
    }

    const device = await prisma.device.create({
      data: {
        systemId: data.systemId,
        clientId,
        subsystemId,
        deviceTypeId: data.deviceTypeId!,
        statusId,
        brand: data.brand || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        assignedName: data.assignedName,
        ipAddress: data.ipAddress || null,
        subnetMask: data.subnetMask || null,
        gateway: data.gateway || null,
        macAddress: data.macAddress || null,
        credentialsEncrypted,
        communicationPorts: communicationPortsStr,
        rackCabinet: data.rackCabinet || null,
        switchName: data.switchName || null,
        switchPort: data.switchPort || null,
        notes: data.notes || null,
      },
      include: {
        system: true,
        client: true,
        subsystem: true,
        deviceType: true,
        status: true,
      },
    });

    return {
      ...device,
      deviceTypeName: (device as any).deviceType?.name || null,
      statusName: (device as any).status?.name || null,
      statusColor: (device as any).status?.color || null,
      hasCredentials: Boolean(device.credentialsEncrypted),
      communicationPorts: parseCommunicationPorts(device.communicationPorts),
      credentialsEncrypted: undefined,
    };
  }

  static async createBulk(data: BulkCreateDevicesInput) {
    const {
      systemId,
      subsystemId,
      deviceTypeId,
      brand,
      model,
      baseName,
      startNumber = 1,
      count,
      startIpAddress,
      rackCabinet,
      switchName,
      startSwitchPort = 1,
      credentials,
      notes,
    } = data;

    if (!deviceTypeId) throw new Error('El tipo de dispositivo es obligatorio para la creación masiva');

    const system = await prisma.system.findUnique({ where: { id: systemId } });
    if (!system) throw new Error('El sistema especificado no existe');

    const clientId = data.clientId || system.clientId;

    // Obtener subsistema para derivar un prefijo de nombre limpio si baseName no se especificó
    const subsystem = await prisma.subsystem.findUnique({ where: { id: subsystemId } });
    const prefix = (baseName || subsystem?.name || 'EQUIPO').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();

    let credentialsEncrypted: string | undefined = undefined;
    if (credentials && Array.isArray(credentials)) {
      const validCreds = credentials.filter(c => c.username || c.password || c.title);
      if (validCreds.length > 0) {
        credentialsEncrypted = encryptCredentials(validCreds);
      }
    }

    const communicationPortsStr = stringifyCommunicationPorts(data.communicationPorts);

    let currentIpParts: number[] | null = null;
    if (startIpAddress) {
      currentIpParts = startIpAddress.split('.').map(Number);
      if (currentIpParts.length !== 4 || currentIpParts.some(isNaN)) {
        throw new Error('Dirección IP de inicio no válida');
      }
    }

    let statusId = data.statusId || null;
    if (!statusId) {
      const defaultStatus = await prisma.deviceStatus.findFirst({
        where: { name: { equals: 'Operativo' } },
      });
      statusId = defaultStatus?.id || null;
    }

    const devicesToCreate = [];

    for (let i = 0; i < count; i++) {
      const currentNum = startNumber + i;
      const numSuffix = currentNum < 10 ? `0${currentNum}` : `${currentNum}`;
      const assignedName = `${prefix}_${numSuffix}`;

      let ipAddress: string | undefined = undefined;
      if (currentIpParts) {
        ipAddress = `${currentIpParts[0]}.${currentIpParts[1]}.${currentIpParts[2]}.${currentIpParts[3] + i}`;
      }

      let switchPort: string | undefined = undefined;
      if (startSwitchPort !== undefined && switchName) {
        switchPort = `PUERTO ${startSwitchPort + i}`;
      }

      devicesToCreate.push({
        systemId,
        clientId,
        subsystemId,
        deviceTypeId,
        statusId,
        brand: brand || null,
        model: model || null,
        serialNumber: undefined,
        assignedName,
        ipAddress,
        subnetMask: data.subnetMask || null,
        gateway: data.gateway || null,
        macAddress: undefined,
        credentialsEncrypted,
        communicationPorts: communicationPortsStr,
        rackCabinet: rackCabinet || null,
        switchName: switchName || null,
        switchPort,
        notes: notes || null,
      });
    }

    const result = await prisma.device.createMany({
      data: devicesToCreate,
    });

    return {
      count: result.count,
      message: `Se han registrado exitosamente ${result.count} dispositivos en el sistema`,
    };
  }

  static async validateImport(systemId: string, items: ImportDeviceItemInput[]) {
    const system = await prisma.system.findUnique({
      where: { id: systemId },
      include: { subsystem: true },
    });
    if (!system) throw new Error('El sistema especificado no existe');

    const allSubsystems = await prisma.subsystem.findMany();
    const defaultSubsystem = system.subsystem || allSubsystems[0];
    if (!defaultSubsystem) throw new Error('No hay subsistemas registrados en la aplicación');

    const allDeviceTypes = await prisma.deviceType.findMany({
      include: { subsystem: true },
    });

    const norm = (str?: string | null) =>
      str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

    const newSubsystemsMap = new Map<string, string>(); // norm -> originalName
    const newDeviceTypesMap = new Map<string, { name: string; subsystemName: string }>(); // norm(subsystem)+norm(type) -> obj

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const rawTypeName = (item.deviceTypeName || item.deviceTypeId || '').trim();
      if (!rawTypeName) continue;

      let resolvedSubsystemName = defaultSubsystem.name;
      let isNewSubsystem = false;

      // 1. Validar subsistema
      if (item.subsystemId) {
        const found = allSubsystems.find(s => s.id === item.subsystemId);
        if (found) resolvedSubsystemName = found.name;
      } else if (item.subsystemName && item.subsystemName.trim()) {
        const rawSubName = item.subsystemName.trim();
        const targetSubNorm = norm(rawSubName);
        let found = allSubsystems.find(s => norm(s.name) === targetSubNorm);
        if (!found) {
          found = allSubsystems.find(s => norm(s.name).includes(targetSubNorm) || targetSubNorm.includes(norm(s.name)));
        }

        if (found) {
          resolvedSubsystemName = found.name;
        } else {
          isNewSubsystem = true;
          resolvedSubsystemName = rawSubName;
          if (!newSubsystemsMap.has(targetSubNorm)) {
            newSubsystemsMap.set(targetSubNorm, rawSubName);
          }
        }
      }

      // 2. Validar tipo de dispositivo
      const targetTypeNorm = norm(rawTypeName);
      let foundType = allDeviceTypes.find(
        dt => norm(dt.subsystem?.name) === norm(resolvedSubsystemName) && norm(dt.name) === targetTypeNorm
      );

      if (!foundType && !isNewSubsystem) {
        foundType = allDeviceTypes.find(dt => norm(dt.name) === targetTypeNorm);
      }

      if (!foundType) {
        const key = `${norm(resolvedSubsystemName)}:::${targetTypeNorm}`;
        if (!newDeviceTypesMap.has(key)) {
          newDeviceTypesMap.set(key, {
            name: rawTypeName,
            subsystemName: resolvedSubsystemName,
          });
        }
      }
    }

    const newSubsystems = Array.from(newSubsystemsMap.values());
    const newDeviceTypes = Array.from(newDeviceTypesMap.values());

    return {
      totalDevices: items.length,
      hasNewCatalogItems: newSubsystems.length > 0 || newDeviceTypes.length > 0,
      newSubsystems,
      newDeviceTypes,
    };
  }

  static async importDevices(systemId: string, items: ImportDeviceItemInput[], autoCreateCatalog: boolean = false) {
    const system = await prisma.system.findUnique({
      where: { id: systemId },
      include: { subsystem: true },
    });
    if (!system) throw new Error('El sistema especificado no existe');

    let allSubsystems = await prisma.subsystem.findMany();
    const defaultSubsystem = system.subsystem || allSubsystems[0];
    if (!defaultSubsystem) throw new Error('No hay subsistemas registrados en la aplicación');

    let allDeviceTypes = await prisma.deviceType.findMany({
      include: { subsystem: true },
    });
    let allStatuses = await prisma.deviceStatus.findMany();

    const defaultStatus = allStatuses.find(st => st.name.trim().toLowerCase() === 'operativo') || allStatuses[0];
    const defaultStatusId = defaultStatus?.id || null;

    const devicesToCreate = [];

    const norm = (str?: string | null) =>
      str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      // Nombre asignado
      const assignedName = item.assignedName
        ? item.assignedName.toUpperCase().trim()
        : `Fila ${index + 1}`;

      // 1. Validar que el tipo de dispositivo esté definido en la fila
      const rawTypeName = (item.deviceTypeName || item.deviceTypeId || '').trim();
      if (!rawTypeName) {
        throw new Error(`Error en la fila ${index + 1} (${assignedName}): El tipo de dispositivo no está definido.`);
      }

      // 2. Buscar subsistema coincidente por nombre (o id)
      let resolvedSubsystemId = defaultSubsystem.id;
      let resolvedSubsystemName = defaultSubsystem.name;
      if (item.subsystemId) {
        const found = allSubsystems.find(s => s.id === item.subsystemId);
        if (found) {
          resolvedSubsystemId = found.id;
          resolvedSubsystemName = found.name;
        }
      } else if (item.subsystemName && item.subsystemName.trim()) {
        const rawSubName = item.subsystemName.trim();
        const targetNorm = norm(rawSubName);
        // Coincidencia exacta o normalizada
        let found = allSubsystems.find(s => norm(s.name) === targetNorm);
        // Coincidencia por subcadena
        if (!found) {
          found = allSubsystems.find(s => norm(s.name).includes(targetNorm) || targetNorm.includes(norm(s.name)));
        }

        if (found) {
          resolvedSubsystemId = found.id;
          resolvedSubsystemName = found.name;
        } else if (autoCreateCatalog) {
          // Crear automáticamente el nuevo subsistema
          const newSub = await prisma.subsystem.create({
            data: {
              name: rawSubName,
              color: '#005596',
              icon: 'shield',
              description: 'Creado automáticamente durante importación de Excel',
            },
          });
          allSubsystems.push(newSub);
          resolvedSubsystemId = newSub.id;
          resolvedSubsystemName = newSub.name;
        }
      }

      // 3. Buscar tipo de dispositivo en la base de datos
      let resolvedDeviceTypeId: string | undefined = undefined;
      if (item.deviceTypeId) {
        const found = allDeviceTypes.find(dt => dt.id === item.deviceTypeId);
        if (found) resolvedDeviceTypeId = found.id;
      }
      
      if (!resolvedDeviceTypeId && rawTypeName) {
        const targetTypeNorm = norm(rawTypeName);

        // a) Coincidencia exacta/normalizada dentro del subsistema
        let found = allDeviceTypes.find(
          dt => dt.subsystemId === resolvedSubsystemId && norm(dt.name) === targetTypeNorm
        );

        // b) Coincidencia exacta/normalizada global en cualquier subsistema
        if (!found) {
          found = allDeviceTypes.find(dt => norm(dt.name) === targetTypeNorm);
        }

        // c) Coincidencia parcial dentro del subsistema
        if (!found) {
          found = allDeviceTypes.find(
            dt => dt.subsystemId === resolvedSubsystemId && (norm(dt.name).includes(targetTypeNorm) || targetTypeNorm.includes(norm(dt.name)))
          );
        }

        // d) Coincidencia parcial global
        if (!found) {
          found = allDeviceTypes.find(
            dt => norm(dt.name).includes(targetTypeNorm) || targetTypeNorm.includes(norm(dt.name))
          );
        }

        if (found) {
          resolvedDeviceTypeId = found.id;
          // Ajustar también el subsistema si el tipo encontrado pertenece a otro subsistema específico
          if (found.subsystemId && !item.subsystemName && !item.subsystemId) {
            resolvedSubsystemId = found.subsystemId;
          }
        } else if (autoCreateCatalog) {
          // Crear automáticamente el nuevo tipo de dispositivo
          const newType = await prisma.deviceType.create({
            data: {
              name: rawTypeName,
              subsystemId: resolvedSubsystemId,
              description: 'Creado automáticamente durante importación de Excel',
            },
            include: { subsystem: true },
          });
          allDeviceTypes.push(newType);
          resolvedDeviceTypeId = newType.id;
        }
      }

      // 4. Si el tipo no está creado en la base de datos, arrojar error descriptivo
      if (!resolvedDeviceTypeId) {
        throw new Error(
          `Error en la fila ${index + 1} (${assignedName}): El tipo de dispositivo "${rawTypeName}" no se encuentra en el catálogo. Por favor, regístralo previamente en Configuración > Catálogo de Tipos o autoriza su creación automática.`
        );
      }

      // 5. Resolver estado si viene indicado en la fila
      let resolvedStatusId = defaultStatusId;
      if (item.statusName) {
        const targetStatusNorm = norm(item.statusName);
        let foundStatus = allStatuses.find(st => norm(st.name) === targetStatusNorm);
        if (!foundStatus) {
          foundStatus = allStatuses.find(st => norm(st.name).includes(targetStatusNorm) || targetStatusNorm.includes(norm(st.name)));
        }
        if (foundStatus) {
          resolvedStatusId = foundStatus.id;
        }
      }

      // Cifrar credenciales si se incluyen
      let credentialsEncrypted: string | undefined = undefined;
      if (item.credentials && Array.isArray(item.credentials)) {
        const validCreds = item.credentials.filter(c => c.username || c.password || c.title);
        if (validCreds.length > 0) {
          credentialsEncrypted = encryptCredentials(validCreds);
        }
      }

      let commPortsStr: string | null = null;
      if (typeof item.communicationPorts === 'string') {
        commPortsStr = stringifyCommunicationPorts(parseCommunicationPorts(item.communicationPorts));
      } else if (Array.isArray(item.communicationPorts)) {
        commPortsStr = stringifyCommunicationPorts(item.communicationPorts);
      }

      devicesToCreate.push({
        systemId,
        clientId: system.clientId,
        subsystemId: resolvedSubsystemId,
        deviceTypeId: resolvedDeviceTypeId,
        statusId: resolvedStatusId,
        assignedName,
        brand: item.brand || null,
        model: item.model || null,
        serialNumber: item.serialNumber || null,
        ipAddress: item.ipAddress || null,
        subnetMask: item.subnetMask || null,
        gateway: item.gateway || null,
        macAddress: item.macAddress || null,
        credentialsEncrypted,
        communicationPorts: commPortsStr,
        rackCabinet: item.rackCabinet || null,
        switchName: item.switchName || null,
        switchPort: item.switchPort || null,
        notes: item.notes || null,
      });
    }

    const result = await prisma.device.createMany({
      data: devicesToCreate,
    });

    return {
      count: result.count,
      message: `Se han importado exitosamente ${result.count} dispositivos al sistema`,
    };
  }

  static async update(id: string, data: Partial<CreateDeviceInput>) {
    let credentialsEncrypted: string | undefined | null = undefined;

    if (data.credentials !== undefined) {
      if (Array.isArray(data.credentials)) {
        const validCreds = data.credentials.filter(c => c.username || c.password || c.title);
        credentialsEncrypted = validCreds.length > 0 ? encryptCredentials(validCreds) : null;
      } else {
        credentialsEncrypted = null;
      }
    }

    let communicationPortsStr: string | undefined | null = undefined;
    if (data.communicationPorts !== undefined) {
      communicationPortsStr = stringifyCommunicationPorts(data.communicationPorts);
    }

    const updateData: any = {
      ...(data.systemId && { systemId: data.systemId }),
      ...(data.clientId && { clientId: data.clientId }),
      ...(data.subsystemId && { subsystemId: data.subsystemId }),
      ...(data.deviceTypeId && { deviceTypeId: data.deviceTypeId }),
      ...(data.statusId !== undefined && { statusId: data.statusId || null }),
      ...(data.brand !== undefined && { brand: data.brand }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
      ...(data.assignedName && { assignedName: data.assignedName }),
      ...(data.ipAddress !== undefined && { ipAddress: data.ipAddress }),
      ...(data.subnetMask !== undefined && { subnetMask: data.subnetMask }),
      ...(data.gateway !== undefined && { gateway: data.gateway }),
      ...(data.macAddress !== undefined && { macAddress: data.macAddress }),
      ...(data.rackCabinet !== undefined && { rackCabinet: data.rackCabinet }),
      ...(data.switchName !== undefined && { switchName: data.switchName }),
      ...(data.switchPort !== undefined && { switchPort: data.switchPort }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };

    if (credentialsEncrypted !== undefined) {
      updateData.credentialsEncrypted = credentialsEncrypted;
    }
    if (communicationPortsStr !== undefined) {
      updateData.communicationPorts = communicationPortsStr;
    }

    const device = await prisma.device.update({
      where: { id },
      data: updateData,
      include: {
        system: true,
        client: true,
        subsystem: true,
        deviceType: true,
        status: true,
      },
    });

    let credsCount = 0;
    if (device.credentialsEncrypted) {
      try {
        const decrypted = decryptCredentials(device.credentialsEncrypted);
        credsCount = Array.isArray(decrypted) ? decrypted.length : 1;
      } catch {
        credsCount = 1;
      }
    }

    return {
      ...device,
      deviceTypeName: device.deviceType?.name || null,
      statusName: device.status?.name || null,
      statusColor: device.status?.color || null,
      hasCredentials: Boolean(device.credentialsEncrypted),
      credentialsCount: credsCount,
      communicationPorts: parseCommunicationPorts(device.communicationPorts),
      credentialsEncrypted: undefined,
    };
  }

  static async delete(id: string) {
    return await prisma.device.delete({
      where: { id },
    });
  }

  static async deleteBySystem(systemId: string) {
    return await prisma.device.deleteMany({
      where: { systemId },
    });
  }
}
      