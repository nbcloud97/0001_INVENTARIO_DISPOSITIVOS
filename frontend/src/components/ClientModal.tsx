import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { Client } from '../types';
import { api } from '../services/api';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientToEdit?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientToEdit,
}) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    legalName: '',
    cif: '',
    beta10Id: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        name: clientToEdit.name,
        legalName: clientToEdit.legalName || '',
        cif: clientToEdit.cif || '',
        beta10Id: clientToEdit.beta10Id || '',
        notes: clientToEdit.notes || '',
      });
    } else {
      setFormData({
        name: '',
        legalName: '',
        cif: '',
        beta10Id: '',
        notes: '',
      });
    }
    setError(null);
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const upperData = {
      ...formData,
      name: formData.name ? formData.name.toUpperCase().trim() : '',
      legalName: formData.legalName ? formData.legalName.toUpperCase().trim() : '',
      cif: formData.cif ? formData.cif.toUpperCase().trim() : '',
      beta10Id: formData.beta10Id ? formData.beta10Id.toUpperCase().trim() : '',
      notes: formData.notes ? formData.notes.toUpperCase().trim() : '',
    };

    try {
      if (clientToEdit) {
        await api.updateClient(clientToEdit.id, upperData);
      } else {
        await api.createClient(upperData);
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
            <Users color="var(--accent-blue)" size={22} />
            <h2>{clientToEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h2>
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

            {/* Nombre Comercial (Obligatorio) */}
            <div className="form-group">
              <label className="form-label">Nombre Comercial *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: HOSPITAL LA PAZ"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Nombre Fiscal */}
            <div className="form-group">
              <label className="form-label">Nombre Fiscal</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: HOSPITAL UNIVERSITARIO DE LA PAZ, S.A."
                value={formData.legalName || ''}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              />
            </div>

            <div className="form-grid">
              {/* NIF */}
              <div className="form-group">
                <label className="form-label">NIF</label>
                <input
                  type="text"
                  className="form-input code-font"
                  placeholder="Ej: A12345678"
                  value={formData.cif || ''}
                  onChange={(e) => setFormData({ ...formData, cif: e.target.value })}
                />
              </div>

              {/* ID Beta10 */}
              <div className="form-group">
                <label className="form-label">ID Beta10</label>
                <input
                  type="text"
                  className="form-input code-font"
                  placeholder="Ej: 345"
                  value={formData.beta10Id || ''}
                  onChange={(e) => setFormData({ ...formData, beta10Id: e.target.value })}
                />
              </div>
            </div>

            {/* Notas */}
            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Observaciones del cliente o contrato..."
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
              {loading ? 'Guardando...' : clientToEdit ? 'Actualizar Cliente' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
