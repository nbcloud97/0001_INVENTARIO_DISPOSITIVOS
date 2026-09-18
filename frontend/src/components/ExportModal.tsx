import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Download,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Device } from '../types';
import { api } from '../services/api';
import { exportSystemDevicesToExcel } from '../utils/excelExport';
import { exportSystemDevicesToPdf } from '../utils/pdfExport';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemId?: string;
  systemName: string;
  clientName: string;
  devices?: Device[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  systemId,
  systemName,
  clientName,
  devices = [],
}) => {
  const [format, setFormat] = useState<'excel' | 'pdf'>('pdf');
  const [includeCredentials, setIncludeCredentials] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);
  const [systemDevices, setSystemDevices] = useState<Device[]>(devices);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Cargar todos los dispositivos del sistema al abrir el modal para no depender de filtros de la tabla
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      if (systemId) {
        setFetching(true);
        api.getDevices({ systemId })
          .then((devs) => {
            if (Array.isArray(devs)) {
              setSystemDevices(devs);
            } else {
              setSystemDevices(devices);
            }
          })
          .catch((err) => {
            console.warn('No se pudieron recargar dispositivos para exportar, usando locales:', err);
            setSystemDevices(devices);
          })
          .finally(() => {
            setFetching(false);
          });
      } else {
        setSystemDevices(devices);
      }
    }
  }, [isOpen, systemId, devices]);

  if (!isOpen) return null;

  const devicesWithCredsCount = systemDevices.filter((d) => d.hasCredentials).length;

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const devicesToExport = systemDevices;

      if (format === 'excel') {
        await exportSystemDevicesToExcel(
          systemName,
          clientName,
          devicesToExport,
          includeCredentials
        );
      } else {
        await exportSystemDevicesToPdf(
          systemName,
          clientName,
          devicesToExport,
          { includeCredentials }
        );
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error durante la exportación:', err);
      setError(err?.message || 'Error al generar la exportación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        style={{
          maxWidth: '560px',
          width: '95%',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(2, 132, 199, 0.15)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Download size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Exportar Dispositivos
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {clientName} • {systemName} ({fetching ? 'Cargando...' : `${systemDevices.length} dispositivos`})
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. Selección de Formato */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.6rem',
              }}
            >
              1. Selecciona el formato del documento:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Opción PDF */}
              <div
                onClick={() => setFormat('pdf')}
                style={{
                  border: format === 'pdf' ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  background: format === 'pdf' ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-tertiary)',
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} color="var(--accent-rose)" />
                    <span style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                      Informe PDF
                    </span>
                  </div>
                  {format === 'pdf' && <CheckCircle2 size={16} color="var(--accent-blue)" />}
                </div>
                <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  Dossier visual de presentación para cliente con tablas maquetadas por subsistema.
                </p>
              </div>

              {/* Opción Excel */}
              <div
                onClick={() => setFormat('excel')}
                style={{
                  border: format === 'excel' ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  background: format === 'excel' ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-tertiary)',
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileSpreadsheet size={20} color="var(--accent-emerald)" />
                    <span style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                      Hoja Excel (.xlsx)
                    </span>
                  </div>
                  {format === 'excel' && <CheckCircle2 size={16} color="var(--accent-blue)" />}
                </div>
                <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  Estructura completa de 19 columnas estándar, ideal para edición o reimportación.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Control de Credenciales */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.6rem',
              }}
            >
              2. Opciones de privacidad y credenciales:
            </label>

            <div
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.9rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={includeCredentials}
                  onChange={(e) => setIncludeCredentials(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: 'var(--accent-blue)',
                    cursor: 'pointer',
                  }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Incluir credenciales de acceso (usuarios y contraseñas)
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    {devicesWithCredsCount > 0
                      ? `${devicesWithCredsCount} de ${systemDevices.length} dispositivos tienen credenciales configuradas`
                      : 'Ningún dispositivo tiene credenciales registradas actualmente'}
                  </div>
                </div>
              </label>

              {/* Mensaje de Seguridad explicativo */}
              {includeCredentials ? (
                <div
                  style={{
                    background: 'rgba(217, 119, 6, 0.12)',
                    border: '1px solid rgba(217, 119, 6, 0.3)',
                    borderRadius: '6px',
                    padding: '0.6rem 0.75rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    fontSize: '0.775rem',
                    color: 'var(--accent-amber)',
                  }}
                >
                  <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>Aviso de seguridad:</strong> El documento descargado contendrá contraseñas descifradas. Úsalo solo para custodia interna o traspaso técnico seguro.
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(5, 150, 105, 0.1)',
                    border: '1px solid rgba(5, 150, 105, 0.25)',
                    borderRadius: '6px',
                    padding: '0.6rem 0.75rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    fontSize: '0.775rem',
                    color: 'var(--accent-emerald)',
                  }}
                >
                  <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>Modo seguro para cliente:</strong> Las contraseñas y accesos sensibles no se incluirán en el informe generado.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mensajes de error / éxito */}
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-rose)',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: 'rgba(5, 150, 105, 0.15)',
                border: '1px solid rgba(5, 150, 105, 0.3)',
                color: 'var(--accent-emerald)',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} />
              ¡Archivo generado y descargado correctamente!
            </div>
          )}
        </div>

        {/* Pie / Botones */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
            style={{ fontSize: '0.85rem' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={loading || fetching}
            style={{
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.25rem',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                Generando {format === 'excel' ? 'Excel...' : 'PDF...'}
              </>
            ) : (
              <>
                <Download size={16} />
                Exportar {format === 'excel' ? 'Excel (.xlsx)' : 'PDF (.pdf)'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
