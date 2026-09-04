import React, { useState, useRef } from 'react';
import { X, FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, FileText, Download, KeyRound } from 'lucide-react';
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

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  systemId,
  systemName,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setResultMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
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

        // Mapear encabezados dinámicamente de forma flexible
        const mapped = rawJson.map((row) => {
          const getItemValue = (keys: string[]) => {
            for (const k of Object.keys(row)) {
              const cleanK = k.trim().toUpperCase();
              if (keys.some((target) => cleanK.includes(target.toUpperCase()))) {
                return String(row[k]).trim();
              }
            }
            return '';
          };

          const username = getItemValue(['USUARIO CREDENCIAL', 'USUARIO', 'USER', 'USERNAME']);
          const password = getItemValue(['CONTRASEÑA CREDENCIAL', 'CONTRASEÑA', 'PASSWORD', 'PASS']);
          const title = getItemValue(['ETIQUETA CREDENCIAL', 'ETIQUETA', 'TIPO CREDENCIAL', 'CREDENCIAL']) || 'ACCESO WEB';

          let credentials = undefined;
          if (username || password) {
            credentials = [{ title, username, password }];
          }

          return {
            assignedName: getItemValue(['NOMBRE ASIGNADO', 'NOMBRE', 'DISPOSITIVO', 'EQUIPO']),
            subsystemName: getItemValue(['SUBSISTEMA', 'SUB-SISTEMA']),
            brand: getItemValue(['MARCA']),
            model: getItemValue(['MODELO']),
            serialNumber: getItemValue(['NÚMERO DE SERIE', 'NUMERO DE SERIE', 'Nº SERIE', 'SERIE']),
            ipAddress: getItemValue(['DIRECCIÓN IP', 'DIRECCION IP', 'IP']),
            macAddress: getItemValue(['DIRECCIÓN MAC', 'DIRECCION MAC', 'MAC']),
            rackCabinet: getItemValue(['RACK', 'ARMARIO RACK']),
            switchName: getItemValue(['REFERENCIA SWITCH', 'SWITCH']),
            switchPort: getItemValue(['SWITCH PUERTO', 'PUERTO EN SWITCH', 'PUERTO']),
            credentials,
            notes: getItemValue(['NOTAS', 'OBSERVACIONES']),
          };
        });

        // Filtrar elementos válidos que tengan algún dato relevante
        const validItems = mapped.filter(
          (item) => item.assignedName || item.ipAddress || item.brand || item.subsystemName
        );

        if (validItems.length === 0) {
          setError('No se pudieron reconocer columnas o dispositivos válidos en el archivo Excel.');
        }

        setParsedItems(validItems);
      } catch (err: any) {
        setError(`Error al leer el archivo Excel: ${err.message}`);
        setParsedItems([]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (parsedItems.length === 0) return;

    setLoading(true);
    setError(null);
    setResultMessage(null);

    try {
      const res = await api.importDevices(systemId, parsedItems);
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

  const handleResetFile = () => {
    setSelectedFile(null);
    setParsedItems([]);
    setError(null);
    setResultMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
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
                Soporta datos técnicos y credenciales de acceso (.XLSX, .XLS, .CSV)
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
                    </div>
                  </div>
                </div>
                <button className="btn btn-secondary btn-icon" title="Cambiar archivo" onClick={handleResetFile}>
                  <X size={16} />
                </button>
              </div>

              {/* Previsualización de los Primeros Dispositivos */}
              {parsedItems.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Vista Previa ({parsedItems.length} filas reconocidas)
                  </h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)' }}>
                    <table className="device-table" style={{ fontSize: '0.775rem' }}>
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Subsistema</th>
                          <th>IP</th>
                          <th>Credenciales</th>
                          <th>RACK / SWITCH</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedItems.slice(0, 10).map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{item.assignedName || `DISPOSITIVO_${idx+1}`}</td>
                            <td>{item.subsystemName || 'GENERAL'}</td>
                            <td className="code-font">{item.ipAddress || '-'}</td>
                            <td>
                              {item.credentials ? (
                                <span style={{ color: 'var(--accent-amber)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <KeyRound size={12} /> {item.credentials[0].username || 'Guardada'}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                            <td>{item.rackCabinet || item.switchName || '-'}</td>
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
          <button
            type="button"
            className="btn btn-success"
            disabled={loading || parsedItems.length === 0}
            onClick={handleImport}
          >
            {loading ? 'Importando...' : `Importar ${parsedItems.length} Dispositivos`}
          </button>
        </div>
      </div>
    </div>
  );
};
