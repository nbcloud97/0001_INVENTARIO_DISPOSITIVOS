import * as XLSX from 'xlsx';
import { Device } from '../types';
import { api } from '../services/api';

export async function exportSystemDevicesToExcel(
  systemName: string,
  clientName: string,
  devices: Device[]
) {
  // Obtener la información completa incluyendo credenciales descifradas si están disponibles
  const rows = await Promise.all(
    devices.map(async (device) => {
      let credsSummary = '';
      if (device.hasCredentials) {
        try {
          const creds = await api.getDeviceCredentials(device.id);
          if (Array.isArray(creds) && creds.length > 0) {
            credsSummary = creds
              .map((c) => `${c.title || 'ACCESO'}: [USER: ${c.username || '-'}, PASS: ${c.password || '-'}]`)
              .join(' | ');
          }
        } catch {
          credsSummary = 'CON CREDENCIALES';
        }
      }

      const portsSummary = Array.isArray(device.communicationPorts) && device.communicationPorts.length > 0
        ? device.communicationPorts.map((p) => p.service ? `${p.port} (${p.service})` : `${p.port}`).join(', ')
        : '';

      return {
        'CLIENTE': device.client?.name || clientName || '',
        'SISTEMA': device.system?.name || systemName || '',
        'SUBSISTEMA': device.subsystem?.name || '',
        'NOMBRE ASIGNADO': device.assignedName || '',
        'ESTADO': device.statusName || 'Operativo',
        'MARCA': device.brand || '',
        'MODELO': device.model || '',
        'NÚMERO DE SERIE': device.serialNumber || '',
        'DIRECCIÓN IP': device.ipAddress || '',
        'MÁSCARA DE SUBRED': device.subnetMask || '',
        'PUERTA DE ENLACE': device.gateway || '',
        'PUERTOS DE COMUNICACIÓN': portsSummary,
        'DIRECCIÓN MAC': device.macAddress || '',
        'RACK': device.rackCabinet || '',
        'REFERENCIA SWITCH': device.switchName || '',
        'SWITCH PUERTO': device.switchPort || '',
        'CREDENCIALES': credsSummary,
        'NOTAS': device.notes || '',
      };
    })
  );

  // Crear la hoja de cálculo XLSX
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Ajustar anchos de columna automáticamente para legibilidad (18 columnas)
  const columnWidths = [
    { wch: 22 }, // CLIENTE
    { wch: 25 }, // SISTEMA
    { wch: 15 }, // SUBSISTEMA
    { wch: 28 }, // NOMBRE ASIGNADO
    { wch: 16 }, // ESTADO
    { wch: 16 }, // MARCA
    { wch: 18 }, // MODELO
    { wch: 20 }, // NÚMERO DE SERIE
    { wch: 18 }, // DIRECCIÓN IP
    { wch: 20 }, // MÁSCARA DE SUBRED
    { wch: 20 }, // PUERTA DE ENLACE
    { wch: 25 }, // PUERTOS DE COMUNICACIÓN
    { wch: 20 }, // DIRECCIÓN MAC
    { wch: 20 }, // RACK
    { wch: 22 }, // REFERENCIA SWITCH
    { wch: 16 }, // SWITCH PUERTO
    { wch: 40 }, // CREDENCIALES
    { wch: 35 }, // NOTAS
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Dispositivos');

  // Formatear el nombre del archivo sanitizado
  const safeSystemName = (systemName || 'SISTEMA').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
  const safeClientName = (clientName || 'CLIENTE').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
  const fileName = `${safeClientName}_${safeSystemName}_DISPOSITIVOS.xlsx`;

  // Descargar archivo Excel .xlsx directamente en el navegador
  XLSX.writeFile(workbook, fileName);
}

/**
 * Genera y descarga la plantilla oficial de Excel para la importación masiva de dispositivos (incluye credenciales y guía)
 */
export function downloadImportTemplate() {
  const templateRows = [
    {
      'NOMBRE ASIGNADO': 'CAM_ACCESO_PRINCIPAL_01',
      'SUBSISTEMA': 'CCTV',
      'TIPO DE DISPOSITIVO': 'Cámara de vídeo',
      'ESTADO': 'Operativo',
      'MARCA': 'HIKVISION',
      'MODELO': 'DS-2CD2143G0-I',
      'NÚMERO DE SERIE': 'HKV-2026-987651',
      'DIRECCIÓN IP': '192.168.1.101',
      'MÁSCARA DE SUBRED': '255.255.255.0',
      'PUERTA DE ENLACE': '192.168.1.1',
      'PUERTOS DE COMUNICACIÓN': '80 (HTTP), 554 (RTSP), 8000 (SDK)',
      'DIRECCIÓN MAC': '00:11:22:33:44:55',
      'RACK': 'RACK R1 - PLANTA 0',
      'REFERENCIA SWITCH': 'SW-POE-CORE-01',
      'SWITCH PUERTO': 'PUERTO 1',
      'USUARIO CREDENCIAL': 'ADMIN',
      'CONTRASEÑA CREDENCIAL': 'PASSWORD2026!',
      'ETIQUETA CREDENCIAL': 'ACCESO WEB',
      'NOTAS': 'CÁMARA DOMO 4MP EN ENTRADA PRINCIPAL',
    },
    {
      'NOMBRE ASIGNADO': 'SW_POE_PLANTA_01',
      'SUBSISTEMA': 'Red',
      'TIPO DE DISPOSITIVO': 'Switch PoE',
      'ESTADO': 'Operativo',
      'MARCA': 'CISCO',
      'MODELO': 'CBS350-24P-4G',
      'NÚMERO DE SERIE': 'FCW242100AB',
      'DIRECCIÓN IP': '192.168.1.10',
      'MÁSCARA DE SUBRED': '255.255.255.0',
      'PUERTA DE ENLACE': '192.168.1.1',
      'PUERTOS DE COMUNICACIÓN': '22 (SSH), 443 (HTTPS)',
      'DIRECCIÓN MAC': '00:1A:2B:3C:4D:5E',
      'RACK': 'RACK R1 - PLANTA 0',
      'REFERENCIA SWITCH': 'SW-POE-CORE-01',
      'SWITCH PUERTO': 'GIGA 1',
      'USUARIO CREDENCIAL': 'CISCO_ADMIN',
      'CONTRASEÑA CREDENCIAL': 'ADMIN_PASS_2026',
      'ETIQUETA CREDENCIAL': 'GESTIÓN SSH/WEB',
      'NOTAS': 'SWITCH POE 24 PUERTOS GIGABIT',
    },
    {
      'NOMBRE ASIGNADO': 'CENTRAL_INTRUSION_01',
      'SUBSISTEMA': 'Intrusión / Alarma',
      'TIPO DE DISPOSITIVO': 'Central de alarma',
      'ESTADO': 'Operativo',
      'MARCA': 'HONEYWELL',
      'MODELO': 'GALAXY FLEX 50',
      'NÚMERO DE SERIE': 'HON-INT-2026-02',
      'DIRECCIÓN IP': '192.168.1.102',
      'MÁSCARA DE SUBRED': '255.255.255.0',
      'PUERTA DE ENLACE': '192.168.1.1',
      'PUERTOS DE COMUNICACIÓN': '443 (HTTPS), 10001',
      'DIRECCIÓN MAC': '00:11:22:33:44:56',
      'RACK': 'RACK SECUNDARIO R2',
      'REFERENCIA SWITCH': 'SW-POE-CORE-01',
      'SWITCH PUERTO': 'PUERTO 2',
      'USUARIO CREDENCIAL': 'OPERADOR',
      'CONTRASEÑA CREDENCIAL': 'SECURE2026#',
      'ETIQUETA CREDENCIAL': 'ACCESO PRINCIPAL',
      'NOTAS': 'CENTRALITA CON MÓDULO IP Y BATERÍA DE RESPALDO',
    },
    {
      'NOMBRE ASIGNADO': 'CONTROLADORA_ACCESOS_01',
      'SUBSISTEMA': 'Control de accesos',
      'TIPO DE DISPOSITIVO': 'Controladora de accesos',
      'ESTADO': 'Operativo',
      'MARCA': 'DORLET',
      'MODELO': 'AS-600',
      'NÚMERO DE SERIE': 'DOR-ACC-8821',
      'DIRECCIÓN IP': '192.168.1.103',
      'MÁSCARA DE SUBRED': '255.255.255.0',
      'PUERTA DE ENLACE': '192.168.1.1',
      'PUERTOS DE COMUNICACIÓN': '4001, 80',
      'DIRECCIÓN MAC': '00:11:22:33:44:57',
      'RACK': 'RACK R1 - PLANTA 0',
      'REFERENCIA SWITCH': 'SW-POE-CORE-01',
      'SWITCH PUERTO': 'PUERTO 3',
      'USUARIO CREDENCIAL': 'ADMIN',
      'CONTRASEÑA CREDENCIAL': 'DORLET2026',
      'ETIQUETA CREDENCIAL': 'GESTIÓN DORLET',
      'NOTAS': 'CONTROLADORA PARA PUERTAS PRINCIPALES',
    },
    {
      'NOMBRE ASIGNADO': 'PLACA_CALLE_INTERFONIA_01',
      'SUBSISTEMA': 'Interfonía',
      'TIPO DE DISPOSITIVO': 'Placa de calle',
      'ESTADO': 'Operativo',
      'MARCA': 'FERMAX',
      'MODELO': 'MEET IP',
      'NÚMERO DE SERIE': 'FMX-MEET-2026',
      'DIRECCIÓN IP': '192.168.1.104',
      'MÁSCARA DE SUBRED': '255.255.255.0',
      'PUERTA DE ENLACE': '192.168.1.1',
      'PUERTOS DE COMUNICACIÓN': '5060 (SIP), 80 (HTTP)',
      'DIRECCIÓN MAC': '00:11:22:33:44:58',
      'RACK': '',
      'REFERENCIA SWITCH': 'SW-POE-CORE-01',
      'SWITCH PUERTO': 'PUERTO 4',
      'USUARIO CREDENCIAL': 'ADMIN',
      'CONTRASEÑA CREDENCIAL': 'FERMAX1234',
      'ETIQUETA CREDENCIAL': 'CONFIGURACIÓN SIP',
      'NOTAS': 'PLACA DE CALLE VÍDEO IP CON TECLADO',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);

  // Anchos exactos para las 19 columnas de la plantilla
  worksheet['!cols'] = [
    { wch: 28 }, // 1. NOMBRE ASIGNADO
    { wch: 22 }, // 2. SUBSISTEMA
    { wch: 25 }, // 3. TIPO DE DISPOSITIVO
    { wch: 18 }, // 4. ESTADO
    { wch: 18 }, // 5. MARCA
    { wch: 20 }, // 6. MODELO
    { wch: 22 }, // 7. NÚMERO DE SERIE
    { wch: 18 }, // 8. DIRECCIÓN IP
    { wch: 20 }, // 9. MÁSCARA DE SUBRED
    { wch: 20 }, // 10. PUERTA DE ENLACE
    { wch: 32 }, // 11. PUERTOS DE COMUNICACIÓN
    { wch: 20 }, // 12. DIRECCIÓN MAC
    { wch: 22 }, // 13. RACK
    { wch: 22 }, // 14. REFERENCIA SWITCH
    { wch: 18 }, // 15. SWITCH PUERTO
    { wch: 22 }, // 16. USUARIO CREDENCIAL
    { wch: 25 }, // 17. CONTRASEÑA CREDENCIAL
    { wch: 22 }, // 18. ETIQUETA CREDENCIAL
    { wch: 40 }, // 19. NOTAS
  ];

  // Hoja 2: Guía de Referencia y Catálogos
  const guideRows = [
    { 'CAMPO': 'NOMBRE ASIGNADO', 'OBLIGATORIO': 'SÍ', 'DESCRIPCIÓN': 'Nombre único identificativo del equipo (ej: CAM_ENTRADA_01)' },
    { 'CAMPO': 'SUBSISTEMA', 'OBLIGATORIO': 'RECOMENDADO', 'DESCRIPCIÓN': 'Red, CCTV, Interfonía, Control de accesos, Intrusión / Alarma' },
    { 'CAMPO': 'TIPO DE DISPOSITIVO', 'OBLIGATORIO': 'SÍ', 'DESCRIPCIÓN': 'Tipo catalogado (ej: Cámara de vídeo, Switch PoE, Central de alarma, Grabadora NVR)' },
    { 'CAMPO': 'ESTADO', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Operativo, Falta instalación, En mantenimiento, Baja (Por defecto: Operativo)' },
    { 'CAMPO': 'MARCA / MODELO', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Fabricante y modelo del dispositivo (ej: HIKVISION, CISCO, FERMAX)' },
    { 'CAMPO': 'NÚMERO DE SERIE', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Número de serie o identificador de hardware del fabricante' },
    { 'CAMPO': 'DIRECCIÓN IP / MÁSCARA / GATEWAY', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Parámetros de red IPv4 (ej. IP: 192.168.1.100, Máscara: 255.255.255.0, Gateway: 192.168.1.1)' },
    { 'CAMPO': 'DIRECCIÓN MAC', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Dirección física de red (ej: 00:11:22:33:44:55)' },
    { 'CAMPO': 'PUERTOS DE COMUNICACIÓN', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Puertos y servicios separados por coma (ej: 80 (HTTP), 443 (HTTPS), 554 (RTSP))' },
    { 'CAMPO': 'RACK / SWITCH / PUERTO', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Ubicación física en armario rack, switch de parcheo y puerto de red' },
    { 'CAMPO': 'CREDENCIALES', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Usuario, Contraseña y Etiqueta (Se almacenan cifradas en AES-256-GCM)' },
    { 'CAMPO': 'NOTAS', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Observaciones técnicas o aclaraciones sobre el equipo' },
  ];

  const guideWorksheet = XLSX.utils.json_to_sheet(guideRows);
  guideWorksheet['!cols'] = [
    { wch: 35 },
    { wch: 16 },
    { wch: 80 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispositivos');
  XLSX.utils.book_append_sheet(workbook, guideWorksheet, 'Guía de Campos');

  XLSX.writeFile(workbook, 'PLANTILLA_IMPORTACION_DISPOSITIVOS.xlsx');
}
