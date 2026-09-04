import React from 'react';
import { X, HardDrive, Building2, Cpu, ExternalLink } from 'lucide-react';
import { DeviceType, Device } from '../types';

interface AssociatedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceType: DeviceType | null;
  devices: Device[];
  onSelectDeviceDetails?: (device: Device) => void;
}

export const AssociatedDevicesModal: React.FC<AssociatedDevicesModalProps> = ({
  isOpen,
  onClose,
  deviceType,
  devices,
  onSelectDeviceDetails,
}) => {
  if (!isOpen || !deviceType) return null;

  // Filtrar los dispositivos asociados a este tipo
  const typeDevices = devices.filter((d) => d.deviceTypeId === deviceType.id);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <HardDrive color="var(--accent-blue)" size={24} />
            <div>
              <h2>Equipos Registrados: {deviceType.name}</h2>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                Subsistema: {deviceType.subsystem?.name || 'General'} • {typeDevices.length} dispositivo(s)
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {typeDevices.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <HardDrive className="empty-icon" />
              <h3>Sin equipos registrados</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Actualmente no hay dispositivos inventariados con este tipo.
              </p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <table className="device-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Sistema</th>
                    <th>Nombre de Dispositivo</th>
                    {onSelectDeviceDetails && <th style={{ textAlign: 'right' }}>Acción</th>}
                  </tr>
                </thead>
                <tbody>
                  {typeDevices.map((dev) => (
                    <tr key={dev.id}>
                      {/* Cliente */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
                          <Building2 size={14} color="var(--accent-blue)" />
                          <span>{dev.client?.name || '-'}</span>
                        </div>
                      </td>

                      {/* Sistema */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                          <Cpu size={14} color="var(--accent-cyan)" />
                          <span>{dev.system?.name || '-'}</span>
                        </div>
                      </td>

                      {/* Nombre de Dispositivo */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {dev.assignedName}
                        </div>
                        {(dev.brand || dev.model) && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {dev.brand} {dev.model}
                          </div>
                        )}
                      </td>

                      {/* Acción Ver Detalle */}
                      {onSelectDeviceDetails && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              onClose();
                              onSelectDeviceDetails(dev);
                            }}
                          >
                            <ExternalLink size={13} /> Abrir
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '0.85rem 1.25rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
