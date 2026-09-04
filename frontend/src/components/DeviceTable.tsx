import React from 'react';
import { Search, Edit2, Trash2, Shield, Camera, Network, PhoneCall, KeyRound, HardDrive, Info } from 'lucide-react';
import { Device, Subsystem } from '../types';

interface DeviceTableProps {
  devices: Device[];
  subsystems: Subsystem[];
  selectedSubsystemId: string;
  setSelectedSubsystemId: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onEditDevice: (device: Device) => void;
  onDeleteDevice: (id: string) => void;
  onSelectDeviceDetails?: (device: Device) => void;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
  subsystems,
  selectedSubsystemId,
  setSelectedSubsystemId,
  searchTerm,
  setSearchTerm,
  onEditDevice,
  onDeleteDevice,
  onSelectDeviceDetails,
}) => {
  const getSubsystemIcon = (iconName?: string) => {
    switch (iconName) {
      case 'camera': return <Camera size={14} />;
      case 'network': return <Network size={14} />;
      case 'phone-call': return <PhoneCall size={14} />;
      case 'key-round': return <KeyRound size={14} />;
      default: return <Shield size={14} />;
    }
  };

  return (
    <div>
      {/* Search Toolbar & Subsystem Filters */}
      <div className="toolbar">
        {/* Search Box */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input-search"
            placeholder="Buscar por Nombre, Marca, Modelo, IP, MAC, Rack o Switch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Subsystem Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          <button
            className={`btn ${selectedSubsystemId === '' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setSelectedSubsystemId('')}
          >
            Todos ({devices.length})
          </button>
          {subsystems.map((sub) => {
            const count = devices.filter((d) => d.subsystemId === sub.id).length;
            const isSelected = selectedSubsystemId === sub.id;
            return (
              <button
                key={sub.id}
                className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  borderColor: sub.color,
                  color: isSelected ? '#fff' : sub.color,
                  background: isSelected ? sub.color : `${sub.color}15`,
                }}
                onClick={() => setSelectedSubsystemId(sub.id)}
              >
                {getSubsystemIcon(sub.icon)} {sub.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Devices Table */}
      <div className="table-card">
        {devices.length === 0 ? (
          <div className="empty-state">
            <HardDrive className="empty-icon" />
            <h3>No se encontraron dispositivos</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Prueba a cambiar el filtro de subsistema o añade nuevos dispositivos a este sistema.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="device-table">
              <thead>
                <tr>
                  <th>Nombre Asignado</th>
                  <th>Subsistema</th>
                  <th>Marca / Modelo</th>
                  <th>Nº Serie</th>
                  <th>Direcci&oacute;n IP</th>
                  <th>MAC</th>
                  <th>RACK / REF. SWITCH / PUERTO</th>
                  <th>Credenciales</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id}>
                    {/* Nombre Asignado - CLICABLE */}
                    <td>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                        title="Haz clic para abrir toda la información detallada de este dispositivo"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDeviceDetails && onSelectDeviceDetails(device);
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: 'var(--accent-blue)',
                            fontSize: '0.95rem',
                          }}
                          className="client-name-clickable"
                        >
                          {device.assignedName}
                        </div>
                      </button>
                    </td>

                    {/* Subsistema */}
                    <td>
                      {device.subsystem ? (
                        <span
                          className="badge-subsystem"
                          style={{
                            background: `${device.subsystem.color || '#005596'}22`,
                            borderColor: device.subsystem.color || '#005596',
                            color: device.subsystem.color || '#005596',
                          }}
                        >
                          {getSubsystemIcon(device.subsystem.icon)}
                          {device.subsystem.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* Marca / Modelo */}
                    <td>
                      <div style={{ fontWeight: 600 }}>{device.brand || 'GENÉRICO'}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                        {device.model || 'ESTÁNDAR'}
                      </div>
                    </td>

                    {/* Nº Serie */}
                    <td>
                      {device.serialNumber ? (
                        <span className="code-font">{device.serialNumber}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* IP */}
                    <td>
                      {device.ipAddress ? (
                        <span className="code-font" style={{ color: 'var(--accent-cyan)' }}>
                          {device.ipAddress}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* MAC */}
                    <td>
                      {device.macAddress ? (
                        <span className="code-font">{device.macAddress}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* RACK / REF. SWITCH / PUERTO */}
                    <td>
                      {device.rackCabinet || device.switchName || device.switchPort ? (
                        <div style={{ fontSize: '0.8rem' }}>
                          {device.rackCabinet && <div>📦 {device.rackCabinet}</div>}
                          {(device.switchName || device.switchPort) && (
                            <div style={{ color: 'var(--text-secondary)' }}>
                              🔌 {device.switchName || 'SWITCH'} {device.switchPort ? `(${device.switchPort})` : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* Credenciales indicator */}
                    <td>
                      {device.hasCredentials ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          🔒 {device.credentialsCount ? `${device.credentialsCount} Guardada(s)` : 'Guardadas'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {/* Botón Ver Detalle Info */}
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Ver Detalle Completo"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDeviceDetails && onSelectDeviceDetails(device);
                          }}
                        >
                          <Info size={15} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Editar Dispositivo"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditDevice(device);
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          title="Eliminar Dispositivo"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDevice(device.id);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
