import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import { Subsystem } from '../types';
import { api } from '../services/api';

interface SubsystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subsystemToEdit?: Subsystem | null;
}

export const SubsystemModal: React.FC<SubsystemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subsystemToEdit,
}) => {
  const [formData, setFormData] = useState<Partial<Subsystem>>({
    name: '',
    color: '#005596',
    icon: 'shield',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subsystemToEdit) {
      setFormData({
        name: subsystemToEdit.name,
        color: subsystemToEdit.color || '#005596',
        icon: subsystemToEdit.icon || 'shield',
        description: subsystemToEdit.description || '',
      });
    } else {
      setFormData({
        name: '',
        color: '#005596',
        icon: 'shield',
        description: '',
      });
    }
    setError(null);
  }, [subsystemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const upperData = {
      ...formData,
      name: formData.name ? formData.name.toUpperCase().trim() : '',
      description: formData.description ? formData.description.toUpperCase().trim() : '',
    };

    try {
      if (subsystemToEdit) {
        await api.updateSubsystem(subsystemToEdit.id, upperData);
      } else {
        await api.createSubsystem(upperData);
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
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers color="var(--accent-purple)" size={22} />
            <h2>{subsystemToEdit ? 'Editar Subsistema' : 'Crear Subsistema'}</h2>
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

            {/* Nombre */}
            <div className="form-group">
              <label className="form-label">Nombre del Subsistema *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: RED, CCTV, INTERFONÍA, CONTROL DE ACCESOS"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-grid">
              {/* Color */}
              <div className="form-group">
                <label className="form-label">Color de Distintivo</label>
                <input
                  type="color"
                  className="form-input"
                  style={{ height: '38px', padding: '0.1rem' }}
                  value={formData.color || '#005596'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>

              {/* Icono */}
              <div className="form-group">
                <label className="form-label">Icono Identificador</label>
                <select
                  className="form-select"
                  value={formData.icon || 'shield'}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  <option value="network">Red (Router/Switch)</option>
                  <option value="camera">CCTV (Cámara)</option>
                  <option value="phone-call">Interfonía (Teléfono)</option>
                  <option value="key-round">Control de Accesos (Llave)</option>
                  <option value="shield">Intrusión / Alarma (Escudo)</option>
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div className="form-group">
              <label className="form-label">Descripci&oacute;n / Alcance T&eacute;cnico</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Equipos que abarca este subsistema..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : subsystemToEdit ? 'Actualizar Subsistema' : 'Guardar Subsistema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
