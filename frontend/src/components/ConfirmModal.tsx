import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#dc2626' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={22} color="#ffffff" />
            <h2 style={{ color: '#ffffff', fontSize: '1.1rem' }}>{title}</h2>
          </div>
          <button className="btn btn-secondary btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }} onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem 1.25rem', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
          >
            <AlertTriangle size={30} />
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            ¿Est&aacute;s seguro de realizar esta acci&oacute;n?
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center', gap: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ width: '120px' }} onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button
            className="btn btn-danger"
            style={{ width: '140px', background: '#dc2626', color: '#ffffff', border: 'none' }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
