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

  // Ajustar anchos de columna automáticamente para legibilidad
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
 * Genera y descarga la plantilla oficial de Excel para la importación masiva de dispositivos (incluye credenciales)
 */
export function downloadImportTemplate() {
  const templateRows = [
    {
      'NOMBRE ASIGNADO': 'CAM_ACCESO_PRINCIPAL_01',
      'SUBSISTEMA': 'CCTV',
      'TIPO DE DISPOSITIVO': 'Cámara IP Domo',
      'ESTADO': 'Operativo',
      'MARCA': 'HIKVISION',
      'MODELO': 'DS-2CD2143G0-I',
      'NÚMERO DE SERIE': 'HKV-2026-987651',
      'DIRECCIÓN IP': '192.168.1.101',
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
      'NOMBRE ASIGNADO': 'CENTRAL_INTRUSION_01',
      'SUBSISTEMA': 'INTRUSIÓN',
      'TIPO DE DISPOSITIVO': 'Central de Alarma',
      'ESTADO': 'Operativo',
      'MARCA': 'HONEYWELL',
      'MODELO': 'GALAXY FLEX 50',
      'NÚMERO DE SERIE': 'HON-INT-2026-02',
      'DIRECCIÓN IP': '192.168.1.102',
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
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);

  worksheet['!cols'] = [
    { wch: 28 }, // NOMBRE ASIGNADO
    { wch: 16 }, // SUBSISTEMA
    { wch: 24 }, // TIPO DE DISPOSITIVO
    { wch: 16 }, // MARCA
    { wch: 18 }, // MODELO
    { wch: 20 }, // NÚMERO DE SERIE
    { wch: 18 }, // DIRECCIÓN IP
    { wch: 25 }, // PUERTOS DE COMUNICACIÓN
    { wch: 20 }, // DIRECCIÓN MAC
    { wch: 22 }, // RACK
    { wch: 22 }, // REFERENCIA SWITCH
    { wch: 16 }, // SWITCH PUERTO
    { wch: 20 }, // USUARIO CREDENCIAL
    { wch: 24 }, // CONTRASEÑA CREDENCIAL
    { wch: 22 }, // ETIQUETA CREDENCIAL
    { wch: 40 }, // NOTAS
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Importacion');

  XLSX.writeFile(workbook, 'PLANTILLA_IMPORTACION_DISPOSITIVOS.xlsx');
}
