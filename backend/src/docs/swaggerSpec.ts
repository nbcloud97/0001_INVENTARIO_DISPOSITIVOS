export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API REST Inventario de Dispositivos por Cliente',
    version: '2.5.0',
    description: 'API REST profesional para integración y gestión técnica de inventario de dispositivos informáticos y seguridad electrónica. Soporta operaciones CRUD para Clientes, Sistemas, Notas, Adjuntos, Subsistemas, Tipos, Estados, Dispositivos, Bóveda de Credenciales Cifradas AES-256-GCM, Integración Oracle ERP Beta 10 y Copias de Seguridad.',
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Servidor Local / Producción Docker',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Autenticación de usuario',
        tags: ['Autenticación'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Token JWT y datos del usuario devueltos' },
          401: { description: 'Credenciales inválidas' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Obtener datos del usuario autenticado',
        tags: ['Autenticación'],
        responses: {
          200: { description: 'Información del usuario actual' },
        },
      },
    },
    '/clients': {
      get: {
        summary: 'Obtener lista de clientes',
        tags: ['Clientes'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Búsqueda por nombre, CIF o ID' },
          { name: 'isArchived', in: 'query', schema: { type: 'boolean' }, description: 'Filtrar por estado de archivado' },
        ],
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
                  legalName: { type: 'string', example: 'Hospital Central S.L.' },
                  cif: { type: 'string', example: 'B12345678' },
                  manualId: { type: 'string', example: 'CLI-001' },
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
    '/clients/{id}': {
      get: {
        summary: 'Obtener cliente por ID',
        tags: ['Clientes'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Cliente encontrado' }, 404: { description: 'No encontrado' } },
      },
      put: {
        summary: 'Actualizar cliente (incluye archivado en cascada a sus sistemas)',
        tags: ['Clientes'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  legalName: { type: 'string' },
                  cif: { type: 'string' },
                  manualId: { type: 'string' },
                  notes: { type: 'string' },
                  isArchived: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Cliente actualizado' } },
      },
      delete: {
        summary: 'Eliminar cliente',
        tags: ['Clientes'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Cliente eliminado' } },
      },
    },
    '/systems': {
      get: {
        summary: 'Listar sistemas registrados',
        tags: ['Sistemas'],
        parameters: [
          { name: 'clientId', in: 'query', schema: { type: 'string' } },
          { name: 'subsystemId', in: 'query', schema: { type: 'string' } },
          { name: 'isArchived', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Lista de sistemas' } },
      },
      post: {
        summary: 'Crear un nuevo sistema',
        tags: ['Sistemas'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'clientId'],
                properties: {
                  name: { type: 'string', example: 'Sistema CCTV Planta 1' },
                  code: { type: 'string', example: 'SYS-CCTV-01' },
                  description: { type: 'string' },
                  notes: { type: 'string' },
                  clientId: { type: 'string' },
                  subsystemId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Sistema creado' } },
      },
    },
    '/systems/{id}': {
      get: {
        summary: 'Obtener detalle de sistema',
        tags: ['Sistemas'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Sistema encontrado' } },
      },
      put: {
        summary: 'Actualizar sistema',
        tags: ['Sistemas'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Sistema actualizado' } },
      },
      delete: {
        summary: 'Eliminar sistema',
        tags: ['Sistemas'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Sistema eliminado' } },
      },
    },
    '/systems/{systemId}/notes': {
      get: {
        summary: 'Obtener notas técnicas de un sistema',
        tags: ['Notas de Sistema'],
        parameters: [{ name: 'systemId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Listado de notas' } },
      },
    },
    '/systems/notes': {
      post: {
        summary: 'Crear nota técnica en un sistema',
        tags: ['Notas de Sistema'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['systemId', 'content'],
                properties: {
                  systemId: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Nota creada' } },
      },
    },
    '/systems/{systemId}/attachments': {
      get: {
        summary: 'Listar archivos adjuntos de un sistema',
        tags: ['Adjuntos de Sistema'],
        parameters: [{ name: 'systemId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Listado de archivos' } },
      },
    },
    '/systems/attachments': {
      post: {
        summary: 'Subir archivo adjunto a un sistema',
        tags: ['Adjuntos de Sistema'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['systemId', 'file'],
                properties: {
                  systemId: { type: 'string' },
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Archivo adjuntado con éxito' } },
      },
    },
    '/devices': {
      get: {
        summary: 'Filtrar y listar dispositivos',
        tags: ['Dispositivos'],
        parameters: [
          { name: 'clientId', in: 'query', schema: { type: 'string' } },
          { name: 'systemId', in: 'query', schema: { type: 'string' } },
          { name: 'subsystemId', in: 'query', schema: { type: 'string' } },
          { name: 'statusId', in: 'query', schema: { type: 'string' } },
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
                required: ['clientId', 'systemId', 'subsystemId', 'deviceTypeId', 'baseName', 'count'],
                properties: {
                  clientId: { type: 'string' },
                  systemId: { type: 'string' },
                  subsystemId: { type: 'string' },
                  deviceTypeId: { type: 'string' },
                  brand: { type: 'string', example: 'Hikvision' },
                  model: { type: 'string', example: 'DS-2CD2143G0-I' },
                  baseName: { type: 'string', example: 'CAM-EXT-' },
                  startNumber: { type: 'number', example: 1 },
                  count: { type: 'number', example: 10 },
                  startIpAddress: { type: 'string', example: '192.168.1.100' },
                  rackCabinet: { type: 'string', example: 'Rack R1' },
                  switchName: { type: 'string', example: 'SW-POE-01' },
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
    '/devices/import': {
      post: {
        summary: 'Importación masiva de dispositivos desde Excel',
        tags: ['Dispositivos'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clientId', 'systemId', 'devices'],
                properties: {
                  clientId: { type: 'string' },
                  systemId: { type: 'string' },
                  devices: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Dispositivos importados con éxito' },
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
          200: { description: 'Credenciales descifradas (cuentas de acceso)' },
          404: { description: 'Sin credenciales o no encontrado' },
        },
      },
    },
    '/beta10/search': {
      get: {
        summary: 'Buscar clientes en base de datos Oracle ERP Beta 10',
        tags: ['Integración ERP Beta 10'],
        parameters: [
          { name: 'query', in: 'query', required: true, schema: { type: 'string' }, description: 'Texto de búsqueda (nombre, CIF o ID)' },
        ],
        responses: {
          200: { description: 'Clientes encontrados en Beta 10' },
        },
      },
    },
    '/beta10/clients/{idcliente}/systems': {
      get: {
        summary: 'Obtener sistemas asociados a un cliente en Beta 10',
        tags: ['Integración ERP Beta 10'],
        parameters: [
          { name: 'idcliente', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Sistemas encontrados en Beta 10' },
        },
      },
    },
    '/beta10/import': {
      post: {
        summary: 'Importar cliente y sistemas seleccionados de Beta 10 al inventario',
        tags: ['Integración ERP Beta 10'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['client', 'systems'],
                properties: {
                  client: { type: 'object' },
                  systems: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Cliente y sistemas importados correctamente' },
        },
      },
    },
    '/backup/stats': {
      get: {
        summary: 'Obtener estadísticas de la base de datos para respaldo',
        tags: ['Copias de Seguridad'],
        responses: { 200: { description: 'Estadísticas obtenidas' } },
      },
    },
    '/backup/export': {
      get: {
        summary: 'Generar y descargar copia de seguridad integral (JSON)',
        tags: ['Copias de Seguridad'],
        responses: { 200: { description: 'Archivo JSON de backup generado' } },
      },
    },
    '/backup/restore': {
      post: {
        summary: 'Restaurar base de datos a partir de archivo de backup',
        tags: ['Copias de Seguridad'],
        responses: { 200: { description: 'Base de datos restaurada' } },
      },
    },
  },
};
