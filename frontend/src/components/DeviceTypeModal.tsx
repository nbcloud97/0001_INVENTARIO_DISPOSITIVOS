import React, { useState, useEffect } from 'react';
import { X, HardDrive } from 'lucide-react';
import { Subsystem, DeviceType, CreateDeviceTypeFormData } from '../types';
import { api } from '../services/api';

interface DeviceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deviceTypeToEdit?: DeviceType | null;
  subsystems: Subsystem[];
}

export const DeviceTypeModal: React.FC<DeviceTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  deviceTypeToEdit,
  subsystems,
}) => {
  const [formData, setFormData] = useState<CreateDeviceTypeFormData>({
    name: '',
    subsystemId: subsystems[0]?.id || '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deviceTypeToEdit) {
      setFormData({
        name: deviceTypeToEdit.name,
        subsystemId: deviceTypeToEdit.subsystemId,
        description: deviceTypeToEdit.description || '',
      });
    } else {
      setFormData({
        name: '',
        subsystemId: subsystems[0]?.id || '',
        description: '',
      });
    }
    setError(null);
  }, [deviceTypeToEdit, isOpen, subsystems]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('El nombre del tipo de dispositivo es obligatorio');
      return;
    }
    if (!formData.subsystemId) {
      setError('Debes seleccionar un subsistema obligatoriamente');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      subsystemId: formData.subsystemId,
      description: formData.description ? formData.description.trim() : undefined,
    };

    try {
      if (deviceTypeToEdit) {
        await api.updateDeviceType(deviceTypeToEdit.id, payload);
      } else {
        await api.createDeviceType(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el tipo de dispositivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HardDrive color="var(--accent-blue)" size={22} />
            <h2>{deviceTypeToEdit ? 'Editar Tipo de Dispositivo' : 'Nuevo Tipo de Dispositivo'}</h2>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--accent-rose)',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Subsistema Obligatorio */}
            <div className="form-group">
              <label className="form-label">Subsistema Asignado *</label>
              <select
                className="form-select"
                value={formData.subsystemId}
                onChange={(e) => setFormData({ ...formData, subsystemId: e.target.value })}
                required
              >
                <option value="">-- Seleccionar Subsistema --</option>
                {subsystems.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Nombre del Tipo de Dispositivo */}
            <div className="form-group">
              <label className="form-label">Nombre del Tipo de Dispositivo *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Descripción u Observaciones */}
            <div className="form-group">
              <label className="form-label">Descripción / Observaciones</label>
              <textarea
                className="form-textarea"
                rows={3}
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
              {loading ? 'Guardando...' : deviceTypeToEdit ? 'Actualizar Tipo' : 'Guardar Tipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
