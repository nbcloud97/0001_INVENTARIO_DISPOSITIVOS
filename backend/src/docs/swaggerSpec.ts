export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API REST Inventario de Dispositivos por Cliente',
    version: '1.0.0',
    description: 'API REST profesional para integración de terceros (CRM, ERP, Sistemas de Monitoreo). Soporta operaciones CRUD para Clientes, Subsistemas, Dispositivos, Creación en Lote (Bulk) y Credenciales Cifradas AES-256.',
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Servidor de Desarrollo Local',
    },
  ],
  paths: {
    '/clients': {
      get: {
        summary: 'Obtener lista de clientes',
        tags: ['Clientes'],
        responses: {
          200: { description: 'Lista de clientes obtenida exitosamente' },
        },
      },
      post: {
        summary: 'Crear un nuevo cliente',
        tags: ['Clientes'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Hospital Central' },
                  cif: { type: 'string', example: 'A12345678' },
                  address: { type: 'string', example: 'Av. Principal 123' },
                  contactName: { type: 'string', example: 'Juan Pérez' },
                  contactPhone: { type: 'string', example: '+34 600 000 000' },
                  contactEmail: { type: 'string', example: 'juan@hospital.es' },
                  notes: { type: 'string', example: 'Contrato de mantenimiento 24/7' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Cliente creado' },
        },
      },
    },
    '/subsystems': {
      get: {
        summary: 'Obtener lista de subsistemas (Red, CCTV, Interfonía, Control de accesos)',
        tags: ['Subsistemas'],
        responses: {
          200: { description: 'Subsistemas devueltos' },
        },
      },
      post: {
        summary: 'Crear un subsistema',
        tags: ['Subsistemas'],
        responses: {
          201: { description: 'Subsistema creado' },
        },
      },
    },
    '/devices': {
      get: {
        summary: 'Filtrar y listar dispositivos',
        tags: ['Dispositivos'],
        parameters: [
          { name: 'clientId', in: 'query', schema: { type: 'string' } },
          { name: 'subsystemId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Dispositivos encontrados' },
        },
      },
      post: {
        summary: 'Registrar un dispositivo individual',
        tags: ['Dispositivos'],
        responses: {
          201: { description: 'Dispositivo registrado' },
        },
      },
    },
    '/devices/bulk': {
      post: {
        summary: 'Creación masiva de N dispositivos (Asistente de lote)',
        tags: ['Dispositivos'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clientId', 'subsystemId', 'brand', 'model', 'baseName', 'count'],
                properties: {
                  clientId: { type: 'string', format: 'uuid' },
                  subsystemId: { type: 'string', format: 'uuid' },
                  brand: { type: 'string', example: 'Hikvision' },
                  model: { type: 'string', example: 'DS-2CD2143G0-I' },
                  baseName: { type: 'string', example: 'CAM-CAMARA-' },
                  startNumber: { type: 'number', example: 1 },
                  count: { type: 'number', example: 20 },
                  startIpAddress: { type: 'string', example: '192.168.1.100' },
                  rackCabinet: { type: 'string', example: 'Rack R1 - Planta 2' },
                  switchName: { type: 'string', example: 'SW-POE-CORE' },
                  startSwitchPort: { type: 'number', example: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Dispositivos creados masivamente' },
        },
      },
    },
    '/devices/{id}/credentials': {
      get: {
        summary: 'Obtener credenciales descifradas AES-256 de un dispositivo',
        tags: ['Dispositivos / Seguridad'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Credenciales descifradas (usuario, contraseña, notas adicionales)' },
          404: { description: 'Sin credenciales o no encontrado' },
        },
      },
    },
  },
};
