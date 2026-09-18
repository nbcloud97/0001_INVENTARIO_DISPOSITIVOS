import React, { useState, useEffect } from 'react';
import { X, Cpu, Database } from 'lucide-react';
import { Client, System } from '../types';
import { api } from '../services/api';

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  systemToEdit?: System | null;
  clients: Client[];
  defaultClientId?: string;
  onOpenBeta10Import?: (clientId?: string) => void;
}

export const SystemModal: React.FC<SystemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  systemToEdit,
  clients,
  defaultClientId,
  onOpenBeta10Import,
}) => {
  const [formData, setFormData] = useState<Partial<System>>({
    name: '',
    code: '',
    notes: '',
    clientId: defaultClientId || (clients[0]?.id || ''),
    isArchived: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (systemToEdit) {
      setFormData({
        name: systemToEdit.name,
        code: systemToEdit.code || '',
        notes: systemToEdit.notes || '',
        clientId: systemToEdit.clientId,
        isArchived: systemToEdit.isArchived || false,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        notes: '',
        clientId: defaultClientId || (clients[0]?.id || ''),
        isArchived: false,
      });
    }
    setError(null);
  }, [systemToEdit, isOpen, defaultClientId, clients]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const upperData = {
      ...formData,
      name: formData.name ? formData.name.toUpperCase().trim() : '',
      code: formData.code ? formData.code.toUpperCase().trim() : '',
      notes: formData.notes ? formData.notes.toUpperCase().trim() : '',
    };

    try {
      if (systemToEdit) {
        await api.updateSystem(systemToEdit.id, upperData);
      } else {
        await api.createSystem(upperData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Cpu color="var(--accent-blue)" size={22} />
            <h2>{systemToEdit ? 'Editar Sistema' : 'Crear Nuevo Sistema'}</h2>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-rose)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            {/* Banner de acceso rápido a Importación Beta 10 */}
            {!systemToEdit && onOpenBeta10Import && (
              <div
                style={{
                  background: 'rgba(234, 88, 12, 0.08)',
                  border: '1px solid rgba(234, 88, 12, 0.25)',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={18} color="#ea580c" />
                  <div style={{ fontSize: '0.825rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>¿Consultar sistemas en Beta 10?</span>
                    <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      Carga los sistemas técnicos registrados para este cliente en Beta 10
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.3rem 0.65rem',
                    color: '#ea580c',
                    borderColor: 'rgba(234, 88, 12, 0.3)',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    onClose();
                    onOpenBeta10Import(formData.clientId);
                  }}
                >
                  Abrir Beta 10
                </button>
              </div>
            )}

            {/* Cliente obligatorio previamente creado */}
            <div className="form-group">
              <label className="form-label">Cliente Asociado *</label>
              <select
                className="form-select"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Nombre del Sistema */}
            <div className="form-group">
              <label className="form-label">Nombre del Sistema *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Código */}
            <div className="form-group">
              <label className="form-label">C&oacute;digo de Sistema</label>
              <input
                type="text"
                className="form-input code-font"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            {/* Notas */}
            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Estado Archivado */}
            <div className="form-group" style={{ marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={!!formData.isArchived}
                  onChange={(e) => setFormData({ ...formData, isArchived: e.target.checked })}
                />
                <span style={{ fontWeight: 600 }}>Archivar este sistema</span>
              </label>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '1.4rem' }}>
                Los sistemas archivados se ocultan de la vista de trabajo principal pero conservan todos sus dispositivos.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : systemToEdit ? 'Actualizar Sistema' : 'Guardar Sistema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
