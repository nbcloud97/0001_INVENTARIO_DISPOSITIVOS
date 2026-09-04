import React, { useState, useEffect } from 'react';
import { X, Cpu } from 'lucide-react';
import { Client, System } from '../types';
import { api } from '../services/api';

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  systemToEdit?: System | null;
  clients: Client[];
  defaultClientId?: string;
}

export const SystemModal: React.FC<SystemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  systemToEdit,
  clients,
  defaultClientId,
}) => {
  const [formData, setFormData] = useState<Partial<System>>({
    name: '',
    code: '',
    notes: '',
    clientId: defaultClientId || (clients[0]?.id || ''),
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
      });
    } else {
      setFormData({
        name: '',
        code: '',
        notes: '',
        clientId: defaultClientId || (clients[0]?.id || ''),
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
