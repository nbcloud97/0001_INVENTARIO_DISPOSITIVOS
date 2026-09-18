import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Device } from '../types';
import { api } from '../services/api';

export interface PdfExportOptions {
  includeCredentials?: boolean;
}

/**
 * Exporta el inventario de dispositivos de un sistema en un documento PDF
 * maquetado profesionalmente para presentación a clientes o uso técnico.
 */
export async function exportSystemDevicesToPdf(
  systemName: string,
  clientName: string,
  devices: Device[],
  options: PdfExportOptions = {}
) {
  const includeCredentials = !!options.includeCredentials;

  // Si se solicitan credenciales, cargarlas en paralelo
  const devicesWithCreds = await Promise.all(
    devices.map(async (device) => {
      let credentials: { title?: string; username?: string; password?: string }[] = [];
      if (includeCredentials && device.hasCredentials) {
        try {
          const creds = await api.getDeviceCredentials(device.id);
          if (Array.isArray(creds)) {
            credentials = creds;
          }
        } catch {
          credentials = [{ title: 'ACCESO', username: 'ERROR', password: '***' }];
        }
      }
      return {
        ...device,
        loadedCredentials: credentials,
      };
    })
  );

  // Inicializar documento PDF en formato A4 apaisado (Landscape: 297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // 1. Franja decorativa superior corporativa
  doc.setFillColor(15, 23, 42); // Navy oscuro (#0f172a)
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFillColor(2, 132, 199); // Acento Cyan (#0284c7)
  doc.rect(0, 24, pageWidth, 2, 'F');

  // Título en la barra superior
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('INFORME TECNICO DE INVENTARIO DE DISPOSITIVOS', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  const dateStr = new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`FECHA DE EMISION: ${dateStr}`, pageWidth - margin, 13, { align: 'right' });

  currentY = 32;

  // 2. Tarjetas de Metadatos (Cliente y Sistema)
  const cardWidth = (pageWidth - margin * 2 - 8) / 2;
  const cardHeight = 20;

  // Tarjeta Cliente
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CLIENTE / EMPRESA', margin + 6, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text((clientName || 'Cliente no especificado').toUpperCase(), margin + 6, currentY + 14);

  // Tarjeta Sistema
  const sysCardX = margin + cardWidth + 8;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(sysCardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SISTEMA / INSTALACION', sysCardX + 6, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(2, 132, 199);
  doc.text((systemName || 'Sistema General').toUpperCase(), sysCardX + 6, currentY + 14);

  currentY += cardHeight + 8;

  // Agrupar dispositivos por subsistema
  const subsystemsMap = new Map<string, typeof devicesWithCreds>();
  devicesWithCreds.forEach((device) => {
    const subName = device.subsystem?.name || 'GENERAL';
    if (!subsystemsMap.has(subName)) {
      subsystemsMap.set(subName, []);
    }
    subsystemsMap.get(subName)!.push(device);
  });

  // Si no hay dispositivos registrados
  if (subsystemsMap.size === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No hay dispositivos registrados en este sistema.', margin, currentY + 8);
  }

  // 4. Tablas de Dispositivos por Subsistema
  for (const [subsystemName, subDevices] of subsystemsMap.entries()) {
    // Salto de página si queda poco espacio
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = margin + 10;
    }

    // Cabecera del Subsistema
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 7.5, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`SUBSISTEMA: ${subsystemName.toUpperCase()} (${subDevices.length} EQUIPOS)`, margin + 4, currentY + 5.2);

    currentY += 9.5;

    // Configuración de columnas y encabezados según includeCredentials
    const tableHeaders = includeCredentials
      ? [
          '#',
          'NOMBRE DISPOSITIVO',
          'TIPO DISPOSITIVO',
          'MARCA / MODELO',
          'NUM. SERIE',
          'CONFIGURACION IP',
          'MAC',
          'UBICACION / CONEXION',
          'CREDENCIALES',
        ]
      : [
          '#',
          'NOMBRE DISPOSITIVO',
          'TIPO DISPOSITIVO',
          'MARCA / MODELO',
          'NUM. SERIE',
          'CONFIGURACION IP',
          'MAC',
          'UBICACION / CONEXION',
        ];

    const columnStylesConfig: Record<string, any> = includeCredentials
      ? {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 40, fontStyle: 'bold' },
          2: { cellWidth: 30 },
          3: { cellWidth: 35 },
          4: { cellWidth: 28 },
          5: { cellWidth: 35 },
          6: { cellWidth: 28 },
          7: { cellWidth: 32 },
          8: { cellWidth: 33, fontStyle: 'bold', textColor: [180, 83, 9] }, // Amber 700
        }
      : {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 45, fontStyle: 'bold' },
          2: { cellWidth: 35 },
          3: { cellWidth: 40 },
          4: { cellWidth: 32 },
          5: { cellWidth: 38 },
          6: { cellWidth: 32 },
          7: { cellWidth: 37 },
        };

    // Filas para la tabla
    const tableBody = subDevices.map((dev, i) => {
      // Configuración IP
      const networkParts: string[] = [];
      if (dev.ipAddress) networkParts.push(`IP: ${dev.ipAddress}`);
      if (dev.subnetMask) networkParts.push(`MSK: ${dev.subnetMask}`);
      if (dev.gateway) networkParts.push(`GW: ${dev.gateway}`);
      const networkInfo = networkParts.length > 0 ? networkParts.join('\n') : '-';

      // Ubicación / Conexión
      const locParts: string[] = [];
      if (dev.rackCabinet) locParts.push(`RACK: ${dev.rackCabinet}`);
      if (dev.switchName) {
        locParts.push(`SW: ${dev.switchName}${dev.switchPort ? ` [${dev.switchPort}]` : ''}`);
      }
      const locationInfo = locParts.length > 0 ? locParts.join('\n') : '-';

      // Fabricante y Modelo
      const hwInfo = [dev.brand || '', dev.model || ''].filter(Boolean).join(' - ') || '-';

      const row = [
        (i + 1).toString(),
        dev.assignedName || '-',
        dev.deviceTypeName || '-',
        hwInfo,
        dev.serialNumber || '-',
        networkInfo,
        dev.macAddress || '-',
        locationInfo,
      ];

      // Formato usuario/contraseña si se solicitan credenciales
      if (includeCredentials) {
        let credsText = '-';
        if (dev.loadedCredentials && dev.loadedCredentials.length > 0) {
          credsText = dev.loadedCredentials
            .map((c) => `${c.username || '-'}/${c.password || '-'}`)
            .join('\n');
        }
        row.push(credsText);
      }

      return row;
    });

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableBody,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        overflow: 'linebreak',
        textColor: [30, 41, 59],
        valign: 'middle',
      },
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Slate 50
      },
      columnStyles: columnStylesConfig,
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 7 : currentY + 30;
  }

  // 5. Pie de página en todas las páginas generadas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Línea separadora
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `Documento Confidencial | Inventario Tecnico de Instalaciones | ${clientName} - ${systemName}`,
      margin,
      pageHeight - 5
    );
    doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  // Sanitizar nombre del archivo
  const safeSystemName = (systemName || 'SISTEMA').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
  const safeClientName = (clientName || 'CLIENTE').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
  const credsSuffix = includeCredentials ? '_CON_CREDENCIALES' : '';
  const fileName = `${safeClientName}_${safeSystemName}_INVENTARIO${credsSuffix}.pdf`;

  // Descargar el archivo PDF en el navegador
  doc.save(fileName);
}
