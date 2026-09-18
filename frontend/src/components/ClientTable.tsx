import React, { useState } from 'react';
import { Search, Edit2, Trash2, Plus, Building2, Database, Archive, ArchiveRestore } from 'lucide-react';
import { Client } from '../types';
import { useDebounce } from '../hooks/useDebounce';

interface ClientTableProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onArchiveClient?: (client: Client, isArchived: boolean) => void;
  onSelectClientSystems: (clientId: string) => void;
  onOpenNewClient: () => void;
  onOpenBeta10Import?: () => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  onEditClient,
  onDeleteClient,
  onArchiveClient,
  onSelectClientSystems,
  onOpenNewClient,
  onOpenBeta10Import,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const debouncedSearch = useDebounce(searchTerm, 200);

  const activeCount = clients.filter((c) => !c.isArchived).length;
  const archivedCount = clients.filter((c) => c.isArchived).length;
  const totalCount = clients.length;

  const filteredClients = clients.filter((c) => {
    // Filtro por estado de archivado
    if (statusFilter === 'active' && c.isArchived) return false;
    if (statusFilter === 'archived' && !c.isArchived) return false;

    // Filtro por texto de búsqueda
    const s = debouncedSearch.trim().toLowerCase();
    if (!s) return true;

    return (
      c.name.toLowerCase().includes(s) ||
      (c.legalName && c.legalName.toLowerCase().includes(s)) ||
      (c.cif && c.cif.toLowerCase().includes(s)) ||
      (c.manualId && c.manualId.toLowerCase().includes(s)) ||
      (c.notes && c.notes.toLowerCase().includes(s))
    );
  });

  return (
    <div>
      {/* Header & Search Toolbar */}
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

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onOpenBeta10Import && (
            <button
              className="btn btn-secondary"
              onClick={onOpenBeta10Import}
              title="Importar cliente y sistemas desde Beta 10 (Oracle ERP)"
              style={{
                borderColor: 'rgba(234, 88, 12, 0.4)',
                color: '#ea580c',
                fontWeight: 600,
              }}
            >
              <Database size={16} /> Beta 10
            </button>
          )}

          <button className="btn btn-primary" onClick={onOpenNewClient}>
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="table-card">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <Building2 className="empty-icon" />
            <h3>No se encontraron clientes</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              {statusFilter === 'archived'
                ? 'No hay clientes archivados.'
                : 'Intenta con otro término de búsqueda o crea un nuevo cliente.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="device-table">
              <thead>
                <tr>
                  <th>Nombre Comercial</th>
                  <th>Nombre Fiscal</th>
                  <th>NIF</th>
                  <th>ID Manual</th>
                  <th>Notas</th>
                  <th>Sistemas</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    style={{
                      opacity: client.isArchived ? 0.75 : 1,
                      background: client.isArchived ? 'rgba(100, 116, 139, 0.04)' : undefined,
                    }}
                  >
                    {/* Nombre Comercial - Clicable */}
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
                          title="Haz clic para abrir los Sistemas de este cliente"
                          onClick={() => onSelectClientSystems(client.id)}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              color: client.isArchived ? 'var(--text-secondary)' : 'var(--accent-blue)',
                              fontSize: '0.975rem',
                            }}
                            className="client-name-clickable"
                          >
                            {client.name}
                          </div>
                        </button>
                        {client.isArchived && (
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

                    {/* Nombre Fiscal */}
                    <td>
                      {client.legalName ? (
                        <span style={{ fontSize: '0.875rem' }}>{client.legalName}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* NIF */}
                    <td>
                      {client.cif ? (
                        <span className="code-font">{client.cif}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* ID Manual */}
                    <td>
                      {client.manualId ? (
                        <span className="code-font" style={{ color: 'var(--accent-purple)' }}>{client.manualId}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* Notas */}
                    <td>
                      {client.notes ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {client.notes}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* Sistemas Instalados (Insignia Clicable) */}
                    <td>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                        }}
                        title="Ver sistemas de este cliente"
                        onClick={() => onSelectClientSystems(client.id)}
                      >
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: 'rgba(0, 85, 150, 0.15)',
                            color: 'var(--accent-blue)',
                            border: '1px solid rgba(0, 85, 150, 0.3)',
                            display: 'inline-block',
                          }}
                        >
                          {client._count?.systems || 0} sistemas
                        </span>
                      </button>
                    </td>

                    {/* Acciones */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Editar Cliente"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClient(client);
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        {onArchiveClient && (
                          <button
                            className="btn btn-secondary btn-icon"
                            title={client.isArchived ? 'Restaurar / Desarchivar Cliente' : 'Archivar Cliente'}
                            style={{
                              color: client.isArchived ? 'var(--accent-emerald)' : 'var(--accent-amber, #d97706)',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchiveClient(client, !client.isArchived);
                            }}
                          >
                            {client.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-icon"
                          title="Eliminar Cliente"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClient(client.id);
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
