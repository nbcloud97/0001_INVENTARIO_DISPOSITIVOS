export interface Subsystem {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  _count?: {
    devices: number;
    systems?: number;
  };
}

export interface Client {
  id: string;
  name: string;       // Nombre Comercial (Obligatorio)
  legalName?: string;  // Nombre Fiscal
  cif?: string;        // NIF
  manualId?: string;   // ID Manual
  notes?: string;      // Notas
  isArchived?: boolean;
  _count?: {
    systems?: number;
    devices: number;
  };
  systems?: System[];
  devices?: Device[];
  createdAt?: string;
}

export interface SystemNote {
  id: string;
  systemId: string;
  title?: string;
  content: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SystemAttachment {
  id: string;
  systemId: string;
  filename: string;
  storedName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdBy?: string;
  createdAt: string;
}

export interface System {
  id: string;
  name: string;
  code?: string;
  description?: string;
  notes?: string;     // Notas
  clientId: string;
  client?: {
    id: string;
    name: string;
  };
  subsystemId?: string;
  subsystem?: Subsystem;
  isArchived?: boolean;
  _count?: {
    devices: number;
    systemNotes?: number;
    attachments?: number;
  };
  devices?: Device[];
  systemNotes?: SystemNote[];
  attachments?: SystemAttachment[];
  createdAt?: string;
}

export interface DeviceCredentialItem {
  id?: string;
  title?: string;
  username?: string;
  password?: string;
  notes?: string;
}

export interface DeviceCommunicationPort {
  id?: string;
  port: number | string;
  service?: string;
}

export interface DeviceStatus {
  id: string;
  name: string;
  color?: string;
  description?: string;
  _count?: {
    devices: number;
  };
}

export interface Device {
  id: string;
  systemId: string;
  system?: {
    id: string;
    name: string;
  };
  clientId: string;
  client?: {
    id: string;
    name: string;
  };
  subsystemId: string;
  subsystem?: Subsystem;
  deviceTypeId: string;
  deviceTypeName?: string;
  deviceType?: {
    id: string;
    name: string;
  };
  statusId?: string;
  statusName?: string;
  statusColor?: string;
  status?: DeviceStatus;
  brand?: string;
  model?: string;
  serialNumber?: string;
  assignedName: string;
  ipAddress?: string;
  macAddress?: string;
  hasCredentials?: boolean;
  credentialsCount?: number;
  communicationPorts?: DeviceCommunicationPort[];
  rackCabinet?: string;
  switchName?: string;
  switchPort?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeviceFormData {
  systemId: string;
  clientId?: string;
  subsystemId?: string;
  deviceTypeId: string;
  statusId?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  assignedName: string;
  ipAddress?: string;
  macAddress?: string;
  credentials?: DeviceCredentialItem[];
  communicationPorts?: DeviceCommunicationPort[];
  rackCabinet?: string;
  switchName?: string;
  switchPort?: string;
  notes?: string;
}

export interface BulkDeviceFormData {
  systemId: string;
  clientId?: string;
  subsystemId?: string;
  deviceTypeId: string;
  statusId?: string;
  brand?: string;
  model?: string;
  baseName?: string;
  startNumber?: number;
  count: number;
  startIpAddress?: string;
  rackCabinet?: string;
  switchName?: string;
  startSwitchPort?: number;
  credentials?: DeviceCredentialItem[];
  notes?: string;
}

export interface DeviceType {
  id: string;
  name: string;
  description?: string;
  subsystemId: string;
  subsystem?: Subsystem;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeviceTypeFormData {
  name: string;
  description?: string;
  subsystemId: string;
}

export interface Beta10SubsystemItem {
  idsubsis: number;
  codigo: string | null;
  descripcion: string;
  tipoSubsis: string | null;
  estado: number;
}

export interface Beta10SystemItem {
  idsistema: number;
  codigo: string | null;
  descripcion: string;
  tipoSistema: string | null;
  observaciones: string | null;
  estado: number;
  subsystems: Beta10SubsystemItem[];
  alreadyImported?: boolean;
  importedSystemId?: string;
}

export interface Beta10ClientSearchResult {
  idcliente: number;
  nombre: string;
  razonSocial: string | null;
  cif: string | null;
  observaciones: string | null;
  estado: number;
  totalSistemas: number;
}

export interface Beta10ClientDetails {
  idcliente: number;
  nombre: string;
  razonSocial: string | null;
  cif: string | null;
  observaciones: string | null;
  estado: number;
  systems: Beta10SystemItem[];
  alreadyImportedClient?: boolean;
  importedClientId?: string;
}

export interface Beta10ImportResult {
  message: string;
  client: Client;
  createdSystemsCount: number;
  updatedSystemsCount: number;
  totalSystemsSelected: number;
}

export type PermissionKey =
  | 'VIEW_INVENTORY'
  | 'EDIT_INVENTORY'
  | 'DELETE_RECORDS'
  | 'VIEW_PASSWORDS'
  | 'BETA10_IMPORT'
  | 'MANAGE_TYPES'
  | 'MANAGE_USERS'
  | 'MANAGE_BACKUPS';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
}

export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'VIEW_INVENTORY',
    label: 'Ver Inventario',
    description: 'Acceso para consultar clientes, sistemas, dispositivos e informes',
  },
  {
    key: 'EDIT_INVENTORY',
    label: 'Crear / Editar Inventario',
    description: 'Crear y modificar clientes, sistemas, dispositivos, notas y adjuntos',
  },
  {
    key: 'DELETE_RECORDS',
    label: 'Eliminar Registros',
    description: 'Permiso para borrar clientes, sistemas, dispositivos y adjuntos',
  },
  {
    key: 'VIEW_PASSWORDS',
    label: 'Ver Contraseñas Cifradas',
    description: 'Descifrar y ver contraseñas en credenciales de dispositivos',
  },
  {
    key: 'BETA10_IMPORT',
    label: 'Importar desde Beta 10',
    description: 'Búsqueda e importación directa de clientes y sistemas desde ERP Oracle',
  },
  {
    key: 'MANAGE_TYPES',
    label: 'Gestionar Catálogos',
    description: 'Administrar tipos de dispositivo, subsistemas y estados',
  },
  {
    key: 'MANAGE_USERS',
    label: 'Gestionar Usuarios',
    description: 'Crear, modificar y asignar permisos a cuentas de acceso',
  },
  {
    key: 'MANAGE_BACKUPS',
    label: 'Copias de Seguridad',
    description: 'Exportar y restaurar copias de seguridad de la base de datos',
  },
];

export function hasPermission(
  user: { role?: string; permissions?: string[] } | null | undefined,
  perm: PermissionKey | string
): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(perm);
}

export interface UserItem {
  id: string;
  username: string;
  name: string;
  role: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  username: string;
  name?: string;
  password?: string;
  role?: string;
  permissions?: string[];
}


