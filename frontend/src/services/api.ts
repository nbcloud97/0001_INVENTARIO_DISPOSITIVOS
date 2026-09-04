import { Client, Subsystem, System, Device, CreateDeviceFormData, BulkDeviceFormData, DeviceCredentialItem, SystemNote, SystemAttachment, DeviceType, CreateDeviceTypeFormData, DeviceStatus } from '../types';

const API_BASE = '/api/v1';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    const errorMsg = data.error || (data.errors ? JSON.stringify(data.errors) : 'Error en la petición API');
    throw new Error(errorMsg);
  }

  return data.data;
}

export const api = {
  // Autenticación
  login: (credentials: { username: string; password: string }) =>
    fetchJson<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => fetchJson<UserProfile>('/auth/me'),

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  // Clientes
  getClients: () => fetchJson<Client[]>('/clients'),
  getClientById: (id: string) => fetchJson<Client>(`/clients/${id}`),
  createClient: (data: Partial<Client>) => fetchJson<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: Partial<Client>) => fetchJson<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => fetchJson<{ message: string }>(`/clients/${id}`, { method: 'DELETE' }),

  // Subsistemas
  getSubsystems: () => fetchJson<Subsystem[]>('/subsystems'),
  createSubsystem: (data: Partial<Subsystem>) => fetchJson<Subsystem>('/subsystems', { method: 'POST', body: JSON.stringify(data) }),
  updateSubsystem: (id: string, data: Partial<Subsystem>) => fetchJson<Subsystem>(`/subsystems/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubsystem: (id: string) => fetchJson<{ message: string }>(`/subsystems/${id}`, { method: 'DELETE' }),

  // Tipos de Dispositivo (Catálogo por Subsistema)
  getDeviceTypes: (subsystemId?: string) => fetchJson<DeviceType[]>(`/device-types${subsystemId ? `?subsystemId=${subsystemId}` : ''}`),
  createDeviceType: (data: CreateDeviceTypeFormData) => fetchJson<DeviceType>('/device-types', { method: 'POST', body: JSON.stringify(data) }),
  updateDeviceType: (id: string, data: Partial<CreateDeviceTypeFormData>) => fetchJson<DeviceType>(`/device-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDeviceType: (id: string) => fetchJson<{ message: string }>(`/device-types/${id}`, { method: 'DELETE' }),

  // Estados de Dispositivo (Configuración de Estados)
  getDeviceStatuses: () => fetchJson<DeviceStatus[]>('/device-statuses'),
  createDeviceStatus: (data: { name: string; color?: string; description?: string }) =>
    fetchJson<DeviceStatus>('/device-statuses', { method: 'POST', body: JSON.stringify(data) }),
  updateDeviceStatus: (id: string, data: { name?: string; color?: string; description?: string }) =>
    fetchJson<DeviceStatus>(`/device-statuses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDeviceStatus: (id: string) => fetchJson<{ message: string }>(`/device-statuses/${id}`, { method: 'DELETE' }),

  // Sistemas
  getSystems: (clientId?: string) => {
    const query = clientId ? `?clientId=${clientId}` : '';
    return fetchJson<System[]>(`/systems${query}`);
  },
  getSystemById: (id: string) => fetchJson<System>(`/systems/${id}`),
  createSystem: (data: Partial<System>) => fetchJson<System>('/systems', { method: 'POST', body: JSON.stringify(data) }),
  updateSystem: (id: string, data: Partial<System>) => fetchJson<System>(`/systems/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSystem: (id: string) => fetchJson<{ message: string }>(`/systems/${id}`, { method: 'DELETE' }),

  // Notas de Sistema
  getSystemNotes: (systemId: string) => fetchJson<SystemNote[]>(`/systems/${systemId}/notes`),
  createSystemNote: (data: { systemId: string; title?: string; content: string }) =>
    fetchJson<SystemNote>('/systems/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateSystemNote: (id: string, data: { title?: string; content?: string }) =>
    fetchJson<SystemNote>(`/systems/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSystemNote: (id: string) => fetchJson<{ message: string }>(`/systems/notes/${id}`, { method: 'DELETE' }),

  // Archivos Adjuntos de Sistema
  getSystemAttachments: (systemId: string) => fetchJson<SystemAttachment[]>(`/systems/${systemId}/attachments`),

  uploadSystemAttachment: async (systemId: string, file: File): Promise<SystemAttachment> => {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('systemId', systemId);
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/systems/attachments`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al subir el archivo adjunto');
    }

    return data.data;
  },

  getAttachmentDownloadUrl: (attachmentId: string) => `${API_BASE}/systems/attachments/${attachmentId}/download`,
  getAttachmentPreviewUrl: (attachmentId: string) => `${API_BASE}/systems/attachments/${attachmentId}/preview`,

  getAttachmentBlob: async (attachmentId: string): Promise<Blob> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/systems/attachments/${attachmentId}/preview`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      throw new Error('No se pudo cargar la previsualización del archivo.');
    }
    return response.blob();
  },

  getAttachmentText: async (attachmentId: string): Promise<string> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/systems/attachments/${attachmentId}/preview`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      throw new Error('No se pudo obtener el contenido de texto del archivo.');
    }
    return response.text();
  },

  updateSystemAttachment: (id: string, filename: string) =>
    fetchJson<SystemAttachment>(`/systems/attachments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ filename }),
    }),

  deleteSystemAttachment: (id: string) => fetchJson<{ message: string }>(`/systems/attachments/${id}`, { method: 'DELETE' }),

  // Dispositivos
  getDevices: (params?: { systemId?: string; clientId?: string; subsystemId?: string; search?: string; rackCabinet?: string }) => {
    const query = new URLSearchParams();
    if (params?.systemId) query.append('systemId', params.systemId);
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.subsystemId) query.append('subsystemId', params.subsystemId);
    if (params?.search) query.append('search', params.search);
    if (params?.rackCabinet) query.append('rackCabinet', params.rackCabinet);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<Device[]>(`/devices${queryString}`);
  },

  getDeviceById: (id: string) => fetchJson<Device>(`/devices/${id}`),
  getDeviceCredentials: (id: string) => fetchJson<DeviceCredentialItem[]>(`/devices/${id}/credentials`),

  createDevice: (data: CreateDeviceFormData) => fetchJson<Device>('/devices', { method: 'POST', body: JSON.stringify(data) }),
  createBulkDevices: (data: BulkDeviceFormData) => fetchJson<{ count: number; message: string }>('/devices/bulk', { method: 'POST', body: JSON.stringify(data) }),
  importDevices: (systemId: string, items: any[]) =>
    fetchJson<{ count: number; message: string }>('/devices/import', {
      method: 'POST',
      body: JSON.stringify({ systemId, items }),
    }),
  updateDevice: (id: string, data: Partial<CreateDeviceFormData>) => fetchJson<Device>(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDevice: (id: string) => fetchJson<{ message: string }>(`/devices/${id}`, { method: 'DELETE' }),
};
