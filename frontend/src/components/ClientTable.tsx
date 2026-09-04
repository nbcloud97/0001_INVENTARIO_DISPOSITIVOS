import React, { useState } from 'react';
import { Search, Edit2, Trash2, Plus, Building2 } from 'lucide-react';
import { Client } from '../types';

interface ClientTableProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSelectClientSystems: (clientId: string) => void;
  onOpenNewClient: () => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  onEditClient,
  onDeleteClient,
  onSelectClientSystems,
  onOpenNewClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter((c) => {
    const s = searchTerm.trim().toLowerCase();
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

        <button className="btn btn-primary" onClick={onOpenNewClient}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Clients Table */}
      <div className="table-card">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <Building2 className="empty-icon" />
            <h3>No se encontraron clientes</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Intenta con otro término de búsqueda o crea un nuevo cliente.
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
                  <tr key={client.id}>
                    {/* Nombre Comercial - Clicable */}
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
                        title="Haz clic para abrir los Sistemas de este cliente"
                        onClick={() => onSelectClientSystems(client.id)}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: 'var(--accent-blue)',
                            fontSize: '0.975rem',
                          }}
                          className="client-name-clickable"
                        >
                          {client.name}
                        </div>
                      </button>
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
