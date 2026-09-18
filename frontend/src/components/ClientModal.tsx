import React, { useState, useEffect } from 'react';
import { X, Users, Database, Search, RefreshCw } from 'lucide-react';
import { Client } from '../types';
import { api } from '../services/api';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientToEdit?: Client | null;
  onOpenBeta10Import?: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientToEdit,
  onOpenBeta10Import,
}) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    legalName: '',
    cif: '',
    manualId: '',
    notes: '',
    isArchived: false,
  });

  const [loading, setLoading] = useState(false);
  const [fetchingBeta10, setFetchingBeta10] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        name: clientToEdit.name,
        legalName: clientToEdit.legalName || '',
        cif: clientToEdit.cif || '',
        manualId: clientToEdit.manualId || '',
        notes: clientToEdit.notes || '',
        isArchived: clientToEdit.isArchived || false,
      });
    } else {
      setFormData({
        name: '',
        legalName: '',
        cif: '',
        manualId: '',
        notes: '',
        isArchived: false,
      });
    }
    setError(null);
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFetchFromBeta10 = async () => {
    const rawId = formData.manualId?.trim();
    if (!rawId || isNaN(Number(rawId))) {
      setError('Introduce un ID de Beta 10 numérico en el campo ID Manual para buscar.');
      return;
    }

    setFetchingBeta10(true);
    setError(null);
    try {
      const betaData = await api.getBeta10ClientSystems(Number(rawId));
      setFormData((prev) => ({
        ...prev,
        manualId: String(betaData.idcliente),
        name: betaData.nombre || prev.name,
        legalName: betaData.razonSocial || prev.legalName,
        cif: betaData.cif || prev.cif,
        notes: betaData.observaciones || prev.notes,
      }));
    } catch (err: any) {
      setError(err.message || 'No se encontró el cliente en Beta 10 con ese ID.');
    } finally {
      setFetchingBeta10(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const upperData = {
      ...formData,
      name: formData.name ? formData.name.toUpperCase().trim() : '',
      legalName: formData.legalName ? formData.legalName.toUpperCase().trim() : '',
      cif: formData.cif ? formData.cif.toUpperCase().trim() : '',
      manualId: formData.manualId ? formData.manualId.toUpperCase().trim() : '',
      notes: formData.notes ? formData.notes.trim() : '',
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
      <div className="modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
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

            {/* Banner de acceso rápido a Importación Beta 10 (solo al crear nuevo) */}
            {!clientToEdit && onOpenBeta10Import && (
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
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>¿Importar desde Beta 10?</span>
                    <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      Carga cliente y todos sus sistemas automáticamente
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
                  }}
                  onClick={() => {
                    onClose();
                    onOpenBeta10Import();
                  }}
                >
                  Abrir Beta 10
                </button>
              </div>
            )}

            {/* ID Manual con botón de autocompletar desde Beta 10 */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>ID Manual (ID Beta 10)</span>
                {formData.manualId && (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#ea580c',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                    onClick={handleFetchFromBeta10}
                    disabled={fetchingBeta10}
                    title="Cargar datos de este ID desde Beta 10"
                  >
                    {fetchingBeta10 ? <RefreshCw size={12} className="spin-animate" /> : <Search size={12} />}
                    Autocompletar desde Beta 10
                  </button>
                )}
              </label>
              <input
                type="text"
                className="form-input code-font"
                placeholder="Ej: 2471"
                value={formData.manualId || ''}
                onChange={(e) => setFormData({ ...formData, manualId: e.target.value })}
              />
            </div>

            {/* Nombre Comercial (Obligatorio) */}
            <div className="form-group">
              <label className="form-label">Nombre Comercial *</label>
              <input
                type="text"
                className="form-input"
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
                value={formData.legalName || ''}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              />
            </div>

            {/* NIF */}
            <div className="form-group">
              <label className="form-label">NIF</label>
              <input
                type="text"
                className="form-input code-font"
                value={formData.cif || ''}
                onChange={(e) => setFormData({ ...formData, cif: e.target.value })}
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
                <span style={{ fontWeight: 600 }}>Archivar este cliente</span>
              </label>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '1.4rem' }}>
                Al archivar el cliente, todos sus sistemas asociados se archivarán automáticamente.
              </span>
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
