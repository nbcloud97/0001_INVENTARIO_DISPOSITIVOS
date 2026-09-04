import React, { useState } from 'react';
import { Search, Plus, HardDrive, Edit2, Trash2, Shield, Camera, Network, PhoneCall, KeyRound } from 'lucide-react';
import { Subsystem, DeviceType, Device } from '../types';
import { AssociatedDevicesModal } from './AssociatedDevicesModal';

interface DeviceTypeTableProps {
  deviceTypes: DeviceType[];
  subsystems: Subsystem[];
  devices?: Device[];
  onEditDeviceType: (deviceType: DeviceType) => void;
  onDeleteDeviceType: (id: string) => void;
  onOpenNewDeviceType: () => void;
  onSelectDeviceDetails?: (device: Device) => void;
}

export const DeviceTypeTable: React.FC<DeviceTypeTableProps> = ({
  deviceTypes,
  subsystems,
  devices = [],
  onEditDeviceType,
  onDeleteDeviceType,
  onOpenNewDeviceType,
  onSelectDeviceDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubsystemId, setSelectedSubsystemId] = useState('');
  const [selectedTypeForModal, setSelectedTypeForModal] = useState<DeviceType | null>(null);

  const filteredDeviceTypes = deviceTypes.filter((dt) => {
    if (selectedSubsystemId && dt.subsystemId !== selectedSubsystemId) {
      return false;
    }
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      dt.name.toLowerCase().includes(term) ||
      (dt.description && dt.description.toLowerCase().includes(term)) ||
      (dt.subsystem?.name && dt.subsystem.name.toLowerCase().includes(term))
    );
  });

  const getSubsystemIcon = (iconName?: string) => {
    switch (iconName) {
      case 'camera':
        return <Camera size={14} />;
      case 'network':
        return <Network size={14} />;
      case 'phone-call':
        return <PhoneCall size={14} />;
      case 'key-round':
        return <KeyRound size={14} />;
      default:
        return <Shield size={14} />;
    }
  };

  return (
    <div>
      {/* Toolbar superior con búsqueda, filtro por subsistema y botón Nuevo */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="input-search"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '220px', fontSize: '0.85rem' }}
            value={selectedSubsystemId}
            onChange={(e) => setSelectedSubsystemId(e.target.value)}
          >
            <option value="">Todos los subsistemas</option>
            {subsystems.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={onOpenNewDeviceType}>
          <Plus size={16} /> Nuevo Tipo
        </button>
      </div>

      {/* Tabla de Tipos de Dispositivo */}
      <div className="table-card">
        {filteredDeviceTypes.length === 0 ? (
          <div className="empty-state">
            <HardDrive className="empty-icon" />
            <h3>No hay tipos de dispositivo registrados</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Crea tipos de dispositivo (ej: Cámara de vídeo, NVR, Extintor) asignados a sus subsistemas correspondientes.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="device-table">
              <thead>
                <tr>
                  <th>Tipo de Dispositivo</th>
                  <th>Subsistema Asignado</th>
                  <th>Equipos Asociados</th>
                  <th>Descripción / Observaciones</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeviceTypes.map((dt) => {
                  const subColor = dt.subsystem?.color || '#0284c7';
                  const associatedCount = devices.filter((d) => d.deviceTypeId === dt.id).length;

                  return (
                    <tr key={dt.id}>
                      {/* Nombre del tipo */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <HardDrive size={18} color="var(--accent-blue)" />
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {dt.name}
                          </span>
                        </div>
                      </td>

                      {/* Subsistema asignado */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: `${subColor}20`,
                            color: subColor,
                            border: `1px solid ${subColor}40`,
                          }}
                        >
                          {getSubsystemIcon(dt.subsystem?.icon)}
                          {dt.subsystem?.name || 'Sin subsistema'}
                        </span>
                      </td>

                      {/* Equipos Asociados */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: associatedCount > 0 ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-primary)',
                            color: associatedCount > 0 ? 'var(--accent-blue)' : 'var(--text-muted)',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            border: '1px solid var(--border-color)',
                            cursor: associatedCount > 0 ? 'pointer' : 'default',
                          }}
                          title={associatedCount > 0 ? 'Haz clic para consultar cliente, sistema y equipos' : undefined}
                          onClick={() => {
                            if (associatedCount > 0) {
                              setSelectedTypeForModal(dt);
                            }
                          }}
                        >
                          {associatedCount} {associatedCount === 1 ? 'equipo' : 'equipos'}
                        </span>
                      </td>

                      {/* Descripción */}
                      <td>
                        {dt.description ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {dt.description}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            title="Editar Tipo de Dispositivo"
                            onClick={() => onEditDeviceType(dt)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            title={
                              associatedCount > 0
                                ? `No se puede eliminar: Asociado a ${associatedCount} equipo(s)`
                                : 'Eliminar Tipo de Dispositivo'
                            }
                            style={associatedCount > 0 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                            onClick={() => onDeleteDeviceType(dt.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Equipos Asociados */}
      <AssociatedDevicesModal
        isOpen={!!selectedTypeForModal}
        onClose={() => setSelectedTypeForModal(null)}
        deviceType={selectedTypeForModal}
        devices={devices}
        onSelectDeviceDetails={onSelectDeviceDetails}
      />
    </div>
  );
};
