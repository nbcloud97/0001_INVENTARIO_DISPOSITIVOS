import oracledb from 'oracledb';
import { prisma } from '../config/prisma';

export interface Beta10ClientSearchResult {
  idcliente: number;
  nombre: string;
  razonSocial: string | null;
  cif: string | null;
  observaciones: string | null;
  estado: number;
  totalSistemas: number;
}

export interface Beta10SubsystemItem {
  idsubsis: number;
  codigo: string | null;
  descripcion: string;
  tipoSubsis: string | null;
  estado: number;
}

export interface Beta10SystemItem {
  idsistema: number;
  codigo: string | null;
  descripcion: string;
  tipoSistema: string | null;
  observaciones: string | null;
  estado: number;
  subsystems: Beta10SubsystemItem[];
  alreadyImported?: boolean;
  importedSystemId?: string;
}

export interface Beta10ClientDetails {
  idcliente: number;
  nombre: string;
  razonSocial: string | null;
  cif: string | null;
  observaciones: string | null;
  estado: number;
  systems: Beta10SystemItem[];
  alreadyImportedClient?: boolean;
  importedClientId?: string;
}

class OracleBeta10Service {
  private getDbConfig() {
    const host = process.env.ORACLE_HOST || '172.16.90.20';
    const port = process.env.ORACLE_PORT || '1521';
    const serviceName = process.env.ORACLE_SERVICE_NAME || 'BETA10';
    const user = process.env.ORACLE_USER || 'satya_only_reader';
    const password = process.env.ORACLE_PASSWORD || 'CA36linGqrLbRG0HLR7FxU2';

    return {
      user,
      password,
      connectString: `${host}:${port}/${serviceName}`,
    };
  }

  private async getConnection(): Promise<oracledb.Connection> {
    const config = this.getDbConfig();
    return await oracledb.getConnection(config);
  }

  /**
   * Buscar clientes en Beta 10 por IDCLIENTE, Nombre, Razón Social o CIF
   */
  async searchClients(query: string, limit = 50): Promise<Beta10ClientSearchResult[]> {
    let connection: oracledb.Connection | null = null;
    try {
      connection = await this.getConnection();
      const q = query.trim();

      let sql = `
        SELECT 
          c.idcliente, 
          c.nombre, 
          c.razon_social, 
          c.cif, 
          c.observaciones, 
          c.estado,
          (SELECT COUNT(*) FROM SATYA.SISTEMA s WHERE s.idcliente = c.idcliente) as total_sistemas
        FROM SATYA.CLIENTE c
      `;

      const binds: any = {};

      if (q) {
        const isNumeric = !isNaN(Number(q));
        if (isNumeric) {
          sql += ` WHERE (c.idcliente = :numQuery OR UPPER(c.nombre) LIKE :strQuery OR UPPER(c.cif) LIKE :strQuery)`;
          binds.numQuery = Number(q);
          binds.strQuery = `%${q.toUpperCase()}%`;
        } else {
          sql += ` WHERE (UPPER(c.nombre) LIKE :strQuery OR UPPER(c.razon_social) LIKE :strQuery OR UPPER(c.cif) LIKE :strQuery)`;
          binds.strQuery = `%${q.toUpperCase()}%`;
        }
      }

      sql += ` ORDER BY c.idcliente ASC FETCH FIRST :maxRows ROWS ONLY`;
      binds.maxRows = limit;

      const result = await connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      const rows = (result.rows || []) as any[];
      return rows.map((r) => ({
        idcliente: Number(r.IDCLIENTE),
        nombre: r.NOMBRE || '',
        razonSocial: r.RAZON_SOCIAL || null,
        cif: r.CIF || null,
        observaciones: r.OBSERVACIONES || null,
        estado: Number(r.ESTADO),
        totalSistemas: Number(r.TOTAL_SISTEMAS || 0),
      }));
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  /**
   * Obtener detalles de un cliente y todos sus sistemas en Beta 10
   */
  async getClientWithSystems(idcliente: number): Promise<Beta10ClientDetails> {
    let connection: oracledb.Connection | null = null;
    try {
      connection = await this.getConnection();

      // 1. Obtener datos del cliente
      const clientResult = await connection.execute(
        `SELECT idcliente, nombre, razon_social, cif, observaciones, estado 
         FROM SATYA.CLIENTE 
         WHERE idcliente = :idcliente`,
        { idcliente },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (!clientResult.rows || clientResult.rows.length === 0) {
        throw new Error(`Cliente con ID ${idcliente} no encontrado en Beta 10`);
      }

      const clientRow = clientResult.rows[0] as any;

      // 2. Obtener sistemas del cliente
      const systemsResult = await connection.execute(
        `SELECT 
           s.idsistema, 
           s.codigo, 
           s.descripcion, 
           s.observaciones, 
           s.estado,
           ts.descripcion as tipo_sistema
         FROM SATYA.SISTEMA s
         LEFT JOIN SATYA.TSISTEMA ts ON ts.idtsistema = s.idtsistema
         WHERE s.idcliente = :idcliente
         ORDER BY s.codigo, s.idsistema`,
        { idcliente },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const systemsRows = (systemsResult.rows || []) as any[];

      // 3. Obtener subsistemas asociados a los sistemas de este cliente
      const systemIds = systemsRows.map((s) => Number(s.IDSISTEMA));
      const subsystemsMap = new Map<number, Beta10SubsystemItem[]>();

      if (systemIds.length > 0) {
        // Consultar subsistemas
        const subsisResult = await connection.execute(
          `SELECT 
             sub.idsistema,
             sub.idsubsis,
             sub.codigo,
             sub.descripcion,
             sub.estado,
             tsub.descripcion as tipo_subsis
           FROM SATYA.SUBSIS sub
           LEFT JOIN SATYA.TSUBSIS tsub ON tsub.idtsubsis = sub.idtsubsis
           WHERE sub.idsistema IN (${systemIds.join(',')})
           ORDER BY sub.idsistema, sub.orden, sub.idsubsis`,
          {},
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const subRows = (subsisResult.rows || []) as any[];
        for (const sub of subRows) {
          const sysId = Number(sub.IDSISTEMA);
          if (!subsystemsMap.has(sysId)) {
            subsystemsMap.set(sysId, []);
          }
          subsystemsMap.get(sysId)!.push({
            idsubsis: Number(sub.IDSUBSIS),
            codigo: sub.CODIGO || null,
            descripcion: sub.DESCRIPCION || '',
            tipoSubsis: sub.TIPO_SUBSIS || null,
            estado: Number(sub.ESTADO),
          });
        }
      }

      // 4. Comprobar si el cliente y sistemas ya existen en PostgreSQL
      const manualIdStr = String(idcliente);
      let existingClient: any = null;
      try {
        existingClient = await prisma.client.findFirst({
          where: { manualId: manualIdStr },
          include: {
            systems: true,
          },
        });
      } catch (err: any) {
        console.warn('Aviso: No se pudo verificar existencia en PostgreSQL:', err.message);
      }


      const systems: Beta10SystemItem[] = systemsRows.map((s) => {
        const sysId = Number(s.IDSISTEMA);
        const code = s.CODIGO ? (s.CODIGO as string).trim() : null;
        const name = s.DESCRIPCION ? (s.DESCRIPCION as string).trim() : `Sistema ${code || sysId}`;
        
        let alreadyImported = false;
        let importedSystemId: string | undefined = undefined;

        if (existingClient) {
          const matched = existingClient.systems.find(
            (es: any) =>
              (code && es.code?.trim().toUpperCase() === code.toUpperCase()) ||
              (es.name.trim().toUpperCase() === name.toUpperCase())
          );
          if (matched) {
            alreadyImported = true;
            importedSystemId = matched.id;
          }
        }

        return {
          idsistema: sysId,
          codigo: code,
          descripcion: name,
          tipoSistema: s.TIPO_SISTEMA || null,
          observaciones: s.OBSERVACIONES || null,
          estado: Number(s.ESTADO),
          subsystems: subsystemsMap.get(sysId) || [],
          alreadyImported,
          importedSystemId,
        };
      });

      return {
        idcliente: Number(clientRow.IDCLIENTE),
        nombre: clientRow.NOMBRE || '',
        razonSocial: clientRow.RAZON_SOCIAL || null,
        cif: clientRow.CIF || null,
        observaciones: clientRow.OBSERVACIONES || null,
        estado: Number(clientRow.ESTADO),
        systems,
        alreadyImportedClient: !!existingClient,
        importedClientId: existingClient?.id,
      };
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  /**
   * Importar o sincronizar un cliente y sus sistemas seleccionados desde Beta 10 a PostgreSQL
   */
  async importClientAndSystems(
    idcliente: number,
    selectedSystemIds?: number[]
  ): Promise<{
    client: any;
    createdSystemsCount: number;
    updatedSystemsCount: number;
    totalSystemsSelected: number;
  }> {
    // 1. Obtener datos completos de Beta 10
    const beta10Data = await this.getClientWithSystems(idcliente);

    // 2. Crear o Actualizar el Cliente en PostgreSQL
    const manualId = String(idcliente);
    const clientName = (beta10Data.nombre || `CLIENTE ${manualId}`).toUpperCase().trim();
    const legalName = beta10Data.razonSocial ? beta10Data.razonSocial.toUpperCase().trim() : null;
    const cif = beta10Data.cif ? beta10Data.cif.toUpperCase().trim() : null;
    const notes = beta10Data.observaciones ? beta10Data.observaciones.trim() : null;

    let client = await prisma.client.findFirst({
      where: { manualId },
    });

    if (client) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          name: clientName,
          legalName,
          cif,
          notes: notes || client.notes,
        },
      });
    } else {
      client = await prisma.client.create({
        data: {
          name: clientName,
          legalName,
          cif,
          manualId,
          notes,
        },
      });
    }

    // 3. Filtrar sistemas a importar
    let targetSystems: Beta10SystemItem[] = [];
    if (Array.isArray(selectedSystemIds)) {
      const idSet = new Set(selectedSystemIds);
      targetSystems = beta10Data.systems.filter((s) => idSet.has(s.idsistema));
    } else {
      targetSystems = beta10Data.systems;
    }

    // Obtener subsistemas existentes en la BD para intentar auto-mapear si coincide
    const availableSubsystems = await prisma.subsystem.findMany();

    let createdSystemsCount = 0;
    let updatedSystemsCount = 0;

    for (const bSys of targetSystems) {
      const sysCode = bSys.codigo ? bSys.codigo.trim() : null;
      const sysName = (bSys.descripcion || `Sistema ${sysCode || bSys.idsistema}`).trim();
      const sysNotes = bSys.observaciones ? bSys.observaciones.trim() : null;

      // Buscar coincidencia de subsistema
      let matchedSubsystemId: string | null = null;
      const combinedSubInfo = [
        bSys.tipoSistema,
        ...bSys.subsystems.map((s) => s.descripcion),
        ...bSys.subsystems.map((s) => s.tipoSubsis),
      ]
        .filter(Boolean)
        .join(' ')
        .toUpperCase();

      for (const sub of availableSubsystems) {
        const subNameUpper = sub.name.toUpperCase();
        if (combinedSubInfo.includes(subNameUpper)) {
          matchedSubsystemId = sub.id;
          break;
        }
      }

      // Buscar si ya existe el sistema en este cliente
      const existingSystem = await prisma.system.findFirst({
        where: {
          clientId: client.id,
          OR: [
            sysCode ? { code: sysCode } : { name: sysName },
            { name: sysName },
          ],
        },
      });

      if (existingSystem) {
        await prisma.system.update({
          where: { id: existingSystem.id },
          data: {
            name: sysName,
            code: sysCode || existingSystem.code,
            subsystemId: existingSystem.subsystemId || matchedSubsystemId,
          },
        });
        updatedSystemsCount++;
      } else {
        await prisma.system.create({
          data: {
            clientId: client.id,
            name: sysName,
            code: sysCode,
            notes: null,
            subsystemId: matchedSubsystemId,
          },
        });
        createdSystemsCount++;
      }

    }

    return {
      client,
      createdSystemsCount,
      updatedSystemsCount,
      totalSystemsSelected: targetSystems.length,
    };
  }
}

export const oracleBeta10Service = new OracleBeta10Service();
