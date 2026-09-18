import React, { useState, useRef } from 'react';
import { X, FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, FileText, Download, KeyRound, Shield, Tag, AlertCircle, PlusCircle, StopCircle, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { downloadImportTemplate } from '../utils/excelExport';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  systemId: string;
  systemName?: string;
}

interface ValidationResult {
  totalDevices: number;
  hasNewCatalogItems: boolean;
  newSubsystems: string[];
  newDeviceTypes: Array<{ name: string; subsystemName: string }>;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  systemId,
  systemName,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Extractor robusto de campos por fila de Excel (evita falsos positivos por substrings como IP en TIPO)
  const extractRowFields = (row: Record<string, any>) => {
    const normalizeKey = (k: string) =>
      k
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const keys = Object.keys(row);
    const normalizedKeysMap = keys.map((originalKey) => ({
      originalKey,
      norm: normalizeKey(originalKey),
      rawUpper: originalKey.trim().toUpperCase(),
    }));

    const getValue = (exactCandidates: string[], fallbackRegex?: RegExp): string => {
      // 1. Prioridad: Coincidencia EXACTA normalizada
      for (const cand of exactCandidates) {
        const normCand = normalizeKey(cand);
        const match = normalizedKeysMap.find((k) => k.norm === normCand);
        if (
          match &&
          row[match.originalKey] !== undefined &&
          row[match.originalKey] !== null &&
          String(row[match.originalKey]).trim() !== ''
        ) {
          return String(row[match.originalKey]).trim();
        }
      }

      // 2. Prioridad: Expresión regular con límites de palabra \b
      if (fallbackRegex) {
        const match = normalizedKeysMap.find((k) => fallbackRegex.test(k.norm));
        if (
          match &&
          row[match.originalKey] !== undefined &&
          row[match.originalKey] !== null &&
          String(row[match.originalKey]).trim() !== ''
        ) {
          return String(row[match.originalKey]).trim();
        }
      }

      return '';
    };

    const subsystemName = getValue(
      ['SUBSISTEMA', 'SUB SISTEMA', 'SUB_SISTEMA', 'SUB-SISTEMA', 'SUBSISTEMAS', 'SUBSYSTEM'],
      /\b(?:SUBSISTEMA|SUB\s*SISTEMA|SUBSYSTEM)\b/
    );

    const deviceTypeName = getValue(
      [
        'TIPO_DISPOSITIVO',
        'TIPO DE DISPOSITIVO',
        'TIPO DISPOSITIVO',
        'TIPO_EQUIPO',
        'TIPO DE EQUIPO',
        'TIPO EQUIPO',
        'TIPO DE ELEMENTO',
        'DEVICE TYPE',
        'TIPO',
      ],
      /\b(?:TIPO_DISPOSITIVO|TIPO\s*DE\s*DISPOSITIVO|TIPO\s*DISPOSITIVO|TIPO\s*DE\s*EQUIPO|TIPO\s*EQUIPO|DEVICE\s*TYPE)\b/
    );

    const statusName = getValue(
      [
        'ESTADO',
        'ESTADO DEL DISPOSITIVO',
        'ESTADO DISPOSITIVO',
        'ESTADO DEL EQUIPO',
        'STATUS',
        'SITUACION',
      ],
      /\b(?:ESTADO|STATUS|SITUACION)\b/
    );

    const assignedName = getValue(
      [
        'NOMBRE',
        'NOMBRE_ASIGNADO',
        'NOMBRE ASIGNADO',
        'NOMBRE DEL DISPOSITIVO',
        'NOMBRE DISPOSITIVO',
        'NOMBRE DEL EQUIPO',
        'NOMBRE EQUIPO',
        'DISPOSITIVO',
        'EQUIPO',
        'HOSTNAME',
        'ASIGNADO',
        'ELEMENTO',
      ],
      /\b(?:NOMBRE_ASIGNADO|NOMBRE\s*ASIGNADO|NOMBRE\s*DISPOSITIVO|NOMBRE\s*EQUIPO|HOSTNAME)\b/
    );

    const brand = getValue(
      ['MARCA', 'FABRICANTE', 'BRAND', 'MANUFACTURER'],
      /\b(?:MARCA|FABRICANTE|BRAND)\b/
    );

    const model = getValue(
      ['MODELO', 'MODEL', 'REFERENCIA MODELO'],
      /\b(?:MODELO|MODEL)\b/
    );

    const serialNumber = getValue(
      [
        'NUMERO_SERIE',
        'NUMERO DE SERIE',
        'NUMERO SERIE',
        'N SERIE',
        'NO SERIE',
        'NUM SERIE',
        'SERIAL NUMBER',
        'SERIAL',
        'SERIE',
        'S N',
        'SN',
      ],
      /\b(?:NUMERO_SERIE|NUMERO\s*DE\s*SERIE|NUMERO\s*SERIE|SERIAL\s*NUMBER|S\s*N|SN|SERIE)\b/
    );

    const ipAddress = getValue(
      ['IP', 'DIRECCION IP', 'DIR IP', 'IP_ADDRESS', 'IP ADDRESS', 'DIRECCION DE RED'],
      /\b(?:DIRECCION\s*IP|DIR\s*IP|IP\s*ADDRESS|^IP$)\b/
    );

    const subnetMask = getValue(
      [
        'MASCARA',
        'MÁSCARA',
        'MASCARA_DE_SUBRED',
        'MASCARA DE SUBRED',
        'MÁSCARA DE SUBRED',
        'MASCARA SUBRED',
        'MÁSCARA SUBRED',
        'SUBNET MASK',
        'NETMASK',
        'MASK',
      ],
      /\b(?:M[AÁ]SCARA(?:\s*DE)?\s*SUBRED|SUBNET\s*MASK|NETMASK|^M[AÁ]SCARA$)\b/
    );

    const gateway = getValue(
      [
        'PUERTA_ENLACE',
        'PUERTA DE ENLACE',
        'PUERTA ENLACE',
        'GATEWAY',
        'PUERTA DE ENLACE GATEWAY',
        'DEFAULT GATEWAY',
        'GW',
      ],
      /\b(?:PUERTA_ENLACE|PUERTA\s*(?:DE\s*)?ENLACE|DEFAULT\s*GATEWAY|^GATEWAY$|^GW$)\b/
    );

    const macAddress = getValue(
      ['MAC', 'DIRECCION MAC', 'DIR MAC', 'MAC_ADDRESS', 'MAC ADDRESS', 'DIRECCION FISICA'],
      /\b(?:DIRECCION\s*MAC|DIR\s*MAC|MAC\s*ADDRESS|^MAC$)\b/
    );

    const rackCabinet = getValue(
      ['RACK', 'ARMARIO RACK', 'ARMARIO', 'GABINETE', 'CABINET', 'UBICACION RACK'],
      /\b(?:ARMARIO\s*RACK|ARMARIO|RACK|GABINETE|CABINET)\b/
    );

    const switchName = getValue(
      [
        'SWITCH',
        'REFERENCIA SWITCH',
        'REF SWITCH',
        'NOMBRE SWITCH',
        'SWITCH REF',
        'SWITCH NOMBRE',
        'SWITCH NAME',
        'CONMUTADOR',
      ],
      /\b(?:REFERENCIA\s*SWITCH|REF\s*SWITCH|NOMBRE\s*SWITCH|SWITCH\s*REF|^SWITCH$)\b/
    );

    const switchPort = getValue(
      [
        'SWITCH_PUERTO',
        'SWITCH PUERTO',
        'PUERTO SWITCH',
        'PUERTO_SWITCH',
        'PUERTO EN SWITCH',
        'PUERTO DEL SWITCH',
        'SWITCH PORT',
        'PORT SWITCH',
        'BOCA SWITCH',
        'BOCA',
      ],
      /\b(?:SWITCH_PUERTO|SWITCH\s*PUERTO|PUERTO\s*SWITCH|PUERTO\s*EN\s*SWITCH|BOCA)\b/
    );

    const credTitle =
      getValue(
        [
          'USUARIO_DESCRIPCION',
          'USUARIO DESCRIPCION',
          'DESCRIPCION USUARIO',
          'ETIQUETA CREDENCIAL',
          'TIPO CREDENCIAL',
          'TITULO CREDENCIAL',
          'ETIQUETA',
          'CREDENCIAL',
        ],
        /\b(?:USUARIO_DESCRIPCION|USUARIO\s*DESCRIPCION|ETIQUETA\s*CREDENCIAL|TIPO\s*CREDENCIAL|ETIQUETA)\b/
      ) || 'ACCESO WEB';

    const username = getValue(
      [
        'USUARIO',
        'USER',
        'USERNAME',
        'USUARIO CREDENCIAL',
        'USUARIO DE ACCESO',
        'USUARIO ACCESO',
        'LOGIN',
        'CREDENCIAL USUARIO',
      ],
      /\b(?:USUARIO\s*CREDENCIAL|USUARIO\s*ACCESO|USERNAME|^USUARIO$|^USER$)\b/
    );

    const password = getValue(
      [
        'CONTRASEÑA',
        'CONTRASENA',
        'CONTRASEÑA CREDENCIAL',
        'CONTRASENA CREDENCIAL',
        'CONTRASEÑA DE ACCESO',
        'CONTRASENA DE ACCESO',
        'PASSWORD',
        'PASS',
        'CLAVE',
        'PWD',
      ],
      /\b(?:CONTRASE[NÑ]A|PASSWORD|CLAVE|PWD)\b/
    );

    const portRaw = getValue(
      [
        'PUERTO',
        'PUERTOS',
        'PORT',
        'PORTS',
        'PUERTOS DE COMUNICACION',
        'PUERTOS COMUNICACION',
        'PUERTOS DE RED',
        'PUERTOS SERVICIO',
      ],
      /\b(?:PUERTOS\s*DE\s*COMUNICACION|PUERTOS\s*COMUNICACION|PUERTOS|^PUERTO$|^PORT$)\b/
    );

    const portNameRaw = getValue(
      [
        'PUERTO_NOMBRE',
        'PUERTO NOMBRE',
        'NOMBRE PUERTO',
        'SERVICIO PUERTO',
        'SERVICIO',
        'PROTOCOLO',
        'PORT NAME',
      ],
      /\b(?:PUERTO_NOMBRE|PUERTO\s*NOMBRE|NOMBRE\s*PUERTO|SERVICIO|PROTOCOLO)\b/
    );

    let communicationPorts: string | undefined = undefined;
    if (portRaw && portNameRaw) {
      const pList = portRaw.split(',').map((s) => s.trim()).filter(Boolean);
      const nList = portNameRaw.split(',').map((s) => s.trim()).filter(Boolean);
      if (pList.length > 1 && nList.length === pList.length) {
        communicationPorts = pList.map((p, idx) => `${p} (${nList[idx]})`).join(', ');
      } else {
        communicationPorts = `${portRaw} (${portNameRaw})`;
      }
    } else if (portRaw) {
      communicationPorts = portRaw;
    }

    const notes = getValue(
      ['NOTAS', 'OBSERVACIONES', 'COMENTARIOS', 'DESCRIPCION', 'NOTES', 'COMMENTS'],
      /\b(?:NOTAS|OBSERVACIONES|COMENTARIOS|DESCRIPCION|NOTES)\b/
    );

    let credentials = undefined;
    if (username || password) {
      credentials = [{ title: credTitle, username, password }];
    }

    return {
      assignedName,
      subsystemName,
      deviceTypeName,
      statusName,
      brand,
      model,
      serialNumber,
      ipAddress,
      subnetMask,
      gateway,
      macAddress,
      rackCabinet,
      switchName,
      switchPort,
      credentials,
      communicationPorts: communicationPorts || undefined,
      notes,
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setResultMessage(null);
    setValidationResult(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          setError('La hoja de cálculo seleccionada no contiene filas de datos.');
          setParsedItems([]);
          return;
        }

        // Mapear filas con el extractor robusto
        const mapped = rawJson.map((row) => extractRowFields(row));

        // Filtrar elementos válidos que tengan algún dato relevante
        const validItems = mapped.filter(
          (item) =>
            item.assignedName ||
            item.ipAddress ||
            item.brand ||
            item.model ||
            item.subsystemName ||
            item.deviceTypeName
        );

        if (validItems.length === 0) {
          setError('No se pudieron reconocer columnas o dispositivos válidos en el archivo Excel.');
          setParsedItems([]);
          return;
        }

        setParsedItems(validItems);

        // Validar catálogo contra el sistema
        setValidating(true);
        try {
          const valRes = await api.validateImportDevices(systemId, validItems);
          setValidationResult(valRes);
        } catch (valErr: any) {
          console.error('Error al validar catálogo de importación:', valErr);
        } finally {
          setValidating(false);
        }
      } catch (err: any) {
        setError(`Error al leer el archivo Excel: ${err.message}`);
        setParsedItems([]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = async (autoCreateCatalog = false) => {
    if (parsedItems.length === 0) return;

    setLoading(true);
    setError(null);
    setResultMessage(null);

    try {
      const res = await api.importDevices(systemId, parsedItems, autoCreateCatalog);
      setResultMessage(res.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStopImport = () => {
    setError('Importación cancelada por el usuario. No se ha modificado la base de datos ni registrado ningún dispositivo.');
    setValidationResult(null);
    setParsedItems([]);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetFile = () => {
    setSelectedFile(null);
    setParsedItems([]);
    setValidationResult(null);
    setError(null);
    setResultMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet color="var(--accent-emerald)" size={24} />
            <div>
              <h2>Importaci&oacute;n de Dispositivos con Credenciales</h2>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                Importa dispositivos desde un archivo Excel (.xlsx, .xls, .csv) al sistema {systemName ? `"${systemName}"` : ''}
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Banner descarga plantilla */}
          <div style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.25)', padding: '0.75rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)' }}>
              <strong>¿Necesitas la plantilla oficial con credenciales?</strong> Descárgala ya formateada.
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.775rem' }}
              onClick={downloadImportTemplate}
            >
              <Download size={14} color="var(--accent-blue)" /> Descargar Plantilla (.xlsx)
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-rose)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {resultMessage && (
            <div style={{ background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: 'var(--accent-emerald)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} />
              {resultMessage}
            </div>
          )}

          {/* Zona de Carga de Archivo */}
          {!selectedFile ? (
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '2.25rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-primary)',
                transition: 'all 0.15s ease',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={36} color="var(--accent-emerald)" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>
                Haz clic para seleccionar o arrastra tu archivo Excel
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Soporta datos técnicos, direccionamiento IP/MAC y credenciales de acceso (.XLSX, .XLS, .CSV)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Info de Archivo Seleccionado */}
              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileText size={20} color="var(--accent-emerald)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • {parsedItems.length} dispositivos detectados
                      {validating && ' (Comprobando catálogo...)'}
                    </div>
                  </div>
                </div>
                <button className="btn btn-secondary btn-icon" title="Cambiar archivo" onClick={handleResetFile}>
                  <X size={16} />
                </button>
              </div>

              {/* ALERTA DE NUEVOS ELEMENTOS DETECTADOS EN EL CATÁLOGO */}
              {validationResult?.hasNewCatalogItems && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '8px',
                    padding: '1rem 1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontWeight: 600, fontSize: '0.95rem' }}>
                    <AlertCircle size={20} />
                    <span>Nuevos elementos detectados en el archivo</span>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                    Se han encontrado subsistemas o tipos de dispositivo en la plantilla que <strong>aún no están registrados en el sistema</strong>:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    {/* Nuevos Subsistemas */}
                    {validationResult.newSubsystems.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Shield size={14} color="var(--accent-blue)" /> Nuevos Subsistemas ({validationResult.newSubsystems.length}):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {validationResult.newSubsystems.map((sub, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: 'rgba(2, 132, 199, 0.15)',
                                color: 'var(--accent-blue)',
                                border: '1px solid rgba(2, 132, 199, 0.3)',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                              }}
                            >
                              + {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nuevos Tipos de Dispositivo */}
                    {validationResult.newDeviceTypes.length > 0 && (
                      <div style={{ marginTop: validationResult.newSubsystems.length > 0 ? '0.5rem' : 0 }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Tag size={14} color="var(--accent-amber)" /> Nuevos Tipos de Dispositivo ({validationResult.newDeviceTypes.length}):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {validationResult.newDeviceTypes.map((dt, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: 'var(--accent-amber)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                              }}
                            >
                              + {dt.name} <span style={{ opacity: 0.75, fontSize: '0.725rem' }}>({dt.subsystemName})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    ¿Deseas añadir estos nuevos elementos al sistema y proceder con la importaci&oacute;n?
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-success"
                      style={{ fontSize: '0.825rem', padding: '0.45rem 0.9rem' }}
                      disabled={loading}
                      onClick={() => handleImport(true)}
                    >
                      <PlusCircle size={16} />
                      {loading ? 'Añadiendo e importando...' : 'Sí, añadir al sistema e importar'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ fontSize: '0.825rem', padding: '0.45rem 0.9rem' }}
                      disabled={loading}
                      onClick={handleStopImport}
                    >
                      <StopCircle size={16} />
                      No, detener importación
                    </button>
                  </div>
                </div>
              )}

              {/* Previsualización de los Primeros Dispositivos */}
              {parsedItems.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Vista Previa Reconocida ({parsedItems.length} filas)
                  </h4>
                  <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)' }}>
                    <table className="device-table" style={{ fontSize: '0.775rem' }}>
                      <thead>
                        <tr>
                          <th>Nombre Asignado</th>
                          <th>Subsistema</th>
                          <th>Tipo</th>
                          <th>Marca / Modelo</th>
                          <th>Dirección IP</th>
                          <th>Dirección MAC</th>
                          <th>Credenciales</th>
                          <th>Rack / Switch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedItems.slice(0, 10).map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{item.assignedName || `DISPOSITIVO_${idx+1}`}</td>
                            <td>{item.subsystemName || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                            <td>{item.deviceTypeName || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                            <td>
                              {item.brand || item.model ? (
                                <span>{item.brand} {item.model}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                            <td>
                              {item.ipAddress ? (
                                <div>
                                  <span className="code-font" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                                    {item.ipAddress}
                                  </span>
                                  {(item.subnetMask || item.gateway) && (
                                    <div className="code-font" style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                      {item.subnetMask ? `M: ${item.subnetMask}` : ''}
                                      {item.subnetMask && item.gateway ? ' • ' : ''}
                                      {item.gateway ? `GW: ${item.gateway}` : ''}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                            <td className="code-font">{item.macAddress || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                            <td>
                              {item.credentials ? (
                                <span style={{ color: 'var(--accent-amber)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <KeyRound size={12} /> {item.credentials[0].username || 'Guardada'}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                            <td>
                              {item.rackCabinet || item.switchName ? (
                                <span>{item.rackCabinet || ''} {item.switchName ? `(${item.switchName}${item.switchPort ? `:${item.switchPort}` : ''})` : ''}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedItems.length > 10 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'center' }}>
                      ... y {parsedItems.length - 10} dispositivos más
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          {!validationResult?.hasNewCatalogItems && (
            <button
              type="button"
              className="btn btn-success"
              disabled={loading || parsedItems.length === 0 || validating}
              onClick={() => handleImport(false)}
            >
              {loading ? 'Importando...' : `Importar ${parsedItems.length} Dispositivos`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
