import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inicializando catálogos base (Subsistemas, Tipos de Dispositivo y Estados)...');

  // 1. Crear / actualizar Subsistemas por defecto
  const subsystemsData = [
    { name: 'Red', color: '#0284c7', icon: 'network', description: 'Switches, routers, puntos de acceso y latiguillos' },
    { name: 'CCTV', color: '#dc2626', icon: 'camera', description: 'Grabadores NVR/DVR, cámaras IP domo/bullet y codificadores' },
    { name: 'Interfonía', color: '#7c3aed', icon: 'phone-call', description: 'Placas de calle, monitores interiores e interfonos IP' },
    { name: 'Control de accesos', color: '#059669', icon: 'key-round', description: 'Lectoras de huella/tarjeta, controladoras de puerta y cerraduras' },
    { name: 'Intrusión / Alarma', color: '#d97706', icon: 'shield-alert', description: 'Centrales de alarma, detectores volumétricos y teclados' },
  ];

  const subsystemsMap = new Map();
  for (const sub of subsystemsData) {
    const created = await prisma.subsystem.upsert({
      where: { name: sub.name },
      update: { color: sub.color, icon: sub.icon, description: sub.description },
      create: sub,
    });
    subsystemsMap.set(sub.name, created.id);
  }

  // 2. Crear Tipos de Dispositivo por defecto para cada subsistema
  const deviceTypesData = [
    { name: 'Switch PoE', subsystemId: subsystemsMap.get('Red') },
    { name: 'Router', subsystemId: subsystemsMap.get('Red') },
    { name: 'Punto de Acceso AP', subsystemId: subsystemsMap.get('Red') },

    { name: 'Cámara de vídeo', subsystemId: subsystemsMap.get('CCTV') },
    { name: 'Grabadora NVR', subsystemId: subsystemsMap.get('CCTV') },
    { name: 'Decodificador IP', subsystemId: subsystemsMap.get('CCTV') },

    { name: 'Placa de calle', subsystemId: subsystemsMap.get('Interfonía') },
    { name: 'Monitor interior', subsystemId: subsystemsMap.get('Interfonía') },

    { name: 'Controladora de accesos', subsystemId: subsystemsMap.get('Control de accesos') },
    { name: 'Lector biométrico', subsystemId: subsystemsMap.get('Control de accesos') },

    { name: 'Central de alarma', subsystemId: subsystemsMap.get('Intrusión / Alarma') },
    { name: 'Detector volumétrico', subsystemId: subsystemsMap.get('Intrusión / Alarma') },
  ];

  for (const dt of deviceTypesData) {
    if (!dt.subsystemId) continue;
    const existing = await prisma.deviceType.findFirst({
      where: {
        name: dt.name,
        subsystemId: dt.subsystemId,
      },
    });

    if (!existing) {
      await prisma.deviceType.create({
        data: {
          name: dt.name,
          subsystemId: dt.subsystemId,
        },
      });
    }
  }

  // 3. Crear Estados de Dispositivo por defecto
  const statusesData = [
    { name: 'Operativo', color: '#10b981', description: 'Dispositivo funcionando correctamente en producción' },
    { name: 'Falta instalación', color: '#f59e0b', description: 'Pendiente de montaje, cableado o configuración' },
    { name: 'En mantenimiento', color: '#06b6d4', description: 'En revisión técnica o sustitución temporal' },
    { name: 'Baja', color: '#ef4444', description: 'Dispositivo retirado o fuera de servicio' },
  ];

  for (const st of statusesData) {
    await prisma.deviceStatus.upsert({
      where: { name: st.name },
      update: { color: st.color, description: st.description },
      create: st,
    });
  }

  console.log('✅ Catálogos base inicializados correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
