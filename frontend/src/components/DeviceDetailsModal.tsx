import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  Cpu,
  Building2,
  ShieldCheck,
  Network,
  Server,
  KeyRound,
  FileText,
  Boxes,
  Zap,
  Camera,
  PhoneCall,
  Shield
} from 'lucide-react';
import { Device, DeviceCredentialItem } from '../types';
import { api } from '../services/api';

interface DeviceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  onEditDevice?: (device: Device) => void;
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  isOpen,
  onClose,
  device,
  onEditDevice,
}) => {
  const [credentialsList, setCredentialsList] = useState<DeviceCredentialItem[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<number, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (device && device.hasCredentials) {
      setLoadingCreds(true);
      api.getDeviceCredentials(device.id)
        .then((creds) => {
          setCredentialsList(Array.isArray(creds) ? creds : []);
        })
        .catch(console.error)
        .finally(() => setLoadingCreds(false));
    } else {
      setCredentialsList([]);
    }
    setShowPasswordMap({});
    setCopiedField(null);
  }, [device, isOpen]);

  if (!isOpen || !device) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleShowPassword = (index: number) => {
    setShowPasswordMap((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getSubsystemIcon = (iconName?: string) => {
    switch (iconName) {
      case 'camera': return <Camera size={15} />;
      case 'network': return <Network size={15} />;
      case 'phone-call': return <PhoneCall size={15} />;
      case 'key-round': return <KeyRound size={15} />;
      default: return <Shield size={15} />;
    }
  };

  const subsystemColor = device.subsystem?.color || '#0284c7';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '750px', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header Visual Principal */}
        <div
          className="modal-header"
          style={{
            background: 'var(--header-bg)',
            borderBottom: '1px solid var(--border-color)',
            padding: '1.1rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: `${subsystemColor}25`,
                border: `1px solid ${subsystemColor}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: subsystemColor,
              }}
            >
              <HardDrive size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
                  {device.assignedName}
                </h2>
                {device.subsystem && (
                  <span
                    className="badge-subsystem"
                    style={{
                      background: `${subsystemColor}22`,
                      borderColor: subsystemColor,
                      color: subsystemColor,
                      fontSize: '0.725rem',
                      padding: '0.15rem 0.5rem',
                    }}
                  >
                    {getSubsystemIcon(device.subsystem.icon)}
                    {device.subsystem.name}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'rgba(255, 255, 255, 0.75)', marginTop: '0.15rem' }}>
                {device.deviceTypeName ? `${device.deviceTypeName} • ` : ''}{device.brand || 'GENÉRICO'} • {device.model || 'ESTÁNDAR'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onEditDevice && (
              <button
                className="btn btn-secondary"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.75rem',
                }}
                onClick={() => {
                  onClose();
                  onEditDevice(device);
                }}
              >
                <Edit2 size={14} /> Editar
              </button>
            )}
            <button
              className="btn btn-secondary btn-icon"
              style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#ffffff' }}
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="modal-body" style={{ padding: '1.5rem', gap: '1.25rem' }}>
          {/* Banner Breadcrumb de Contexto (Cliente -> Sistema) */}
          <div
            style={{
              background: 'var(--bg-primary)',
              padding: '0.75rem 1.1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <Building2 size={16} color="var(--accent-blue)" />
              <span style={{ color: 'var(--text-muted)' }}>Cliente:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{device.client?.name || '-'}</strong>
            </div>

            <div style={{ color: 'var(--border-color)' }}>|</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <Cpu size={16} color="var(--accent-cyan)" />
              <span style={{ color: 'var(--text-muted)' }}>Sistema:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{device.system?.name || '-'}</strong>
            </div>

            <div style={{ color: 'var(--border-color)' }}>|</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <Boxes size={16} color="var(--accent-purple)" />
              <span style={{ color: 'var(--text-muted)' }}>Subsistema:</span>
              <strong style={{ color: subsystemColor }}>{device.subsystem?.name || '-'}</strong>
            </div>

            {device.deviceTypeName && (
              <>
                <div style={{ color: 'var(--border-color)' }}>|</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tipo:</span>
                  <strong style={{ color: 'var(--accent-emerald)' }}>{device.deviceTypeName}</strong>
                </div>
              </>
            )}
          </div>

          {/* Tarjetas Visuales de Datos Técnicos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* TARJETA 1: Red y Conectividad (Sin botones de copiar IP / MAC) */}
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)' }}>
                <Network size={18} />
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Red y Conectividad
                </h3>
              </div>

              {/* Dirección IP */}
              <div style={{ background: 'var(--bg-primary)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Direcci&oacute;n IP</span>
                {device.ipAddress ? (
                  <span className="code-font" style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'inline-block', marginTop: '0.15rem' }}>
                    {device.ipAddress}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sin IP configurada</span>
                )}
              </div>

              {/* Dirección MAC */}
              <div style={{ background: 'var(--bg-primary)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Direcci&oacute;n MAC</span>
                {device.macAddress ? (
                  <span className="code-font" style={{ fontSize: '0.9rem', display: 'inline-block', marginTop: '0.15rem' }}>
                    {device.macAddress}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No registrada</span>
                )}
              </div>
            </div>

            {/* TARJETA 2: Ubicación Física y Switch */}
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)' }}>
                <Server size={18} />
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Ubicaci&oacute;n F&iacute;sica y Switch
                </h3>
              </div>

              {/* RACK */}
              <div style={{ background: 'var(--bg-primary)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>RACK</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '0.1rem' }}>
                  {device.rackCabinet ? `📦 ${device.rackCabinet}` : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Sin rack asignado</span>}
                </div>
              </div>

              {/* REFERENCIA SWITCH Y PUERTO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>REFERENCIA SWITCH</span>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, marginTop: '0.1rem' }}>
                    {device.switchName ? `🔌 ${device.switchName}` : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>-</span>}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>SWITCH PUERTO</span>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, marginTop: '0.1rem' }}>
                    {device.switchPort ? `⚡ ${device.switchPort}` : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>-</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TARJETA 3: Marca, Modelo y Número de Serie CENTRADOS */}
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '1.1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              textAlign: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>MARCA</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem' }}>
                {device.brand || 'GENÉRICO'}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>MODELO</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem' }}>
                {device.model || 'ESTÁNDAR'}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>N&Uacute;MERO DE SERIE</span>
              <div style={{ marginTop: '0.2rem' }}>
                {device.serialNumber ? (
                  <span className="code-font" style={{ fontSize: '0.875rem' }}>{device.serialNumber}</span>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No registrado</span>
                )}
              </div>
            </div>
          </div>

          {/* TARJETA 4: Credenciales del Equipo (Sin el texto Cifradas en AES-256) */}
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '1.2rem',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)' }}>
                <ShieldCheck size={18} />
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Credenciales del Equipo ({credentialsList.length})
                </h3>
              </div>
            </div>

            {loadingCreds ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem' }}>Descifrando accesos de forma segura...</div>
            ) : credentialsList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {credentialsList.map((cred, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-primary)',
                      padding: '0.85rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Zap size={14} /> {cred.title || `Credencial #${idx + 1}`}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                      {/* Usuario */}
                      <div style={{ background: 'var(--bg-card)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>USUARIO</span>
                          <span className="code-font" style={{ fontSize: '0.875rem' }}>{cred.username || '-'}</span>
                        </div>
                        {cred.username && (
                          <button
                            className="btn btn-secondary btn-icon"
                            style={{ padding: '0.2rem 0.4rem' }}
                            title="Copiar usuario"
                            onClick={() => copyToClipboard(cred.username!, `u_${idx}`)}
                          >
                            {copiedField === `u_${idx}` ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                          </button>
                        )}
                      </div>

                      {/* Contraseña */}
                      <div style={{ background: 'var(--bg-card)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>CONTRASE&Ntilde;A</span>
                          <span className="code-font" style={{ fontSize: '0.875rem' }}>
                            {showPasswordMap[idx] ? cred.password : '••••••••••••'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            style={{ padding: '0.2rem 0.4rem' }}
                            title={showPasswordMap[idx] ? 'Ocultar' : 'Mostrar'}
                            onClick={() => toggleShowPassword(idx)}
                          >
                            {showPasswordMap[idx] ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          {cred.password && (
                            <button
                              className="btn btn-secondary btn-icon"
                              style={{ padding: '0.2rem 0.4rem' }}
                              title="Copiar contraseña"
                              onClick={() => copyToClipboard(cred.password!, `p_${idx}`)}
                            >
                              {copiedField === `p_${idx}` ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                Sin credenciales de acceso registradas para este equipo.
              </div>
            )}
          </div>

          {/* TARJETA 5: Notas y Observaciones */}
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '1.1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              <FileText size={16} />
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Notas / Observaciones T&eacute;cnicas
              </h3>
            </div>
            <div
              style={{
                background: 'var(--bg-primary)',
                padding: '0.85rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                color: 'var(--text-primary)',
              }}
            >
              {device.notes ? device.notes : <span style={{ color: 'var(--text-muted)' }}>Sin observaciones registradas para este equipo.</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '1rem 1.5rem', background: 'var(--bg-primary)', borderRadius: '0 0 12px 12px' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.5rem 1.25rem' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
