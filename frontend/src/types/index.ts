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
  beta10Id?: string;   // ID Beta10
  notes?: string;      // Notas
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
  _count?: {
    devices: number;
    systemNotes?: number;
  };
  devices?: Device[];
  systemNotes?: SystemNote[];
  createdAt?: string;
}

export interface DeviceCredentialItem {
  id?: string;
  title?: string;
  username?: string;
  password?: string;
  notes?: string;
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
  brand?: string;
  model?: string;
  serialNumber?: string;
  assignedName: string;
  ipAddress?: string;
  macAddress?: string;
  hasCredentials?: boolean;
  credentialsCount?: number;
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
  brand?: string;
  model?: string;
  serialNumber?: string;
  assignedName: string;
  ipAddress?: string;
  macAddress?: string;
  credentials?: DeviceCredentialItem[];
  rackCabinet?: string;
  switchName?: string;
  switchPort?: string;
  notes?: string;
}

export interface BulkDeviceFormData {
  systemId: string;
  clientId?: string;
  subsystemId?: string;
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
