import React, { useState } from 'react';
import { Search, Layers, Edit2, Trash2, Plus, Camera, Network, PhoneCall, KeyRound, Shield } from 'lucide-react';
import { Subsystem } from '../types';

interface SubsystemTableProps {
  subsystems: Subsystem[];
  onEditSubsystem: (subsystem: Subsystem) => void;
  onDeleteSubsystem: (id: string) => void;
  onOpenNewSubsystem: () => void;
}

export const SubsystemTable: React.FC<SubsystemTableProps> = ({
  subsystems,
  onEditSubsystem,
  onDeleteSubsystem,
  onOpenNewSubsystem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSubsystems = subsystems.filter((sub) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      sub.name.toLowerCase().includes(term) ||
      (sub.description && sub.description.toLowerCase().includes(term))
    );
  });

  const getSubsystemIcon = (iconName: string) => {
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
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input-search"
            placeholder="Buscar subsistema por Nombre o Descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={onOpenNewSubsystem}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Subsystem Table */}
      <div className="table-card">
        {filteredSubsystems.length === 0 ? (
          <div className="empty-state">
            <Layers className="empty-icon" />
            <h3>No se encontraron subsistemas</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Define un nuevo subsistema (ej. Red, CCTV, Interfonía, Control de accesos).
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="device-table">
              <thead>
                <tr>
                  <th>Nombre del Subsistema</th>
                  <th>Muestra Color</th>
                  <th>Icono</th>
                  <th>Descripci&oacute;n / Alcance T&eacute;cnico</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubsystems.map((sub) => (
                  <tr key={sub.id}>
                    {/* Nombre con Badge */}
                    <td>
                      <span
                        className="badge-subsystem"
                        style={{
                          background: `${sub.color || '#005596'}22`,
                          borderColor: sub.color || '#005596',
                          color: sub.color || '#005596',
                          fontSize: '0.85rem',
                          padding: '0.3rem 0.75rem',
                        }}
                      >
                        {getSubsystemIcon(sub.icon)} {sub.name}
                      </span>
                    </td>

                    {/* Color UI */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            background: sub.color || '#005596',
                            border: '1px solid var(--border-color)',
                            display: 'inline-block',
                          }}
                        />
                        <span className="code-font">{sub.color || '#005596'}</span>
                      </div>
                    </td>

                    {/* Icono UI */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        {getSubsystemIcon(sub.icon)}
                        <span style={{ color: 'var(--text-secondary)' }}>{sub.icon || 'shield'}</span>
                      </div>
                    </td>

                    {/* Descripción */}
                    <td>
                      {sub.description ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {sub.description}
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
                          title="Editar Subsistema"
                          onClick={() => onEditSubsystem(sub)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          title="Eliminar Subsistema"
                          onClick={() => onDeleteSubsystem(sub.id)}
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
