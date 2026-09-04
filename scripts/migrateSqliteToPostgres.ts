import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/inventario_db?schema=public',
    },
  },
});

async function main() {
  const sqliteDbPath = path.resolve(__dirname, '../backend/prisma/dev.db');

  if (!fs.existsSync(sqliteDbPath)) {
    console.log('ℹ️ No se encontró el archivo de base de datos SQLite (dev.db). Se omitirá la migración.');
    return;
  }

  console.log(`📦 Leyendo datos existentes desde SQLite: ${sqliteDbPath}...`);
  const sqlite = new Database(sqliteDbPath);

  try {
    // 1. Usuarios
    const users = sqlite.prepare('SELECT * FROM User').all() as any[];
    console.log(`👤 Migrando ${users.length} usuarios...`);
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          username: u.username,
          passwordHash: u.passwordHash,
          name: u.name,
          role: u.role || 'ADMIN',
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
        },
      });
    }

    // 2. Clientes
    const clients = sqlite.prepare('SELECT * FROM Client').all() as any[];
    console.log(`🏢 Migrando ${clients.length} clientes...`);
    for (const c of clients) {
      await prisma.client.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          name: c.name,
          legalName: c.legalName,
          cif: c.cif,
          manualId: c.manualId,
          notes: c.notes,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        },
      });
    }

    // 3. Subsistemas
    const subsystems = sqlite.prepare('SELECT * FROM Subsystem').all() as any[];
    console.log(`🛡️ Migrando ${subsystems.length} subsistemas...`);
    for (const s of subsystems) {
      await prisma.subsystem.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          name: s.name,
          color: s.color || '#005596',
          icon: s.icon || 'shield',
          description: s.description,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        },
      });
    }

    // 4. Tipos de Dispositivo
    const deviceTypes = sqlite.prepare('SELECT * FROM DeviceType').all() as any[];
    console.log(`🏷️ Migrando ${deviceTypes.length} tipos de dispositivo...`);
    for (const dt of deviceTypes) {
      await prisma.deviceType.upsert({
        where: { id: dt.id },
        update: {},
        create: {
          id: dt.id,
          name: dt.name,
          description: dt.description,
          subsystemId: dt.subsystemId,
          createdAt: dt.createdAt ? new Date(dt.createdAt) : new Date(),
          updatedAt: dt.updatedAt ? new Date(dt.updatedAt) : new Date(),
        },
      });
    }

    // 5. Estados de Dispositivo
    const deviceStatuses = sqlite.prepare('SELECT * FROM DeviceStatus').all() as any[];
    console.log(`🏷️ Migrando ${deviceStatuses.length} estados de dispositivo...`);
    for (const st of deviceStatuses) {
      await prisma.deviceStatus.upsert({
        where: { id: st.id },
        update: {},
        create: {
          id: st.id,
          name: st.name,
          color: st.color || '#10b981',
          description: st.description,
          createdAt: st.createdAt ? new Date(st.createdAt) : new Date(),
          updatedAt: st.updatedAt ? new Date(st.updatedAt) : new Date(),
        },
      });
    }

    // 6. Sistemas
    const systems = sqlite.prepare('SELECT * FROM System').all() as any[];
    console.log(`🖥️ Migrando ${systems.length} sistemas...`);
    for (const sys of systems) {
      await prisma.system.upsert({
        where: { id: sys.id },
        update: {},
        create: {
          id: sys.id,
          name: sys.name,
          code: sys.code,
          description: sys.description,
          notes: sys.notes,
          clientId: sys.clientId,
          subsystemId: sys.subsystemId,
          createdAt: sys.createdAt ? new Date(sys.createdAt) : new Date(),
          updatedAt: sys.updatedAt ? new Date(sys.updatedAt) : new Date(),
        },
      });
    }

    // 7. Notas de Sistema
    const notes = sqlite.prepare('SELECT * FROM SystemNote').all() as any[];
    console.log(`📝 Migrando ${notes.length} notas de sistema...`);
    for (const n of notes) {
      await prisma.systemNote.upsert({
        where: { id: n.id },
        update: {},
        create: {
          id: n.id,
          systemId: n.systemId,
          title: n.title,
          content: n.content,
          createdBy: n.createdBy,
          createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
          updatedAt: n.updatedAt ? new Date(n.updatedAt) : new Date(),
        },
      });
    }

    // 8. Adjuntos de Sistema
    const attachments = sqlite.prepare('SELECT * FROM SystemAttachment').all() as any[];
    console.log(`📎 Migrando ${attachments.length} adjuntos de sistema...`);
    for (const a of attachments) {
      await prisma.systemAttachment.upsert({
        where: { id: a.id },
        update: {},
        create: {
          id: a.id,
          systemId: a.systemId,
          filename: a.filename,
          storedName: a.storedName,
          filePath: a.filePath,
          mimeType: a.mimeType,
          fileSize: a.fileSize,
          createdBy: a.createdBy,
          createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
          updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
        },
      });
    }

    // 9. Dispositivos
    const devices = sqlite.prepare('SELECT * FROM Device').all() as any[];
    console.log(`📷 Migrando ${devices.length} dispositivos...`);
    for (const d of devices) {
      await prisma.device.upsert({
        where: { id: d.id },
        update: {},
        create: {
          id: d.id,
          systemId: d.systemId,
          clientId: d.clientId,
          subsystemId: d.subsystemId,
          deviceTypeId: d.deviceTypeId,
          statusId: d.statusId,
          brand: d.brand,
          model: d.model,
          serialNumber: d.serialNumber,
          assignedName: d.assignedName,
          ipAddress: d.ipAddress,
          macAddress: d.macAddress,
          credentialsEncrypted: d.credentialsEncrypted,
          rackCabinet: d.rackCabinet,
          switchName: d.switchName,
          switchPort: d.switchPort,
          notes: d.notes,
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
          updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
        },
      });
    }

    console.log('✅ Migración de datos desde SQLite a PostgreSQL completada con éxito.');
  } catch (error) {
    console.error('⚠️ Error durante la migración de datos:', error);
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

main();
