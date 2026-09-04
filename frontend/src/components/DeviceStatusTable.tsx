import React, { useState } from 'react';
import { Search, Plus, Tag, Edit2, Trash2 } from 'lucide-react';
import { DeviceStatus, Device } from '../types';

interface DeviceStatusTableProps {
  statuses: DeviceStatus[];
  devices?: Device[];
  onEditStatus: (status: DeviceStatus) => void;
  onDeleteStatus: (id: string) => void;
  onOpenNewStatus: () => void;
}

export const DeviceStatusTable: React.FC<DeviceStatusTableProps> = ({
  statuses,
  devices = [],
  onEditStatus,
  onDeleteStatus,
  onOpenNewStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStatuses = statuses.filter((st) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      st.name.toLowerCase().includes(term) ||
      (st.description && st.description.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      {/* Toolbar superior con búsqueda y botón Nuevo */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="search-box" style={{ flex: 1, minWidth: '250px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input-search"
            placeholder="Buscar estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={onOpenNewStatus}>
          <Plus size={16} /> Nuevo Estado
        </button>
      </div>

      {/* Tabla de Estados de Dispositivo */}
      <div className="table-card">
        {filteredStatuses.length === 0 ? (
          <div className="empty-state">
            <Tag className="empty-icon" />
            <h3>No se encontraron estados</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Define los estados en los que puede encontrarse un equipo (ej: Operativo, Baja, Falta instalación).
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="device-table">
              <thead>
                <tr>
                  <th>Nombre del Estado</th>
                  <th>Visualización Badge</th>
                  <th>Equipos Asignados</th>
                  <th>Descripción / Observaciones</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredStatuses.map((st) => {
                  const statusColor = st.color || '#10b981';
                  const countAssigned = st._count?.devices ?? devices.filter((d) => d.statusId === st.id).length;

                  return (
                    <tr key={st.id}>
                      {/* Nombre del estado */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <Tag size={18} color={statusColor} />
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {st.name}
                          </span>
                        </div>
                      </td>

                      {/* Visualización Badge */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: `${statusColor}20`,
                            color: statusColor,
                            border: `1px solid ${statusColor}55`,
                          }}
                        >
                          {st.name}
                        </span>
                      </td>

                      {/* Equipos Asignados */}
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: countAssigned > 0 ? 'var(--accent-blue)' : 'var(--text-muted)',
                          }}
                        >
                          {countAssigned} {countAssigned === 1 ? 'equipo' : 'equipos'}
                        </span>
                      </td>

                      {/* Descripción */}
                      <td>
                        {st.description ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {st.description}
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
                            title="Editar Estado"
                            onClick={() => onEditStatus(st)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            title={
                              countAssigned > 0
                                ? `No se puede eliminar: Asignado a ${countAssigned} equipo(s)`
                                : 'Eliminar Estado'
                            }
                            style={countAssigned > 0 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                            onClick={() => onDeleteStatus(st.id)}
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
    </div>
  );
};
