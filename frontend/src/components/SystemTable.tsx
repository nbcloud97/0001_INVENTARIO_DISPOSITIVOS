import React, { useState } from 'react';
import { Search, Cpu, Edit2, Trash2, HardDrive, Plus, Database, Archive, ArchiveRestore } from 'lucide-react';
import { System } from '../types';

interface SystemTableProps {
  systems: System[];
  onEditSystem: (system: System) => void;
  onDeleteSystem: (id: string) => void;
  onArchiveSystem?: (system: System, isArchived: boolean) => void;
  onSelectSystemDevices: (systemId: string) => void;
  onOpenNewSystem: () => void;
  onOpenBeta10Import?: () => void;
  showClientName?: boolean;
}

export const SystemTable: React.FC<SystemTableProps> = ({
  systems,
  onEditSystem,
  onDeleteSystem,
  onArchiveSystem,
  onSelectSystemDevices,
  onOpenNewSystem,
  onOpenBeta10Import,
  showClientName = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');

  const activeCount = systems.filter((s) => !s.isArchived).length;
  const archivedCount = systems.filter((s) => s.isArchived).length;
  const totalCount = systems.length;

  const filteredSystems = systems.filter((s) => {
    // Filtro por estado de archivado
    if (statusFilter === 'active' && s.isArchived) return false;
    if (statusFilter === 'archived' && !s.isArchived) return false;

    // Filtro por término de búsqueda
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
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="input-search"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Selector de estado: Activos / Archivados / Todos */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className={`btn ${statusFilter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.78rem',
                padding: '0.25rem 0.65rem',
                border: 'none',
                boxShadow: statusFilter === 'active' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              }}
              onClick={() => setStatusFilter('active')}
            >
              Activos ({activeCount})
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'archived' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.78rem',
                padding: '0.25rem 0.65rem',
                border: 'none',
                boxShadow: statusFilter === 'archived' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              }}
              onClick={() => setStatusFilter('archived')}
            >
              Archivados ({archivedCount})
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.78rem',
                padding: '0.25rem 0.65rem',
                border: 'none',
                boxShadow: statusFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              }}
              onClick={() => setStatusFilter('all')}
            >
              Todos ({totalCount})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {onOpenBeta10Import && (
            <button
              className="btn btn-secondary"
              onClick={onOpenBeta10Import}
              title="Importar o sincronizar sistemas desde Beta 10 (Oracle ERP)"
              style={{
                borderColor: 'rgba(234, 88, 12, 0.4)',
                color: '#ea580c',
                fontWeight: 600,
              }}
            >
              <Database size={16} /> Beta 10
            </button>
          )}

          <button className="btn btn-primary" onClick={onOpenNewSystem}>
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        {filteredSystems.length === 0 ? (
          <div className="empty-state">
            <Cpu className="empty-icon" />
            <h3>No se encontraron sistemas</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              {statusFilter === 'archived'
                ? 'No hay sistemas archivados en este cliente.'
                : 'Crea un nuevo sistema para organizar los dispositivos de tus clientes.'}
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
                  <tr
                    key={system.id}
                    style={{
                      opacity: system.isArchived ? 0.75 : 1,
                      background: system.isArchived ? 'rgba(100, 116, 139, 0.04)' : undefined,
                    }}
                  >
                    {/* Nombre del sistema clicable para abrir sus dispositivos */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                              color: system.isArchived ? 'var(--text-secondary)' : 'var(--accent-blue)',
                              fontSize: '0.95rem',
                            }}
                            className="client-name-clickable"
                          >
                            {system.name}
                          </div>
                        </button>
                        {system.isArchived && (
                          <span
                            style={{
                              fontSize: '0.675rem',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(100, 116, 139, 0.15)',
                              color: 'var(--text-muted)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.02em',
                            }}
                          >
                            Archivado
                          </span>
                        )}
                      </div>
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
                        {onArchiveSystem && (
                          <button
                            className="btn btn-secondary btn-icon"
                            title={system.isArchived ? 'Restaurar / Desarchivar Sistema' : 'Archivar Sistema'}
                            style={{
                              color: system.isArchived ? 'var(--accent-emerald)' : 'var(--accent-amber, #d97706)',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchiveSystem(system, !system.isArchived);
                            }}
                          >
                            {system.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                          </button>
                        )}
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
