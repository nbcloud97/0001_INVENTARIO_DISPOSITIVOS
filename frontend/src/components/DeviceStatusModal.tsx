import React, { useState, useEffect } from 'react';
import { X, Tag, Palette } from 'lucide-react';
import { DeviceStatus } from '../types';

interface DeviceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color?: string; description?: string }) => Promise<void>;
  statusToEdit?: DeviceStatus | null;
}

const PRESET_COLORS = [
  '#10b981', // Operativo (Verde)
  '#f59e0b', // Falta instalación (Amber/Naranja)
  '#06b6d4', // En mantenimiento (Cyan/Azul)
  '#ef4444', // Baja (Rojo)
  '#8b5cf6', // Púrpura
  '#ec4899', // Rosa
  '#64748b', // Gris
];

export const DeviceStatusModal: React.FC<DeviceStatusModalProps> = ({
  isOpen,
  onClose,
  onSave,
  statusToEdit,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (statusToEdit) {
      setName(statusToEdit.name || '');
      setColor(statusToEdit.color || '#10b981');
      setDescription(statusToEdit.description || '');
    } else {
      setName('');
      setColor('#10b981');
      setDescription('');
    }
    setError(null);
  }, [statusToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del estado es obligatorio.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        color,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el estado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Tag color={color} size={22} />
            <div>
              <h2>{statusToEdit ? 'Editar Estado de Dispositivo' : 'Nuevo Estado de Dispositivo'}</h2>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                {statusToEdit ? 'Modifica la información del estado' : 'Crea un estado para clasificar los equipos (ej: Operativo, Baja)'}
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-rose)', padding: '0.65rem', borderRadius: '4px', fontSize: '0.825rem' }}>
                {error}
              </div>
            )}

            {/* Nombre del Estado */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Nombre del Estado <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder=""
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Color del Badge */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Palette size={14} /> Color Identificador
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: c,
                        border: color === c ? '2px solid #ffffff' : '1px solid var(--border-color)',
                        boxShadow: color === c ? '0 0 0 2px var(--accent-blue)' : 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: '36px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  title="Elegir color personalizado"
                />
              </div>
            </div>

            {/* Muestra previa de Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Muestra visual:</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: `${color}20`,
                  color: color,
                  border: `1px solid ${color}55`,
                }}
              >
                {name || 'Nombre del Estado'}
              </span>
            </div>

            {/* Descripción */}
            <div className="form-group">
              <label className="form-label">Descripción / Observaciones</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder=""
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '0.85rem 1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : statusToEdit ? 'Guardar Cambios' : 'Crear Estado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
