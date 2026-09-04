import { PrismaClient } from '@prisma/client';
import { encryptCredentials } from '../services/cryptoService';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inicializando datos semilla (Seeding con campos de Cliente actualizados)...');

  // 1. Crear Subsistemas por defecto
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

  // 1.5. Crear Tipos de Dispositivo por defecto para cada subsistema
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

  const deviceTypesMap = new Map();
  for (const dt of deviceTypesData) {
    const created = await prisma.deviceType.create({
      data: dt,
    });
    deviceTypesMap.set(dt.name, created.id);
  }

  // 2. Crear Cliente de Prueba 1 con los campos requeridos (Nombre comercial, Nombre fiscal, NIF, ID Manual, notas)
  const client1 = await prisma.client.create({
    data: {
      name: 'Hospital La Paz',                              // Nombre Comercial (Obligatorio)
      legalName: 'Hospital Universitario de la Paz, S.A.', // Nombre Fiscal
      cif: 'A12345678',                                     // NIF
      manualId: '345',                                      // ID Manual
      notes: 'Instalación de seguridad iniciada en Q3 2026. Armario Rack en Planta -1.',
    },
  });

  // 3. Crear Cliente de Prueba 2
  const client2 = await prisma.client.create({
    data: {
      name: 'Centro Comercial Gran Plaza',
      legalName: 'Gran Plaza Retail Inversiones S.L.U.',
      cif: 'B98765432',
      manualId: '682',
      notes: 'Revisión trimestral de switches PoE.',
    },
  });

  // 4. Crear Sistemas para Cliente 1
  const system1_CCTV = await prisma.system.create({
    data: {
      name: 'Sistema CCTV Urgencias & Pasillos',
      code: 'SYS-CCTV-01',
      description: 'Grabación de video en 4K pasillos de urgencias y accesos',
      clientId: client1.id,
      subsystemId: subsystemsMap.get('CCTV'),
    },
  });

  const system1_Red = await prisma.system.create({
    data: {
      name: 'Sistema de Red & Switches Core',
      code: 'SYS-NET-01',
      description: 'Infraestructura de switches PoE y enlaces de fibra',
      clientId: client1.id,
      subsystemId: subsystemsMap.get('Red'),
    },
  });

  // 5. Crear Dispositivos para Sistema CCTV de Cliente 1
  await prisma.device.create({
    data: {
      systemId: system1_CCTV.id,
      clientId: client1.id,
      subsystemId: subsystemsMap.get('CCTV'),
      deviceTypeId: deviceTypesMap.get('Grabadora NVR'),
      brand: 'Hikvision',
      model: 'DS-9664NI-I8',
      serialNumber: 'HKV-NVR-20260901-X',
      assignedName: 'NVR_PRINCIPAL_64CH',
      ipAddress: '192.168.1.10',
      macAddress: '70:B3:D5:11:22:33',
      credentialsEncrypted: encryptCredentials({ username: 'admin', password: 'PasswordSeguro2026!' }),
      rackCabinet: 'Rack R1 - CPD Planta -1',
      switchName: 'SW-CORE-01',
      switchPort: 'Port 01 (Gi1/0/1)',
      notes: 'Grabador principal 64 canales con 8 Discos duros de 10TB en RAID 5.',
    },
  });

  // Dispositivos masivos de cámaras en Sistema CCTV
  const camerasToCreate = [];
  for (let i = 1; i <= 20; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    camerasToCreate.push({
      systemId: system1_CCTV.id,
      clientId: client1.id,
      subsystemId: subsystemsMap.get('CCTV'),
      deviceTypeId: deviceTypesMap.get('Cámara de vídeo'),
      brand: 'Hikvision',
      model: 'DS-2CD2143G0-I',
      serialNumber: `HKV-CAM-2026-${num}`,
      assignedName: `CAM_URGENCIAS_${num}`,
      ipAddress: `192.168.1.${100 + i}`,
      macAddress: `00:1A:2B:3C:4D:${num}`,
      credentialsEncrypted: encryptCredentials({ username: 'admin', password: 'CamPassword2026!' }),
      rackCabinet: 'Rack R1 - CPD Planta -1',
      switchName: 'SW-POE-CORE-R1',
      switchPort: `Port ${i}`,
      notes: `Cámara domo 4MP Urgencias Pasillo ${num}`,
    });
  }
  await prisma.device.createMany({ data: camerasToCreate });

  // 6. Crear Dispositivo en Sistema de Red
  await prisma.device.create({
    data: {
      systemId: system1_Red.id,
      clientId: client1.id,
      subsystemId: subsystemsMap.get('Red'),
      deviceTypeId: deviceTypesMap.get('Switch PoE'),
      brand: 'Cisco',
      model: 'Catalyst C9200-24P',
      serialNumber: 'FCW2435X001',
      assignedName: 'SW-POE-CORE-R1',
      ipAddress: '192.168.1.2',
      macAddress: '00:27:0D:A1:B2:C3',
      credentialsEncrypted: encryptCredentials({ username: 'cisco_admin', password: 'CiscoAdmin#2026' }),
      rackCabinet: 'Rack R1 - CPD Planta -1',
      switchName: 'SW-CORE-01',
      switchPort: 'Uplink SFP 10G',
      notes: 'Switch gestionado 24 puertos PoE+ 370W.',
    },
  });

  console.log('✅ Semilla cargada con éxito: 5 subsistemas, 2 clientes, 2 sistemas y 22 dispositivos integrados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
