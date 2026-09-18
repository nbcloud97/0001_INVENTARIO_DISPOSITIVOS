import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { Device } from '../types';
import { api } from '../services/api';

/**
 * Exporta los dispositivos de un sistema en una hoja Excel (.xlsx) maquetada
 * profesionalmente con formato nativo de tabla, filtros, estilos de celda y experiencia visual cuidada.
 */
export async function exportSystemDevicesToExcel(
  systemName: string,
  clientName: string,
  devices: Device[],
  includeCredentials = false
) {
  // Obtener la información completa incluyendo credenciales descifradas si se solicita explícitamente
  const rawData = await Promise.all(
    devices.map(async (device) => {
      let username = '';
      let password = '';
      let userDesc = '';
      if (includeCredentials && device.hasCredentials) {
        try {
          const creds = await api.getDeviceCredentials(device.id);
          if (Array.isArray(creds) && creds.length > 0) {
            userDesc = creds.map((c) => c.title || 'ACCESO').join(' | ');
            username = creds.map((c) => c.username || '').join(' | ');
            password = creds.map((c) => c.password || '').join(' | ');
          }
        } catch {
          userDesc = 'CON CREDENCIALES';
        }
      }

      const ports =
        Array.isArray(device.communicationPorts) && device.communicationPorts.length > 0
          ? device.communicationPorts.map((p) => p.port).join(', ')
          : '';
      const portNames =
        Array.isArray(device.communicationPorts) && device.communicationPorts.length > 0
          ? device.communicationPorts.map((p) => p.service || '').join(', ')
          : '';

      return [
        device.subsystem?.name || '',
        device.deviceTypeName || '',
        device.statusName || 'Operativo',
        device.assignedName || '',
        device.brand || '',
        device.model || '',
        device.serialNumber || '',
        device.ipAddress || '',
        device.subnetMask || '',
        device.gateway || '',
        device.macAddress || '',
        device.rackCabinet || '',
        device.switchName || '',
        device.switchPort || '',
        userDesc,
        username,
        password,
        ports,
        portNames,
      ];
    })
  );

  const columns = [
    { name: 'SUBSISTEMA', filterButton: true },
    { name: 'TIPO_DISPOSITIVO', filterButton: true },
    { name: 'ESTADO', filterButton: true },
    { name: 'NOMBRE', filterButton: true },
    { name: 'MARCA', filterButton: true },
    { name: 'MODELO', filterButton: true },
    { name: 'NUMERO_SERIE', filterButton: true },
    { name: 'IP', filterButton: true },
    { name: 'MASCARA', filterButton: true },
    { name: 'PUERTA_ENLACE', filterButton: true },
    { name: 'MAC', filterButton: true },
    { name: 'RACK', filterButton: true },
    { name: 'SWITCH', filterButton: true },
    { name: 'SWITCH_PUERTO', filterButton: true },
    { name: 'USUARIO_DESCRIPCION', filterButton: true },
    { name: 'USUARIO', filterButton: true },
    { name: 'CONTRASEÑA', filterButton: true },
    { name: 'PUERTO', filterButton: true },
    { name: 'PUERTO_NOMBRE', filterButton: true },
  ];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Inventario de Dispositivos';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Dispositivos', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
  });

  // Si hay datos, agregarlos como tabla nativa de Excel con estilo corporativo
  if (rawData.length > 0) {
    worksheet.addTable({
      name: 'TablaDispositivos',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium9', // Estilo azul marino/slate con filas alternas
        showRowStripes: true,
      },
      columns,
      rows: rawData,
    });
  } else {
    // Si no hay datos, crear la fila de encabezados formateada
    const headerRow = worksheet.addRow(columns.map((c) => c.name));
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Segoe UI' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;
  }

  // Anchos y alineaciones visuales por columna
  const colWidths = [
    { width: 22, align: 'left' },    // SUBSISTEMA
    { width: 24, align: 'left' },    // TIPO_DISPOSITIVO
    { width: 18, align: 'center' },  // ESTADO
    { width: 28, align: 'left' },    // NOMBRE
    { width: 18, align: 'left' },    // MARCA
    { width: 20, align: 'left' },    // MODELO
    { width: 22, align: 'center' },  // NUMERO_SERIE
    { width: 18, align: 'center' },  // IP
    { width: 18, align: 'center' },  // MASCARA
    { width: 18, align: 'center' },  // PUERTA_ENLACE
    { width: 20, align: 'center' },  // MAC
    { width: 22, align: 'left' },    // RACK
    { width: 22, align: 'left' },    // SWITCH
    { width: 16, align: 'center' },  // SWITCH_PUERTO
    { width: 22, align: 'left' },    // USUARIO_DESCRIPCION
    { width: 18, align: 'left' },    // USUARIO
    { width: 20, align: 'left' },    // CONTRASEÑA
    { width: 18, align: 'center' },  // PUERTO
    { width: 20, align: 'left' },    // PUERTO_NOMBRE
  ];

  colWidths.forEach((cw, idx) => {
    const col = worksheet.getColumn(idx + 1);
    col.width = cw.width;
    col.alignment = { vertical: 'middle', horizontal: cw.align as any };
  });

  // Ajustar altura de las filas
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.height = 26;
      row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Segoe UI' };
      row.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      row.height = 20;
      row.font = { size: 9.5, name: 'Segoe UI' };
    }
  });

  // Generar buffer y descargar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const safeSystemName = (systemName || 'SISTEMA').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
  const safeClientName = (clientName || 'CLIENTE').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
  const credsSuffix = includeCredentials ? '_CON_CREDENCIALES' : '';
  const fileName = `${safeClientName}_${safeSystemName}_DISPOSITIVOS${credsSuffix}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

/**
 * Genera y descarga la plantilla oficial de Excel para la importación masiva de dispositivos
 * Con los 19 campos exactos: SUBSISTEMA, TIPO_DISPOSITIVO, ESTADO, NOMBRE, MARCA, MODELO, NUMERO_SERIE, IP, MASCARA, PUERTA_ENLACE, MAC, RACK, SWITCH, SWITCH_PUERTO, USUARIO_DESCRIPCION, USUARIO, CONTRASEÑA, PUERTO, PUERTO_NOMBRE
 */
export function downloadImportTemplate() {
  const templateRows = [
    {
      'SUBSISTEMA': 'CCTV',
      'TIPO_DISPOSITIVO': 'Cámara de vídeo',
      'ESTADO': 'Operativo',
      'NOMBRE': 'CAM_ACCESO_PRINCIPAL_01',
      'MARCA': 'HIKVISION',
      'MODELO': 'DS-2CD2143G0-I',
      'NUMERO_SERIE': 'HKV-2026-987651',
      'IP': '192.168.1.101',
      'MASCARA': '255.255.255.0',
      'PUERTA_ENLACE': '192.168.1.1',
      'MAC': '00:11:22:33:44:55',
      'RACK': 'RACK R1 - PLANTA 0',
      'SWITCH': 'SW-POE-CORE-01',
      'SWITCH_PUERTO': 'PUERTO 1',
      'USUARIO_DESCRIPCION': 'ACCESO WEB',
      'USUARIO': 'ADMIN',
      'CONTRASEÑA': 'PASSWORD2026!',
      'PUERTO': '80, 554, 8000',
      'PUERTO_NOMBRE': 'HTTP, RTSP, SDK',
    },
    {
      'SUBSISTEMA': 'Red',
      'TIPO_DISPOSITIVO': 'Switch PoE',
      'ESTADO': 'Operativo',
      'NOMBRE': 'SW_POE_PLANTA_01',
      'MARCA': 'CISCO',
      'MODELO': 'CBS350-24P-4G',
      'NUMERO_SERIE': 'FCW242100AB',
      'IP': '192.168.1.10',
      'MASCARA': '255.255.255.0',
      'PUERTA_ENLACE': '192.168.1.1',
      'MAC': '00:1A:2B:3C:4D:5E',
      'RACK': 'RACK R1 - PLANTA 0',
      'SWITCH': 'SW-POE-CORE-01',
      'SWITCH_PUERTO': 'GIGA 1',
      'USUARIO_DESCRIPCION': 'GESTIÓN SSH/WEB',
      'USUARIO': 'CISCO_ADMIN',
      'CONTRASEÑA': 'ADMIN_PASS_2026',
      'PUERTO': '22, 443',
      'PUERTO_NOMBRE': 'SSH, HTTPS',
    },
    {
      'SUBSISTEMA': 'Intrusión / Alarma',
      'TIPO_DISPOSITIVO': 'Central de alarma',
      'ESTADO': 'Operativo',
      'NOMBRE': 'CENTRAL_INTRUSION_01',
      'MARCA': 'HONEYWELL',
      'MODELO': 'GALAXY FLEX 50',
      'NUMERO_SERIE': 'HON-INT-2026-02',
      'IP': '192.168.1.102',
      'MASCARA': '255.255.255.0',
      'PUERTA_ENLACE': '192.168.1.1',
      'MAC': '00:11:22:33:44:56',
      'RACK': 'RACK SECUNDARIO R2',
      'SWITCH': 'SW-POE-CORE-01',
      'SWITCH_PUERTO': 'PUERTO 2',
      'USUARIO_DESCRIPCION': 'ACCESO PRINCIPAL',
      'USUARIO': 'OPERADOR',
      'CONTRASEÑA': 'SECURE2026#',
      'PUERTO': '443, 10001',
      'PUERTO_NOMBRE': 'HTTPS, BUS IP',
    },
    {
      'SUBSISTEMA': 'Control de accesos',
      'TIPO_DISPOSITIVO': 'Controladora de accesos',
      'ESTADO': 'Operativo',
      'NOMBRE': 'CONTROLADORA_ACCESOS_01',
      'MARCA': 'DORLET',
      'MODELO': 'AS-600',
      'NUMERO_SERIE': 'DOR-ACC-8821',
      'IP': '192.168.1.103',
      'MASCARA': '255.255.255.0',
      'PUERTA_ENLACE': '192.168.1.1',
      'MAC': '00:11:22:33:44:57',
      'RACK': 'RACK R1 - PLANTA 0',
      'SWITCH': 'SW-POE-CORE-01',
      'SWITCH_PUERTO': 'PUERTO 3',
      'USUARIO_DESCRIPCION': 'GESTIÓN DORLET',
      'USUARIO': 'ADMIN',
      'CONTRASEÑA': 'DORLET2026',
      'PUERTO': '443, 3001',
      'PUERTO_NOMBRE': 'HTTPS, DORLET BUS',
    },
    {
      'SUBSISTEMA': 'Interfonía / Megafonía',
      'TIPO_DISPOSITIVO': 'Placa de calle IP',
      'ESTADO': 'Operativo',
      'NOMBRE': 'INTERFONO_ACCESO_PEATONAL',
      'MARCA': 'FERMAX',
      'MODELO': 'MEET IP MILO',
      'NUMERO_SERIE': 'FMX-2026-009',
      'IP': '192.168.1.104',
      'MASCARA': '255.255.255.0',
      'PUERTA_ENLACE': '192.168.1.1',
      'MAC': '00:11:22:33:44:58',
      'RACK': 'RACK R1 - PLANTA 0',
      'SWITCH': 'SW-POE-CORE-01',
      'SWITCH_PUERTO': 'PUERTO 4',
      'USUARIO_DESCRIPCION': 'SIP SERVER',
      'USUARIO': 'FERMAX_ADMIN',
      'CONTRASEÑA': 'FERMAX_PASS_2026',
      'PUERTO': '5060, 80',
      'PUERTO_NOMBRE': 'SIP, HTTP',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);

  worksheet['!cols'] = [
    { wch: 22 }, // SUBSISTEMA
    { wch: 25 }, // TIPO_DISPOSITIVO
    { wch: 16 }, // ESTADO
    { wch: 28 }, // NOMBRE
    { wch: 18 }, // MARCA
    { wch: 20 }, // MODELO
    { wch: 22 }, // NUMERO_SERIE
    { wch: 18 }, // IP
    { wch: 20 }, // MASCARA
    { wch: 20 }, // PUERTA_ENLACE
    { wch: 20 }, // MAC
    { wch: 22 }, // RACK
    { wch: 22 }, // SWITCH
    { wch: 18 }, // SWITCH_PUERTO
    { wch: 24 }, // USUARIO_DESCRIPCION
    { wch: 20 }, // USUARIO
    { wch: 22 }, // CONTRASEÑA
    { wch: 20 }, // PUERTO
    { wch: 22 }, // PUERTO_NOMBRE
  ];

  const guideRows = [
    { 'CAMPO': 'SUBSISTEMA', 'OBLIGATORIO': 'SÍ', 'DESCRIPCIÓN': 'Nombre del subsistema (ej: CCTV, Red, Intrusión, Control de accesos)' },
    { 'CAMPO': 'TIPO_DISPOSITIVO', 'OBLIGATORIO': 'SÍ', 'DESCRIPCIÓN': 'Tipo catalogado (ej: Cámara de vídeo, Switch PoE, Central de alarma, Grabadora NVR)' },
    { 'CAMPO': 'ESTADO', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Operativo, Falta instalación, En mantenimiento, Baja (Por defecto: Operativo)' },
    { 'CAMPO': 'NOMBRE', 'OBLIGATORIO': 'SÍ', 'DESCRIPCIÓN': 'Nombre único identificativo del equipo (ej: CAM_ENTRADA_01)' },
    { 'CAMPO': 'MARCA', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Fabricante del dispositivo (ej: HIKVISION, CISCO, FERMAX)' },
    { 'CAMPO': 'MODELO', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Modelo específico del dispositivo (ej: DS-2CD2143G0-I)' },
    { 'CAMPO': 'NUMERO_SERIE', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Número de serie o identificador de hardware del fabricante' },
    { 'CAMPO': 'IP', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Dirección IPv4 asignada (ej: 192.168.1.101)' },
    { 'CAMPO': 'MASCARA', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Máscara de subred (ej: 255.255.255.0 ó /24)' },
    { 'CAMPO': 'PUERTA_ENLACE', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Puerta de enlace predeterminada / Default Gateway (ej: 192.168.1.1)' },
    { 'CAMPO': 'MAC', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Dirección física de red MAC (ej: 00:11:22:33:44:55)' },
    { 'CAMPO': 'RACK', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Armario o Rack de ubicación física (ej: RACK R1 - PLANTA 0)' },
    { 'CAMPO': 'SWITCH', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Nombre o referencia del switch donde conecta (ej: SW-POE-CORE-01)' },
    { 'CAMPO': 'SWITCH_PUERTO', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Puerto o boca de conexión en el switch (ej: PUERTO 1)' },
    { 'CAMPO': 'USUARIO_DESCRIPCION', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Etiqueta o rol de la cuenta (ej: ACCESO WEB, ADMIN, OPERADOR)' },
    { 'CAMPO': 'USUARIO', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Nombre de usuario de acceso' },
    { 'CAMPO': 'CONTRASEÑA', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Contraseña de acceso (se almacenará cifrada en AES-256-GCM)' },
    { 'CAMPO': 'PUERTO', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Puerto o lista de puertos numéricos (ej: 80 ó 80, 554, 8000)' },
    { 'CAMPO': 'PUERTO_NOMBRE', 'OBLIGATORIO': 'NO', 'DESCRIPCIÓN': 'Nombre o protocolo del puerto (ej: HTTP ó HTTP, RTSP, SDK)' },
  ];

  const guideWorksheet = XLSX.utils.json_to_sheet(guideRows);
  guideWorksheet['!cols'] = [
    { wch: 30 },
    { wch: 16 },
    { wch: 80 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispositivos');
  XLSX.utils.book_append_sheet(workbook, guideWorksheet, 'Guía de Campos');

  XLSX.writeFile(workbook, 'importacion_dispositivos.xlsx');
}
