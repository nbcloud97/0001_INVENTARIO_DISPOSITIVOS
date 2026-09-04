import React, { useState } from 'react';
import { Search, Cpu, Edit2, Trash2, HardDrive, Plus } from 'lucide-react';
import { System } from '../types';

interface SystemTableProps {
  systems: System[];
  onEditSystem: (system: System) => void;
  onDeleteSystem: (id: string) => void;
  onSelectSystemDevices: (systemId: string) => void;
  onOpenNewSystem: () => void;
  showClientName?: boolean;
}

export const SystemTable: React.FC<SystemTableProps> = ({
  systems,
  onEditSystem,
  onDeleteSystem,
  onSelectSystemDevices,
  onOpenNewSystem,
  showClientName = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSystems = systems.filter((s) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      s.name.toLowerCase().includes(term) ||
      (s.code && s.code.toLowerCase().includes(term)) ||
      (s.notes && s.notes.toLowerCase().includes(term)) ||
      (s.client?.name && s.client.name.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input-search"
            placeholder="Buscar sistema por Nombre, Código, Cliente o Notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={onOpenNewSystem}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Table */}
      <div className="table-card">
        {filteredSystems.length === 0 ? (
          <div className="empty-state">
            <Cpu className="empty-icon" />
            <h3>No se encontraron sistemas</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Crea un nuevo sistema para organizar los dispositivos de tus clientes.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="device-table">
              <thead>
                <tr>
                  <th>Nombre del Sistema</th>
                  <th>C&oacute;digo</th>
                  {showClientName && <th>Cliente Asociado</th>}
                  <th>Notas</th>
                  <th>Dispositivos</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSystems.map((system) => (
                  <tr key={system.id}>
                    {/* Nombre del sistema clicable para abrir sus dispositivos */}
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
                        title="Haz clic para abrir los dispositivos de este sistema"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSystemDevices(system.id);
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
                          {system.name}
                        </div>
                      </button>
                    </td>

                    {/* Código */}
                    <td>
                      {system.code ? (
                        <span className="code-font">{system.code}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* Cliente */}
                    {showClientName && (
                      <td>
                        <span style={{ fontWeight: 600 }}>{system.client?.name || '-'}</span>
                      </td>
                    )}

                    {/* Notas */}
                    <td>
                      {system.notes ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {system.notes}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* Dispositivos */}
                    <td>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: 'rgba(2, 132, 199, 0.15)',
                          color: 'var(--accent-cyan)',
                          border: '1px solid rgba(2, 132, 199, 0.3)',
                          cursor: 'pointer',
                          display: 'inline-block',
                        }}
                        title="Haz clic para ver los dispositivos de este sistema"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSystemDevices(system.id);
                        }}
                      >
                        {system._count?.devices || 0} dispositivos
                      </span>
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Editar Sistema"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSystem(system);
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          title="Eliminar Sistema"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSystem(system.id);
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
